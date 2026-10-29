import { pressDashboardEnter } from '../../support/utils/press-dashboard-enter';
import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';
import { DraftCasefileRecoveryActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { RejectedCasefileAmendmentFlow } from '../../e2e/functional/opal/flows/checkAndValidateCase/rejected-casefile-amendment.flow';
import { RejectedCasefileJourneyActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/rejected-casefile-journey.actions';
import { RejectedCasefileFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/rejected-casefile-fixture.actions';
import { InputterCasefileMonitoringActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-casefile-monitoring.actions';
import { CheckerDashboardWindowActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-dashboard-window.actions';
import { InputterDashboardActions } from '../../e2e/functional/opal/actions/createDraftCasefile/inputter-dashboard.actions';
import { correctedRejectedCasefile } from '../../e2e/functional/opal/actions/checkAndValidateCase/rejected-casefile-evidence.actions';
import { buildSyntheticDraftRequest } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-payload';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { CasesDraftSelectors as D } from '../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as C } from '../../shared/selectors/create-casefile.selectors';
import type {
  IRejectedCasefileContext,
  RejectedAmendmentKind,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/rejected-casefile-context.interface';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { CyHttpMessages } from 'cypress/types/net-stubbing';

const tags = (): string[] => ['@JIRA-STORY:PO-10623', '@JIRA-EPIC:PO-10817'];
const DASHBOARD = '/cases/draft/create-and-manage/tabs';
const REJECTIONS = '/cases/draft/create-and-manage/rejections';
const CHECKER = '/cases/draft/check-and-validate/tabs';

/** Exercises the explicit business entry point for each independently owned controlled example. */
function complete(flow: RejectedCasefileAmendmentFlow, kind: RejectedAmendmentKind): void {
  if (kind === 'retry') flow.retryResubmission();
  else if (kind === 'stale') flow.submitStaleReplacement();
  else if (kind === 'denied' || kind === 'non-rejected') flow.attemptDeniedEntry();
  else flow.resubmit();
}

/** Runs each detailed business outcome once; phrases never repeat the whole navigation journey. */
function assertOutcome(flow: RejectedCasefileAmendmentFlow, kind: RejectedAmendmentKind): void {
  if (kind === 'stale') flow.assertStaleRecovery();
  else if (kind === 'denied' || kind === 'non-rejected') flow.assertDenied();
  else flow.assertResubmitted();
}

function fixture(cross: boolean): IRejectedCasefileContext {
  const draft = createPersistedCasefileDetail();
  const marker = 'E2E-0123456789012345';
  draft.casefile = buildSyntheticDraftRequest(marker, 'TEST', 101, {
    minorCreditorCount: 2,
    uniqueNames: true,
  }).casefile;
  draft.submitted_by = 'A-id';
  draft.submitted_by_name = 'Actor A';
  draft.casefile_status = 'REJECTED';
  draft.casefile_status_date = '2026-09-15T10:00:00Z';
  const person = draft.casefile.respondent_account.respondent.party_details.individual_details!;
  const applicant = draft.casefile.applicant.party_details.individual_details!;
  draft.casefile_snapshot = {
    respondent_account: {
      respondent_name: `${person.forenames} ${person.surname}`,
      account_id: null,
      account_number: null,
    },
    applicant_account: {
      applicant_name: `${applicant.forenames} ${applicant.surname}`,
      account_id: null,
      account_number: null,
    },
    minor_creditor_accounts: draft.casefile.minor_creditors!.map((creditor) => ({
      creditor_sequence: creditor.creditor_sequence,
      name: `${creditor.party_details.individual_details!.forenames} ${creditor.party_details.individual_details!.surname}`,
      account_id: null,
      account_number: null,
    })),
  };
  draft.timeline_data = [
    { username: 'Actor A', status: 'Submitted', status_date: draft.created_date },
    {
      username: 'Actor B',
      status: 'Rejected',
      status_date: draft.casefile_status_date,
      reason_text: 'Synthetic correction requested',
    },
  ];
  return {
    owned: {
      id: draft.draft_casefile_id,
      marker,
      inputter: 'synthetic-A',
      checker: 'synthetic-B',
      inputterId: 'A-id',
      checkerId: 'B-id',
      inputterName: 'Actor A',
      checkerName: 'Actor B',
    },
    before: { draft, etag: '"9007199254740993"' },
    amender: cross
      ? { email: 'synthetic-B', id: 'B-id', name: 'Actor B' }
      : { email: 'synthetic-A', id: 'A-id', name: 'Actor A' },
  };
}

function resubmitted(context: IRejectedCasefileContext, correction: string): IDraftCasefileSnapshot {
  const saved = structuredClone(context.before);
  saved.draft.casefile = correctedRejectedCasefile(context.before, correction);
  saved.draft.casefile_status = 'RESUBMITTED';
  saved.draft.submitted_by = context.amender.id;
  saved.draft.submitted_by_name = context.amender.name;
  saved.draft.casefile_status_date = '2026-09-15T11:00:00Z';
  (
    saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
  ).respondent_account!.respondent_name =
    `${correction} ${saved.draft.casefile.respondent_account.respondent.party_details.individual_details!.surname}`;
  saved.draft.timeline_data.push({
    username: context.amender.name,
    status: 'Resubmitted',
    status_date: saved.draft.casefile_status_date,
  });
  saved.etag = '"9007199254740994"';
  return saved;
}

interface Faults {
  requestAudit?: boolean;
  missingProvider?: boolean;
  missingCheckerProvider?: boolean;
  incompleteRequest?: boolean;
  wrongProviderActor?: boolean;
  residual?: boolean;
  lostCorrection?: boolean;
  wrongOrigin?: boolean;
  badReceipt?: boolean;
  missingWarning?: boolean;
  originStatus?: number;
  malformedOrigin?: boolean;
  overflow?: boolean;
  unreachableReturn?: boolean;
  lostFocus?: boolean;
  rejectionScope?: 'unfiltered' | 'wrong-actor';
  rejectedHistory?: 'wrong-status' | 'missing-event';
}

/** Controlled route/HTTP boundary; native rendered controls still drive every edit, submit and departure. */
function harness(kind: RejectedAmendmentKind, faults: Faults = {}) {
  const context = fixture(kind === 'cross-user');
  const state = {
    context,
    saved: structuredClone(context.before),
    actor: context.amender.email,
    page: 1,
    sort: 'none',
    path: DASHBOARD,
    hash: '#rejected',
    field: '',
    error: '',
    requiresReload: false,
    receiptRecorded: false,
    monitorRegistrations: 0,
    requests: [] as Cypress.RequestOptions[],
    events: [] as string[],
    submissions: 0,
    providerCallbacks: 0,
    scans: [] as string[],
    native: [] as string[],
    pointer: [] as string[],
    listScans: [] as string[],
  };
  const handlers: {
    method: string;
    matcher: string | RegExp | Record<string, unknown>;
    callback: (request: CyHttpMessages.IncomingHttpRequest) => void;
  }[] = [];
  const receipts: Record<string, unknown>[] = [];
  const earlyOriginResponses: (() => void)[] = [];
  const collectionReceipts = new Map<string, Record<string, unknown>[]>();
  let document!: Document;
  let detailResponse: Record<string, unknown>;
  const response = (snapshot: IDraftCasefileSnapshot, statusCode = 200) => ({
    statusCode,
    body: structuredClone(snapshot.draft),
    headers: { etag: snapshot.etag },
  });
  const matches = (matcher: string | RegExp | Record<string, unknown>, url: string) =>
    typeof matcher === 'string'
      ? matcher.replaceAll('**', '') === url
      : matcher instanceof RegExp
        ? matcher.test(url)
        : matcher['pathname'] === url;
  const emit = (
    method: string,
    url: string,
    query: Record<string, unknown>,
    body: unknown,
    result: Record<string, unknown>,
    version?: string,
  ) => {
    const listeners: ((result: unknown) => void)[] = [];
    let finished = false;
    for (const handler of [...handlers].reverse()) {
      if (handler.method !== method && !handler.method.includes(method)) continue;
      if (!matches(handler.matcher, url)) continue;
      const request = {
        method,
        url,
        query,
        body,
        headers: { 'if-match': version },
        on: (_event: string, callback: (result: unknown) => void) => listeners.push(callback),
        continue: (callback?: (result: unknown) => void) => {
          finished = true;
          if (callback) listeners.push(callback);
        },
        reply: () => {
          finished = true;
        },
      } as unknown as CyHttpMessages.IncomingHttpRequest;
      handler.callback(request);
      if (method === 'GET' && request.alias) {
        const queued = collectionReceipts.get(request.alias) ?? [];
        queued.push({ response: result });
        collectionReceipts.set(request.alias, queued);
      }
      if (finished) break;
    }
    for (const listener of listeners) listener(result);
  };
  const name = (snapshot: IDraftCasefileSnapshot) =>
    String(Cypress._.get(snapshot.draft.casefile_snapshot, 'respondent_account.respondent_name'));
  const bind = (selector: string, callback: () => void) =>
    document.querySelector(selector)?.addEventListener('click', (event) => {
      event.preventDefault();
      callback();
    });
  const renderReview = (editable: boolean, checker = false) => {
    const snapshot = editable ? context.before : state.saved;
    if (!editable) state.events.push(checker ? 'checker-saved-detail' : 'inputter-saved-detail');
    if (!editable) state.error = '';
    const aggregate = structuredClone(snapshot.draft.casefile);
    if (editable) aggregate.respondent_account.respondent.party_details.individual_details!.forenames = state.field;
    const individual = aggregate.respondent_account.respondent.party_details.individual_details!;
    const displayed = faults.lostCorrection && !editable ? 'Lost' : individual.forenames;
    const savedLabel = checker ? 'To review' : 'In review';
    const savedStatus = `<span id="create_casefile_review_status">${savedLabel}</span>`;
    const savedHistory = `<app-cases-draft-casefile-history>${snapshot.draft.timeline_data.map((event) => `<div class="moj-timeline__item">${event.status} ${event.username} ${event.reason_text ?? ''}</div>`).join('')}</app-cases-draft-casefile-history>`;
    document.body.innerHTML = `<h1 id="review-heading" tabindex="-1">${editable ? 'Check case details' : name(snapshot)}</h1>${editable ? '' : savedStatus}<a class="govuk-back-link" href="#back">Back</a>
      <app-cases-create-casefile-review-section id="review-respondent">${displayed} ${individual.surname}${editable ? '<span class="govuk-summary-card__action"><a id="review-respondent-change" href="#change">Change</a></span>' : ''}</app-cases-create-casefile-review-section>
      <app-cases-create-casefile-review-section id="review-rest">${JSON.stringify({ ...aggregate, respondent_account: { ...aggregate.respondent_account, respondent: null } })}</app-cases-create-casefile-review-section>
      ${editable ? '' : savedHistory}
      ${state.error ? `<div class="moj-alert--error">${state.error}</div>` : ''}${editable ? '<button id="create_casefile_review_submit">Submit for review</button>' : checker && kind !== 'cross-user' ? '<input id="create_casefile_review_decision-approve"><input id="create_casefile_review_decision-reject"><button id="create_casefile_review_continue">Continue</button><a id="create_casefile_review_delete">Delete case</a>' : ''}`;
    bind('#review-respondent-change', renderEditor);
    bind('#create_casefile_review_submit', () => {
      if (state.requiresReload) {
        state.error = 'Select Back to reload the saved case before submitting again.';
        renderReview(true);
        return;
      }
      void document.defaultView!.fetch(`/opal-maintenance-service/draft-casefiles/${context.owned.id}`, {
        method: 'PUT',
      });
    });
    bind('.govuk-back-link', () => {
      if (faults.missingWarning || document.defaultView!.confirm('Discard unsaved corrections?')) {
        state.events.push('confirmed-reload');
        detailResponse = response(state.saved);
        emit('GET', `/opal-maintenance-service/draft-casefiles/${context.owned.id}`, {}, undefined, detailResponse);
        state.path = '/error/permission-denied';
        document.body.innerHTML = '<h1>Permission denied</h1>';
      }
    });
  };
  const renderEditor = () => {
    document.body.innerHTML = `<label for="${C.respondentDetails.firstNames.slice(1)}">First names</label><input id="${C.respondentDetails.firstNames.slice(1)}" value="${state.field}"><label for="editor-other-field">Other retained field</label><input id="editor-other-field" value="Unchanged"><label for="editor-native-checkbox">Native checkbox</label><input type="checkbox" id="editor-native-checkbox" style="opacity:0"><button ${faults.unreachableReturn ? 'tabindex="-1"' : ''} id="${C.respondentDetails.returnToCaseDetails.slice(1)}">Return to case details</button>`;
    if (faults.overflow) document.body.insertAdjacentHTML('beforeend', '<div style="width:1400px">Overflow</div>');
    bind(C.respondentDetails.returnToCaseDetails, () => {
      state.field = (document.querySelector(C.respondentDetails.firstNames) as HTMLInputElement).value;
      renderReview(true);
    });
  };
  const provider = (tab: string, checker: boolean, include: boolean) => {
    const summary = {
      ...context.before.draft,
      draft_casefile_id: context.owned.id,
      submitted_by: state.saved.draft.submitted_by,
      submitted_by_name: state.saved.draft.submitted_by_name,
      casefile_status: state.saved.draft.casefile_status,
      casefile_snapshot: state.saved.draft.casefile_snapshot,
    };
    if (faults.wrongProviderActor && tab === 'in-review') summary.submitted_by = 'wrong-provider-actor';
    const rows =
      include && !(faults.missingProvider && tab === 'in-review') && !(faults.missingCheckerProvider && checker)
        ? [summary]
        : [];
    const origin = !checker && tab === 'rejected' && state.saved.draft.casefile_status === 'RESUBMITTED';
    const deliver = () => {
      if (origin) state.events.push('origin-response');
      emit(
        'GET',
        '/opal-maintenance-service/draft-casefiles',
        {
          business_unit_id: '44',
          casefile_status: tab === 'rejected' ? 'REJECTED' : 'SUBMITTED,RESUBMITTED',
          ...(checker
            ? { not_submitted_by: 'B-id' }
            : state.path === REJECTIONS
              ? faults.rejectionScope === 'unfiltered'
                ? {}
                : { not_submitted_by: faults.rejectionScope === 'wrong-actor' ? 'wrong-id' : context.amender.id }
              : { submitted_by: context.amender.id }),
        },
        undefined,
        {
          statusCode: origin ? (faults.originStatus ?? 200) : 200,
          body:
            origin && faults.malformedOrigin ? { count: -1, summaries: [] } : { count: rows.length, summaries: rows },
        },
      );
      state.providerCallbacks++;
    };
    // Deliver fault callbacks at the controlled PUT receipt boundary, before its saved GET is scheduled.
    // This keeps callback assertions in Cypress command execution instead of a rejected native Fetch promise.
    if (origin && (faults.originStatus !== undefined || faults.malformedOrigin)) earlyOriginResponses.push(deliver);
    else deliver();
  };
  const table = (tab: string, checker = false, notice = false) => {
    const included =
      tab === 'rejected' ? state.saved.draft.casefile_status === 'REJECTED' : !(checker && kind === 'cross-user');
    const residual = faults.residual && tab === 'rejected' && state.saved.draft.casefile_status === 'RESUBMITTED';
    const visible = included || (residual && state.page === 2);
    const cross = state.path === REJECTIONS;
    const heading = cross ? 'cases-draft-all-rejected-heading' : 'cases-draft-heading';
    const success = cross ? 'cases-draft-all-rejected-success' : 'cases-draft-success';
    document.body.innerHTML = `<h1 id="${heading}" tabindex="-1">${checker ? 'Review cases' : cross ? 'All rejected cases' : 'Create cases'}</h1>
      <a id="cases-draft-in-review-tab" href="#in-review" ${tab === 'in-review' ? 'aria-current="page"' : ''}>In review</a><a id="cases-draft-to-review-tab" href="#to-review" ${checker ? 'aria-current="page"' : ''}>To review</a><a id="cases-draft-rejected-tab" href="#rejected">Rejected</a><a id="cases-draft-all-rejected-back" href="#back">Back to your cases</a>
      ${notice ? `<div id="${success}"><opal-lib-moj-alert-content-text>You have submitted ${name(state.saved)}'s case for review.</opal-lib-moj-alert-content-text><button class="moj-alert__dismiss">Dismiss</button></div>` : ''}
      <app-cases-draft-table><table><thead><tr><th columnKey="applicant" aria-sort="${state.sort}"><button>Applicant</button></th></tr></thead><tbody>${visible ? `<tr data-draft-id="${context.owned.id}"><td data-column="respondent"><a href="#owned">${name(state.saved)}</a></td><td data-column="submittedByName">${state.saved.draft.submitted_by_name}</td></tr>` : ''}</tbody></table></app-cases-draft-table>
      ${residual ? `<nav id="cases-draft-pagination"><a aria-label="Page 1" href="#1" ${state.page === 1 ? 'aria-current="page"' : ''}>1</a><a aria-label="Page 2" href="#2" ${state.page === 2 ? 'aria-current="page"' : ''}>2</a>${state.page === 1 ? '<a rel="next" href="#next">Next</a>' : ''}</nav>` : ''}`;
    bind(`#${success} button`, () => {
      document.querySelector(`#${success}`)!.remove();
      (document.querySelector(`#${heading}`) as HTMLElement).focus();
    });
    bind('#cases-draft-in-review-tab', () => {
      state.path = DASHBOARD;
      state.hash = '#in-review';
      state.page = 1;
      table('in-review');
      provider('in-review', false, true);
    });
    bind('#cases-draft-all-rejected-back', () => {
      state.path = DASHBOARD;
      state.hash = '#rejected';
      table('rejected');
      provider('rejected', false, false);
    });
    bind('th button', () => {
      state.sort = state.sort === 'ascending' ? 'descending' : 'ascending';
      table(tab, checker, notice);
      (document.querySelector('th button') as HTMLElement).focus();
    });
    bind('[rel="next"]', () => {
      state.page = 2;
      table(tab, checker, notice);
    });
    bind('[aria-label="Page 1"]', () => {
      state.page = 1;
      table(tab, checker, notice);
    });
    bind(`${D.row(context.owned.id)} a`, () => {
      if (state.saved.draft.casefile_status === 'REJECTED') renderTasks();
      else {
        state.path = checker
          ? `/cases/draft/check-and-validate/review/${context.owned.id}`
          : `/cases/create-casefile/check-case-details/${context.owned.id}`;
        detailResponse = response(state.saved);
        emit('GET', `/opal-maintenance-service/draft-casefiles/${context.owned.id}`, {}, undefined, detailResponse);
        renderReview(false, checker);
      }
    });
  };
  const renderTasks = () => {
    state.path = `/cases/create-casefile/task-list/${context.owned.id}`;
    state.field =
      context.before.draft.casefile.respondent_account.respondent.party_details.individual_details!.forenames!;
    const status = faults.rejectedHistory === 'wrong-status' ? 'In review' : 'Rejected';
    const timeline = context.before.draft.timeline_data.slice(faults.rejectedHistory === 'missing-event' ? 1 : 0);
    document.body.innerHTML = `<h1>${name(context.before)}</h1><app-cases-draft-casefile-history><span id="create_casefile_review_status">${status}</span>${timeline.map((event) => `<div class="moj-timeline__item">${event.status} ${event.username} ${event.reason_text ?? ''}</div>`).join('')}</app-cases-draft-casefile-history><button id="checkCaseButton">Check case details</button>`;
    bind('#checkCaseButton', () => {
      state.path = '/cases/create-casefile/check-case-details';
      renderReview(true);
    });
  };
  const submit = () => {
    if (state.requiresReload) {
      state.error = 'Select Back to reload the saved case before submitting again.';
      renderReview(true);
      return new Response(null, { status: 409 });
    }
    state.submissions++;
    const body = {
      business_unit_id: 44,
      casefile: correctedRejectedCasefile(context.before, state.field),
      ...(faults.requestAudit ? { submitted_by: 'client-audit' } : {}),
    };
    if (faults.incompleteRequest) body.casefile.minor_creditors!.pop();
    const status = kind === 'retry' && state.submissions === 1 ? 400 : kind === 'stale' ? 409 : 200;
    if (status === 200) {
      state.saved = resubmitted(context, state.field);
      state.error = '';
    }
    const receipt = response(state.saved, status);
    if (faults.badReceipt && status === 200) (receipt.body as { submitted_by: string }).submitted_by = 'wrong-receipt';
    emit(
      'PUT',
      `/opal-maintenance-service/draft-casefiles/${context.owned.id}`,
      {},
      body,
      receipt,
      context.before.etag,
    );
    state.events.push(`put:${status}`);
    const receiptBody = receipt.body;
    Object.defineProperty(receipt, 'body', {
      get: () => {
        state.events.push('receipt-decode');
        return receiptBody;
      },
    });
    receipts.push({ response: receipt });
    if (status !== 200) {
      state.error = 'The change could not be saved';
      state.requiresReload = status === 409;
      renderReview(true);
    } else {
      state.path = faults.wrongOrigin ? '/wrong-origin' : kind === 'cross-user' ? REJECTIONS : DASHBOARD;
      state.hash = kind === 'cross-user' ? '' : '#rejected';
      table('rejected', false, true);
      provider('rejected', false, false);
    }
    return new Response(JSON.stringify(receiptBody), { status, headers: { etag: state.saved.etag } });
  };
  cy.document().then((doc) => {
    document = doc;
    document.documentElement.style.overflowWrap = 'anywhere';
    document.addEventListener('click', (event) => {
      if (event.detail) state.pointer.push((event.target as HTMLElement).id);
    });
    document.addEventListener('keydown', (event) => {
      state.native.push(`${event.key}:${(event.target as HTMLElement).id}`);
    });
    if (faults.lostFocus)
      document.addEventListener('focusin', (event) => {
        if ((event.target as HTMLElement).id === 'checkCaseButton') (event.target as HTMLElement).blur();
      });
    cy.stub(document.defaultView!, 'fetch').callsFake(async () => submit());
    table('rejected');
  });
  cy.stub(RejectedCasefileFixtureActions.prototype, 'prepare').callsFake(() => cy.wrap(context, { log: false }));
  cy.stub(RejectedCasefileFixtureActions.prototype, 'recordCleanupActor').callsFake((_context, saved) =>
    cy.then(() => {
      state.receiptRecorded = true;
      state.events.push(`cleanup:${saved.draft.submitted_by}`);
    }),
  );
  cy.stub(RejectedCasefileFixtureActions.prototype, 'foreignActor').callsFake(() =>
    cy.wrap({ email: 'synthetic-foreign', id: 'foreign-id', name: 'Foreign' }, { log: false }),
  );
  cy.stub(cy, 'session').callsFake((email: string) =>
    cy.then(() => {
      state.actor = email;
      state.events.push(`auth:${email}`);
    }),
  );
  cy.stub(InputterCasefileMonitoringActions.prototype, 'observe');
  cy.stub(InputterCasefileMonitoringActions.prototype, 'open').callsFake(() => {
    cy.then(() => {
      table('rejected');
    });
  });
  cy.stub(InputterCasefileMonitoringActions.prototype, 'expectRows').callsFake(() => {
    cy.get(D.row(context.owned.id)).should('be.visible');
  });
  cy.stub(InputterCasefileMonitoringActions.prototype, 'viewAllRejected').callsFake(() => {
    cy.then(() => {
      state.path = REJECTIONS;
      state.hash = '';
      table('rejected');
    });
  });
  cy.stub(InputterCasefileMonitoringActions.prototype, 'openAmendment').callsFake((_owned, accessible) => {
    if (accessible) {
      cy.get(`${D.row(context.owned.id)} a`)
        .focus()
        .should('be.focused');
      pressDashboardEnter();
    } else cy.get(`${D.row(context.owned.id)} a`).click();
  });
  cy.stub(InputterDashboardActions.prototype, 'open').callsFake(() => {
    cy.then(() => {
      state.path = DASHBOARD;
      state.hash = '#in-review';
      table('in-review');
      provider('in-review', false, true);
    });
  });
  cy.stub(CheckerDashboardWindowActions.prototype, 'observe');
  cy.stub(CheckerDashboardWindowActions.prototype, 'open').callsFake(() => {
    cy.then(() => {
      state.path = CHECKER;
      state.hash = '#to-review';
      state.sort = 'none';
      table('in-review', true);
      provider('in-review', true, kind !== 'cross-user');
    });
  });
  cy.stub(CheckerDashboardWindowActions.prototype, 'select').callsFake(() => {
    cy.get(D.tab('to-review')).should('have.attr', 'aria-current', 'page');
  });
  cy.stub(cy, 'intercept').callsFake((...args: unknown[]) => {
    const matcher = (typeof args[0] === 'string' ? args[1] : args[0]) as string | RegExp | Record<string, unknown>;
    const method = typeof args[0] === 'string' ? args[0] : (matcher as Record<string, string>)['method'];
    if (method === 'PUT') state.monitorRegistrations++;
    const match =
      typeof matcher === 'object' && !(matcher instanceof RegExp) && matcher['url']
        ? (matcher['url'] as RegExp)
        : matcher;
    if (typeof args[args.length - 1] === 'function')
      handlers.push({
        method,
        matcher: match,
        callback: args[args.length - 1] as (request: CyHttpMessages.IncomingHttpRequest) => void,
      });
    return cy.wrap(null, { log: false });
  });
  cy.stub(cy, 'location').callsFake((key: string) =>
    cy.then(() => (key === 'pathname' ? state.path : key === 'hash' ? state.hash : '')),
  );
  cy.stub(cy, 'wait').callsFake((alias: string) =>
    cy.then(() => {
      if (alias === '@draftMutation') {
        const receipt = receipts.shift();
        if (!receipt) throw new Error('Controlled native submission missing');
        earlyOriginResponses.splice(0).forEach((deliver) => deliver());
        return receipt;
      }
      if (alias === '@amendmentSavedDetail') return { response: detailResponse };
      if (alias === '@amendmentRejected' || alias === '@amendmentInReview') {
        const observed = collectionReceipts.get(alias.slice(1))?.shift();
        if (!observed) throw new Error(`Missing exact controlled provider receipt ${alias}`);
        return observed;
      }
      throw new Error(`Unexpected controlled wait ${alias}`);
    }),
  );
  cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
    cy.then(() => {
      state.requests.push(request);
      if (request.method === 'PUT') {
        expect(state.actor, 'competing current A session').to.equal('synthetic-A');
        expect(request.headers).to.deep.equal({ 'If-Match': context.before.etag });
        expect(
          Cypress._.isEqual(request.body, {
            business_unit_id: 44,
            casefile: correctedRejectedCasefile(context.before, 'Winning'),
          }),
        ).to.equal(true);
        state.saved = resubmitted(context, 'Winning');
        return { status: 200, body: structuredClone(state.saved.draft), headers: { etag: state.saved.etag } };
      }
      state.events.push(`saved-get:${state.saved.draft.submitted_by}`);
      return { status: 200, body: structuredClone(state.saved.draft), headers: { etag: state.saved.etag } };
    }),
  );
  cy.stub(cy, 'visit').callsFake((url: string) =>
    cy.then(() => {
      state.path = url;
      if (url === '/')
        document.body.innerHTML =
          '<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav>';
      else if (url.includes('/task-list/')) {
        state.path = '/error/permission-denied';
        document.body.innerHTML = '<h1>Permission denied</h1>';
      } else if (url.includes('/review/')) {
        detailResponse = response(state.saved);
        emit('GET', `/opal-maintenance-service/draft-casefiles/${context.owned.id}`, {}, undefined, detailResponse);
        renderReview(false, true);
      } else throw new Error(`Unexpected controlled route ${url}`);
    }),
  );
  return state;
}

/** Controls only the scanner dependency; records the real DOM before navigation can remove it. */
function recordScans(state: ReturnType<typeof harness>, removed = false): void {
  cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
    cy.document().then((doc) => {
      if (removed) return;
      const body = doc.body;
      let label = 'list';
      if (body.querySelector(C.respondentDetails.firstNames)) label = 'editor';
      else if (body.querySelector('.moj-alert--error')) label = 'failure';
      else if (body.querySelector(D.success) || body.querySelector(D.allRejectedSuccess)) label = 'confirmation';
      else if (body.querySelector(C.caseDetails.checkCaseButton)) label = 'tasks';
      else if (body.querySelector('app-cases-create-casefile-review-section')) {
        label = body.querySelector('#create_casefile_review_submit') ? 'review' : 'read-only';
      } else if (body.textContent?.includes('Permission denied')) label = 'denial';
      state.scans.push(`${label}:${doc.defaultView!.innerWidth}`);
      if (['list', 'confirmation'].includes(label)) {
        const sort = body.querySelector('th')?.getAttribute('aria-sort');
        const page = body.querySelector('[aria-current="page"][aria-label]')?.getAttribute('aria-label') ?? 'Page 1';
        state.listScans.push(`${sort}:${page}`);
      }
    });
  });
}

