import { getState } from '@ngrx/signals';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9811', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const originalCreditor = SUMMARY_CREDITORS[0];
const setupAmendment = (): void => {
  setupOrderTerms({
    initialChild: PATHS.children.orderTermsSummary,
    acceptedTerms: SUMMARY_TERMS,
    minorCreditors: [originalCreditor],
  });
};
const openSecondInput = (): void => {
  cy.get(S.orderTermsSummary.change(2)).click();
  cy.get(S.orderTermsInput.amount).should('have.value', '20.00');
  cy.get(S.orderTermsInput.expiry).should('have.value', '31/12/2026');
};
const continueToCreditor = (amount = '25'): void => {
  cy.get(S.orderTermsInput.amount).clear().type(amount);
  cy.get(S.orderTermsInput.continueButton).click();
  cy.get(S.heading).should('have.text', 'Creditor');
};
const openNewDetails = (): void => {
  cy.get(S.creditor.addNew).check();
  cy.get(S.creditor.continueButton).click();
  cy.get(S.heading).should('have.text', 'Minor creditor details');
};
const enterNewCreditorDetails = (): void => {
  cy.get(S.minorCreditor.organisation).check();
  cy.get(S.minorCreditor.organisationName).type('Atomic synthetic creditor');
  cy.get(S.minorCreditor.addressLine1).type('3 Test Street');
  cy.get(S.minorCreditor.countryAutocomplete).type('United Kingdom').type('{downArrow}{enter}');
  cy.get(S.minorCreditor.bankNone).check();
};
const saveNewCreditor = (): void => {
  enterNewCreditorDetails();
  cy.get(S.minorCreditor.save).click();
  cy.get(S.heading).should('have.text', 'Minor creditor summary');
};
const assertOriginalAcceptedState = (): void => {
  cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
    expect(store.minorCreditors()).to.deep.equal([originalCreditor]);
    expect(store.nextOrderTermId()).to.eq(3);
    expect(store.nextMinorCreditorSequence()).to.eq(2);
  });
};
const failNextNavigation = (failure: 'false return' | 'rejection'): void => {
  cy.get<Router>('@angularRouter').then((router) => {
    const navigateByUrl = router.navigateByUrl.bind(router);
    const navigation = cy.stub(router, 'navigateByUrl').callsFake(navigateByUrl);
    if (failure === 'false return') navigation.onFirstCall().resolves(false);
    else navigation.onFirstCall().rejects(new Error('Synthetic amendment navigation failure'));
  });
};
const assertCompletedExistingCreditorAmendment = (amount: string): void => {
  cy.get(S.orderTermsSummary.cards).should('have.length', 2);
  cy.get(S.orderTermsSummary.card(1)).should('contain.text', '£10.00');
  cy.get(S.orderTermsSummary.card(2)).should('contain.text', `£${amount}.00`);
  cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.orderTerms()).to.have.length(2);
    expect(store.minorCreditors()).to.deep.equal([originalCreditor]);
    expect(store.nextOrderTermId()).to.eq(3);
    expect(store.nextMinorCreditorSequence()).to.eq(2);
    expect(store.orderTermAmendment()).to.eq(null);
  });
};

