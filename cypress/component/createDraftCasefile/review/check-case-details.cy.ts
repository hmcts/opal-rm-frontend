import { getState } from '@ngrx/signals';
import type { Subject } from 'rxjs';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_SUBMISSION_COPY as COPY } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-submission-copy.constant';
import { CASES_CREATE_CASEFILE_REVIEW_ERRORS as ERRORS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-review-errors.constant';
import { CASES_CREATE_CASEFILE_STATE } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import type { CasesCreateCasefileSubmissionOutcome } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-submission-outcome.type';
import type { CasesCreateCasefileSubmissionService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-submission.service';
import type { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import {
  createCompleteReviewState,
  createRemoOutReviewState,
  createOrganisationReviewState,
  createMixedCreditorReviewState,
  REVIEW_RECEIPT,
} from './mocks/review.mock';
import { setupReview, type ReviewStore } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9817', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const emit = (outcome: CasesCreateCasefileSubmissionOutcome) =>
  cy.get<Subject<CasesCreateCasefileSubmissionOutcome>>('@gatewayOutcomes').then((subject) => subject.next(outcome));
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
      cy.get(S.notice).should('have.text', COPY.notice);
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
      cy.get('@gatewaySubmit').should('not.have.been.called');
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
      cy.get('@gatewaySubmit').should('not.have.been.called');
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
    cy.get('@gatewaySubmit').should('not.have.been.called');
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
      cy.get('@gatewaySubmit').should('have.been.calledOnce');
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
      cy.get('@gatewaySubmit').should('not.have.been.called');
      cy.screenshot('po-9817-review-mixed-creditors');
    },
  );

  it('AC3. should lock repeated activation to one mock gateway call while pending', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.submit).then((button) => {
      button[0].click();
      button[0].click();
    });
    cy.get(S.submit).should('be.disabled');
    cy.get(S.change('respondent')).should('be.disabled');
    cy.get('@gatewaySubmit').should('have.been.calledOnce');
    cy.get('@routerNavigate').should('not.have.been.called');
    assertDraftRetained();
  });

  it(
    'AC4. should retain the entire draft after definite failure and allow one explicit retry',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.get(S.submit).click();
      emit({ status: 'definiteFailure' });
      cy.get(S.errors).should('contain.text', COPY.rejected).and('be.focused');
      cy.get(S.submit).should('be.enabled');
      assertDraftRetained();
      cy.get('@routerNavigate').should('not.have.been.called');
      cy.get(S.submit).click();
      cy.get('@gatewaySubmit').should('have.been.calledTwice');
      cy.get(S.submit).should('be.disabled');
    },
  );

  it('AC4. should retain unknown outcomes and prevent unsafe replay', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.submit).click();
    emit({ status: 'outcomeUnknown' });
    cy.get(S.errors).should('contain.text', COPY.unknown);
    cy.get(S.submit).should('be.disabled');
    cy.get<CasesCreateCasefileSubmissionService>('@submission').then((service) => service.submit());
    cy.get('@gatewaySubmit').should('have.been.calledOnce');
    cy.get('@routerNavigate').should('not.have.been.called');
    assertDraftRetained();
  });

  it('AC5. should reset the draft only after success and retain the mock receipt', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.submit).click();
    assertDraftRetained();
    emit({ status: 'success', receipt: REVIEW_RECEIPT });
    cy.get<ReviewStore>('@reviewStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
    cy.get<CasesCreateCasefileSubmissionService>('@submission').should((service) =>
      expect(service.receipt()).to.equal(REVIEW_RECEIPT),
    );
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.submissionConfirmation));
    cy.get('@gatewaySubmit').should('have.been.calledOnce');
    cy.screenshot('po-9817-review-after-mock-success');
  });

  it('AC5. should retry only confirmation navigation after a successful mock result', { tags: buildTags() }, () => {
    setupReview({ failNavigation: true });
    cy.get(S.submit).click();
    emit({ status: 'success', receipt: REVIEW_RECEIPT });
    cy.get(S.errors).should('contain.text', 'Your mock receipt is retained');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resolves(true));
    cy.get(S.retryConfirmation).click();
    cy.get('@routerNavigate').should('have.been.calledTwice');
    cy.get('@gatewaySubmit').should('have.been.calledOnce');
    cy.get(S.errors).should('not.exist');
  });

  it('AC2. should reject incomplete state without invoking the gateway', { tags: buildTags() }, () => {
    setupReview({ state: { respondentDetails: null } });
    cy.get(S.submit).click();
    cy.get(S.errors).should('contain.text', ERRORS.respondent.text).and('be.focused');
    cy.get('@gatewaySubmit').should('not.have.been.called');
    cy.get('@routerNavigate').should('not.have.been.called');
  });

  it('AC2. should reject stale managed references and focus their correction section', { tags: buildTags() }, () => {
    setupReview({ staleReferences: true });
    cy.get(S.submit).click();
    cy.get(S.errors).should('contain.text', ERRORS.respondent.text);
    cy.get(S.errorLink('respondent')).click();
    cy.get(S.section('respondent')).should('be.focused');
    cy.get('@gatewaySubmit').should('not.have.been.called');
    assertDraftRetained();
  });

  it('AC2. should recheck lost mock authority at submission and make no gateway call', { tags: buildTags() }, () => {
    setupReview({ authorised: false });
    cy.get(S.submit).click();
    cy.get(S.errors).should('contain.text', ERRORS.authority.text);
    cy.get('@gatewaySubmit').should('not.have.been.called');
    assertDraftRetained();
  });

  it('AC1. should request cancellation without clearing the draft', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.cancel).click();
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.cancel));
    assertDraftRetained();
    cy.get('@gatewaySubmit').should('not.have.been.called');
  });
});
