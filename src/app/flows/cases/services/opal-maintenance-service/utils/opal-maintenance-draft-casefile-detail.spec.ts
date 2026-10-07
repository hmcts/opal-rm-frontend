import { describe, expect, it } from 'vitest';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_RESULT_DETAIL,
  PERSISTED_CASEFILE_RESULT_PAGE,
} from '../mocks/opal-maintenance-draft-casefile-detail.mock';
import { mapOrderTermParameters } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import { decodeDraftCasefileDetail } from './opal-maintenance-draft-casefile-detail';

describe('decodeDraftCasefileDetail', () => {
  it('preserves the independent business body, snapshot and quoted zero version', () => {
    const body = createPersistedCasefileDetail();
    expect(decodeDraftCasefileDetail(body, '"0"', 17)).toEqual({ draft: body, etag: '"0"' });
    expect(createPersistedCasefileDetail()).not.toBe(body);
  });
  it('resolves the supported raw result definition', () => {
    expect(mapOrderTermParameters(PERSISTED_CASEFILE_RESULT_DETAIL.result_parameters)).toEqual(
      PERSISTED_CASEFILE_RESULT_PAGE.fields,
    );
  });
  it.each([null, '', '0', '"x"', 'W/"0"'])('rejects invalid version %s safely', (etag) => {
    expect(() => decodeDraftCasefileDetail(createPersistedCasefileDetail(), etag, 17)).toThrow(
      'Unusable draft casefile data',
    );
  });
  it.each([
    ['draft_casefile_id', 18],
    ['business_unit_id', 0],
    ['casefile_type', 'Unknown'],
    ['casefile_status', 'APPROVED'],
    ['created_date', '2026-02-30T09:00:00Z'],
    ['casefile_status_date', '2026-09-15T09:00:00+01:00'],
    ['casefile', null],
    ['casefile_snapshot', {}],
    ['timeline_data', []],
    ['validated_date', 'invalid'],
    ['validated_by', 123],
    ['status_message', false],
  ])('rejects malformed envelope %s', (key, value) => {
    const body = { ...createPersistedCasefileDetail(), [key]: value };
    expect(() => decodeDraftCasefileDetail(body, '"1"', 17)).toThrow('Unusable draft casefile data');
  });
  it.each([
    ['respondent_account', null],
    ['applicant', []],
    ['respondent_account.business_unit_id', 45],
    ['respondent_account.casefile_type', 'REMO Out'],
    ['respondent_account.respondent', null],
    ['respondent_account.order_details', null],
    ['respondent_account.order_details.order_terms', []],
    ['respondent_account.respondent.party_details.address.address_line_1', ' '],
    ['respondent_account.respondent.party_details.address.cjs_code', 1.5],
    ['applicant.bank_account_details.bank_account_type', 'Unknown'],
    ['applicant.party_details.organisation', 'false'],
    ['respondent_account.order_details.date_ordered', '2026-02-30'],
    ['respondent_account.order_details.payment_period', 'Daily'],
    ['respondent_account.order_details.order_terms.0.creditor_type', 'Unknown'],
    ['respondent_account.order_details.order_terms.0.result_responses.0.response', 100],
  ])('rejects malformed business field %s', (path, value) => {
    const body = createPersistedCasefileDetail();
    let current: Record<string, unknown> = body.casefile as unknown as Record<string, unknown>;
    const parts = path.split('.');
    for (const part of parts.slice(0, -1)) current = current[part] as Record<string, unknown>;
    current[parts[parts.length - 1]] = value;
    expect(() => decodeDraftCasefileDetail(body, '"1"', 17)).toThrow('Unusable draft casefile data');
  });
  it('rejects unknown timeline display status', () => {
    const body = createPersistedCasefileDetail();
    expect(() =>
      decodeDraftCasefileDetail(
        { ...body, timeline_data: [{ ...body.timeline_data[0], status: 'SUBMITTED' }] },
        '"1"',
        17,
      ),
    ).toThrow('Unusable draft casefile data');
  });
  it('preserves complete optional party, bank, employer, minor, server and generated identity data', () => {
    const body = createPersistedCasefileDetail();
    const respondent = body.casefile.respondent_account.respondent;
    respondent.party_details.individual_details = {
      title: 'Mx',
      forenames: 'Synthetic',
      surname: 'Respondent',
      date_of_birth: '1990-01-01',
      national_insurance_number: 'SYNTHETIC',
      other_personal_information: 'Synthetic information',
      restrict_personal_information: true,
      restriction_reason: 'Synthetic reason',
    };
    respondent.party_details.contact_details = { primary_email_address: 'synthetic@example.test' };
    respondent.party_details.aliases = [{ sequence_number: 1, forenames: 'Synthetic', surname: 'Alias' }];
    respondent.third_party_details = {
      name: 'Synthetic contact',
      relationship: 'Representative',
      reference: 'TEST',
      address: {
        address_line_1: '3 Test Street',
        address_line_2: 'Synthetic locality',
        postcode: 'TEST',
        cjs_code: 101,
      },
    };
    respondent.debtor_details = {
      employer_name: 'Synthetic Employer',
      employee_reference: 'TEST',
      employer_address: { address_line_1: '4 Test Street', cjs_code: 101 },
    };
    body.casefile.applicant.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Synthetic Organisation', foreign_authority_reference: 'TEST' },
      address: { address_line_1: '2 Test Street', cjs_code: 102 },
    };
    body.casefile.applicant.bank_account_details = {
      bank_account_type: 'UK Bank',
      uk_bank_details: {
        account_name: 'Synthetic account',
        sort_code: '000000',
        account_number: '00000000',
        payment_reference: 'TEST',
      },
    };
    body.casefile.minor_creditors = [
      {
        creditor_sequence: 1,
        party_details: {
          organisation: false,
          individual_details: { surname: 'Synthetic Minor' },
          address: { address_line_1: '5 Test Street', cjs_code: 101 },
        },
        bank_account_details: {
          bank_account_type: 'Non-UK Bank',
          non_uk_bank_details: {
            account_name: 'Synthetic minor',
            payment_reference: 'TEST',
            iban: 'SYNTHETIC',
            bank_name: 'Synthetic bank',
          },
        },
      },
    ];
    body.casefile.respondent_account.notes = { note_text: 'Synthetic note' };
    body.casefile.respondent_account.order_details.order_terms = [
      { result_id: 'TEST01', creditor_type: 'Minor Creditor', minor_creditor_sequence: 1, result_responses: [] },
      { result_id: 'TEST02', creditor_type: 'Major Creditor', major_creditor_code: 'TEST', result_responses: [] },
    ];
    body.casefile_snapshot.respondent_account.account_id = 100;
    body.casefile_snapshot.respondent_account.account_number = 'SYNTHETIC';
    body.casefile_snapshot.minor_creditor_accounts = [
      { creditor_sequence: 1, account_id: 101, account_number: 'SYNTHETIC', name: 'Synthetic Minor' },
    ];
    body.validated_date = '2026-09-15T09:00:00.123Z';
    body.validated_by = 'SYNTHETIC';
    body.timeline_data[0].reason_text = 'Synthetic reason';
    expect(decodeDraftCasefileDetail(body, '"123"', 17)).toEqual({ draft: body, etag: '"123"' });
  });
  it('supports a minor organisation without an applicant-only foreign reference', () => {
    const body = createPersistedCasefileDetail();
    body.casefile.minor_creditors = [
      {
        creditor_sequence: 1,
        party_details: {
          organisation: true,
          organisation_details: { organisation_name: 'Synthetic minor organisation' },
          address: { address_line_1: '5 Test Street', cjs_code: 101 },
        },
        bank_account_details: { bank_account_type: 'None or not applicable' },
      },
    ];
    expect(decodeDraftCasefileDetail(body, '"1"', 17).draft).toBe(body);
  });
  it('accepts absent optional server fields without adding values', () => {
    const body = createPersistedCasefileDetail();
    delete body.validated_date;
    delete body.validated_by;
    delete body.validated_by_name;
    delete body.status_message;
    expect(decodeDraftCasefileDetail(body, '"1"', 17).draft).toBe(body);
  });
  it.each([null, [], 'Synthetic secret body'])('rejects non-object body safely', (body) => {
    expect(() => decodeDraftCasefileDetail(body, '"1"', 17)).toThrow(new Error('Unusable draft casefile data'));
  });
  it.each([
    ['casefile.respondent_account.respondent.party_details.individual_details.surname', ''],
    ['casefile.respondent_account.respondent.party_details.individual_details.date_of_birth', '2026-02-30'],
    ['casefile.respondent_account.respondent.party_details.individual_details.restrict_personal_information', 'false'],
    ['casefile.respondent_account.respondent.party_details.contact_details', null],
    [
      'casefile.respondent_account.respondent.party_details.aliases',
      [{ sequence_number: 0, forenames: '', surname: '' }],
    ],
    ['casefile.respondent_account.respondent.party_details.address.postcode', null],
    ['casefile.respondent_account.respondent.third_party_details', {}],
    ['casefile.respondent_account.respondent.debtor_details', {}],
    ['casefile.respondent_account.notes', {}],
    [
      'casefile.applicant.party_details',
      {
        organisation: true,
        organisation_details: { organisation_name: 'Synthetic' },
        address: { address_line_1: 'Test', cjs_code: 101 },
      },
    ],
    ['casefile.applicant.bank_account_details', { bank_account_type: 'UK Bank', uk_bank_details: {} }],
    ['casefile.applicant.bank_account_details', { bank_account_type: 'Non-UK Bank', non_uk_bank_details: {} }],
    ['casefile.applicant.bank_account_details', { bank_account_type: 'None or not applicable', uk_bank_details: {} }],
    ['casefile.minor_creditors', [{ creditor_sequence: 0 }]],
    ['casefile.respondent_account.order_details.interest_flag', 'false'],
    ['casefile.respondent_account.order_details.indexation', 'Unknown'],
    ['casefile.respondent_account.order_details.payment_arrangement', 'Unknown'],
    [
      'casefile.respondent_account.order_details.order_terms.0',
      { result_id: 'TEST', creditor_type: 'Minor Creditor', result_responses: [] },
    ],
    [
      'casefile.respondent_account.order_details.order_terms.0',
      { result_id: 'TEST', creditor_type: 'Major Creditor', result_responses: [] },
    ],
    ['casefile.respondent_account.order_details.order_terms.0.minor_creditor_sequence', 1],
    ['casefile.respondent_account.order_details.order_terms.0.major_creditor_code', 'TEST'],
    ['casefile_snapshot.respondent_account.account_id', undefined],
    ['casefile_snapshot.applicant_account.account_number', 123],
    ['casefile_snapshot.minor_creditor_accounts', [{ creditor_sequence: 0 }]],
    ['timeline_data.0.username', null],
    ['timeline_data.0.status_date', '2026-02-30T09:00:00Z'],
    ['timeline_data.0.reason_text', null],
  ])('rejects unusable optional/branch field %s with a constant error', (path, value) => {
    const body = createPersistedCasefileDetail();
    let current: Record<string, unknown> = body as unknown as Record<string, unknown>;
    const parts = path.split('.');
    for (const part of parts.slice(0, -1)) current = current[part] as Record<string, unknown>;
    current[parts[parts.length - 1]] = value;
    expect(() => decodeDraftCasefileDetail(body, '"1"', 17)).toThrow(new Error('Unusable draft casefile data'));
  });
});
