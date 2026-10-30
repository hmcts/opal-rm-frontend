import type { IOpalMaintenanceDraftCasefileDetail } from '../../../../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { versionValue } from './draft-casefile-evidence.actions';
import type { IDraftCasefileDetail } from './interfaces/draft-casefile-detail.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from './interfaces/draft-casefile-monitor.interface';
import type { IRejectedCasefileContext } from './interfaces/rejected-casefile-context.interface';

/** Clones the entire authoritative aggregate, changing only the explicit respondent correction.
 * @param before Fresh rejected detail.
 * @param correction Expected respondent forenames.
 * @returns An independent complete amendment payload.
 */
export function correctedRejectedCasefile(
  before: IDraftCasefileSnapshot,
  correction: string,
): IDraftCasefileDetail['casefile'] {
  if (!correction.trim()) throw new Error('Explicit respondent correction required');
  const corrected = structuredClone(before.draft.casefile);
  const individual = corrected.respondent_account.respondent.party_details.individual_details;
  if (!individual?.forenames) throw new Error('Rejected respondent forenames required');
  if (individual.forenames === correction) throw new Error('Respondent correction must change forenames');
  individual.forenames = correction;
  return corrected;
}

/** Validates snapshot structure before comparing it without logging participant payloads.
 * @param snapshot Authoritative aggregate and snapshot.
 * @returns A checked pre-publication snapshot retaining all unknown fields.
 */
function unpublishedSnapshot(
  snapshot: IDraftCasefileSnapshot,
): IOpalMaintenanceDraftCasefileDetail['casefile_snapshot'] {
  const saved = snapshot.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot'];
  const sequences = snapshot.draft.casefile.minor_creditors?.map((creditor) => creditor.creditor_sequence);
  expect(sequences, 'two complete aggregate creditor sequences').to.deep.equal([1, 2]);
  expect(Array.isArray(saved.minor_creditor_accounts), 'snapshot creditors present').to.equal(true);
  expect(
    saved.minor_creditor_accounts.map((creditor) => creditor.creditor_sequence),
    'matching snapshot sequences',
  ).to.deep.equal(sequences);
  for (const account of [saved.respondent_account, saved.applicant_account, ...saved.minor_creditor_accounts]) {
    expect(account?.account_id, 'prepublication account ID').to.equal(null);
    expect(account?.account_number, 'prepublication account number').to.equal(null);
  }
  expect(saved.respondent_account.respondent_name, 'baseline respondent name').to.be.a('string');
  return saved;
}

/** Requires full aggregate/snapshot preservation and exactly one real resubmission event.
 * @param context Original creator, rejected baseline and actual amender.
 * @param saved Independent post-action GET.
 * @param correction Explicit forenames correction.
 */
export function assertResubmittedCasefile(
  context: IRejectedCasefileContext,
  saved: IDraftCasefileSnapshot,
  correction: string,
): void {
  const before = context.before;
  expect(before.draft.casefile_status, 'rejected baseline').to.equal('REJECTED');
  expect(before.draft.draft_casefile_id, 'baseline owned ID').to.equal(context.owned.id);
  expect(before.draft.business_unit_id, 'baseline owning BU').to.equal(44);
  expect(before.draft.submitted_by, 'baseline original creator').to.equal(context.owned.inputterId);
  expect(before.draft.casefile.respondent_account.remo_reference, 'baseline exact marker').to.equal(
    context.owned.marker,
  );
  expect(
    before.draft.timeline_data.map((event) => event.status),
    'complete rejected history',
  ).to.deep.equal(['Submitted', 'Rejected']);
  expect(saved.draft.casefile_status, 'saved lifecycle').to.equal('RESUBMITTED');
  for (const field of ['draft_casefile_id', 'business_unit_id', 'created_date', 'casefile_type'] as const)
    expect(saved.draft[field], `immutable ${field}`).to.equal(before.draft[field]);
  expect(saved.draft.submitted_by, 'actual latest submitter').to.equal(context.amender.id);
  expect(saved.draft.submitted_by_name, 'actual latest submitter name').to.equal(context.amender.name);
  expect(
    Cypress._.isEqual(saved.draft.casefile, correctedRejectedCasefile(before, correction)),
    'complete corrected aggregate preserved',
  ).to.equal(true);
  const expectedSnapshot = structuredClone(unpublishedSnapshot(before));
  unpublishedSnapshot(saved);
  const forenames = before.draft.casefile.respondent_account.respondent.party_details.individual_details!.forenames!;
  const name = expectedSnapshot.respondent_account.respondent_name;
  expect(name.split(forenames), 'original forenames appear exactly once in snapshot').to.have.length(2);
  expectedSnapshot.respondent_account.respondent_name = name.replace(forenames, correction);
  expect(
    Cypress._.isEqual(saved.draft.casefile_snapshot, expectedSnapshot),
    'whole corrected snapshot preserved',
  ).to.equal(true);
  expect(versionValue(saved.etag) > versionValue(before.etag), 'lossless version increase').to.equal(true);
  expect(saved.draft.timeline_data, 'exact history plus one event').to.have.length(
    before.draft.timeline_data.length + 1,
  );
  expect(
    Cypress._.isEqual(saved.draft.timeline_data.slice(0, -1), before.draft.timeline_data),
    'lossless original history prefix',
  ).to.equal(true);
  const event = saved.draft.timeline_data.at(-1)!;
  expect(event.status, 'new lifecycle event').to.equal('Resubmitted');
  expect(event.username, 'new event actual amender').to.equal(context.amender.name);
  expect(event.status_date, 'event and status UTC timestamp match').to.equal(saved.draft.casefile_status_date);
  expect(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(event.status_date) &&
      Number.isFinite(Date.parse(event.status_date)),
    'valid UTC resubmission time',
  ).to.equal(true);
  expect(
    Date.parse(event.status_date) >= Date.parse(before.draft.casefile_status_date),
    'resubmission follows rejection',
  ).to.equal(true);
  expect(event.reason_text == null || event.reason_text === '', 'no fabricated resubmission reason').to.equal(true);
}

/** Requires a definite intercepted failure followed by one explicit real retry.
 * @param monitor Same transport monitor across both activations.
 * @param original Original strong ETag retained for both attempts.
 */
export function assertRejectedRetry(monitor: IDraftCasefileMonitor, original: string): void {
  expect(monitor.applicationAttempts, 'two application activations').to.equal(2);
  expect(monitor.attempts, 'two wire attempts').to.equal(2);
  expect(monitor.interceptedFailures, 'one definite intercepted failure').to.equal(1);
  expect(monitor.upstreamSuccesses, 'one real successful mutation').to.equal(1);
  expect(monitor.droppedResponses, 'no uncertain delivery').to.equal(0);
  expect(monitor.lastStatus, 'real retry status').to.equal(200);
  expect(monitor.requestVersions, 'original ETag on both explicit attempts').to.deep.equal([original, original]);
  expect(versionValue(monitor.upstreamEtag ?? '') > versionValue(original), 'real response advances version').to.equal(
    true,
  );
}
