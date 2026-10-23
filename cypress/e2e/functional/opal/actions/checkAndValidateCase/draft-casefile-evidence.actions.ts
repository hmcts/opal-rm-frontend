import { pathForDraftCasefileCleanup } from '../../../../../support/draftCasefiles';
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
 * Validates journal identity and safe counts without treating incomplete evidence as zero.
 * @param body Unknown response from the Maintenance publication observation endpoint.
 * @returns Only the seven safe contract fields, including consistent incomplete observations.
 */
export function decodePublicationEvidence(body: unknown): IDraftCasefilePublicationEvidence {
  if (
    !record(body) ||
    typeof body['observation_id'] !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body['observation_id']) ||
    typeof body['registered_at'] !== 'string' ||
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(body['registered_at']) ||
    !Number.isFinite(Date.parse(body['registered_at'])) ||
    typeof body['evidence_complete'] !== 'boolean'
  ) {
    throw new Error('Malformed publication observation identity');
  }
  for (const key of [
    'send_attempt_count',
    'acknowledged_send_count',
    'uncertain_send_count',
    'unfinished_send_count',
  ]) {
    const value = body[key];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
      throw new Error(`Publication evidence requires a nonnegative safe integer: ${key}`);
  }
  const evidence = body as unknown as IDraftCasefilePublicationEvidence;
  if (
    evidence.send_attempt_count !==
      evidence.acknowledged_send_count + evidence.uncertain_send_count + evidence.unfinished_send_count ||
    evidence.evidence_complete !== (evidence.uncertain_send_count === 0 && evidence.unfinished_send_count === 0)
  ) {
    throw new Error('Inconsistent publication evidence');
  }
  return {
    observation_id: evidence.observation_id,
    registered_at: evidence.registered_at,
    send_attempt_count: evidence.send_attempt_count,
    acknowledged_send_count: evidence.acknowledged_send_count,
    uncertain_send_count: evidence.uncertain_send_count,
    unfinished_send_count: evidence.unfinished_send_count,
    evidence_complete: evidence.evidence_complete,
  };
}

/**
 * Scopes both evidence methods to the validated owned draft and exact run marker.
 * @param owned Owned fixture identity used by both observation methods.
 * @param owned.id Positive safe-integer draft identifier.
 * @param owned.marker Exact scenario run marker.
 * @returns The fixed Maintenance publication evidence route.
 */
function publicationEvidencePath(owned: { id: number; marker: string }): string {
  if (!/^E2E-[0-9a-f]{16}$/.test(owned.marker)) throw new Error('Publication evidence requires the exact run marker');
  return `${pathForDraftCasefileCleanup(owned.id)}/publication-evidence`;
}

/**
 * Registers before publication, using the already authenticated current inputter.
 * @param owned Owned draft identifier and exact marker captured during creation.
 * @param owned.id Positive safe-integer draft identifier.
 * @param owned.marker Exact scenario run marker.
 * @returns A complete baseline with no publication attempts.
 */
export function registerPublicationEvidence(owned: {
  id: number;
  marker: string;
}): Cypress.Chainable<IDraftCasefilePublicationEvidence> {
  return cy
    .request<unknown>({
      method: 'POST',
      url: publicationEvidencePath(owned),
      headers: { 'Test-Run-Reference': owned.marker },
      failOnStatusCode: false,
      followRedirect: false,
      retryOnNetworkFailure: false,
      retryOnStatusCodeFailure: false,
      log: false,
    })
    .then((response) => {
      expect(response.status, 'publication registration').to.be.oneOf([201, 200]);
      const evidence = decodePublicationEvidence(response.body);
      expect(evidence.evidence_complete, 'complete registration baseline').to.equal(true);
      expect(evidence.send_attempt_count, 'registration before any publication').to.equal(0);
      return evidence;
    });
}

/**
 * Reads the existing observation using the already authenticated current inputter.
 * @param owned Owned draft identifier and exact marker captured during creation.
 * @param owned.id Positive safe-integer draft identifier.
 * @param owned.marker Exact scenario run marker.
 * @returns Current validated journal fields; acceptance still requires complete evidence.
 */
export function readPublicationEvidence(owned: {
  id: number;
  marker: string;
}): Cypress.Chainable<IDraftCasefilePublicationEvidence> {
  return cy
    .request<unknown>({
      method: 'GET',
      url: publicationEvidencePath(owned),
      headers: { 'Test-Run-Reference': owned.marker },
      failOnStatusCode: false,
      followRedirect: false,
      retryOnNetworkFailure: false,
      retryOnStatusCodeFailure: false,
      log: false,
    })
    .then((response) => {
      expect(response.status, 'publication evidence read').to.equal(200);
      return decodePublicationEvidence(response.body);
    });
}

/**
 * Requires observation continuity and complete attempt plus acknowledgment deltas.
 * @param before Authoritative baseline captured before the tested action.
 * @param after Authoritative evidence read after the action.
 * @param delta Expected number of additional publication sends.
 */
export function assertPublicationDelta(
  before: IDraftCasefilePublicationEvidence,
  after: IDraftCasefilePublicationEvidence,
  delta: 0 | 1,
): void {
  // The scoped URL/header identify the owned draft; the observation must never be replaced.
  expect(after.observation_id, 'same publication observation').to.equal(before.observation_id);
  expect(after.registered_at, 'same observation registration time').to.equal(before.registered_at);
  expect(before.evidence_complete, 'complete publication baseline').to.equal(true);
  expect(after.evidence_complete, 'complete publication result').to.equal(true);
  expect(after.uncertain_send_count, 'uncertain sends').to.equal(0);
  expect(after.unfinished_send_count, 'unfinished sends').to.equal(0);
  expect(after.send_attempt_count - before.send_attempt_count, 'publisher attempt delta').to.equal(delta);
  expect(after.acknowledged_send_count - before.acknowledged_send_count, 'acknowledged send delta').to.equal(delta);
}
