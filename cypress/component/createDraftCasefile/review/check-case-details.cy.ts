import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import {
  createCompleteReviewState,
  createRemoOutReviewState,
  createOrganisationReviewState,
  createMixedCreditorReviewState,
} from './mocks/review.mock';
import { setupReview, type ReviewStore } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9817', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const assertDraftRetained = () =>
  cy
    .get<ReviewStore>('@reviewStore')
    .should((store) => expect(getState(store)).to.deep.equal(createCompleteReviewState()));

describe('Check case details local mock review', () => {
  it(
    'AC1. should display every accepted review section without originator or generated fields',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.get(S.heading).should('have.text', 'Check case details');
      cy.get(S.section('caseType')).should('contain.text', 'REMO In').and('contain.text', 'Individual');
      cy.get(S.section('respondent'))
        .should('contain.text', 'Alternative Respondent')
        .and('contain.text', '31 January 1990')
        .and('contain.text', 'Test country')
        .and('contain.text', 'Synthetic restriction');
      cy.get(S.section('applicant'))
        .should('contain.text', 'Test Applicant')
        .and('contain.text', 'applicant@example.com');
      cy.get(S.section('centralAuthority')).should('contain.text', 'TEST-REMO').and('contain.text', 'TEST-CA');
      cy.get(S.section('orderDetails'))
        .should('contain.text', 'TEST Synthetic application')
        .and('contain.text', '15 September 2026');
      cy.get(S.section('orderTerms')).should('contain.text', 'Synthetic maintenance').and('contain.text', '£100.00');
      cy.get(S.section('interestAndIndexation')).should('contain.text', 'No indexation');
      cy.get(S.section('managingPayments')).should('contain.text', 'Payments via the court');
      cy.get(S.section('commentsAndNotes'))
        .should('contain.text', 'Synthetic review comment')
        .and('contain.text', 'Synthetic review note');
      cy.contains('Originator').should('not.exist');
      cy.screenshot('po-9817-review-before-submission');
    },
  );

  it('AC1. should expand and collapse bank details without changing accepted state', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.bankDetails).should('not.have.attr', 'open');
    cy.get(S.bankToggle).click();
    cy.get(S.bankDetails).should('have.attr', 'open');
    cy.get(S.bankDetails).should('contain.text', '12345678').and('contain.text', 'PAY-123');
    cy.get(S.bankToggle).click();
    cy.get(S.bankDetails).should('not.have.attr', 'open');
    assertDraftRetained();
  });

  it(
    'AC1, AC6. should tab to the contextual Change action and request correction with review context',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.get(S.heading).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.change('respondent')).should('be.focused').and('contain.text', 'Respondent details').type('{enter}');
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.respondentDetails));
      cy.get<CasesCreateCasefileReviewNavigationService>('@reviewNavigation').should((navigation) =>
        expect(navigation.context()).to.deep.equal({ origin: 'review', section: 'respondent' }),
      );
      assertDraftRetained();
    },
  );

  it(
    'AC1. should begin a correction for the selected term without replacing accepted data',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.get(S.termChange(1)).click();
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.orderTermsInput) + '/TEST01');
      cy.get<ReviewStore>('@reviewStore').should((store) => {
        expect(store.orderTermAmendment()?.termId).to.equal(1);
        expect(store.orderTerms()).to.deep.equal(createCompleteReviewState().orderTerms);
        expect(store.applicantDetails()).to.deep.equal(createCompleteReviewState().applicantDetails);
      });
      cy.get<CasesCreateCasefileReviewNavigationService>('@reviewNavigation').should((navigation) =>
        expect(navigation.context()).to.deep.equal({ origin: 'review', section: 'orderTerm', termId: 1 }),
      );
    },
  );

  it('AC1. should request term removal confirmation without deleting the accepted term', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.termRemove(1)).click();
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.orderTermsRemove) + '/0');
    cy.get<ReviewStore>('@reviewStore').should((store) => {
      expect(store.orderTermRemoval()?.termId).to.equal(1);
      expect(store.orderTerms()).to.deep.equal(createCompleteReviewState().orderTerms);
    });
  });

  it(
    'AC1. should render REMO Out without an applicant-type choice and retain the individual applicant',
    { tags: buildTags() },
    () => {
      setupReview({ state: createRemoOutReviewState() });
      cy.get(S.section('caseType')).should('contain.text', 'REMO Out').and('not.contain.text', 'Applicant type');
      cy.get(S.section('applicant'))
        .should('contain.text', 'Alternative Applicant')
        .and('contain.text', '31 January 1990');
      cy.get(S.submit).click();
      cy.get(S.errors).should('not.exist');
    },
  );

  it(
    'AC1. should render organisation details and all accepted international bank values',
    { tags: buildTags() },
    () => {
      setupReview({ state: createOrganisationReviewState() });
      cy.get(S.section('caseType')).should('contain.text', 'Organisation');
      cy.get(S.section('applicant'))
        .should('contain.text', 'Example Organisation')
        .and('contain.text', 'FA-9803')
        .and('not.contain.text', 'Date of birth');
      cy.get(S.bankToggle).click();
      cy.get(S.bankDetails)
        .should('contain.text', 'EXAMGB2L')
        .and('contain.text', 'GB29NWBK60161331926819')
        .and('contain.text', 'Example International Bank')
        .and('contain.text', 'EX-001')
        .and('contain.text', '87654321')
        .and('contain.text', 'INTL-9803');
      cy.get(S.change('applicant')).click();
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.applicantOrganisation));
      cy.get<ReviewStore>('@reviewStore').should((store) =>
        expect(getState(store)).to.deep.equal(createOrganisationReviewState()),
      );
    },
  );

  it(
    'AC1. should independently disclose mixed and repeated minor creditors with unique DOM IDs',
    { tags: buildTags() },
    () => {
      setupReview({ state: createMixedCreditorReviewState() });
      cy.get(S.section('orderTerms'))
        .should('contain.text', 'Synthetic major creditor')
        .and('contain.text', 'Test Applicant');
      cy.get(S.section('minor-creditor-1-term-3')).find('summary').click();
      cy.get(S.section('minor-creditor-1-term-3')).find('details').should('have.attr', 'open');
      cy.get(S.section('minor-creditor-1-term-3'))
        .should('contain.text', '001122')
        .and('contain.text', '00112233')
        .and('contain.text', 'Example reference');
      cy.get(S.section('minor-creditor-1-term-5')).find('details').should('not.have.attr', 'open');
      cy.get(S.section('minor-creditor-1-term-5')).find('summary').click();
      cy.get(S.section('minor-creditor-1-term-5')).find('details').should('have.attr', 'open');
      cy.get(S.section('minor-creditor-2-term-4')).find('summary').click();
      cy.get(S.section('minor-creditor-2-term-4'))
        .should('contain.text', 'Synthetic international account holder')
        .and('contain.text', 'Synthetic international bank with a deliberately long descriptive name')
        .and('contain.text', 'SYNTHETIC-LONG-BRANCH-REFERENCE-00000001')
        .and('contain.text', '000000001234567890')
        .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
      cy.get(S.section('minor-creditor-3-term-6')).find('summary').click();
      cy.get(S.section('minor-creditor-3-term-6'))
        .should('contain.text', 'Example')
        .and('contain.text', 'Person')
        .and('contain.text', 'None or not applicable');
      cy.document().should((document) => {
        const ids = Array.from(document.querySelectorAll('[id]'), (element) => element.id);
        expect(new Set(ids).size).to.equal(ids.length);
      });
      cy.get<ReviewStore>('@reviewStore').should((store) =>
        expect(getState(store)).to.deep.equal(createMixedCreditorReviewState()),
      );
      cy.screenshot('po-9817-review-mixed-creditors');
    },
  );

  it('AC3. should simulate submission by navigating with the draft unchanged', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.submit).click();
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.submissionConfirmation));
    assertDraftRetained();
  });
  it('should retain the draft when confirmation navigation fails', { tags: buildTags() }, () => {
    setupReview({ failNavigation: true });
    cy.get(S.submit).click();
    cy.get(S.errors).should('contain.text', 'The page could not be opened').and('be.focused');
    assertDraftRetained();
  });
  it('should retain the draft when opening cancellation', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.cancel).click();
    cy.get('@routerNavigate').should('have.been.calledWith', route(PATHS.children.cancel));
    assertDraftRetained();
  });
});