describe('PO-10623 real journey orchestration (controlled support only)', { retries: 0 }, () => {
  let environment: Record<string, unknown>;
  let expected = false;
  let observed = false;
  beforeEach(() => {
    environment = {
      PO10625_LIFECYCLE_CLEANUP_VERIFIED: Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED'),
      PO10623_TRANSFER_CLEANUP_VERIFIED: Cypress.env('PO10623_TRANSFER_CLEANUP_VERIFIED'),
    };
    // Controlled fixture dependency is replaced before preparation; no live data or session is created.
    Cypress.env({ PO10625_LIFECYCLE_CLEANUP_VERIFIED: true, PO10623_TRANSFER_CLEANUP_VERIFIED: true });
    expected = false;
    observed = false;
  });
  afterEach(() => {
    Cypress.env(environment);
  });
  function requireFailure(): void {
    cy.then(() => {
      if (expected) expect(observed, 'required business assertion was reached').to.equal(true);
    });
  }
  function mustFail(message: string, inspect?: () => void): void {
    expected = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observed = true;
      inspect?.();
      return false;
    });
  }
  it(
    'AC1, AC3. should expose resubmission and persisted cross-user evidence through the Flow',
    { tags: tags() },
    () => {
      const state = harness('cross-user');
      const flow = new RejectedCasefileAmendmentFlow();
      flow.prepare('cross-user');
      flow.resubmit();
      flow.assertResubmitted();
      cy.then(() => {
        const ordered = [
          'put:200',
          'saved-get:B-id',
          'cleanup:B-id',
          'receipt-decode',
          'inputter-saved-detail',
          'checker-saved-detail',
        ];
        for (let index = 0; index < ordered.length; index++) {
          expect(state.events, 'observed network, authority and real DOM outcome').to.include(ordered[index]);
          if (index)
            expect(state.events.indexOf(ordered[index - 1]), ordered.join(' → ')).to.be.lessThan(
              state.events.indexOf(ordered[index]),
            );
        }
        expect(state.saved.draft.submitted_by).to.equal('B-id');
        expect(state.submissions).to.equal(1);
      });
    },
  );
  it('AC2. should retain one monitor and original version through the explicit Flow retry', { tags: tags() }, () => {
    const state = harness('retry');
    const definiteFailure = RejectedCasefileJourneyActions.prototype.assertDefiniteFailure;
    cy.stub(RejectedCasefileJourneyActions.prototype, 'assertDefiniteFailure').callsFake(function (
      this: RejectedCasefileJourneyActions,
    ) {
      definiteFailure.call(this);
      cy.then(() => {
        expect(state.submissions, 'failure proved before second activation').to.equal(1);
        expect(state.saved).to.deep.equal(state.context.before);
        state.events.push('definite-failure-proved');
      });
    });
    const flow = new RejectedCasefileAmendmentFlow();
    flow.prepare('retry');
    flow.retryResubmission();
    flow.assertResubmitted();
    cy.then(() => {
      expect(state.monitorRegistrations).to.equal(1);
      expect(state.submissions).to.equal(2);
      expect(state.events.indexOf('put:400')).to.be.lessThan(state.events.indexOf('definite-failure-proved'));
      expect(state.events.indexOf('definite-failure-proved')).to.be.lessThan(state.events.indexOf('put:200'));
    });
  });
  for (const kind of [
    'same-user',
    'cross-user',
    'retry',
    'stale',
    'denied',
    'non-rejected',
  ] as RejectedAmendmentKind[]) {
    it(
      `AC1, AC2, AC3, AC4. should complete native ${kind} controls with independent saved evidence`,
      { tags: tags() },
      () => {
        const state = harness(kind);
        const flow = new RejectedCasefileAmendmentFlow();
        flow.prepare(kind);
        complete(flow, kind);
        assertOutcome(flow, kind);
        cy.then(() => {
          expect(state.context.owned.inputterId).to.equal('A-id');
          if (!['denied'].includes(kind)) expect(state.receiptRecorded).to.equal(true);
          if (['same-user', 'cross-user', 'retry'].includes(kind)) {
            expect(state.monitorRegistrations).to.equal(1);
            expect(state.submissions).to.equal(kind === 'retry' ? 2 : 1);
          }
          if (kind === 'stale') {
            expect(state.events.filter((event) => event.startsWith('auth:'))).to.deep.equal(['auth:synthetic-A']);
            expect(
              state.saved.draft.casefile.respondent_account.respondent.party_details.individual_details!.forenames,
            ).to.equal('Winning');
          }
        });
      },
    );
  }
  for (const rejectedHistory of ['wrong-status', 'missing-event'] as const) {
    it(`AC1. should reject ${rejectedHistory} on the amendment task list before editing`, { tags: tags() }, () => {
      const state = harness('same-user', { rejectedHistory });
      mustFail(
        rejectedHistory === 'wrong-status' ? 'Rejected' : "Not enough elements found. Found '1', expected '2'",
        () => {
          expect(state.path).to.equal(`/cases/create-casefile/task-list/${state.context.owned.id}`);
          expect(state.submissions).to.equal(0);
        },
      );
      new RejectedCasefileAmendmentFlow().prepare('same-user');
      requireFailure();
    });
  }
  for (const rejectionScope of ['unfiltered', 'wrong-actor'] as const) {
    it(
      `AC3. should reject the ${rejectionScope} All rejected consultation after cross-user resubmission`,
      { tags: tags() },
      () => {
        harness('cross-user', { rejectionScope });
        mustFail('Missing exact controlled provider receipt @amendmentRejected');
        const flow = new RejectedCasefileAmendmentFlow();
        flow.prepare('cross-user');
        complete(flow, 'cross-user');
        assertOutcome(flow, 'cross-user');
        requireFailure();
      },
    );
  }
  for (const origin of [
    { label: 'non-200', faults: { originStatus: 503 }, message: 'actual amendment collection status' },
    { label: 'malformed', faults: { malformedOrigin: true }, message: 'Invalid draft casefile list response' },
  ]) {
    it(
      `AC1, AC3. should persist observed B cleanup authority before rejecting an early ${origin.label} origin collection`,
      { tags: tags() },
      () => {
        const state = harness('cross-user', origin.faults);
        mustFail(origin.message, () => {
          expect(state.receiptRecorded, 'B cleanup receipt persisted before provider failure').to.equal(true);
          expect(state.saved.draft.submitted_by).to.equal('B-id');
          const response = state.events.indexOf('origin-response');
          const savedGet = state.events.indexOf('saved-get:B-id');
          const persisted = state.events.indexOf('cleanup:B-id');
          expect(response, 'origin arrived before independent saved GET').to.be.greaterThan(-1).and.lessThan(savedGet);
          expect(savedGet, 'independent B authority read before persistence').to.be.lessThan(persisted);
        });
        const flow = new RejectedCasefileAmendmentFlow();
        flow.prepare('cross-user');
        complete(flow, 'cross-user');
        assertOutcome(flow, 'cross-user');
        requireFailure();
      },
    );
  }
  for (const fault of [
    {
      name: 'client audit fields in the complete outgoing replacement',
      faults: { requestAudit: true },
      message: 'complete corrected replacement body',
    },
    {
      name: 'a lost creditor in the complete outgoing replacement',
      faults: { incompleteRequest: true },
      message: 'complete corrected replacement body',
    },
    {
      name: 'a wrong latest submitter in the actual downstream provider',
      faults: { wrongProviderActor: true },
      message: 'actual latest submitter',
    },
    {
      name: 'a missing eligible checker provider row despite visible DOM',
      faults: { missingCheckerProvider: true },
      message: 'owned case in actual provider',
    },
    {
      name: 'a missing actual downstream provider row despite a visible DOM row',
      faults: { missingProvider: true },
      message: 'owned case in actual provider',
    },
    {
      name: 'a rejected residual hidden on a later DOM page',
      faults: { residual: true },
      message: 'owned case across every real DOM page',
    },
    {
      name: 'a lost correction in the saved full presentation',
      faults: { lostCorrection: true },
      message: 'Corrected',
    },
    { name: 'an unrelated success destination', faults: { wrongOrigin: true }, message: 'resubmission destination' },
    {
      name: 'a receipt differing from the independent saved GET',
      faults: { badReceipt: true },
      message: 'saved submitted_by unchanged',
    },
  ]) {
    it(`AC1, AC3. should reject ${fault.name}`, { tags: tags() }, () => {
      const state = harness('same-user', fault.faults);
      mustFail(fault.message, () =>
        expect(state.receiptRecorded, 'cleanup authority persisted before assertions').to.equal(true),
      );
      const flow = new RejectedCasefileAmendmentFlow();
      flow.prepare('same-user');
      complete(flow, 'same-user');
      assertOutcome(flow, 'same-user');
      requireFailure();
      cy.then(() =>
        expect(state.receiptRecorded, 'observed cleanup actor persisted before fallible assertions').to.equal(true),
      );
    });
  }
  it(
    'AC4. should require the actual winner in the fresh inputter provider after stale reload',
    { tags: tags() },
    () => {
      harness('stale', { missingProvider: true });
      mustFail('owned case in actual provider');
      const flow = new RejectedCasefileAmendmentFlow();
      flow.prepare('stale');
      complete(flow, 'stale');
      assertOutcome(flow, 'stale');
      requireFailure();
    },
  );
  it('AC4. should require the native stale departure warning before reload', { tags: tags() }, () => {
    harness('stale', { missingWarning: true });
    mustFail('native departure warning presented');
    const flow = new RejectedCasefileAmendmentFlow();
    flow.prepare('stale');
    complete(flow, 'stale');
    assertOutcome(flow, 'stale');
    requireFailure();
  });
  for (const guard of [undefined, false, 'true']) {
    it(`AC4. should block fixture creation for lifecycle guard ${String(guard)}`, { tags: tags() }, () => {
      const prepare = cy.spy(RejectedCasefileFixtureActions.prototype, 'prepare');
      Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED', guard);
      expect(() => new RejectedCasefileAmendmentFlow().prepare('same-user')).to.throw(
        'PO10625_LIFECYCLE_CLEANUP_VERIFIED',
      );
      expect(prepare).not.to.have.been.called;
    });
  }
  for (const kind of ['same-user', 'cross-user', 'stale', 'non-rejected'] as RejectedAmendmentKind[]) {
    it(
      `AC4. should block the ${kind} transition if cleanup capability is lost after preparation`,
      { tags: tags() },
      () => {
        const state = harness(kind);
        const flow = new RejectedCasefileAmendmentFlow();
        flow.prepare(kind);
        cy.then(() =>
          Cypress.env(
            kind === 'cross-user' ? 'PO10623_TRANSFER_CLEANUP_VERIFIED' : 'PO10625_LIFECYCLE_CLEANUP_VERIFIED',
            false,
          ),
        );
        mustFail(
          kind === 'cross-user' ? 'PO10623_TRANSFER_CLEANUP_VERIFIED' : 'PO10625_LIFECYCLE_CLEANUP_VERIFIED',
          () => {
            expect(state.submissions).to.equal(0);
            expect(state.requests.some((request) => request.method === 'PUT')).to.equal(false);
          },
        );
        complete(flow, kind);
        requireFailure();
      },
    );
  }
  it('AC4. should reject missing transfer cleanup before fixture preparation', { tags: tags() }, () => {
    const prepare = cy.spy(RejectedCasefileFixtureActions.prototype, 'prepare');
    Cypress.env('PO10623_TRANSFER_CLEANUP_VERIFIED', false);
    expect(() => new RejectedCasefileAmendmentFlow().prepare('cross-user')).to.throw(
      'PO10623_TRANSFER_CLEANUP_VERIFIED',
    );
    expect(prepare).not.to.have.been.called;
  });

  for (const kind of [
    'same-user',
    'cross-user',
    'retry',
    'stale',
    'denied',
    'non-rejected',
  ] as RejectedAmendmentKind[]) {
    it(
      `AC5. should scan every material ${kind} state before leaving and retain real business proof`,
      { tags: tags() },
      () => {
        const state = harness(kind);
        recordScans(state);
        const flow = new RejectedCasefileAmendmentFlow();
        flow.prepare(kind, true);
        complete(flow, kind);
        assertOutcome(flow, kind);
        cy.then(() => {
          const required = ['denied', 'non-rejected'].includes(kind)
            ? ['denial']
            : [
                'list',
                'tasks',
                'editor',
                'review',
                'read-only',
                ...(kind === 'stale' ? ['failure', 'denial'] : ['confirmation']),
                ...(kind === 'retry' ? ['failure'] : []),
              ];
          for (const page of required)
            for (const width of [1280, 320])
              expect(state.scans, `strict scan coverage ${page} at ${width}`).to.include(`${page}:${width}`);
          if (required.includes('editor')) {
            expect(
              state.native.some((event) => event === `Enter:${C.respondentDetails.returnToCaseDetails.slice(1)}`),
              'native Return activation',
            ).to.equal(true);
            expect(
              state.native.some((event) => event.startsWith('Tab:')),
              'native Tab traversal',
            ).to.equal(true);
            expect(state.native).to.include('Tab:editor-other-field');
            expect(state.native).to.include('Tab:editor-native-checkbox');
          }
          expect(state.pointer, 'no pointer substitution in accessible controls').to.have.length(0);
          if (!['denied', 'non-rejected'].includes(kind)) {
            expect(state.listScans).to.include('ascending:Page 1');
            expect(state.listScans).to.include('descending:Page 1');
          }
        });
      },
    );
  }
  it('AC5. should scan each real later pagination state before rejected residual failure', { tags: tags() }, () => {
    const state = harness('same-user', { residual: true });
    recordScans(state);
    mustFail('owned case across every real DOM page', () => {
      expect(state.listScans).to.include('none:Page 1');
      expect(state.listScans).to.include('none:Page 2');
    });
    const flow = new RejectedCasefileAmendmentFlow();
    flow.prepare('same-user', true);
    complete(flow, 'same-user');
    assertOutcome(flow, 'same-user');
    requireFailure();
  });
  it('AC5. should reject removed scanner coverage', { tags: tags() }, () => {
    const state = harness('denied');
    recordScans(state, true);
    mustFail('strict scan coverage');
    const flow = new RejectedCasefileAmendmentFlow();
    flow.prepare('denied', true);
    complete(flow, 'denied');
    assertOutcome(flow, 'denied');
    cy.then(() => expect(state.scans, 'strict scan coverage').to.include('denial:320'));
    requireFailure();
  });
  for (const fault of [
    { label: 'overflow', faults: { overflow: true }, message: 'horizontal overflow' },
    { label: 'unreachable Return', faults: { unreachableReturn: true }, message: 'focused' },
    { label: 'lost task focus', faults: { lostFocus: true }, message: 'focused' },
  ]) {
    it(`AC5. should reject ${fault.label}`, { tags: tags() }, () => {
      const state = harness('same-user', fault.faults);
      recordScans(state);
      mustFail(fault.message);
      new RejectedCasefileAmendmentFlow().prepare('same-user', true);
      requireFailure();
    });
  }
  it('AC5. should propagate strict Axe failures without exemptions', { tags: tags() }, () => {
    const state = harness('denied');
    const inject = cy.stub(cy, 'injectAxe');
    const scan = cy.stub(cy, 'checkA11y').callsFake(() => {
      throw new Error('strict Axe failure');
    });
    mustFail('strict Axe failure', () => {
      expect(inject).to.have.been.called;
      expect(scan.firstCall.args, 'no Axe exemptions or exclusions').to.deep.equal([]);
      expect(state.submissions).to.equal(0);
    });
    const flow = new RejectedCasefileAmendmentFlow();
    flow.prepare('denied', true);
    complete(flow, 'denied');
    assertOutcome(flow, 'denied');
    requireFailure();
  });
  it('AC5. should preserve pointer correction defaults', { tags: tags() }, () => {
    const state = harness('same-user');
    new RejectedCasefileAmendmentFlow().prepare('same-user');
    cy.then(() => expect(state.native.filter((event) => event.startsWith('Enter:'))).to.have.length(0));
  });
  it('AC5. should scan corrected editor before native Return and propagate callback errors', { tags: tags() }, () => {
    const state = harness('same-user');
    new RejectedCasefileAmendmentFlow().prepare('same-user');
    mustFail('editor callback failure', () => {
      expect(
        state.native.some((event) => event === `Enter:${C.respondentDetails.returnToCaseDetails.slice(1)}`),
      ).to.equal(false);
    });
    cy.then(() => {
      // The additive callback contract must run with the corrected field still rendered.
      const recovery = new DraftCasefileRecoveryActions();
      recovery.correctRespondent('Callback', true, () => {
        cy.get(C.respondentDetails.firstNames).should('have.value', 'Callback');
        cy.then(() => {
          throw new Error('editor callback failure');
        });
      });
    });
    requireFailure();
  });

  it('AC4. should validate all string choices immediately before scheduling work', { tags: tags() }, () => {
    const flow = new RejectedCasefileAmendmentFlow();
    expect(() => flow.prepare('unsupported')).to.throw('Unsupported rejected amendment kind');
  });
});
