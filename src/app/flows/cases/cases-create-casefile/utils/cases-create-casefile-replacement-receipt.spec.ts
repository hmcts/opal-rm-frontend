import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { createPersistedCasefileDetail } from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { readCasesCreateCasefileReplacementReceipt } from './cases-create-casefile-replacement-receipt';

const expected = {
  draft: createPersistedCasefileDetail(),
  identity: { userId: 10606, businessUnitId: 44 as const, submittedBy: 'BUU-INPUTTER' },
  etag: '"9007199254740993"',
};
const response = () =>
  new HttpResponse({
    status: 200,
    body: { ...createPersistedCasefileDetail(), casefile_status: 'RESUBMITTED', submitted_by: 'BUU-INPUTTER' },
    headers: new HttpHeaders({ ETag: '"9007199254740994"' }),
  });
describe('replacement receipt', () => {
  it.each(['4', 'opaque-next-version', '"9007199254740994"'])(
    'verifies same-draft completion with opaque new ETag %s',
    (etag) => {
      const receipt = response().clone({ headers: new HttpHeaders({ ETag: etag }) });
      expect(() => readCasesCreateCasefileReplacementReceipt(receipt, expected)).not.toThrow();
    },
  );
  it.each([
    { status: 201 },
    { body: null },
    { headers: new HttpHeaders() },
    { headers: new HttpHeaders({ ETag: expected.etag }) },
    { headers: new HttpHeaders({ ETag: '' }) },
    ...[
      { draft_casefile_id: 18 },
      { business_unit_id: 99 },
      { casefile_status: 'SUBMITTED' },
      { submitted_by: '10606' },
      { submitted_by: '' },
      { submitted_by_name: '' },
    ].map((body) => ({ body: { ...response().body, ...body } })),
  ])('rejects an unverified receipt %j', (change) => {
    expect(() => readCasesCreateCasefileReplacementReceipt(response().clone(change), expected)).toThrow();
  });
});
