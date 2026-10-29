import { activateCasefileControl, setCasefileReason } from './casefile-review-controls.actions';
import { selectedPersistedCasefile } from '../../mocks/createDraftCasefile/persisted-casefile.mock';
import { stubPersistedCasefileReferences } from '../../setup/createDraftCasefile/persisted-casefile.intercept';
import { CreateCasefileSelectors as CREATE } from '../../../../../shared/selectors/create-casefile.selectors';
import { CasesDraftSelectors as DASHBOARD } from '../../../../../shared/selectors/cases-draft.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { checkerUser } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import type { CheckerRole } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import type { CasesDraftCasefileDecision } from 'src/app/flows/cases/cases-draft/types/cases-draft-casefile-decision.type';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';

const S = CREATE.review;
const D = CREATE.deletion;
const CHECKER = '/cases/draft/check-and-validate';
const INPUTTER = '/cases/draft/create-and-manage/tabs';
const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;

/** Owns selected GET, permission fixtures and browser interactions and explicit decision fixtures. */
export class CheckCaseDetailsModesActions {
  private draft = selectedPersistedCasefile(17);
  private selectedEtag = '"0"';
  private deletionReason = '';
  private decisionReason = '';
  private decisionIntent: CasesDraftCasefileDecision['decision'] = 'approve';
  private failure = '';
  private writes: string[] = [];
  private host: HTMLElement | null = null;