describe('Order term amendment routed transaction', () => {
  it(
    'changes the second repeated Result while the first accepted term remains unchanged',
    { tags: buildTags() },
    () => {
      setupAmendment();
      openSecondInput();
      continueToCreditor();
      assertOriginalAcceptedState();
      cy.get(S.creditor.minor(1)).should('be.checked');
      cy.get(S.creditor.continueButton).click();

      cy.get(S.orderTermsSummary.card(1)).should('contain.text', '£10.00');
      cy.get(S.orderTermsSummary.card(2)).should('contain.text', '£25.00');
      cy.get(S.orderTermsSummary.cards).should('have.length', 2);
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[0]).to.deep.equal(SUMMARY_TERMS[0]);
        expect(store.orderTerms()[1].parameters).to.deep.equal({ amount: '25.00', expiry_date: '2026-12-31' });
      });
    },
  );

  it('keeps a new creditor separate until review and accepts both records exactly once', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    continueToCreditor('30');
    openNewDetails();
    saveNewCreditor();
    assertOriginalAcceptedState();

    cy.get(S.minorCreditorSummary.continue).click();

    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.have.length(2);
      expect(store.orderTerms()[0]).to.deep.equal(SUMMARY_TERMS[0]);
      expect(store.orderTerms()[1]).to.deep.include({
        termId: 2,
        parameters: { amount: '30.00', expiry_date: '2026-12-31' },
        creditor: { type: 'minor', sequenceNumber: 2 },
      });
      expect(store.minorCreditors()).to.have.length(2);
      expect(store.minorCreditors()[1].displayName).to.eq('Atomic synthetic creditor');
      expect(store.nextMinorCreditorSequence()).to.eq(3);
      expect(store.orderTermAmendment()).to.eq(null);
      expect(store.creditorDraft()).to.eq(null);
    });
  });

  for (const boundary of ['input', 'creditor', 'details', 'review'] as const) {
    it(`cancels from the ${boundary} boundary without changing accepted identities`, { tags: buildTags() }, () => {
      setupAmendment();
      openSecondInput();
      if (boundary === 'input') {
        cy.get(S.orderTermsInput.amount).clear().type('99');
        cy.once('window:confirm', () => true);
        cy.get(S.orderTermsInput.amendmentCancel).click();
      } else {
        continueToCreditor('99');
        if (boundary === 'creditor') {
          cy.get(S.creditor.applicant).check();
          cy.once('window:confirm', () => true);
          cy.get(S.creditor.cancel).click();
        } else {
          openNewDetails();
          if (boundary === 'details') {
            cy.get(S.minorCreditor.organisation).check();
            cy.get(S.minorCreditor.organisationName).type('Discarded creditor');
            cy.once('window:confirm', () => true);
            cy.get(S.minorCreditor.cancel).click();
          } else {
            saveNewCreditor();
            cy.get(S.minorCreditorSummary.cancel).click();
          }
        }
      }

      cy.get(S.heading).should('have.text', 'Order terms');
      assertOriginalAcceptedState();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTermAmendment()).to.eq(null);
        expect(store.creditorDraft()).to.eq(null);
      });
    });
  }

  it('retains the dirty input and whole amendment when Cancel is declined', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    cy.get(S.orderTermsInput.amount).clear().type('31');
    cy.once('window:confirm', () => false);
    cy.get(S.orderTermsInput.amendmentCancel).click();

    cy.get(S.orderTermsInput.amount).should('have.value', '31');
    assertOriginalAcceptedState();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTermAmendment()?.termId).to.eq(2);
      expect(store.orderTermDraft()?.values).to.deep.equal({ amount: '31', expiry_date: '31/12/2026', arrears: '' });
    });
  });

  for (const failure of ['false return', 'rejection'] as const) {
    it(
      `retains the amendment after input navigation ${failure} and completes once on retry`,
      { tags: buildTags() },
      () => {
        setupAmendment();
        openSecondInput();
        failNextNavigation(failure);
        cy.get(S.orderTermsInput.amount).clear().type('41');
        cy.get(S.orderTermsInput.continueButton).click();

        cy.get(S.orderTermsInput.amount).should('have.value', '41');
        assertOriginalAcceptedState();
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTermAmendment()).to.deep.include({ termId: 2, ready: false });
        });

        cy.get(S.orderTermsInput.continueButton).click();
        cy.get(S.creditor.minor(1)).should('be.checked');
        cy.get(S.creditor.continueButton).click();
        assertCompletedExistingCreditorAmendment('41');
      },
    );

    it(
      `retains the amendment after creditor navigation ${failure} and completes once on retry`,
      { tags: buildTags() },
      () => {
        setupAmendment();
        openSecondInput();
        continueToCreditor('42');
        failNextNavigation(failure);
        cy.get(S.creditor.minor(1)).check();
        cy.get(S.creditor.continueButton).click();

        cy.get(S.heading).should('have.text', 'Creditor');
        assertOriginalAcceptedState();
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTermAmendment()).to.deep.include({ termId: 2, ready: true });
        });

        cy.get(S.creditor.continueButton).click();
        assertCompletedExistingCreditorAmendment('42');
      },
    );

    it(
      `retains pending details after review navigation ${failure} and completes once on retry`,
      { tags: buildTags() },
      () => {
        setupAmendment();
        openSecondInput();
        continueToCreditor('43');
        openNewDetails();
        failNextNavigation(failure);
        enterNewCreditorDetails();
        cy.get(S.minorCreditor.save).click();

        cy.get(S.minorCreditor.save).should('be.visible');
        assertOriginalAcceptedState();
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.creditorDraft()).to.deep.include({ termId: 2, branch: 'add-new' });
          expect(store.creditorDraft()?.details?.identity).to.deep.equal({
            type: 'organisation',
            organisationName: 'Atomic synthetic creditor',
          });
        });

        cy.get(S.minorCreditor.save).click();
        cy.get(S.heading).should('have.text', 'Minor creditor summary');
        cy.get(S.minorCreditorSummary.continue).click();
        cy.get(S.orderTermsSummary.cards).should('have.length', 2);
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTerms()).to.have.length(2);
          expect(store.orderTerms()[1].parameters).to.deep.equal({ amount: '43.00', expiry_date: '2026-12-31' });
          expect(store.minorCreditors()).to.have.length(2);
          expect(store.nextMinorCreditorSequence()).to.eq(3);
          expect(store.orderTermAmendment()).to.eq(null);
        });
      },
    );

    it(
      `retains reviewed creditor after summary navigation ${failure} and completes once on retry`,
      { tags: buildTags() },
      () => {
        setupAmendment();
        openSecondInput();
        continueToCreditor('44');
        openNewDetails();
        saveNewCreditor();
        failNextNavigation(failure);
        cy.get(S.minorCreditorSummary.continue).click();

        cy.get(S.heading).should('have.text', 'Minor creditor summary');
        assertOriginalAcceptedState();
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTermAmendment()).to.deep.include({ termId: 2, ready: true });
          expect(store.creditorDraft()).to.deep.include({ termId: 2, branch: 'add-new' });
        });

        cy.get(S.minorCreditorSummary.continue).click();
        cy.get(S.orderTermsSummary.cards).should('have.length', 2);
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTerms()).to.have.length(2);
          expect(store.orderTerms()[1].parameters).to.deep.equal({ amount: '44.00', expiry_date: '2026-12-31' });
          expect(store.minorCreditors()).to.have.length(2);
          expect(store.nextMinorCreditorSequence()).to.eq(3);
          expect(store.orderTermAmendment()).to.eq(null);
        });
      },
    );
  }

  it(
    'preserves accepted state when amended metadata fails and reopens the selected term on retry',
    { tags: buildTags() },
    () => {
      setupAmendment();
      cy.get('@getResult').then((aliased) => (aliased as unknown as sinon.SinonStub).onFirstCall().returns(of(null)));
      cy.get(S.orderTermsSummary.change(2)).click();

      cy.get(S.heading).should('have.text', 'Order terms');
      assertOriginalAcceptedState();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTermAmendment()).to.deep.include({ termId: 2, ready: false });
      });

      cy.get(S.orderTermsSummary.change(2)).click();
      cy.get(S.orderTermsInput.amount).should('have.value', '20.00');
      assertOriginalAcceptedState();
    },
  );

  it('changes one shared reference without editing or pruning the shared creditor', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    continueToCreditor();
    cy.get(S.creditor.applicant).check();
    cy.get(S.creditor.continueButton).click();

    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
      expect(store.orderTerms()[1].creditor).to.deep.equal({ type: 'applicant' });
      expect(store.minorCreditors()).to.deep.equal([originalCreditor]);
      expect(store.nextMinorCreditorSequence()).to.eq(2);
    });
  });

  it(
    'changes one shared reference to a different existing minor without changing either creditor',
    { tags: buildTags() },
    () => {
      const secondCreditor = SUMMARY_CREDITORS[1];
      setupOrderTerms({
        initialChild: PATHS.children.orderTermsSummary,
        acceptedTerms: SUMMARY_TERMS,
        minorCreditors: [originalCreditor, secondCreditor],
      });
      openSecondInput();
      continueToCreditor();
      cy.get(S.creditor.minor(2)).check();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
        expect(store.minorCreditors()).to.deep.equal([originalCreditor, secondCreditor]);
        expect(store.nextOrderTermId()).to.eq(3);
        expect(store.nextMinorCreditorSequence()).to.eq(3);
      });
      cy.get(S.creditor.continueButton).click();

      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.have.length(2);
        expect(store.orderTerms()[0]).to.deep.equal(SUMMARY_TERMS[0]);
        expect(store.orderTerms()[1]).to.deep.equal({
          ...SUMMARY_TERMS[1],
          parameters: { amount: '25.00', expiry_date: '2026-12-31' },
          creditor: { type: 'minor', sequenceNumber: 2 },
        });
        expect(store.minorCreditors()).to.deep.equal([originalCreditor, secondCreditor]);
        expect(store.nextMinorCreditorSequence()).to.eq(3);
      });
    },
  );

  it('preserves raw input values through a routed revisit, including date conversion', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    cy.get(S.orderTermsInput.amount).clear().type('26');
    cy.get(S.orderTermsInput.expiry).clear().type('03/11/2026');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get<Router>('@angularRouter').then((router) =>
      router.navigateByUrl('/' + PATHS.root + '/' + PATHS.children.orderTermsInput + '/MAT'),
    );

    cy.get(S.orderTermsInput.amount).should('have.value', '26');
    cy.get(S.orderTermsInput.expiry).should('have.value', '03/11/2026');
    assertOriginalAcceptedState();
  });

  it('resumes a pending amendment when selection is re-entered and completes it once', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    cy.get(S.orderTermsInput.amount).clear().type('27');
    cy.get(S.orderTermsInput.expiry).clear().type('04/11/2026');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      const acceptedTerms = store.orderTerms();
      const amendment = store.orderTermAmendment();
      cy.once('window:confirm', () => true);
      cy.get<Router>('@angularRouter').then((router) =>
        router.navigateByUrl('/' + PATHS.root + '/' + PATHS.children.orderTermsSelect),
      );

      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsInput + '/MAT');
      cy.get(S.orderTermsInput.amount).should('have.value', '27');
      cy.get(S.orderTermsInput.expiry).should('have.value', '04/11/2026');
      cy.then(() => {
        expect(store.orderTerms()).to.eq(acceptedTerms);
        expect(store.orderTermAmendment()).to.eq(amendment);
        expect(store.currentOrderTermId()).to.eq(2);
        expect(store.orderTermDraft()?.values).to.deep.equal({
          amount: '27',
          expiry_date: '04/11/2026',
          arrears: '',
        });
      });
    });

    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.minor(1)).should('be.checked');
    cy.get(S.creditor.continueButton).click();
    assertCompletedExistingCreditorAmendment('27');
  });

  it('starts Add with a blank selection after cancelling an amendment', { tags: buildTags() }, () => {
    setupAmendment();
    openSecondInput();
    cy.get(S.orderTermsInput.amendmentCancel).click();
    cy.get(S.heading).should('have.text', 'Order terms');

    cy.get(S.orderTerms.add).click();

    cy.get(S.orderTerms.select).should('have.value', '');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTermAmendment()).to.eq(null);
      expect(store.currentOrderTermId()).to.eq(null);
      expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
      expect(store.minorCreditors()).to.deep.equal([originalCreditor]);
    });
  });

  it(
    'retains the whole transaction when external departure is declined and resets it when confirmed',
    { tags: buildTags() },
    () => {
      setupOrderTerms({
        shell: true,
        initialChild: PATHS.children.orderTermsSummary,
        acceptedTerms: SUMMARY_TERMS,
        minorCreditors: [originalCreditor],
      });
      openSecondInput();
      cy.get(S.orderTermsInput.amount).clear().type('32');
      cy.window().then((window) => {
        const confirm = cy.stub(window, 'confirm');
        confirm.onFirstCall().returns(false);
        confirm.onSecondCall().returns(true);
        cy.wrap(confirm).as('confirmDeparture');
      });
      cy.get('@angularRouter').then((router: unknown) =>
        (router as { navigateByUrl: (url: string) => Promise<boolean> }).navigateByUrl('/order-terms-test-external'),
      );
      cy.get(S.orderTermsInput.amount).should('have.value', '32');
      assertOriginalAcceptedState();

      cy.get('@angularRouter').then((router: unknown) =>
        (router as { navigateByUrl: (url: string) => Promise<boolean> }).navigateByUrl('/order-terms-test-external'),
      );
      cy.get('h1').should('have.text', 'External destination');
      cy.get('@confirmDeparture').should('have.been.calledTwice');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(getState(store).orderTerms).to.deep.equal([]);
        expect(store.orderTermAmendment()).to.eq(null);
      });
    },
  );
});
