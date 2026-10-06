import { CASES_CREATE_CASEFILE_STATE } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { REVIEW_SUBMISSION_RECEIPT } from './mocks/review.mock';
import { interceptReviewSubmission, REVIEW_SUBMISSION_URL } from './setup/review-submission.intercept';
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

describe('Check case details submission', () => {
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
      cy.intercept('POST', REVIEW_SUBMISSION_URL, cy.spy().as('prohibitedPost'));
      setupReview();
      cy.get(S.heading).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.change('respondent')).should('be.focused').and('contain.text', 'Respondent details').type('{enter}');
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.respondentDetails));
      cy.get<CasesCreateCasefileReviewNavigationService>('@reviewNavigation').should((navigation) =>
        expect(navigation.context()).to.deep.equal({ origin: 'review', section: 'respondent' }),
      );
      assertDraftRetained();
      cy.get('@prohibitedPost').should('not.have.been.called');
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
      interceptReviewSubmission();
      setupReview({ state: createRemoOutReviewState() });
      cy.get(S.section('caseType')).should('contain.text', 'REMO Out').and('not.contain.text', 'Applicant type');
      cy.get(S.section('applicant'))
        .should('contain.text', 'Alternative Applicant')
        .and('contain.text', '31 January 1990');
      cy.get(S.submit).click();
      cy.wait('@draftCasefilePost').its('request.body.casefile_type').should('equal', 'REMO Out');
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

  it(
    'AC3. should POST resolved codes and open confirmation only after a successful response',
    { tags: buildTags() },
    () => {
      let releaseResponse: () => void;
      const responseReady = new Promise<void>((resolve) => {
        releaseResponse = resolve;
      });
      cy.intercept('POST', REVIEW_SUBMISSION_URL, (request) =>
        responseReady.then(() => request.reply({ statusCode: 201, body: REVIEW_SUBMISSION_RECEIPT })),
      ).as('draftCasefilePost');
      setupReview();
      cy.get(S.submit).click();
      cy.get(S.submit).should('be.enabled').click();
      cy.get(S.change('respondent')).should('match', 'a').click();
      cy.get('@routerNavigate').should('not.have.been.called');
      assertDraftRetained();
      cy.then(() => releaseResponse());
      cy.wait('@draftCasefilePost').then(({ request, response }) => {
        expect(response?.statusCode).to.equal(201);
        expect(request.body.business_unit_id).to.equal(44);
        expect(request.body.casefile.respondent_account.application_code).to.equal('TEST');
        expect(request.body.casefile.respondent_account.respondent.party_details.address.cjs_code).to.equal(101);
        expect(request.body.casefile.applicant.party_details.address.cjs_code).to.equal(101);
        expect(request.body.casefile.respondent_account.order_details.order_terms).to.deep.equal([
          {
            result_id: 'TEST01',
            creditor_type: 'Applicant',
            result_responses: [{ parameter_name: 'amount', response: '100.00' }],
          },
        ]);
        expect(request.body).not.to.have.property('taskStatuses');
      });
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.submissionConfirmation));
      cy.get<ReviewStore>('@reviewStore').should((store) => {
        expect(getState(store)).to.deep.equal({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
      });
      cy.get('@draftCasefilePost.all').should('have.length', 1);
    },
  );
  it(
    'AC3. should POST comma-separated checkbox selections and omit unselected parameters',
    { tags: buildTags() },
    () => {
      const state = createCompleteReviewState();
      state.orderTerms[0].parameters = {
        single: ['Option 1'],
        multiple: ['Option 1', 'Option 2', 'Option 3'],
        empty: [],
      };
      state.orderTerms[0].presentation.fields = [
        { name: 'single', label: 'Single selection', kind: 'checkbox', options: [] },
        { name: 'multiple', label: 'Multiple selections', kind: 'checkbox', options: [] },
        { name: 'empty', label: 'No selection', kind: 'checkbox', options: [] },
      ];
      interceptReviewSubmission();
      setupReview({ state });
      cy.get(S.submit).click();
      cy.wait('@draftCasefilePost').then(({ request }) => {
        expect(request.body.casefile.respondent_account.order_details.order_terms[0].result_responses).to.deep.equal([
          { parameter_name: 'single', response: 'Option 1' },
          { parameter_name: 'multiple', response: 'Option 1,Option 2,Option 3' },
        ]);
      });
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.submissionConfirmation));
    },
  );

  it(
    'AC3. should preserve the draft and use the global banner after a rejected submission',
    { tags: buildTags() },
    () => {
      interceptReviewSubmission(400);
      setupReview();
      cy.get(S.submit).click();
      cy.wait('@draftCasefilePost');
      cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) => {
        expect(store.bannerError()).to.include({ error: true, message: 'Synthetic validation failure' });
      });
      cy.get(S.errors).should('not.exist');
      assertDraftRetained();
      cy.get('@routerNavigate').should('not.have.been.called');
      cy.get('@draftCasefilePost.all').should('have.length', 1);
    },
  );
  it(
    'AC3. should retain the successful submission and retry navigation without submitting again',
    { tags: buildTags() },
    () => {
      interceptReviewSubmission();
      setupReview({ failNavigation: true });
      cy.get(S.submit).click();
      cy.wait('@draftCasefilePost');
      cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) =>
        expect(store.bannerError().error).to.equal(true),
      );
      cy.get(S.errors).should('not.exist');
      cy.get<ReviewStore>('@reviewStore').should((store) => {
        expect(getState(store)).to.deep.equal({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
      });
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
        navigate.onSecondCall().resolves(true),
      );
      cy.get(S.submit).should('be.enabled').click();
      cy.get('@routerNavigate').should('have.been.calledTwice');
      cy.get(S.errors).should('not.exist');
      cy.get('@draftCasefilePost.all').should('have.length', 1);
    },
  );
  it('AC4. should retain the draft when opening cancellation', { tags: buildTags() }, () => {
    setupReview();
    cy.get(S.cancel).click();
    cy.get('@routerNavigate').should('have.been.calledWith', route(PATHS.children.cancel));
    assertDraftRetained();
  });
});
