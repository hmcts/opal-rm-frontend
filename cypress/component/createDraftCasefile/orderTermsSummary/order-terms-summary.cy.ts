import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
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
  it('AC1–AC4. should capture populated summary', { tags: buildTags() }, () => {
    cy.viewport(1280, 800);
    setupSummary();
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.screenshot('po-9811-order-terms-summary');
  });
});
