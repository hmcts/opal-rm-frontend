import { CreateCasefileSelectors as CREATE } from '../../../../../shared/selectors/create-casefile.selectors';
import { CasesDraftSelectors as DASHBOARD } from '../../../../../shared/selectors/cases-draft.selectors';
import { checkerUser } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import type { CheckerRole } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import type { IOpalMaintenanceDraftCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';

const S = CREATE.review;
const CHECKER = '/cases/draft/check-and-validate';
const INPUTTER = '/cases/draft/create-and-manage/tabs';
const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;

/** Complete historical references used by the real resolver and mapper in every persisted journey. */
export function stubPersistedCasefileReferences(): void {
  cy.intercept('GET', '**/opal-maintenance-service/countries*', (request) => {
    expect(request.query).not.to.have.property('active');
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', (request) => {
    expect(request.query).to.deep.equal({ application_group: 'Create Casefile' });
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', (request) => {
    expect(request.query).to.deep.equal({ business_unit_id: '44' });
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.majorCreditors) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/results/TEST01', {
    body: structuredClone(PERSISTED_CASEFILE_RESULT_DETAIL),
  });
}

/** Adapts independently authored wire data to the selected dashboard ID and lifecycle.
 * @param id Selected draft identifier.
 * @param status Saved lifecycle status.
 * @param submitter Saved BU-user identity.
 * @returns Complete independent selected HTTP fixture. */
export function selectedPersistedCasefile(
  id: number,
  status = 'SUBMITTED',
  submitter = 'BUU-OTHER',
): IOpalMaintenanceDraftCasefileDetail {
  const draft = createPersistedCasefileDetail();
  draft.draft_casefile_id = id;
  const statuses = [
    'SUBMITTED',
    'RESUBMITTED',
    'REJECTED',
    'DELETED',
    'PUBLISHED',
    'PUBLISHING_PENDING',
    'PUBLISHING_FAILED',
  ] as const;
  const selectedStatus = statuses.find((value) => value === status);
  if (!selectedStatus) throw new Error('Unsupported persisted fixture lifecycle: ' + status);
  draft.casefile_status = selectedStatus;
  draft.casefile_status_name = status.charAt(0) + status.slice(1).toLowerCase();
  draft.submitted_by = submitter;
  return draft;
}

/** Owns selected GET, permission fixtures and browser interactions; decisions remain local. */
export class CheckCaseDetailsModesActions {
  private draft = selectedPersistedCasefile(17);
  private failure = '';
  private writes: string[] = [];
  private host: HTMLElement | null = null;

  /** Sets synthetic identity and independent HTTP fixtures without bypassing application guards.
   * @param role Permission role.
   * @param status Persisted lifecycle.
   * @param submitter Other or self BU-user. */
  public prepare(role: CheckerRole, status: string, submitter: string): void {
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
      request.reply({ body: draft, headers: { ETag: '"0"' } });
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
    cy.get(S.heading).should('have.text', 'Check case details').and('be.focused');
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

  /** Asserts permissions and intent control the actual decision UI.
   * @param mode Expected review or view mode. */
  public expectMode(mode: string): void {
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
    cy.get('@persistedSelectedGet.all').should('have.length', 1);
  }

  /** Submits one explicit decision/reason through the rendered form.
   * @param decision Approve, Reject or none.
   * @param reason Empty, whitespace, 250, 251 or valid. */
  public decide(decision: string, reason: string): void {
    if (decision !== 'none') cy.get(decision === 'approve' ? S.decisionApprove : S.decisionReject).check();
    if (decision === 'reject' && reason !== 'empty') {
      const text =
        reason === 'whitespace'
          ? '   '
          : reason === 'valid'
            ? 'Synthetic rejection reason'
            : 'x'.repeat(Number(reason));
      cy.get(S.rejectionReason).clear().type(text);
    }
    cy.get(S.decisionContinue).click();
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
    cy.get(S.decisionApprove).check();
    cy.get(S.rejectionReason).should('not.exist');
    cy.get(CREATE.errorSummary).should('not.exist');
    cy.get(S.decisionContinue).click();
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

  /** Opens the interim Delete walkthrough from review. */
  public chooseDelete(): void {
    cy.get(S.delete).click();
    this.expectDelete();
  }

  /** Checks Delete has no mutation confirmation or local creation controls. */
  public expectDelete(): void {
    cy.contains('h1', 'Delete casefile').should('be.visible').and('be.focused');
    cy.get(S.deleteReturn).should('be.visible');
    cy.get(S.submit).should('not.exist');
    this.expectNoWrites();
  }

  /** Returns from interim Delete without changing the draft. */
  public returnFromDelete(): void {
    cy.get(S.deleteReturn).click();
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
