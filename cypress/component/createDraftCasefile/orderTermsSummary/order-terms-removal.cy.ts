import { Router } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { ORDER_TERMS_REMOVAL_COPY } from './constants/order-terms-removal-copy.constant';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9812', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const path = (child: string): string => '/' + PATHS.root + '/' + child;
const summaryPath = path(PATHS.children.orderTermsSummary);
const removalPath = path(PATHS.children.orderTermsRemove + '/1');
const setupSummary = (terms = SUMMARY_TERMS, creditors = [SUMMARY_CREDITORS[0]]): void => {
  setupOrderTerms({ initialChild: PATHS.children.orderTermsSummary, acceptedTerms: terms, minorCreditors: creditors });
};
const openSecondRemoval = (): void => {
  cy.get(S.orderTermsSummary.remove(2)).click();
  cy.get<Router>('@angularRouter').its('url').should('eq', removalPath);
  cy.get(S.heading).should('have.text', ORDER_TERMS_REMOVAL_COPY.confirmationHeading);
};
const assertOriginalBusinessState = (): void => {
  cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
    expect(store.minorCreditors()).to.deep.equal([SUMMARY_CREDITORS[0]]);
    expect(store.nextOrderTermId()).to.eq(3);
    expect(store.nextMinorCreditorSequence()).to.eq(2);
  });
};
const assertRemovedSecond = (): void => {
  cy.get(S.orderTermsSummary.cards).should('have.length', 1);
  cy.get(S.orderTermsSummary.card(1)).should('contain.text', '£10.00');
  cy.get(S.orderTermsSummary.card(2)).should('not.exist');
  cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.orderTerms()).to.deep.equal([SUMMARY_TERMS[0]]);
    expect(store.minorCreditors()).to.deep.equal([SUMMARY_CREDITORS[0]]);
    expect(store.nextOrderTermId()).to.eq(3);
    expect(store.nextMinorCreditorSequence()).to.eq(2);
  });
};
const assertSilentSummary = (): void => {
  cy.get<Router>('@angularRouter').its('url').should('eq', summaryPath);
  cy.get(S.orderTermsRemoval.summaryHeading).should('be.visible');
  cy.get(S.orderTermsRemoval.notice).should('not.exist');
};
const failNextNavigation = (failure: 'false return' | 'rejection'): void => {
  cy.get<Router>('@angularRouter').then((router) => {
    const navigateByUrl = router.navigateByUrl.bind(router);
    const navigation = cy.stub(router, 'navigateByUrl').callsFake(navigateByUrl);
    if (failure === 'false return') navigation.onFirstCall().resolves(false);
    else navigation.onFirstCall().rejects(new Error('Synthetic removal navigation failure'));
  });
};

