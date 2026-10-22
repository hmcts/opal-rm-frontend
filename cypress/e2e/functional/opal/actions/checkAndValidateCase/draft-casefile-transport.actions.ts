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
      if (!first || fault !== 'lost-response') return;
      if (response.statusCode !== 200) {
        throw new Error('Expected a real upstream HTTP 200 before losing its response');
      }
      const etag = response.headers['etag'];
      if (typeof etag !== 'string' || !etag) throw new Error('Successful mutation response has no ETag');
      monitor.upstreamEtag = etag;
      monitor.droppedResponses++;
      response.send({ forceNetworkError: true });
    });
  };
  return { monitor, handleRequest };
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
  return control.monitor;
}
