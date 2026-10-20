import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { createPersistedCasefileDetail } from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { describe, expect, it } from 'vitest';
import { readCasesDraftDeletionReceipt } from './cases-draft-deletion-receipt';

const expected = { id: 17, businessUnitId: 44, etag: '"0"' };
function response(status = 200, etag: string | null = '"1"') {
  const body = createPersistedCasefileDetail();
  body.casefile_status = 'DELETED';
  body.submitted_by = 'BUU-OTHER';
  return new HttpResponse({
    status,
    body,
    headers: etag === null ? new HttpHeaders() : new HttpHeaders({ ETag: etag }),
  });
}
describe('readCasesDraftDeletionReceipt', () => {
  it('accepts a complete deletion without treating the checker as the submitter', () => {
    const receipt = readCasesDraftDeletionReceipt(response(), expected);
    expect(receipt.draft.casefile_status).toBe('DELETED');
    expect(receipt.draft.submitted_by).toBe('BUU-OTHER');
    expect(receipt.etag).toBe('"1"');
  });
  it.each([204, 201])('rejects status %s', (status) => {
    expect(() => readCasesDraftDeletionReceipt(response(status), expected)).toThrow();
  });
  it.each([null, '"0"', 'W/"1"', '"9223372036854775808"'])('rejects version %s', (etag) => {
    expect(() => readCasesDraftDeletionReceipt(response(200, etag), expected)).toThrow();
  });
  it('rejects incomplete detail, a different ID, BU and a non-deleted lifecycle', () => {
    expect(() => readCasesDraftDeletionReceipt(response().clone({ body: null }), expected)).toThrow();
    for (const mutation of [
      { draft_casefile_id: 18 },
      { business_unit_id: 45 },
      { casefile_status: 'SUBMITTED' as const },
    ]) {
      const received = response();
      expect(() =>
        readCasesDraftDeletionReceipt(received.clone({ body: { ...received.body!, ...mutation } }), expected),
      ).toThrow();
    }
  });
  it('rejects a missing display identity even when the remaining detail is complete', () => {
    const received = response();
    received.body!.casefile_snapshot.respondent_account.respondent_name = ' ';
    expect(() => readCasesDraftDeletionReceipt(received, expected)).toThrow();
  });
});
