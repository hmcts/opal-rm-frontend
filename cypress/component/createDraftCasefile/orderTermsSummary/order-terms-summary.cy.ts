import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { SAVED_APPLICANT_INDIVIDUAL } from '../mocks/applicant-individual.mock';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9811', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const path = (child: string): string => '/' + PATHS.root + '/' + child;
const setupSummary = (populated = true) =>
  setupOrderTerms({
    initialChild: PATHS.children.orderTermsSummary,
    acceptedTerms: populated ? SUMMARY_TERMS : [],
    minorCreditors: populated ? SUMMARY_CREDITORS : [],
  });

describe('Order terms summary', () => {
  it('AC1. should render the exact empty state', { tags: buildTags() }, () => {
    setupSummary(false);

    cy.get(S.orderTermsSummary.cards).should('not.exist');
    cy.contains('p.govuk-body', 'There are currently no order terms.').should(
      'have.text',
      'There are currently no order terms.',
    );
    cy.get(S.orderTerms.return)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Return to case details'));
    cy.get(S.orderTerms.add)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Add terms'));
  });

  it('AC1, AC2. should render repeated results as stable cards in accepted order', { tags: buildTags() }, () => {
    setupSummary();

    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.get(S.orderTermsSummary.card(1)).within(() => {
      cy.get('.govuk-summary-card__title').should('have.text', 'Maintenance');
      cy.get('#order-term-1AmountValue').should('have.text', '£10.00');
      cy.get('#order-term-1Assigned-creditorValue').should('have.text', 'Synthetic creditor');
      cy.contains('a', 'Change').find('.govuk-visually-hidden').should('have.text', 'Maintenance');
      cy.contains('a', 'Remove').find('.govuk-visually-hidden').should('have.text', 'Maintenance');
    });
    cy.get(S.orderTermsSummary.card(2)).within(() => {
      cy.get('#order-term-2AmountValue').should('have.text', '£20.00');
    });
  });

  it('AC3. should toggle bank details by keyboard without changing accepted data', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.creditorToggle(1))
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Show creditor details'));
    cy.get(S.orderTermsSummary.creditorToggle(1)).should('have.attr', 'aria-expanded', 'false');
    cy.get(S.orderTermsSummary.creditorDetails(1)).should('not.be.visible');

    cy.get(S.orderTermsSummary.creditorToggle(1)).focus().type('{enter}');

    cy.get(S.orderTermsSummary.creditorToggle(1))
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Hide creditor details'));
    cy.get(S.orderTermsSummary.creditorToggle(1)).should('have.attr', 'aria-expanded', 'true').and('be.focused');
    cy.get(S.orderTermsSummary.creditorDetails(1)).should('be.visible').and('contain.text', '00112233');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
      expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
    });

    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.orderTermsSummary.creditorToggle(1)).should('have.attr', 'aria-expanded', 'false').and('be.focused');
    cy.get(S.orderTermsSummary.creditorDetails(1)).should('not.be.visible');
  });

  it('AC5. should follow the native keyboard order and omit collapsed details', { tags: buildTags() }, () => {
    setupSummary();

    cy.get(S.orderTermsSummary.change(1)).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsSummary.remove(1)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsSummary.creditorToggle(1)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsSummary.change(2)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTerms.return).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTerms.add).should('be.focused');
  });

  it(
    'AC2, AC5. should activate Change with Enter and expose duplicate titles in card context',
    { tags: buildTags() },
    () => {
      setupSummary();

      cy.get(S.orderTermsSummary.change(1)).should('contain.text', 'Change').and('contain.text', 'Maintenance');
      cy.get(S.orderTermsSummary.change(2)).should('contain.text', 'Change').and('contain.text', 'Maintenance');
      cy.get(S.orderTermsSummary.change(2)).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);

      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', path(PATHS.children.orderTermsInput + '/MAT'));
      cy.get(S.orderTermsInput.amount).should('have.value', '20.00');
    },
  );

  it(
    'AC2, AC5. should activate Remove with native Enter without changing accepted state',
    { tags: buildTags() },
    () => {
      setupSummary();
      cy.get(S.orderTermsSummary.remove(2)).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);

      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', path(PATHS.children.orderTermsRemove + '/1'));
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
        expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
      });
    },
  );

  it('AC1, AC3. should render unique IDs, non-UK details and no-bank creditors', { tags: buildTags() }, () => {
    setupOrderTerms({
      initialChild: PATHS.children.orderTermsSummary,
      acceptedTerms: [
        SUMMARY_TERMS[0],
        { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 2 } },
        { ...SUMMARY_TERMS[0], termId: 3, creditor: { type: 'minor', sequenceNumber: 3 } },
      ],
      minorCreditors: SUMMARY_CREDITORS,
    });

    cy.get(S.orderTermsSummary.creditorToggle(2)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'Bank name')
      .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
    cy.get(S.orderTermsSummary.card(3)).should('contain.text', 'Synthetic no-bank creditor');
    cy.get(S.orderTermsSummary.card(3)).find('button').should('not.exist');
    cy.document().then((document) => {
      const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map(({ id }) => id);
      expect(new Set(ids).size).to.eq(ids.length);
    });
  });

  it(
    'AC3. should render organisation applicant bank details without changing journey state',
    { tags: buildTags() },
    () => {
      const applicantTerms = [{ ...SUMMARY_TERMS[0], creditor: { type: 'applicant' as const } }];
      setupOrderTerms({ initialChild: PATHS.children.orderTermsSummary, acceptedTerms: applicantTerms });

      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        const before = structuredClone(getState(store));
        cy.get(S.orderTermsSummary.card(1)).should('contain.text', 'Test Organisation');
        cy.get(S.orderTermsSummary.creditorToggle(1)).click();
        cy.get(S.orderTermsSummary.creditorDetails(1))
          .should('be.visible')
          .and('contain.text', 'Test Organisation')
          .and('contain.text', '112233')
          .and('contain.text', '12345678')
          .and('contain.text', 'PAY-9803');
        cy.then(() => expect(getState(store)).to.deep.equal(before));
      });
    },
  );

  it(
    'AC3. should render an individual applicant name and bank disclosure without mutation',
    { tags: buildTags() },
    () => {
      const applicantTerms = [{ ...SUMMARY_TERMS[0], creditor: { type: 'applicant' as const } }];
      setupOrderTerms({ initialChild: PATHS.children.orderTermsSummary, acceptedTerms: applicantTerms });

      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        store.setApplicantDetails(structuredClone(SAVED_APPLICANT_INDIVIDUAL));
        const before = structuredClone(getState(store));
        cy.get(S.orderTermsSummary.card(1)).should('contain.text', 'Mx Test Applicant');
        cy.get(S.orderTermsSummary.creditorToggle(1)).click();
        cy.get(S.orderTermsSummary.creditorDetails(1))
          .should('be.visible')
          .and('contain.text', 'Test Applicant')
          .and('contain.text', '123456')
          .and('contain.text', 'PAY-123');
        cy.then(() => expect(getState(store)).to.deep.equal(before));
      });
    },
  );

  it('AC1. should render an HTML-like title as inert text', { tags: buildTags() }, () => {
    const title = '<img src=x onerror=alert(1)> Synthetic title';
    setupOrderTerms({
      initialChild: PATHS.children.orderTermsSummary,
      acceptedTerms: [{ ...SUMMARY_TERMS[0], presentation: { ...SUMMARY_TERMS[0].presentation, title } }],
      minorCreditors: SUMMARY_CREDITORS,
    });

    cy.get(S.orderTermsSummary.card(1)).should('contain.text', title).find('img').should('not.exist');
  });

  it('AC3. should present the disclosure as a GOV.UK link-style text button', { tags: buildTags() }, () => {
    setupSummary();

    cy.get(S.orderTermsSummary.card(1))
      .contains('a', 'Change')
      .then(($link) => {
        cy.get(S.orderTermsSummary.creditorToggle(1))
          .should('have.css', 'color', $link.css('color'))
          .and('have.css', 'font-size', $link.css('font-size'));
      });
  });

  it(
    'AC2. should open Change for the stable term and retain accepted values while pending',
    { tags: buildTags() },
    () => {
      setupSummary();

      cy.get(S.orderTermsSummary.card(2)).contains('a', 'Change').click();

      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', path(PATHS.children.orderTermsInput + '/MAT'));
      cy.get(S.orderTermsInput.amount).should('have.value', '20.00');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTermAmendment()?.termId).to.eq(2);
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
        expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
      });
    },
  );

  it('AC4. should start Add fresh and retain accepted terms', { tags: buildTags() }, () => {
    setupSummary();

    cy.get(S.orderTerms.add).click();

    cy.get<Router>('@angularRouter').its('url').should('eq', path(PATHS.children.orderTermsSelect));
    cy.get(S.orderTerms.select).should('have.value', '');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
      expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
    });
  });

  it('AC4. should return to case details and retain accepted terms', { tags: buildTags() }, () => {
    setupSummary();

    cy.get(S.orderTerms.return).click();

    cy.get<Router>('@angularRouter').its('url').should('eq', path(PATHS.children.taskList));
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
      expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
    });
  });

  it('AC2. should open Remove by array index and return without changing journey state', { tags: buildTags() }, () => {
    setupSummary();

    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      const before = structuredClone(getState(store));

      cy.get(S.orderTermsSummary.card(2)).contains('a', 'Remove').click();
      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', path(PATHS.children.orderTermsRemove + '/1'));
      cy.get(S.orderTerms.heading).should('have.text', 'Remove order term');
      cy.get(S.orderTermsSummary.removeReturn).click();
      cy.get<Router>('@angularRouter').its('url').should('eq', path(PATHS.children.orderTermsSummary));

      cy.then(() => {
        expect(getState(store)).to.deep.equal(before);
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
        expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
        expect(store.taskStatuses()).to.deep.equal(before.taskStatuses);
      });
    });
  });
});

describe('Order terms summary visual evidence', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('AC1. should capture the empty summary', { tags: buildTags() }, () => {
    setupSummary(false);
    cy.contains('p.govuk-body', 'There are currently no order terms.').should('be.visible');
    cy.screenshot('po-9811-order-terms-summary-empty');
  });

  it('AC1–AC4. should capture populated summary', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.screenshot('po-9811-order-terms-summary');
  });

  it('AC3. should capture expanded creditor details', { tags: buildTags() }, () => {
    setupOrderTerms({
      initialChild: PATHS.children.orderTermsSummary,
      acceptedTerms: [SUMMARY_TERMS[0], { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 2 } }],
      minorCreditors: SUMMARY_CREDITORS,
    });
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorToggle(2))
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq('Hide creditor details'));
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'Synthetic international bank with a deliberately long descriptive name')
      .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.screenshot('po-9811-order-terms-summary-expanded');
  });

  it('AC2. should capture the removal placeholder', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.remove(2)).click();
    cy.get(S.orderTerms.heading).should('have.text', 'Remove order term');
    cy.screenshot('po-9811-order-terms-remove');
  });
});
