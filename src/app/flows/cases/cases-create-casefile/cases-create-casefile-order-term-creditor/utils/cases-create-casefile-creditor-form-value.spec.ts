import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileMinorCreditor } from '../../interfaces/cases-create-casefile-minor-creditor.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { creditorAssignment, creditorFormValue } from './cases-create-casefile-creditor-form-value';

const minor = (sequenceNumber: number, displayName: string): ICasesCreateCasefileMinorCreditor => ({
  sequenceNumber,
  displayName,
  details: {
    ...MINOR_CREDITOR_DETAILS_MOCK,
    identity: { type: 'organisation', organisationName: displayName },
  },
});
const minorCreditors = [minor(1, 'Duplicate name'), minor(2, 'Duplicate name')];
const majorCreditors = [
  {
    major_creditor_id: 901,
    business_unit_id: 44,
    major_creditor_code: 'MC901',
    name: 'Synthetic major creditor',
    address_line_1: '1 Test Street',
    address_line_2: null,
    address_line_3: null,
    address_line_4: null,
    address_line_5: null,
    postcode: null,
    country_id: null,
    country_name: null,
    contact_name: null,
    contact_email: null,
    active: true,
    central_authority: false,
  },
];

describe('creditor form mapping', () => {
  it('maps persisted branches and gives a pending new minor creditor precedence', () => {
    expect(creditorFormValue({ type: 'applicant' }, false)).toEqual({
      create_casefile_order_term_creditor_choice: 'applicant',
      create_casefile_order_term_creditor_major_creditor_id: null,
    });
    expect(creditorFormValue({ type: 'major', majorCreditorId: 901 }, false)).toEqual({
      create_casefile_order_term_creditor_choice: 'major',
      create_casefile_order_term_creditor_major_creditor_id: 901,
    });
    expect(creditorFormValue({ type: 'minor', sequenceNumber: 2 }, false)).toEqual({
      create_casefile_order_term_creditor_choice: 'minor:2',
      create_casefile_order_term_creditor_major_creditor_id: null,
    });
    expect(creditorFormValue({ type: 'major', majorCreditorId: 901 }, true)).toEqual({
      create_casefile_order_term_creditor_choice: 'add-new',
      create_casefile_order_term_creditor_major_creditor_id: null,
    });
  });

  it('maps only exact current applicant, major and minor selections', () => {
    expect(
      creditorAssignment(
        {
          create_casefile_order_term_creditor_choice: 'applicant',
          create_casefile_order_term_creditor_major_creditor_id: null,
        },
        minorCreditors,
        majorCreditors,
      ),
    ).toEqual({ type: 'applicant' });
    expect(
      creditorAssignment(
        {
          create_casefile_order_term_creditor_choice: 'major',
          create_casefile_order_term_creditor_major_creditor_id: '901',
        },
        minorCreditors,
        majorCreditors,
      ),
    ).toEqual({ type: 'major', majorCreditorId: 901 });
    expect(
      creditorAssignment(
        {
          create_casefile_order_term_creditor_choice: 'minor:2',
          create_casefile_order_term_creditor_major_creditor_id: null,
        },
        minorCreditors,
        majorCreditors,
      ),
    ).toEqual({ type: 'minor', sequenceNumber: 2 });
  });

  it.each([
    ['add-new', null, majorCreditors],
    [null, null, majorCreditors],
    ['minor:1abc', null, majorCreditors],
    ['minor:3', null, majorCreditors],
    ['major', 999, majorCreditors],
    ['major', 901, []],
  ] as const)('rejects an unavailable or invalid selection %s', (choice, majorCreditorId, records) => {
    expect(
      creditorAssignment(
        {
          create_casefile_order_term_creditor_choice: choice,
          create_casefile_order_term_creditor_major_creditor_id: majorCreditorId,
        },
        minorCreditors,
        records,
      ),
    ).toBeNull();
  });
});
