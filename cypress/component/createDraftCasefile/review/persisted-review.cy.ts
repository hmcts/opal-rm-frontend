import type { CasesDraftDeletePlaceholderComponent } from 'src/app/flows/cases/cases-draft/cases-draft-delete-placeholder/cases-draft-delete-placeholder.component';
import type { ComponentFixture } from '@angular/core/testing';
import type { Data } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { getState } from '@ngrx/signals';
import type { BehaviorSubject } from 'rxjs';
import { CasesDraftCasefileStore } from 'src/app/flows/cases/cases-draft/stores/cases-draft-casefile.store';
import { createPersistedCasefileResolved } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { CasesCreateCasefileCheckDetailsComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { createCompleteReviewState } from './mocks/review.mock';
import { reviewUser, setupReview, type ReviewStore } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-10608', '@JIRA-EPIC:PO-10817', '@JIRA-LABEL:create-draft-casefile'];
const checkerReturn =
  '/' + CASES_DRAFT_CHECKER_ROUTING_PATHS.root + '/' + CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs + '#to-review';
const inputterReturn =
  '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs + '#in-review';
const assertNoMutation = () => {
  cy.get('@persistedMutation').should('not.have.been.called');
  cy.get('@completeSubmission').should('not.have.been.called');
};
const spyCompletion = () =>
  cy.get<ReviewStore>('@reviewStore').then((store) => cy.spy(store, 'completeSubmission').as('completeSubmission'));
const assertSummaryError = (message: string) => {
  cy.get(S.decisionSummary).should('be.focused');
  cy.contains(S.rejectionReasonSummaryLink, message).should('have.text', message);
};
const assertPerson = (section: string, firstNames: string, lastName: string) => {
  cy.get(S.rowValue(section, 'FirstNames'))
    .invoke('text')
    .should((text) => expect(text.trim()).to.equal(firstNames));
  cy.get(S.rowValue(section, 'LastName'))
    .invoke('text')
    .should((text) => expect(text.trim()).to.equal(lastName));
};
const assertHistoryAboveDetails = () =>
  cy.get('@reviewHost').should(($host) => {
    const heading = $host.find(S.heading)[0].getBoundingClientRect();
    const status = $host.find(S.status)[0].getBoundingClientRect();
    const history = $host.find(S.history)[0].getBoundingClientRect();
    const details = $host.find(S.section('caseType'))[0].getBoundingClientRect();
    expect(status.top, 'status below heading').to.be.at.least(heading.bottom);
    expect(history.top, 'history below status').to.be.at.least(status.bottom);
    expect(details.top, 'case details below history').to.be.at.least(history.bottom);
  });
const assertSavedEnvelope = (draft = createPersistedCasefileDetail()) =>
  cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) => {
    expect(store.draft()).to.deep.equal(draft);
    expect(store.etag()).to.equal('"0"');
  });

