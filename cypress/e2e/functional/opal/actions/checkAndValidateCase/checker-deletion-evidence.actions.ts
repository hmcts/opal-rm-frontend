import { versionValue } from './draft-casefile-evidence.actions';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileMonitor } from './interfaces/draft-casefile-monitor.interface';

export type CheckerDeletionKind = 'success' | 'cancel' | 'blank' | 'hard-cap' | 'retry';

/** Requires a retained owned aggregate and precisely one independent deletion event.
 * @param before Authoritative pre-decision aggregate.
 * @param saved Actual receipt or independent persisted read.
 * @param owned Scenario identity and independent checker.
 * @param reason Exact reason entered by the checker.
 */
export function assertDeletedAggregate(
  before: IDraftCasefileSnapshot,
  saved: IDraftCasefileSnapshot,
  owned: IOwnedDraftCasefile,
  reason: string,
): void {
  expect(before.draft.casefile_status, 'owned Submitted baseline').to.equal('SUBMITTED');
  expect(saved.draft.draft_casefile_id, 'same retained identity').to.equal(owned.id);
  expect(saved.draft.submitted_by, 'same retained inputter').to.equal(owned.inputterId);
  expect(saved.draft.casefile.respondent_account.remo_reference, 'same retained marker').to.equal(owned.marker);
  expect(saved.draft.casefile_status, 'retained deleted lifecycle').to.equal('DELETED');
  expect(versionValue(saved.etag) > versionValue(before.etag), 'deletion advanced ETag').to.equal(true);
  const lifecycle = new Set([
    'casefile_status',
    'casefile_status_name',
    'casefile_status_date',
    'status_message',
    'timeline_data',
  ]);
  for (const field of Object.keys(before.draft)) {
    if (!lifecycle.has(field))
      expect(
        Cypress._.isEqual(Cypress._.get(saved.draft, field), Cypress._.get(before.draft, field)),
        `retained ${field}`,
      ).to.equal(true);
  }
  const remaining = [...saved.draft.timeline_data];
  expect(remaining, 'exactly one added deletion event').to.have.length(before.draft.timeline_data.length + 1);
  for (const old of before.draft.timeline_data) {
    const index = remaining.findIndex((event) => Cypress._.isEqual(old, event));
    expect(index, 'every original history event retained exactly').to.be.greaterThan(-1);
    remaining.splice(index, 1);
  }
  expect(remaining, 'one new deletion event').to.have.length(1);
  expect(remaining[0].status, 'exact Deleted event').to.equal('Deleted');
  expect(remaining[0].username, 'independent checker history').to.equal(owned.checkerName);
  expect(remaining[0].reason_text, 'exact typed deletion reason').to.equal(reason);
  expect(remaining[0].status_date, 'matching saved deletion timestamp').to.equal(saved.draft.casefile_status_date);
}

/** Requires one definite failure followed by one real explicit retry on the original version.
 * @param monitor Same maintained observation across both activations.
 * @param original Original opaque detail version.
 */
export function assertDeletionRetry(monitor: IDraftCasefileMonitor, original: string): void {
  expect(monitor.applicationAttempts, 'two explicit deletion activations').to.equal(2);
  expect(monitor.attempts, 'two deletion wire attempts').to.equal(2);
  expect(monitor.requestVersions, 'same original opaque version on explicit retry').to.deep.equal([original, original]);
  expect(monitor.interceptedFailures, 'one injected definite rejection').to.equal(1);
  expect(monitor.upstreamSuccesses, 'one real acknowledged deletion').to.equal(1);
  expect(monitor.droppedResponses, 'no uncertain response loss').to.equal(0);
  expect(monitor.lastStatus, 'real final deletion status').to.equal(200);
}
