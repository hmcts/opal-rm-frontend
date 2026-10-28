import type { IDraftCasefileDetail } from './interfaces/draft-casefile-detail.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

/**
 * Compares server versions losslessly; the original quoted header is still echoed in If-Match.
 * @param etag Quoted strong version returned by the authoritative server.
 * @returns Lossless integer version for comparison only.
 */
export function versionValue(etag: string): bigint {
  if (!/^"[0-9]+"$/.test(etag)) throw new Error('Invalid authoritative ETag');
  const value = BigInt(etag.slice(1, -1));
  if (value > 9223372036854775807n) throw new Error('Invalid authoritative ETag');
  return value;
}

/**
 * Narrows an unknown wire value to a non-array object.
 * @param value Explicit synthetic correction or validated journey value.
 * @returns Whether the value is an object.
 */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates the fields consumed by the journey assertions, without duplicating the full API schema.
 * @param id Positive identifier of the independently owned draft.
 * @param body Wire data read from or sent to the real API.
 * @param etag Quoted strong version returned by the authoritative server.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function decodeDraftSnapshot(id: number, body: unknown, etag: unknown): IDraftCasefileSnapshot {
  if (typeof etag !== 'string') throw new Error('Authoritative GET has no ETag');
  versionValue(etag);
  if (
    !record(body) ||
    body['draft_casefile_id'] !== id ||
    !record(body['casefile']) ||
    !record(body['casefile_snapshot']) ||
    !Array.isArray(body['timeline_data']) ||
    body['timeline_data'].length === 0 ||
    !Number.isSafeInteger(body['business_unit_id'])
  ) {
    throw new Error('Authoritative GET does not contain the owned complete draft');
  }
  for (const key of [
    'created_date',
    'submitted_by',
    'submitted_by_name',
    'casefile_status',
    'casefile_status_date',
    'casefile_type',
  ]) {
    if (typeof body[key] !== 'string' || !body[key]) throw new Error(`Authoritative GET is missing ${key}`);
  }
  for (const event of body['timeline_data']) {
    if (
      !record(event) ||
      typeof event['username'] !== 'string' ||
      typeof event['status_date'] !== 'string' ||
      !['Submitted', 'Resubmitted', 'Approved', 'Rejected', 'Deleted'].includes(String(event['status']))
    ) {
      throw new Error('Authoritative GET has an unusable timeline');
    }
  }
  return { draft: body as unknown as IDraftCasefileDetail, etag };
}

/**
 * Reads independently of browser intercepts and disables cy.request's own mutation-obscuring retries.
 * @param id Positive identifier of the independently owned draft.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function readDraftSnapshot(id: number): Cypress.Chainable<IDraftCasefileSnapshot> {
  return cy
    .request<unknown>({
      method: 'GET',
      url: `/opal-maintenance-service/draft-casefiles/${id}`,
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
      retryOnNetworkFailure: false,
      retryOnStatusCodeFailure: false,
      log: false,
    })
    .then((response) => {
      expect(response.status, 'authoritative GET').to.equal(200);
      return decodeDraftSnapshot(id, response.body, response.headers['etag']);
    });
}

/**
 * Reports the changed field without serializing participant data into a failed assertion.
 * @param before Authoritative baseline captured before the tested action.
 * @param after Authoritative state/evidence read after the action.
 */
export function assertUnchangedDraft(before: IDraftCasefileSnapshot, after: IDraftCasefileSnapshot): void {
  expect(after.etag, 'saved version unchanged').to.equal(before.etag);
  for (const field of Object.keys(before.draft) as (keyof IDraftCasefileDetail)[]) {
    expect(Cypress._.isEqual(after.draft[field], before.draft[field]), `saved ${field} unchanged`).to.equal(true);
  }
}
