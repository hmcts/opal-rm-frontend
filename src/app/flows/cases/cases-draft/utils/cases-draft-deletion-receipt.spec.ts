import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { createPersistedCasefileDetail } from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { readCasesDraftDeletionReceipt } from './cases-draft-deletion-receipt';

const expected = {
  draft: createPersistedCasefileDetail(),
  etag: '"9007199254740993"',
};
const response = () =>
  new HttpResponse({
    status: 200,
    body: {
      ...createPersistedCasefileDetail(),
      casefile_status: 'DELETED',
      casefile_status_name: 'Deleted',
      status_message: 'Duplicate case',
    },
    headers: new HttpHeaders({ ETag: '"9007199254740994"' }),
  });

describe('deletion receipt', () => {
  it.each(['4', 'opaque-next-version', '"9007199254740994"'])(
    'returns confirmed deletion with updated opaque ETag %s',
    (etag) => {
      const receipt = response().clone({ headers: new HttpHeaders({ ETag: etag }) });
      expect(readCasesDraftDeletionReceipt(receipt, expected)).toBe(receipt.body);
      expect(expected.draft.casefile_status).toBe('SUBMITTED');
      expect(expected.etag).toBe('"9007199254740993"');
    },
  );

  it('rejects an absent response', () => {
    expect(() => readCasesDraftDeletionReceipt(null, expected)).toThrow();
  });

  it.each([
    { status: 201 },
    { status: 204 },
    { status: 500 },
    { body: null },
    { body: { casefile_status: 'DELETED' } },
    { headers: new HttpHeaders() },
    { headers: new HttpHeaders({ ETag: expected.etag }) },
    { headers: new HttpHeaders({ ETag: '' }) },
    ...[
      { draft_casefile_id: 18 },
      { casefile_status: 'SUBMITTED' },
      { casefile_status: 'RESUBMITTED' },
      { submitted_by: '' },
      { casefile_snapshot: null },
      { timeline_data: [] },
    ].map((body) => ({ body: { ...response().body, ...body } })),
  ])('rejects an unverified receipt %j', (change) => {
    expect(() => readCasesDraftDeletionReceipt(response().clone(change), expected)).toThrow();
  });

  it('rejects a well-formed deletion belonging to another business unit', () => {
    const draft = createPersistedCasefileDetail();
    draft.business_unit_id = 99;
    draft.casefile.respondent_account.business_unit_id = 99;
    const receipt = response().clone({ body: { ...draft, casefile_status: 'DELETED' } });

    expect(() => readCasesDraftDeletionReceipt(receipt, expected)).toThrow();
  });
});
