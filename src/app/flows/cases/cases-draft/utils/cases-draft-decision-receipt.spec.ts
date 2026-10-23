import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { createPersistedCasefileResolved } from '../mocks/cases-draft-casefile-resolved.mock';
import type { CasesDraftCasefileDecision } from '../types/cases-draft-casefile-decision.type';
import { readCasesDraftDecisionReceipt } from './cases-draft-decision-receipt';

describe('readCasesDraftDecisionReceipt', () => {
  const decisions: CasesDraftCasefileDecision[] = [
    { decision: 'approve', targetStatus: 'PUBLISHING_PENDING' },
    { decision: 'reject', targetStatus: 'REJECTED', reason: 'Synthetic reason' },
  ];

  function scenario(decision: CasesDraftCasefileDecision) {
    const expected = createPersistedCasefileResolved();
    const body = structuredClone(expected.draft);
    body.casefile_status = decision.targetStatus;
    body.casefile_snapshot.respondent_account.respondent_name = 'Synthetic Respondent';
    return { expected, body };
  }

  it.each(decisions)('accepts $decision using persisted name and checker identity', (decision) => {
    const { expected, body } = scenario(decision);
    const response = new HttpResponse({ status: 200, body, headers: new HttpHeaders({ ETag: '"next"' }) });
    expect(readCasesDraftDecisionReceipt(response, expected, decision)).toEqual({
      identity: expected.identity,
      draftCasefileId: expected.draft.draft_casefile_id,
      respondentName: 'Synthetic Respondent',
      outcome: decision.decision === 'approve' ? 'approved' : 'rejected',
    });
  });

  it.each([201, 202, 204])('rejects unexpected HTTP %s', (status) => {
    const decision = decisions[0];
    const { expected, body } = scenario(decision);
    expect(() =>
      readCasesDraftDecisionReceipt(
        new HttpResponse({ status, body, headers: new HttpHeaders({ ETag: '"next"' }) }),
        expected,
        decision,
      ),
    ).toThrow();
  });

  it.each([null, '', '   ', '"0"'])('rejects missing, blank or unchanged ETag %s', (etag) => {
    const decision = decisions[0];
    const { expected, body } = scenario(decision);
    const headers = etag === null ? new HttpHeaders() : new HttpHeaders({ ETag: etag });
    expect(() =>
      readCasesDraftDecisionReceipt(new HttpResponse({ status: 200, body, headers }), expected, decision),
    ).toThrow();
  });

  it.each(['id', 'bu', 'inconsistent-bu', 'status', 'name', 'snapshot', 'empty', 'shape'] as const)(
    'rejects invalid %s',
    (kind) => {
      const decision = decisions[0];
      const { expected, body } = scenario(decision);
      let receipt: unknown = body;
      if (kind === 'id') body.draft_casefile_id += 1;
      if (kind === 'bu') {
        body.business_unit_id += 1;
        body.casefile.respondent_account.business_unit_id = body.business_unit_id;
      }
      if (kind === 'inconsistent-bu') body.business_unit_id += 1;
      if (kind === 'status') body.casefile_status = 'REJECTED';
      if (kind === 'name') body.casefile_snapshot.respondent_account.respondent_name = '  ';
      if (kind === 'snapshot') receipt = { ...body, casefile_snapshot: null };
      if (kind === 'empty') receipt = null;
      if (kind === 'shape') receipt = { draft_casefile_id: body.draft_casefile_id };
      expect(() =>
        readCasesDraftDecisionReceipt(
          new HttpResponse({ status: 200, body: receipt, headers: new HttpHeaders({ ETag: '"next"' }) }),
          expected,
          decision,
        ),
      ).toThrow();
    },
  );
});
