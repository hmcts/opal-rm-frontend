import type { IDraftCasefileDetail } from './interfaces/draft-casefile-detail.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefilePublicationEvidence } from './interfaces/draft-casefile-publication-evidence.interface';

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

/**
 * Missing or late producer observations cannot be interpreted as a count of zero.
 * @param owned Identity and exact run marker of the owned case.
 * @param owned.id Positive owned draft identifier.
 * @param owned.marker Exact marker captured from real creation.
 * @param body Wire data read from or sent to the real API.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function decodePublicationEvidence(
  owned: { id: number; marker: string },
  body: unknown,
): IDraftCasefilePublicationEvidence {
  if (
    !record(body) ||
    body['draft_casefile_id'] !== owned.id ||
    body['test_run_reference'] !== owned.marker ||
    body['complete'] !== true ||
    body['recording_started_before_approval'] !== true ||
    !Number.isSafeInteger(body['accepted_publication_requests']) ||
    Number(body['accepted_publication_requests']) < 0
  ) {
    throw new Error('Incomplete or mismatched publication evidence');
  }
  return body as unknown as IDraftCasefilePublicationEvidence;
}

/**
 * URI is supplied from the delivered provider contract, rather than pretending the proposed endpoint exists.
 * @param owned Identity and exact run marker of the owned case.
 * @param owned.id Positive owned draft identifier.
 * @param owned.marker Exact marker captured from real creation.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function readPublicationEvidence(owned: {
  id: number;
  marker: string;
}): Cypress.Chainable<IDraftCasefilePublicationEvidence> {
  const path: unknown = Cypress.env('PO10626_PUBLICATION_EVIDENCE_PATH');
  if (
    typeof path !== 'string' ||
    !path.startsWith('/opal-maintenance-service/testing-support/') ||
    !path.includes('{id}') ||
    path.includes('..') ||
    path.includes('?') ||
    path.includes('#')
  ) {
    throw new Error('Set PO10626_PUBLICATION_EVIDENCE_PATH to the delivered test-support URI containing {id}');
  }
  return cy
    .request<unknown>({
      method: 'GET',
      url: path.replace('{id}', String(owned.id)),
      headers: { 'Test-Run-Reference': owned.marker },
      failOnStatusCode: false,
      retryOnNetworkFailure: false,
      retryOnStatusCodeFailure: false,
      log: false,
    })
    .then((response) => {
      expect(response.status, 'producer evidence response').to.equal(200);
      return decodePublicationEvidence(owned, response.body);
    });
}

/**
 * Compares accepted producer sends independently of consumer redelivery.
 * @param before Authoritative baseline captured before the tested action.
 * @param after Authoritative state/evidence read after the action.
 * @param delta Expected number of additional accepted publication requests.
 */
export function assertPublicationDelta(
  before: IDraftCasefilePublicationEvidence,
  after: IDraftCasefilePublicationEvidence,
  delta: 0 | 1,
): void {
  expect(after.draft_casefile_id).to.equal(before.draft_casefile_id);
  expect(after.test_run_reference).to.equal(before.test_run_reference);
  expect(
    after.accepted_publication_requests - before.accepted_publication_requests,
    'accepted producer sends',
  ).to.equal(delta);
}