describe('Persisted case details', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    const writes = cy.spy().as('persistedMutation');
    ['POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
      cy.intercept({ method, url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ }, (request) => {
        writes(request.method);
        request.reply({ statusCode: 500 });
      });
    });
  });

  it(
    'AC1, AC2, AC5. should restore saved individual summaries without editing or decisions in inputter view',
    { tags: buildTags() },
    () => {
      setupReview({
        resolved: createPersistedCasefileResolved({
          intent: 'inputter-view',
          mode: 'view',
          context: 'inputter',
          dashboardMode: 'inputter',
        }),
        user: reviewUser('inputter'),
      });
      spyCompletion();
      cy.get(S.heading).should('have.text', 'Synthetic Respondent');
      assertPerson('respondent', 'Synthetic', 'Respondent');
      assertPerson('applicant', 'Synthetic', 'Applicant');
      cy.get(S.section('respondent')).should('contain.text', 'Test Country One');
      cy.get(S.section('applicant')).should('contain.text', 'Test Country Two');
      cy.get(S.section('orderDetails')).should('contain.text', 'TEST Test application');
      cy.get(S.section('orderTerms'))
        .should('contain.text', 'Test order term')
        .and('contain.text', 'Amount')
        .and('contain.text', '£100.00');
      cy.get(S.section('commentsAndNotes')).should('not.exist');
      cy.get(S.rowValue('respondent', 'DateOfBirth')).should('contain.text', 'Not provided');
      cy.get('@reviewHost').find('a[id$="-change"], a[id^="review-term-remove-"]').should('not.exist');
      cy.get(CreateCasefileSelectors.orderTerms.add).should('not.exist');
      cy.get(S.submit).should('not.exist');
      cy.get(S.cancel).should('not.exist');
      cy.get(S.decisionHost).should('not.exist');
      cy.get(S.delete).should('not.exist');
      cy.get(S.status).should('have.text', 'In review');
      assertHistoryAboveDetails();
      cy.screenshot('po-10608-persisted-inputter-view-1280');
      cy.get('@reviewHost').find(S.backLink).click();
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
        expect(navigate.firstCall.args[0].toString()).to.equal(inputterReturn),
      );
      assertSavedEnvelope();
      assertNoMutation();
    },
  );

  it(
    'AC2, AC5. should retain organisation labels, optional values and independent minor-creditor disclosure',
    { tags: buildTags() },
    () => {
      const draft = createPersistedCasefileDetail();
      draft.casefile.applicant.party_details = {
        organisation: true,
        organisation_details: {
          organisation_name: 'Synthetic organisation',
          foreign_authority_reference: 'SYNTHETIC-REF',
        },
        address: { address_line_1: '3 Test Street', cjs_code: 101 },
      };
      draft.casefile.minor_creditors = [
        {
          creditor_sequence: 4,
          party_details: {
            organisation: false,
            individual_details: { forenames: 'Synthetic', surname: 'Creditor' },
            address: { address_line_1: '4 Test Street', cjs_code: 102 },
          },
          bank_account_details: {
            bank_account_type: 'UK Bank',
            uk_bank_details: {
              account_name: 'Synthetic account',
              sort_code: '001122',
              account_number: '00112233',
              payment_reference: 'SYNTHETIC',
            },
          },
        },
      ];
      draft.casefile.respondent_account.order_details.order_terms[0].creditor_type = 'Minor Creditor';
      draft.casefile.respondent_account.order_details.order_terms[0].minor_creditor_sequence = 4;
      setupReview({ resolved: createPersistedCasefileResolved({ draft }) });
      spyCompletion();
      cy.get(S.section('caseType')).should('contain.text', 'Organisation');
      cy.get(S.section('applicant'))
        .should('contain.text', 'Synthetic organisation')
        .and('contain.text', 'SYNTHETIC-REF')
        .and('not.contain.text', 'Date of birth');
      assertPerson('minor-creditor-4-term-1', 'Synthetic', 'Creditor');
      cy.get(S.section('minor-creditor-4-term-1')).find('details').should('not.have.attr', 'open');
      cy.get(S.section('minor-creditor-4-term-1')).find('summary').click();
      cy.get(S.section('minor-creditor-4-term-1')).find('details').should('have.attr', 'open');
      cy.get(S.section('minor-creditor-4-term-1'))
        .find('details')
        .should('contain.text', '00112233')
        .and('contain.text', 'SYNTHETIC');
      cy.get(S.bankDetails).should('not.have.attr', 'open');
      cy.get('@reviewHost').find('a[id$="-change"], a[id^="review-term-remove-"]').should('not.exist');
      assertSavedEnvelope(draft);
      assertNoMutation();
    },
  );

  it(
    'AC2. should order history chronologically without changing server dates or omitting rejection reasons',
    { tags: buildTags() },
    () => {
      const draft = createPersistedCasefileDetail();
      draft.timeline_data = [
        { username: 'Synthetic resubmitter', status: 'Resubmitted', status_date: '2026-09-17T09:00:00Z' },
        { username: 'Synthetic submitter', status: 'Submitted', status_date: '2026-09-15T09:00:00Z' },
        {
          username: 'Synthetic checker',
          status: 'Rejected',
          status_date: '2026-09-16T09:00:00Z',
          reason_text: 'Synthetic historical rejection',
        },
      ];
      setupReview({ resolved: createPersistedCasefileResolved({ draft }) });
      cy.get(S.history)
        .find('.moj-timeline__title')
        .should(($titles) =>
          expect([...$titles].map((title) => title.textContent?.trim())).to.deep.equal([
            'Submitted',
            'Rejected',
            'Resubmitted',
          ]),
        );
      cy.get(S.history)
        .should('contain.text', 'Synthetic checker')
        .and('contain.text', 'Synthetic historical rejection');
      assertSavedEnvelope(draft);
    },
  );

  (['checker-view', 'inputter-view'] as const).forEach((intent) => {
    it(
      `AC1, AC5. should hide all actions for ${intent} and gate direct editing handlers`,
      { tags: buildTags() },
      () => {
        setupReview({
          resolved: createPersistedCasefileResolved({ intent, mode: 'view' }),
        });
        spyCompletion();
        cy.get(S.decisionHost).should('not.exist');
        cy.get(S.delete).should('not.exist');
        cy.get<ComponentFixture<CasesCreateCasefileCheckDetailsComponent>>('@reviewFixture').then(
          ({ componentInstance }) => {
            componentInstance.handleChange('respondent');
            componentInstance.handleTermChange(1);
            componentInstance.handleTermRemove(1);
            componentInstance.handleSubmit();
            componentInstance.handleCancel();
          },
        );
        cy.get('@routerNavigate').should('not.have.been.called');
        assertNoMutation();
      },
    );
  });

  it(
    'AC1, AC2, AC3, AC5. should show an eligible review with no decision selected and no editor actions',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      cy.get(S.decisionApprove).should('not.be.checked');
      cy.get(S.decisionReject).should('not.be.checked');
      cy.get(S.rejectionReason).should('not.exist');
      cy.get(S.delete).should('be.visible').and('match', 'a.govuk-link').and('have.text', 'Delete case');
      assertHistoryAboveDetails();
      cy.get(S.decisionHost).should(($decision) => {
        const decision = $decision[0].getBoundingClientRect();
        const details = $decision.prev()[0].getBoundingClientRect();
        expect(decision.top, 'decision below case details').to.be.at.least(details.bottom);
      });
      cy.get(S.status).should('have.text', 'To review');
      cy.get(CreateCasefileSelectors.orderTerms.add).should('not.exist');
      cy.get('@reviewHost').find('a[id$="-change"], a[id^="review-term-remove-"]').should('not.exist');
      cy.screenshot('po-10608-persisted-checker-review-1280');
    },
  );

  it('AC3. should focus the exact missing-decision error and its first radio', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    spyCompletion();
    cy.get(S.decisionContinue).click();
    assertSummaryError('Select a review decision');
    cy.contains(S.rejectionReasonSummaryLink, 'Select a review decision').click();
    cy.get(S.decisionApprove).should('be.focused');
    cy.get('@routerNavigate').should('not.have.been.called');
    assertNoMutation();
  });

  ['', '   '].forEach((reason) => {
    it(
      `AC3. should reject a ${reason ? 'whitespace-only' : 'missing'} reason with linked textarea focus`,
      { tags: buildTags() },
      () => {
        setupReview({ resolved: createPersistedCasefileResolved() });
        spyCompletion();
        cy.get(S.decisionReject).check();
        if (reason) cy.get(S.rejectionReason).type(reason);
        cy.get(S.decisionContinue).click();
        assertSummaryError('Enter reason for rejection');
        cy.get(S.rejectionReason).should('have.attr', 'aria-invalid', 'true');
        cy.contains(S.rejectionReasonSummaryLink, 'Enter reason for rejection').click();
        cy.get(S.rejectionReason).should('be.focused');
        cy.get('@routerNavigate').should('not.have.been.called');
        assertNoMutation();
      },
    );
  });

  it('AC3. should block 251 characters and accept exactly 250 without saving the case', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    spyCompletion();
    cy.get(S.decisionReject).check();
    cy.get(S.rejectionReason).type('R'.repeat(251));
    cy.get(S.rejectionReasonCount).should('contain.text', 'You have 1 character too many');
    cy.get(S.decisionContinue).click();
    assertSummaryError('Reason for rejection must be 250 characters or fewer');
    cy.screenshot('po-10608-persisted-reason-validation-1280');
    cy.get('@routerNavigate').should('not.have.been.called');
    cy.get(S.rejectionReason).type('{backspace}');
    cy.get(S.rejectionReasonCount).should('contain.text', 'You have 0 characters remaining');
    cy.get(S.decisionContinue).click();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
      expect(navigate.firstCall.args[0].toString()).to.equal(checkerReturn),
    );
    assertSavedEnvelope();
    assertNoMutation();
  });

  it('AC3. should clear rejection errors and reason when switching to Approve', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    spyCompletion();
    cy.get(S.decisionReject).check();
    cy.get(S.rejectionReason).type('R'.repeat(251));
    cy.get(S.decisionContinue).click();
    assertSummaryError('Reason for rejection must be 250 characters or fewer');
    cy.get(S.decisionApprove).check();
    cy.get(S.rejectionReason).should('not.exist');
    cy.get(S.decisionSummary).should('not.exist');
    cy.get(S.decisionReject).check();
    cy.get(S.rejectionReason).should('have.value', '');
    cy.get(S.rejectionReasonCount).should('contain.text', 'You have 250 characters remaining');
    cy.get(S.decisionApprove).check();
    cy.get(S.decisionContinue).click();
    assertSavedEnvelope();
    assertNoMutation();
  });

  ['approve', 'reject'].forEach((decision) => {
    it(
      `AC3. should locally return after ${decision} while preserving lifecycle and creation completion`,
      { tags: buildTags() },
      () => {
        setupReview({ resolved: createPersistedCasefileResolved() });
        spyCompletion();
        cy.get(decision === 'approve' ? S.decisionApprove : S.decisionReject).check();
        if (decision === 'reject') cy.get(S.rejectionReason).type('Synthetic review reason');
        cy.get(S.decisionContinue).click();
        cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
          expect(navigate.firstCall.args[0].toString()).to.equal(checkerReturn),
        );
        assertSavedEnvelope();
        cy.get<ReviewStore>('@reviewStore').should((store) => expect(store.submissionSucceeded()).to.equal(false));
        assertNoMutation();
      },
    );
  });

  ['false', 'rejected'].forEach((failure) => {
    it(
      `AC3. should retain local decisions after ${failure} navigation and allow retry without mutation`,
      { tags: buildTags() },
      () => {
        setupReview({ resolved: createPersistedCasefileResolved(), failNavigation: true });
        spyCompletion();
        if (failure === 'rejected')
          cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
            navigate.rejects(new Error('Synthetic navigation rejection')),
          );
        cy.get(S.decisionReject).check();
        cy.get(S.rejectionReason).type('Synthetic reason retained for retry');
        cy.get(S.decisionContinue).click();
        cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) =>
          expect(store.bannerError().error).to.equal(true),
        );
        cy.get(S.decisionReject).should('be.checked');
        cy.get(S.rejectionReason).should('have.value', 'Synthetic reason retained for retry');
        cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resolves(true));
        cy.get(S.decisionContinue).click();
        cy.get('@routerNavigate').should('have.been.calledTwice');
        assertSavedEnvelope();
        assertNoMutation();
      },
    );
  });

  it(
    'AC1, AC3. should reset decisions, reason and errors on same-component draft A to B reuse',
    { tags: buildTags() },
    () => {
      const second = createPersistedCasefileDetail();
      second.draft_casefile_id = 18;
      second.casefile.respondent_account.respondent.party_details.individual_details!.forenames = 'Second';
      second.casefile.applicant.party_details.individual_details!.forenames = 'Second';
      second.casefile_status = 'RESUBMITTED';
      second.casefile.respondent_account.order_details.order_terms[0].result_responses[0].response = '200.00';
      const resolvedB = createPersistedCasefileResolved({ draft: second });
      setupReview({ resolved: createPersistedCasefileResolved() });
      cy.get(S.heading).should('have.text', 'Synthetic Respondent');
      cy.get(S.decisionReject).check();
      cy.get(S.rejectionReason).type('R'.repeat(251));
      cy.get(S.decisionContinue).click();
      assertSummaryError('Reason for rejection must be 250 characters or fewer');
      cy.get<BehaviorSubject<Data>>('@reviewRouteData').then((data) =>
        data.next({ casefileIntent: 'checker-review', draftCasefile: resolvedB }),
      );
      cy.get(S.heading).should('have.text', 'Second Respondent');
      assertPerson('respondent', 'Second', 'Respondent');
      assertPerson('applicant', 'Second', 'Applicant');
      cy.get(S.section('orderTerms')).should('contain.text', '£200.00').and('not.contain.text', '£100.00');
      cy.get(S.decisionApprove).should('not.be.checked');
      cy.get(S.decisionReject).should('not.be.checked');
      cy.get(S.rejectionReason).should('not.exist');
      cy.get(S.decisionSummary).should('not.exist');
      cy.get(S.decisionReject).check();
      cy.get(S.rejectionReason).should('have.value', '');
      assertSavedEnvelope(second);
      setupReview();
      cy.get(S.heading).should('have.text', 'Check case details');
      cy.get(S.submit).should('be.visible');
      assertPerson('respondent', 'Test', 'Respondent');
      cy.get(S.history).should('not.exist');
      cy.get(S.decisionHost).should('not.exist');
      cy.get<ReviewStore>('@reviewStore').should((store) =>
        expect(getState(store)).to.deep.equal(createCompleteReviewState()),
      );
      cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) =>
        expect(store.draft()).to.equal(null),
      );
    },
  );

  ['cleared authentication', 'cleared user', 'changed user', 'changed BU user', 'disabled feature'].forEach((loss) => {
    it(`AC1, AC3. should hide summaries and stop actions after ${loss}`, { tags: buildTags() }, () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      spyCompletion();
      cy.get(S.decisionApprove).check();
      cy.get<InstanceType<typeof GlobalStore>>('@globalStore').then((store) => {
        const user = structuredClone(reviewUser());
        if (loss === 'cleared authentication') store.setAuthenticated(false);
        if (loss === 'disabled feature') store.setFeatureFlags({ 'release-1c-rm-create-case-files': false });
        if (loss === 'cleared user') {
          user.user_id = 0;
          user.status = null;
          user.business_unit_users = [];
          store.setUserState(user);
        }
        if (loss === 'changed user') {
          user.user_id = 10609;
          store.setUserState(user);
        }
        if (loss === 'changed BU user') {
          user.business_unit_users[0].business_unit_user_id = 'BUU-CHANGED';
          store.setUserState(user);
        }
      });
      cy.get(S.heading).should('not.exist');
      cy.get(S.decisionHost).should('not.exist');
      cy.get(S.delete).should('not.exist');
      cy.get<ComponentFixture<CasesCreateCasefileCheckDetailsComponent>>('@reviewFixture').then(
        ({ componentInstance }) => {
          componentInstance.handleBack();
          componentInstance.handleDecision();
        },
      );
      cy.get('@routerNavigate').should('not.have.been.called');
      assertNoMutation();
    });
  });

  (['SUBMITTED', 'RESUBMITTED', 'REJECTED', 'PUBLISHED'] as const).forEach((status) => {
    it(`AC1, AC3. should only offer decisions for a reviewable ${status} lifecycle`, { tags: buildTags() }, () => {
      const draft = createPersistedCasefileDetail();
      draft.casefile_status = status;
      setupReview({ resolved: createPersistedCasefileResolved({ draft }) });
      cy.get(S.heading).should('be.visible');
      cy.get(S.decisionHost).should(['SUBMITTED', 'RESUBMITTED'].includes(status) ? 'exist' : 'not.exist');
      cy.get(S.delete).should(['SUBMITTED', 'RESUBMITTED'].includes(status) ? 'exist' : 'not.exist');
    });
  });

  it(
    'AC1, AC3. should show a self-submitted case as read-only using the BU-user identity',
    { tags: buildTags() },
    () => {
      const draft = createPersistedCasefileDetail();
      draft.submitted_by = 'BUU-CHECKER';
      setupReview({ resolved: createPersistedCasefileResolved({ draft }) });
      cy.get(S.heading).should('be.visible');
      cy.get(S.decisionHost).should('not.exist');
      cy.get(S.delete).should('not.exist');
    },
  );

  it(
    'AC1, AC3. should retain readable summaries and stop decisions after permission 22 is lost',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      spyCompletion();
      cy.get(S.decisionApprove).check();
      cy.get<InstanceType<typeof GlobalStore>>('@globalStore').then((store) =>
        store.setUserState(reviewUser('inputter')),
      );
      cy.get(S.heading).should('be.visible');
      cy.get(S.decisionHost).should('not.exist');
      cy.get(S.delete).should('not.exist');
      cy.get<ComponentFixture<CasesCreateCasefileCheckDetailsComponent>>('@reviewFixture').then(
        ({ componentInstance }) => componentInstance.handleDecision(),
      );
      cy.get('@routerNavigate').should('not.have.been.called');
      cy.get('@reviewHost').find(S.backLink).click();
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
        expect(navigate.firstCall.args[0].toString()).to.equal(inputterReturn),
      );
      assertSavedEnvelope();
      assertNoMutation();
    },
  );

  it(
    'AC5. should open the interim Delete destination without changing the persisted case',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      spyCompletion();
      cy.get(S.delete)
        .should('match', 'a.govuk-link')
        .and('have.attr', 'href', '/cases/draft/check-and-validate/delete/17')
        .focus();
      cy.get(S.delete).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
        expect(navigate.firstCall.args[0].toString()).to.equal(
          '/' +
            CASES_DRAFT_CHECKER_ROUTING_PATHS.root +
            '/' +
            CASES_DRAFT_CHECKER_ROUTING_PATHS.children.delete +
            '/17',
        ),
      );
      assertSavedEnvelope();
      assertNoMutation();
    },
  );

  it(
    'AC5. should return from the real Delete walkthrough without mutation or creation completion',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved({ intent: 'checker-delete' }), deleteScreen: true });
      spyCompletion();
      cy.get('@reviewHost')
        .find(CreateCasefileSelectors.heading)
        .should('have.text', 'Delete casefile')
        .and('be.focused');
      cy.screenshot('po-10608-persisted-delete-1280');
      cy.get(S.deleteReturn).click();
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
        expect(navigate.firstCall.args[0].toString()).to.equal(checkerReturn),
      );
      assertSavedEnvelope();
      assertNoMutation();
    },
  );

  ['successful', 'false', 'rejected'].forEach((redirect) => {
    it(
      `AC1, AC5. should safely handle ${redirect} permission-denied navigation after Delete loses permission 22`,
      { tags: buildTags() },
      () => {
        setupReview({
          resolved: createPersistedCasefileResolved({ intent: 'checker-delete' }),
          deleteScreen: true,
          failNavigation: redirect !== 'successful',
        });
        spyCompletion();
        if (redirect === 'rejected')
          cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
            navigate.rejects(new Error('Synthetic denial navigation rejection')),
          );
        cy.get(S.deleteReturn).should('be.visible');
        cy.get<InstanceType<typeof GlobalStore>>('@globalStore').then((store) =>
          store.setUserState(reviewUser('inputter')),
        );
        cy.get(S.deleteReturn).should('not.exist');
        cy.get('@reviewHost').find(CreateCasefileSelectors.heading).should('have.text', 'Delete casefile');
        cy.get('@routerNavigate').should('have.been.calledOnceWith', '/error/permission-denied');
        cy.get<ComponentFixture<CasesDraftDeletePlaceholderComponent>>('@reviewFixture').then(({ componentInstance }) =>
          componentInstance.handleReturn(),
        );
        cy.get('@routerNavigate').should('have.been.calledOnce');
        if (redirect !== 'successful')
          cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) =>
            expect(store.bannerError().error).to.equal(true),
          );
        assertSavedEnvelope();
        assertNoMutation();
      },
    );
  });
});