  /** Sets synthetic identity and independent HTTP fixtures without bypassing application guards.
   * @param role Permission role.
   * @param status Persisted lifecycle.
   * @param submitter Other or self BU-user. */
  public prepare(role: CheckerRole, status: string, submitter: string): void {
    this.selectedEtag = '"0"';
    this.deletionReason = '';
    this.decisionReason = '';
    this.decisionIntent = 'approve';
    this.failure = '';
    this.writes = [];
    this.host = null;
    this.draft = selectedPersistedCasefile(17, status, submitter === 'self' ? 'BUU-CHECKER' : 'BUU-OTHER');
    this.draft.timeline_data = [
      { username: 'Synthetic second checker', status: 'Resubmitted', status_date: '2026-09-17T09:00:00Z' },
      { username: 'Synthetic Submitter', status: 'Submitted', status_date: '2026-09-15T09:00:00Z' },
      {
        username: 'Synthetic first checker',
        status: 'Rejected',
        status_date: '2026-09-16T09:00:00Z',
        reason_text: 'Synthetic earlier rejection',
      },
    ];
    cy.intercept('GET', '**/api/user-state', { body: checkerUser(role) });
    stubPersistedCasefileReferences();
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles\/[^?]+(?:\?|$)/, (request) => {
      const id = Number(new URL(request.url).pathname.split('/').pop());
      if (this.failure === 'unavailable' || this.failure === 'http') {
        request.reply({
          statusCode: this.failure === 'unavailable' ? 404 : 503,
          body: { operation_id: 'SYNTHETIC-DETAIL' },
        });
        return;
      }
      const draft = structuredClone(this.draft);
      draft.draft_casefile_id = id;
      if (id === 18) {
        draft.casefile.respondent_account.respondent.party_details.individual_details!.forenames = 'Second';
        draft.casefile_snapshot.respondent_account!.respondent_name = 'Second Respondent';
      } else expect(id, 'selected independent fixture ID').to.eq(17);
      request.reply({ body: draft, headers: { ETag: this.selectedEtag } });
    }).as('persistedSelectedGet');
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      (request) => {
        this.writes.push(request.method);
        request.reply({ statusCode: 405, body: {} });
      },
    ).as('persistedUnexpectedWrite');
    cy.intercept('GET', COLLECTION, (request) => {
      const summary = createCasesDraftSummary({
        draft_casefile_id: 17,
        casefile_status: this.draft.casefile_status,
        submitted_by: this.draft.submitted_by,
        submitted_by_name: 'Synthetic Submitter',
        casefile_snapshot: structuredClone(this.draft.casefile_snapshot),
      });
      const statuses = String(request.query['casefile_status']).split(',');
      expect(request.query['business_unit_id']).to.eq('44');
      const matchingSubmitter = request.query['submitted_by']
        ? summary.submitted_by === request.query['submitted_by']
        : summary.submitted_by !== request.query['not_submitted_by'];
      const summaries = statuses.includes(summary.casefile_status) && matchingSubmitter ? [summary] : [];
      request.reply({
        body:
          request.query['restrict'] === 'counts' ? { count: summaries.length } : { count: summaries.length, summaries },
      });
    }).as('persistedDashboardCollection');
  }

  /** Opens the selected case from the checker review queue. */
  public openFromChecker(): void {
    cy.visit(CHECKER + '/tabs#to-review');
    cy.get(DASHBOARD.row(17)).find('a').click();
  }
  /** Supplies one explicit provider outcome and checks the versioned checker request.
   * @param outcome Success, shared error or malformed receipt boundary. */
  public enableDecision(outcome: string): void {
    if (!['success', 'error', 'malformed'].includes(outcome)) throw new Error('Unsupported synthetic decision outcome');
    cy.intercept('PATCH', '**/opal-maintenance-service/draft-casefiles/17', (request) => {
      this.writes.push('PATCH');
      const approval = this.decisionIntent === 'approve';
      const status = approval ? 'PUBLISHING_PENDING' : 'REJECTED';
      expect(request.headers['if-match']).to.equal(this.selectedEtag);
      expect(request.body).to.deep.equal({
        business_unit_id: 44,
        casefile_status: status,
        ...(!approval ? { status_message: this.decisionReason } : {}),
      });
      if (outcome === 'error') {
        request.reply({
          statusCode: 503,
          body: { retriable: true, title: 'Synthetic request failure', detail: 'Synthetic decision failed' },
        });
        return;
      }
      this.draft.casefile_status = status;
      this.draft.casefile_status_name = approval ? 'Publishing pending' : 'Rejected';
      if (approval) delete this.draft.status_message;
      else this.draft.status_message = this.decisionReason;
      this.draft.timeline_data.push({
        username: 'Synthetic Checker',
        status: approval ? 'Approved' : 'Rejected',
        status_date: '2026-10-21T10:00:00Z',
        ...(!approval ? { reason_text: this.decisionReason } : {}),
      });
      this.selectedEtag = '"1"';
      const body = outcome === 'malformed' ? { draft_casefile_id: 17 } : structuredClone(this.draft);
      request.reply({ statusCode: 200, body, headers: { ETag: this.selectedEtag } });
    }).as('decisionPatch');
  }

  /** Resolves a named reason boundary without allowing arbitrary fixture values.
   * @param reason Supported empty, whitespace, valid or length boundary.
   * @returns The exact reason to enter into the rendered form. */
  private savedDecisionReason(reason: string): string {
    if (reason === 'empty') return '';
    if (reason === 'whitespace') return '   ';
    if (reason === 'valid') return 'Synthetic rejection reason';
    if (reason === '250' || reason === '251') return 'x'.repeat(Number(reason));
    throw new Error('Unsupported saved decision reason');
  }

  /** Checks the accepted notice, refreshed empty queue and absence of repeated writes.
   * @param outcome Approved or rejected confirmation copy. */
  public expectDecisionReturn(outcome: string): void {
    if (!['approved', 'rejected'].includes(outcome)) throw new Error('Unsupported checker confirmation outcome');
    const text =
      'You have ' + outcome + ' ' + this.draft.casefile_snapshot.respondent_account.respondent_name + '’s case.';
    cy.location('pathname').should('eq', CHECKER + '/tabs');
    cy.location('hash').should('eq', '#to-review');
    cy.location('search').should('eq', '');
    cy.get(DASHBOARD.success).should('contain.text', text);
    cy.get(DASHBOARD.successAnnouncement)
      .should('have.length', 1)
      .and('have.attr', 'aria-atomic', 'true')
      .should(($output) => expect($output.text().trim()).to.equal('success: ' + text));
    cy.get(DASHBOARD.row(17)).should('not.exist');
    cy.get(DASHBOARD.empty).should('contain.text', 'There are no cases to review.');
    cy.get('@decisionPatch.all').should('have.length', 1);
    cy.then(() => expect(this.writes).to.deep.equal(['PATCH']));
    // Restoring the interactive runner after a screenshot can move focus to its spec list.
    if (!Cypress.config('isInteractive')) cy.screenshot('po10611-confirmed-' + outcome);
  }

  /** Checks an uncertain receipt retains enabled controls while the parent prevents another mutation. */
  public expectDecisionError(): void {
    cy.location('pathname').should('eq', CHECKER + '/review/17');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    activateCasefileControl(S.decisionContinue, false);
    activateCasefileControl(S.decisionContinue, false);
    cy.get(S.decisionApprove).should('be.enabled');
    cy.get(S.decisionReject).should('be.enabled').check();
    setCasefileReason(S.rejectionReason, 'Synthetic later rejection reason');
    activateCasefileControl(S.decisionContinue, false);
    cy.location('pathname').should('eq', CHECKER + '/review/17');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(DASHBOARD.success).should('not.exist');
    cy.get('@decisionPatch.all').should('have.length', 1);
    cy.then(() => expect(this.writes).to.deep.equal(['PATCH']));
  }

  /** Leaves or dismisses the visible notice without reconstructing it or replaying PATCH.
   * @param method Dismiss, refresh, history or departure boundary. */
  public clearDecisionNotice(method: string): void {
    if (!['dismiss', 'refresh', 'history', 'departure'].includes(method))
      throw new Error('Unsupported notice departure');
    if (method === 'dismiss') {
      cy.get(DASHBOARD.successDismiss).focus().should('be.focused');
      pressDashboardEnter();
      cy.get(DASHBOARD.success).should('not.exist');
      cy.get(DASHBOARD.heading).should('be.focused');
    }
    if (method === 'refresh') cy.reload();
    if (method === 'history') {
      cy.go('back');
      cy.location('pathname').should('eq', CHECKER + '/review/17');
      cy.get(S.heading).should('be.visible');
      cy.get(DASHBOARD.heading).should('not.exist');
      cy.go('forward');
    }
    if (method === 'departure') {
      this.navigate('/dashboard/cases');
      cy.get(DASHBOARD.checkerEntry).should('be.visible');
      this.navigate(CHECKER + '/tabs#to-review');
    }
    cy.location('pathname').should('eq', CHECKER + '/tabs');
    cy.get(DASHBOARD.heading).should('be.visible');
    cy.get(DASHBOARD.success).should('not.exist');
    cy.get('@decisionPatch.all').should('have.length', 1);
    cy.then(() => expect(this.writes).to.deep.equal(['PATCH']));
  }

  /** Checks narrow-screen notice visibility without horizontal document overflow. */
  public expectDecisionReflow(): void {
    cy.viewport(320, 900);
    cy.get(DASHBOARD.success).should('be.visible');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.screenshot('po10611-confirmation-320', { capture: 'viewport' });
  }

  /** Enables the explicit synthetic deletion contract.
   * @param outcome Success or a shared request error. */
  public enableDeletion(outcome: string): void {
    if (!['success', 'error'].includes(outcome)) throw new Error('Unsupported synthetic deletion outcome');
    cy.intercept('PATCH', '**/opal-maintenance-service/draft-casefiles/17', (request) => {
      this.writes.push('PATCH');
      expect(request.headers['if-match']).to.equal(this.selectedEtag);
      expect(request.body).to.deep.equal({
        business_unit_id: 44,
        casefile_status: 'DELETED',
        status_message: this.deletionReason,
      });
      if (outcome === 'error') {
        request.reply({
          statusCode: 503,
          body: { retriable: true, title: 'Synthetic request failure', detail: 'Synthetic deletion failed' },
        });
        return;
      }
      this.draft.casefile_status = 'DELETED';
      this.draft.casefile_status_name = 'Deleted';
      this.draft.status_message = this.deletionReason;
      this.draft.timeline_data.push({
        username: 'Synthetic Checker',
        status: 'Deleted',
        status_date: '2026-10-20T10:00:00Z',
        reason_text: this.deletionReason,
      });
      this.selectedEtag = '"1"';
      request.reply({ statusCode: 200, body: structuredClone(this.draft), headers: { ETag: this.selectedEtag } });
    }).as('deletionPatch');
  }
  /** Enters the accepted deletion reason.
   * @param reason Synthetic reason sent unchanged. */
  public enterDeletionReason(reason: string): void {
    this.deletionReason = reason;
    setCasefileReason(D.reason, reason);
  }
  /** Confirms deletion through the rendered form. */
  public confirmDeletion(): void {
    activateCasefileControl(D.submit, false);
  }
  /** Submits an empty reason to exercise validation. */
  public submitEmptyDeletion(): void {
    activateCasefileControl(D.submit, false);
    cy.get(D.summary).should('contain.text', 'Enter reason').and('be.focused');
    this.expectNoWrites();
    cy.screenshot('po10609-deletion-validation');
  }
  /** Cancels deletion back to the selected review. */
  public cancelDeletion(): void {
    cy.get(D.cancel).click();
  }
  /** Checks shared feedback leaves the reason editable without another request. */
  public expectDeletionError(): void {
    cy.location('pathname').should('eq', CHECKER + '/delete/17');
    cy.get(D.reason).should('not.be.disabled').and('have.value', this.deletionReason);
    cy.get(D.submit).should('be.disabled');
    cy.get(D.recovery)
      .should('be.visible')
      .and('have.attr', 'role', 'status')
      .and(
        'contain.text',
        'The deletion outcome is not confirmed. Select No - cancel to reload the saved case before trying again.',
      );
    cy.get(D.cancel).should('be.visible');
    cy.get(CREATE.globalErrorBanner).should('contain.text', 'Synthetic deletion failed');
    cy.get('@deletionPatch.all').should('have.length', 1);
    cy.then(() => expect(this.writes).to.deep.equal(['PATCH']));
    cy.screenshot('po10609-deletion-request-error');
  }
  /** Checks the confirmed deletion notice and refreshed queue. */
  public expectDeletedReturn(): void {
    const name = this.draft.casefile_snapshot.respondent_account.respondent_name;
    const text = 'You have deleted ' + name + '’s case.';
    cy.location('pathname').should('eq', CHECKER + '/tabs');
    cy.location('hash').should('eq', '#to-review');
    cy.location('search').should('eq', '');
    cy.get(DASHBOARD.success).should('contain.text', text);
    cy.get(DASHBOARD.row(17)).should('not.exist');
    cy.get('@deletionPatch.all').should('have.length', 1);
    cy.then(() => expect(this.writes).to.deep.equal(['PATCH']));
    cy.screenshot('po10609-deletion-confirmed-return');
  }

  /** Introduces one explicit provider, mapping or ownership failure.
   * @param failure Named failure contract. */
  public fail(failure: string): void {
    this.failure = failure;
    if (failure === 'mapping') this.draft.casefile.respondent_account.application_code = 'UNRESOLVABLE';
    if (failure === 'wrong-business-unit') {
      this.draft.business_unit_id = 45;
      this.draft.casefile.respondent_account.business_unit_id = 45;
    }
  }

  /** Opens the selected route through a real document or Angular history navigation.
   * @param destination Inputter view, checker view, review or delete.
   * @param id Route identifier.
   * @param query Untrusted mode query. */
  public open(destination: string, id = '17', query = ''): void {
    cy.visit(this.path(destination, id) + query);
  }

  /** Enters the inputter row so its originating fragment is remembered. */
  public openFromInputter(): void {
    cy.visit(INPUTTER + '#in-review');
    cy.get(DASHBOARD.row(17)).find('a').click();
  }

  /** Verifies independently restored parties, dynamic term values and chronological history. */
  public expectSummary(): void {
    cy.get(S.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
    cy.get(S.section('respondent'))
      .should('contain.text', 'Synthetic')
      .and('contain.text', 'Respondent')
      .and('contain.text', 'Test Country One');
    cy.get(S.section('applicant'))
      .should('contain.text', 'Synthetic')
      .and('contain.text', 'Applicant')
      .and('contain.text', 'Test Country Two');
    cy.get(S.section('orderTerms'))
      .should('contain.text', 'Test order term')
      .and('contain.text', 'Amount')
      .and('contain.text', '£100.00');
    cy.get(S.history)
      .should('contain.text', 'Synthetic earlier rejection')
      .find('.moj-timeline__title')
      .should((titles) => {
        expect([...titles].map((title) => title.textContent?.trim())).to.deep.equal([
          'Submitted',
          'Rejected',
          'Resubmitted',
        ]);
      });
    cy.get('@persistedSelectedGet.all').should('have.length', 1);
    this.expectNoEditing();
  }

  /** Checks saved summaries cannot activate local editor actions. */
  public expectNoEditing(): void {
    for (const id of [
      'respondent',
      'applicant',
      'orderDetails',
      'interestAndIndexation',
      'managingPayments',
      'commentsAndNotes',
    ])
      cy.get(S.change(id)).should('not.exist');
    cy.get(S.termChange(1)).should('not.exist');
    cy.get(S.termRemove(1)).should('not.exist');
    cy.get(CREATE.orderTerms.add).should('not.exist');
    cy.get(S.submit).should('not.exist');
    cy.get(S.cancel).should('not.exist');
    this.expectNoWrites();
  }

  /** Checks saved controls for the selected presentation.
   * @param mode Review or read-only view. */
  private expectModePresentation(mode: string): void {
    cy.get(S.heading).should('be.visible');
    this.expectNoEditing();
    if (mode === 'review') {
      cy.get(S.decisionApprove).should('not.be.checked');
      cy.get(S.decisionReject).should('not.be.checked');
      cy.get(S.decisionContinue).should('be.visible');
      cy.get(S.delete).should('be.visible');
    } else {
      cy.get(S.decisionApprove).should('not.exist');
      cy.get(S.decisionReject).should('not.exist');
      cy.get(S.decisionContinue).should('not.exist');
      cy.get(S.delete).should('not.exist');
    }
  }
  /** Checks initial selected loading and presentation.
   * @param mode Review or read-only view. */
  public expectMode(mode: string): void {
    this.expectModePresentation(mode);
    cy.get('@persistedSelectedGet.all').should('have.length', 1);
  }
  /** Checks cancellation performs fresh selected loading without mutation.
   * @param expectedGets Total selected requests for this journey. */
  public expectReviewAfterCancel(expectedGets: number): void {
    cy.location('pathname').should('eq', CHECKER + '/review/17');
    cy.location('hash').should('eq', '#to-review');
    this.expectModePresentation('review');
    cy.get('@persistedSelectedGet.all').should('have.length', expectedGets);
    this.expectNoWrites();
  }

  /** Submits one explicit decision/reason through the rendered form.
   * @param decision Approve, Reject or none.
   * @param reason Empty, whitespace, 250, 251 or valid. */
  public decide(decision: string, reason: string): void {
    if (!['none', 'approve', 'reject'].includes(decision)) throw new Error('Unsupported saved decision');
    this.decisionReason = this.savedDecisionReason(reason);
    if (decision !== 'none') {
      this.decisionIntent = decision === 'approve' ? 'approve' : 'reject';
      cy.get(decision === 'approve' ? S.decisionApprove : S.decisionReject).check();
    }
    if (decision === 'reject' && reason !== 'empty') setCasefileReason(S.rejectionReason, this.decisionReason);
    activateCasefileControl(S.decisionContinue, false);
  }

  /** Verifies focused summary, conditional invalid field and the real summary-to-field focus link.
   * @param message Required validation text. */
  public expectError(message: string): void {
    cy.get(CREATE.errorSummary).should('contain.text', message).and('be.focused');
    cy.get(CREATE.errorSummaryLinks).contains(message).click();
    const selector = message === 'Select a review decision' ? S.decisionApprove : S.rejectionReason;
    cy.get(selector).should('be.focused');
    if (selector === S.rejectionReason) cy.get(selector).should('have.attr', 'aria-invalid', 'true');
    this.expectNoWrites();
  }

  /** Changes a rejected decision to Approve; its conditional error state must disappear. */
  public switchToApprove(): void {
    this.decisionIntent = 'approve';
    this.decisionReason = '';
    cy.get(S.decisionApprove).check();
    cy.get(S.rejectionReason).should('not.exist');
    cy.get(CREATE.errorSummary).should('not.exist');
    activateCasefileControl(S.decisionContinue, false);
  }

  /** Returns from a saved view through the actual Back link. */
  public back(): void {
    cy.get(S.back).click();
  }

  /** Checks the permission-selected dashboard and unchanged review queue.
   * @param dashboard Expected inputter or checker dashboard. */
  public expectReturn(dashboard: string): void {
    const path = dashboard === 'inputter' ? INPUTTER : CHECKER + '/tabs';
    cy.location('pathname').should('eq', path);
    cy.location('hash').should('eq', dashboard === 'inputter' ? '#in-review' : '#to-review');
    cy.get(DASHBOARD.heading).should('have.text', dashboard === 'inputter' ? 'Create cases' : 'Review cases');
    if (dashboard === 'inputter' && this.draft.submitted_by !== 'BUU-CHECKER') {
      cy.get(DASHBOARD.row(17)).should('not.exist');
    } else {
      cy.get(DASHBOARD.row(17)).should('contain.text', 'Synthetic').and('contain.text', 'Respondent');
    }
    cy.get(DASHBOARD.tab(dashboard === 'inputter' ? 'in-review' : 'to-review')).should(
      'have.attr',
      'aria-current',
      'page',
    );
    cy.then(() => expect(this.draft.casefile_status).to.be.oneOf(['SUBMITTED', 'RESUBMITTED']));
    this.expectNoWrites();
  }

  /** Opens the deletion reason screen from review. */
  public chooseDelete(): void {
    cy.get(S.delete).click();
    this.expectDelete();
  }

  /** Checks the eligible deletion reason screen without mutation. */
  public expectDelete(): void {
    cy.get(D.heading).should('contain.text', 'Are you sure you want to delete this case?').and('be.focused');
    cy.get(D.reason).should('be.visible');
    cy.get(D.submit).should('be.visible');
    cy.get(D.cancel).should('be.visible');
    this.expectNoWrites();
    cy.screenshot('po10609-deletion-reason');
  }

  /** Proves denial before selected GET or after loading an unauthorised record.
   * @param count Expected selected GET count. */
  public expectDenied(count: number): void {
    cy.location('pathname').should('eq', count === 0 ? '/access-denied' : '/error/permission-denied');
    cy.get(S.heading).should('not.exist');
    cy.get('@persistedSelectedGet.all').should('have.length', count);
    this.expectNoWrites();
  }

  /** Attempts malformed or unavailable data through Angular navigation so cancellation is observable.
   * @param destination Intended persisted route.
   * @param id Route identifier. */
  public attempt(destination: string, id: string): void {
    cy.visit('/dashboard/cases');
    cy.get(DASHBOARD.checkerEntry).should('be.visible');
    this.navigate(this.path(destination, id));
  }

  /** Checks resolver failure preserves the previous page without activating saved controls.
   * @param count Expected selected GET count. */
  public expectFailure(count: number): void {
    cy.get(DASHBOARD.checkerEntry).should('be.visible');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(S.heading).should('not.exist');
    cy.get(S.decisionContinue).should('not.exist');
    cy.get('@persistedSelectedGet.all').should('have.length', count);
    this.expectNoWrites();
  }

  /** Navigates A to B while recording the real Angular host identity. */
  public switchDraft(): void {
    cy.get(S.host).then((host) => {
      this.host = host[0];
    });
    this.decide('reject', '251');
    this.navigate(this.path('review', '18'));
    cy.get(S.heading).should('have.text', 'Second Respondent');
    cy.get(S.section('respondent')).should('contain.text', 'Second').and('not.contain.text', 'Synthetic');
    cy.get(S.host).should((host) => expect(host[0], 'reused Angular component host').to.eq(this.host));
    cy.get(S.decisionApprove).should('not.be.checked');
    cy.get(S.decisionReject).should('not.be.checked');
    cy.get(S.rejectionReason).should('not.exist');
    cy.get(CREATE.errorSummary).should('not.exist');
    cy.get(S.decisionReject).check();
    cy.get(S.rejectionReason).should('have.value', '');
    cy.get('@persistedSelectedGet.all').should('have.length', 2);
  }

  /** Enters fresh creation in the same application and proves saved identity/data are absent. */
  public startCreation(): void {
    this.navigate('/cases/create-casefile/case-type');
    cy.get(CREATE.caseTypeHeading).should('be.visible');
    cy.get(CREATE.caseTypeRadios).filter(':checked').should('not.exist');
    cy.get(CREATE.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get(S.host).should('not.exist');
    cy.get(S.status).should('not.exist');
    cy.get(S.decisionContinue).should('not.exist');
    cy.get('body').should('not.contain.text', 'Second Respondent');
    this.expectNoWrites();
  }

  /** Checks the explicit write counter after every saved-only action. */
  public expectNoWrites(): void {
    cy.then(() => expect(this.writes, 'persisted POST/PUT/PATCH/DELETE requests').to.have.length(0));
  }

  /** Resolves the route intent without trusting query parameters.
   * @param destination Route intent.
   * @param id Selected draft identifier.
   * @returns Canonical saved route. */
  private path(destination: string, id: string): string {
    if (destination === 'inputter-view') return '/cases/create-casefile/check-case-details/' + id;
    return CHECKER + '/' + destination + '/' + id;
  }

  /** Uses the browser location listener for real in-application Angular navigation.
   * @param path Canonical destination. */
  private navigate(path: string): void {
    cy.window().then((window) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
  }
}