describe('Order terms removal routed transaction', () => {
  it('AC1. should show only the selected second term in a read-only confirmation', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();

    cy.get(S.orderTermsRemoval.card).should('contain.text', '£20.00').and('not.contain.text', '£10.00');
    cy.get(S.orderTermCard.rowValue(1, 'Amount')).should('not.exist');
    cy.get(S.orderTermsSummary.change(2)).should('not.exist');
    cy.get(S.orderTermsSummary.remove(2)).should('not.exist');
    cy.get(S.orderTermsRemoval.confirm)
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq('Yes - remove order terms'));
    cy.get(S.orderTermsRemoval.cancel)
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq('No - cancel'));
    cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('not.have.attr', 'open');
    cy.get(S.orderTermsSummary.creditorDetails(2)).should(([details]) => {
      expect(details.checkVisibility()).to.eq(false);
    });
    cy.screenshot('po-9812-order-terms-remove-confirmation');
    assertOriginalBusinessState();
  });

  it('AC1. should show the selected international creditor and no-bank variants', { tags: buildTags() }, () => {
    const internationalTerm = { ...SUMMARY_TERMS[1], creditor: { type: 'minor' as const, sequenceNumber: 2 } };
    setupSummary([SUMMARY_TERMS[0], internationalTerm], SUMMARY_CREDITORS);
    openSecondRemoval();

    cy.get(S.orderTermsRemoval.card).should('contain.text', SUMMARY_CREDITORS[1].displayName);
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'Synthetic international bank with a deliberately long descriptive name')
      .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
    cy.get(S.orderTermsRemoval.cancel).click();
    cy.get(S.orderTermsSummary.remove(2)).should('be.focused');

    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTerms: [SUMMARY_TERMS[0], { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 3 } }],
      });
    });
    cy.get(S.orderTermsSummary.remove(2)).click();
    cy.get(S.orderTermsRemoval.card).should('contain.text', SUMMARY_CREDITORS[2].displayName);
    cy.get(S.orderTermsRemoval.card).find('opal-lib-govuk-details').should('not.exist');
  });

  it(
    'AC2. should remove exactly the selected ID, retain its shared creditor and dismiss success',
    { tags: buildTags() },
    () => {
      setupSummary();
      openSecondRemoval();
      cy.get(S.orderTermsRemoval.confirm).click();

      cy.get<Router>('@angularRouter').its('url').should('eq', summaryPath);
      cy.get(S.orderTermsRemoval.notice).should('be.focused').and('contain.text', ORDER_TERMS_REMOVAL_COPY.success);
      cy.screenshot('po-9812-order-terms-remove-success');
      assertRemovedSecond();
      cy.get(S.orderTermsRemoval.dismiss).click();
      cy.get(S.orderTermsRemoval.notice).should('not.exist');
      cy.get(S.orderTermsRemoval.summaryHeading).should('be.focused');
      cy.get('@getResults').should('not.have.been.called');
      cy.get('@getMajorCreditors').should('not.have.been.called');
    },
  );

  it('AC2. should remove the final term and show the empty summary with success', { tags: buildTags() }, () => {
    setupOrderTerms({
      initialChild: PATHS.children.orderTermsSummary,
      acceptedTerms: [SUMMARY_TERMS[0]],
      minorCreditors: [SUMMARY_CREDITORS[0]],
    });
    cy.get(S.orderTermsSummary.remove(1)).click();
    cy.get(S.orderTermsRemoval.confirm).click();

    cy.get(S.orderTermsRemoval.notice).should('be.focused').and('contain.text', ORDER_TERMS_REMOVAL_COPY.success);
    cy.get(S.orderTermsSummary.cards).should('not.exist');
    cy.contains('p.govuk-body', 'There are currently no order terms.').should('be.visible');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal([]);
      expect(store.nextOrderTermId()).to.eq(2);
    });
  });

  it('AC3. should cancel without changing business state and return focus to Remove', { tags: buildTags() }, () => {
    setupSummary();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      const before = structuredClone(getState(store));
      openSecondRemoval();
      cy.get(S.orderTermsRemoval.cancel).click();
      cy.get<Router>('@angularRouter').its('url').should('eq', summaryPath);
      cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
      cy.get(S.orderTermsRemoval.notice).should('not.exist');
      cy.then(() => expect(getState(store)).to.deep.equal(before));
    });
  });

  it('AC4. should redirect a valid index without a selection token', { tags: buildTags() }, () => {
    setupOrderTerms({
      initialChild: PATHS.children.orderTermsRemove + '/0',
      acceptedTerms: SUMMARY_TERMS,
      minorCreditors: [SUMMARY_CREDITORS[0]],
    });
    assertSilentSummary();
    cy.get(S.orderTermsRemoval.confirm).should('not.exist');
    assertOriginalBusinessState();
  });

  it('AC4. should redirect an out-of-bounds removal URL without deleting terms', { tags: buildTags() }, () => {
    setupSummary();
    cy.get<Router>('@angularRouter').then((router) =>
      router.navigateByUrl(path(PATHS.children.orderTermsRemove + '/99')),
    );
    assertSilentSummary();
    cy.get(S.orderTermsRemoval.confirm).should('not.exist');
    assertOriginalBusinessState();
  });

  it('AC4. should reject re-entry to an old removal URL after cancellation', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get(S.orderTermsRemoval.cancel).click();
    cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
    cy.get<Router>('@angularRouter').then((router) => router.navigateByUrl(removalPath));
    assertSilentSummary();
    cy.get(S.orderTermsRemoval.confirm).should('not.exist');
    assertOriginalBusinessState();
  });

  for (const failure of ['false return', 'rejection'] as const) {
    it(`AC4. should clear selection when opening Remove navigation ${failure}`, { tags: buildTags() }, () => {
      setupSummary();
      failNextNavigation(failure);
      cy.get(S.orderTermsSummary.remove(2)).click();
      assertSilentSummary();
      cy.get(S.orderTermsSummary.remove(2)).should('be.visible');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').should((store) => {
        expect(store.orderTermRemoval()).to.eq(null);
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
      });
    });
  }

  it(
    'AC4. should not remove a target whose displayed amount changes while confirmation is open',
    { tags: buildTags() },
    () => {
      setupSummary();
      openSecondRemoval();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
          orderTerms: [
            SUMMARY_TERMS[0],
            { ...SUMMARY_TERMS[1], parameters: { ...SUMMARY_TERMS[1].parameters, amount: '25.00' } },
          ],
        });
      });
      assertSilentSummary();
      cy.get(S.orderTermsRemoval.confirm).should('not.exist');
      cy.get(S.orderTermsSummary.card(2)).should('contain.text', '£25.00');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.have.length(2);
        expect(store.orderTerms()[1].parameters['amount']).to.eq('25.00');
      });
    },
  );

  it('AC4. should allow removal when only an unrelated term changes', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      const currentTerms = store.orderTerms();
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTerms: [
          { ...currentTerms[0], parameters: { ...currentTerms[0].parameters, amount: '15.00' } },
          currentTerms[1],
        ],
      });
    });
    cy.get(S.orderTermsRemoval.confirm).click();
    cy.get(S.orderTermsRemoval.notice).should('contain.text', ORDER_TERMS_REMOVAL_COPY.success);
    cy.get(S.orderTermsSummary.card(1)).should('contain.text', '£15.00');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.have.length(1);
      expect(store.orderTerms()[0].termId).to.eq(1);
    });
  });

  it('AC4. should not remove a target after its displayed bank details change', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      const bank = SUMMARY_CREDITORS[0].details.bank;
      if (bank.type !== 'uk') throw new Error('Expected UK bank fixture');
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        minorCreditors: [
          {
            ...SUMMARY_CREDITORS[0],
            details: {
              ...SUMMARY_CREDITORS[0].details,
              bank: { ...bank, paymentReference: 'CHANGED-REFERENCE' },
            },
          },
        ],
      });
    });
    assertSilentSummary();
    cy.get(S.orderTermsRemoval.confirm).should('not.exist');
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
    });
  });

  for (const failure of ['false return', 'rejection'] as const) {
    it(
      `AC3. should retain selection after Cancel navigation ${failure} and succeed on retry`,
      { tags: buildTags() },
      () => {
        setupSummary();
        openSecondRemoval();
        failNextNavigation(failure);
        cy.get(S.orderTermsRemoval.cancel).click();
        cy.get(S.heading).should('have.text', ORDER_TERMS_REMOVAL_COPY.confirmationHeading);
        cy.get(S.orderTermsRemoval.card).should('contain.text', '£20.00');
        cy.get(S.orderTermsRemoval.confirm).should('be.visible');
        cy.get(S.orderTermsRemoval.cancel).should('be.visible');
        cy.get<Router>('@angularRouter').its('url').should('eq', removalPath);
        assertOriginalBusinessState();
        cy.get(S.orderTermsRemoval.cancel).click();
        cy.get<Router>('@angularRouter').its('url').should('eq', summaryPath);
        cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
        assertOriginalBusinessState();
      },
    );

    it(
      `AC2. should keep one deletion after return navigation ${failure} and retry without deleting again`,
      { tags: buildTags() },
      () => {
        setupSummary();
        openSecondRemoval();
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          cy.spy(store, 'confirmOrderTermRemoval').as('confirmOrderTermRemoval');
        });
        failNextNavigation(failure);
        cy.get(S.orderTermsRemoval.confirm).click();
        cy.get<Router>('@angularRouter').its('url').should('eq', removalPath);
        cy.get(S.heading).should('have.text', ORDER_TERMS_REMOVAL_COPY.confirmationHeading);
        cy.get(S.orderTermsRemoval.card).should('contain.text', '£20.00');
        cy.get(S.orderTermsRemoval.confirm).should('be.visible');
        cy.get(S.orderTermsRemoval.cancel).should('be.visible');
        cy.get('@confirmOrderTermRemoval').should('have.been.calledOnce');
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTerms()).to.deep.equal([SUMMARY_TERMS[0]]);
        });
        cy.get(S.orderTermsRemoval.confirm).click();
        cy.get<Router>('@angularRouter').its('url').should('eq', summaryPath);
        cy.get(S.orderTermsRemoval.notice).should('contain.text', ORDER_TERMS_REMOVAL_COPY.success);
        cy.get('@confirmOrderTermRemoval').should('have.been.calledOnce');
        assertRemovedSecond();
      },
    );
  }
});
