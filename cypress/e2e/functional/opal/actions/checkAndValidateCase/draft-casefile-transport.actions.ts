import type { CyHttpMessages } from 'cypress/types/net-stubbing';
import type { IDraftCasefileMonitor } from './interfaces/draft-casefile-monitor.interface';
import type { DraftCasefileFault } from './types/draft-casefile-fault.type';
import { DRAFT_CASEFILE_DEFINITE_FAILURE } from './mocks/draft-casefile-definite-failure.mock';

/**
 * Counts all attempts. Only the first request is faulted, so an automatic replay remains observable.
 * @param fault One-shot fault or conflict selected for this example.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function createMutationControl(fault: DraftCasefileFault): {
  monitor: IDraftCasefileMonitor;
  handleRequest: (request: CyHttpMessages.IncomingHttpRequest) => void;
} {
  const monitor: IDraftCasefileMonitor = {
    attempts: 0,
    applicationAttempts: 0,
    upstreamSuccesses: 0,
    droppedResponses: 0,
    interceptedFailures: 0,
    requestVersions: [],
  };
  const handleRequest = (request: CyHttpMessages.IncomingHttpRequest) => {
    const first = ++monitor.attempts === 1;
    const version = request.headers['if-match'];
    monitor.requestVersions.push(typeof version === 'string' ? version : undefined);
    if (first && fault === 'definite-failure') {
      monitor.interceptedFailures++;
      request.reply({ statusCode: 400, body: structuredClone(DRAFT_CASEFILE_DEFINITE_FAILURE) });
      return;
    }
    request.continue((response) => {
      monitor.lastStatus = response.statusCode;
      if (response.statusCode === 200) monitor.upstreamSuccesses++;
      if (!first || fault !== 'lost-response' || response.statusCode !== 200) return;
      const etag = response.headers['etag'];
      if (typeof etag !== 'string' || !etag) throw new Error('Successful mutation response has no ETag');
      monitor.upstreamEtag = etag;
    });
  };
  return { monitor, handleRequest };
}

/**
 * Counts application dispatches separately from wire attempts. Loss occurs after a real successful response,
 * before Fetch delivers it to Angular. Closing a Chromium socket can itself replay the wire request.
 * @param window Application window owning Fetch.
 * @param id Exact owned draft identifier.
 * @param method Exact mutation method.
 * @param fault One-shot fault selected for this example.
 * @param monitor Independent application and network observations.
 * @returns Restore only this wrapper, without overwriting a later owner of fetch.
 */
export function installDraftCasefileFetchMonitor(
  window: Pick<Window, 'fetch' | 'location'>,
  id: number,
  method: 'PATCH' | 'PUT',
  fault: DraftCasefileFault,
  monitor: IDraftCasefileMonitor,
): () => void {
  const original = window.fetch;
  const pathname = `/opal-maintenance-service/draft-casefiles/${id}`;
  const monitored: typeof window.fetch = async function (input, options) {
    let inputUrl: string;
    if (typeof input === 'string') inputUrl = input;
    else inputUrl = input instanceof URL ? input.href : input.url;
    const url = new URL(inputUrl, window.location.href);
    const requestMethod = options?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
    const target =
      url.origin === window.location.origin && url.pathname === pathname && requestMethod.toUpperCase() === method;
    const first = target && ++monitor.applicationAttempts === 1;
    const response = await original.call(window, input, options);
    if (first && fault === 'lost-response' && response.status === 200) {
      if (
        monitor.upstreamSuccesses !== 1 ||
        !monitor.upstreamEtag ||
        response.headers.get('etag') !== monitor.upstreamEtag
      ) {
        throw new Error('Lost response requires the independently observed upstream HTTP 200 and ETag');
      }
      monitor.droppedResponses++;
      throw new TypeError('Failed to fetch');
    }
    return response;
  };
  window.fetch = monitored;
  return () => {
    if (window.fetch === monitored) window.fetch = original;
  };
}

/**
 * Installs a monitor for exactly one resource/method, without limiting observation to one attempt.
 * @param id Positive identifier of the independently owned draft.
 * @param method HTTP mutation method to forward or observe.
 * @param fault One-shot fault or conflict selected for this example.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function armDraftCasefileMutation(
  id: number,
  method: 'PATCH' | 'PUT',
  fault: DraftCasefileFault,
): IDraftCasefileMonitor {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid owned draft ID');
  const control = createMutationControl(fault);
  cy.intercept({ method, pathname: `/opal-maintenance-service/draft-casefiles/${id}` }, control.handleRequest).as(
    'draftMutation',
  );
  cy.window({ log: false }).then((window) => {
    const restore = installDraftCasefileFetchMonitor(window, id, method, fault, control.monitor);
    Cypress.once('test:after:run', restore);
  });
  return control.monitor;
}
