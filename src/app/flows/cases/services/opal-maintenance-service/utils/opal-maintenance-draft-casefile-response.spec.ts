import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../../cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { decodeDraftCasefileCount, decodeDraftCasefileList } from './opal-maintenance-draft-casefile-response';

const summary = () => ({
  draft_casefile_id: 7,
  business_unit_id: 44,
  submitted_by: 'BUU-SYNTHETIC',
  created_date: '2026-09-01T12:00:00Z',
  casefile_type: 'REMO In',
  casefile_status: 'SUBMITTED',
  casefile_status_date: '2026-09-01T12:00:00Z',
  casefile_snapshot: {},
});

describe('draft casefile response decoders', () => {
  it.each([undefined, null, '', 'Synthetic submitter'])(
    'accepts optional top-level submitter name %s',
    (submitted_by_name) => {
      const row = { ...summary(), submitted_by_name };
      expect(decodeDraftCasefileList({ count: 1, summaries: [row] }).summaries).toEqual([row]);
    },
  );
  it.each([{ name: 7 }, { name: {} }, { name: [] }])(
    'rejects invalid top-level submitter name %j',
    ({ name: submitted_by_name }) => {
      expect(() => decodeDraftCasefileList({ count: 1, summaries: [{ ...summary(), submitted_by_name }] })).toThrow();
    },
  );
  it.each([
    null,
    [],
    {},
    { count: -1 },
    { count: 0 },
    { count: 0, summaries: null },
    { count: 1.5, summaries: [] },
    { count: '2', summaries: [] },
    { count: Number.MAX_SAFE_INTEGER + 1, summaries: [] },
  ])('rejects malformed lists: %j', (value) => {
    expect(() => decodeDraftCasefileList(value)).toThrow('Invalid draft casefile list response');
  });
  it.each([
    null,
    [],
    {},
    { count: -1 },
    { count: null },
    { count: 0.5 },
    { count: 1.5 },
    { count: '2' },
    { count: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects invalid counts: %j', (value) => {
    expect(() => decodeDraftCasefileCount(value)).toThrow('Invalid draft casefile count response');
  });
  it.each([0, 107, Number.MAX_SAFE_INTEGER])('accepts count %s without requiring summaries', (count) => {
    expect(decodeDraftCasefileCount({ count, extra: true })).toEqual({ count });
  });
  it('preserves a provider count discrepancy and ignores extra wrapper fields', () => {
    const summaries = [summary()];
    expect(decodeDraftCasefileList({ count: 99, summaries, extra: true })).toEqual({ count: 99, summaries });
  });
  it('accepts empty lists', () =>
    expect(decodeDraftCasefileList({ count: 0, summaries: [] })).toEqual({ count: 0, summaries: [] }));
  it.each(['SUBMITTED', 'RESUBMITTED', 'REJECTED', 'PUBLISHING_PENDING', 'PUBLISHED', 'PUBLISHING_FAILED', 'DELETED'])(
    'accepts known status %s',
    (casefile_status) => {
      const row = { ...summary(), casefile_status };
      expect(decodeDraftCasefileList({ count: 1, summaries: [row] }).summaries).toEqual([row]);
    },
  );
  it.each(Object.values(CASES_CREATE_CASEFILE_CASE_TYPES))('accepts known case type %s', (casefile_type) => {
    const row = { ...summary(), casefile_type };
    expect(decodeDraftCasefileList({ count: 1, summaries: [row] }).summaries).toEqual([row]);
  });
  it.each([
    {},
    { respondent_account: null, applicant_account: null, minor_creditor_accounts: null },
    { respondent_account: {}, applicant_account: {}, minor_creditor_accounts: [] },
    {
      respondent_account: { respondent_name: 'Synthetic respondent', account_number: '001' },
      applicant_account: { applicant_name: 'Synthetic applicant', account_number: null },
      minor_creditor_accounts: [{ creditor_sequence: 1, account_number: '001' }, { account_number: '001' }],
    },
  ])('tolerates missing accounts and duplicate optional numbers: %j', (casefile_snapshot) => {
    const row = { ...summary(), casefile_snapshot };
    expect(decodeDraftCasefileList({ count: 1, summaries: [row] }).summaries).toEqual([row]);
  });
  it.each([undefined, null, '2026-09-01T12:00:00+01:00'])(
    'accepts optional validated timestamp %s',
    (validated_date) => {
      const row = { ...summary(), validated_date };
      expect(decodeDraftCasefileList({ count: 1, summaries: [row] }).summaries).toEqual([row]);
    },
  );
  it.each([
    null,
    [],
    {},
    { draft_casefile_id: undefined },
    { draft_casefile_id: 0 },
    { draft_casefile_id: 1.5 },
    { draft_casefile_id: Number.MAX_SAFE_INTEGER + 1 },
    { business_unit_id: undefined },
    { business_unit_id: -1 },
    { business_unit_id: '44' },
    { submitted_by: undefined },
    { submitted_by: '' },
    { submitted_by: ' ' },
    { submitted_by: 7 },
    { created_date: undefined },
    { created_date: '2026-02-30T12:00:00Z' },
    { created_date: '2026-09-01' },
    { created_date: 7 },
    { casefile_status_date: undefined },
    { casefile_status_date: 'invalid' },
    { validated_date: '2026-02-30T12:00:00Z' },
    { casefile_status: 'UNKNOWN' },
    { casefile_type: 'UNKNOWN' },
    { casefile_snapshot: undefined },
    { casefile_snapshot: [] },
    { casefile_snapshot: null },
    { casefile_snapshot: { respondent_account: [] } },
    { casefile_snapshot: { respondent_account: { account_number: 7 } } },
    { casefile_snapshot: { respondent_account: { respondent_name: null } } },
    { casefile_snapshot: { applicant_account: { applicant_name: 7 } } },
    { casefile_snapshot: { minor_creditor_accounts: {} } },
    { casefile_snapshot: { minor_creditor_accounts: [null] } },
    { casefile_snapshot: { minor_creditor_accounts: [{ account_number: 7 }] } },
    { casefile_snapshot: { minor_creditor_accounts: [{ creditor_sequence: 0 }] } },
  ])('rejects invalid individual records: %j', (invalid) => {
    const row =
      invalid === null || Array.isArray(invalid) || Object.keys(invalid).length === 0
        ? invalid
        : { ...summary(), ...invalid };
    expect(() => decodeDraftCasefileList({ count: 1, summaries: [row] })).toThrow(
      'Invalid draft casefile list response',
    );
  });
});
