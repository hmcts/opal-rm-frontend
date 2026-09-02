import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS } from '../cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS } from '../cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-errors.constant';
import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from './cases-create-casefile-field-errors';

describe('cases-create-casefile-field-errors', () => {
  const commonApplicantFields = [
    'applicant_main_email_address',
    'applicant_other_email_address',
    'applicant_main_telephone_number',
    'applicant_other_telephone_number',
    'applicant_address_line_1',
    'applicant_address_line_2',
    'applicant_address_line_3',
    'applicant_address_line_4',
    'applicant_address_line_5',
    'applicant_postal_or_zip_code',
    'applicant_country_id',
    'applicant_bank_type',
    'applicant_uk_bank_name_on_account',
    'applicant_uk_bank_sort_code',
    'applicant_uk_bank_account_number',
    'applicant_uk_bank_payment_reference',
    'applicant_non_uk_bank_name_on_account',
    'applicant_non_uk_bank_account_number',
    'applicant_non_uk_bank_bic_swift_code',
    'applicant_non_uk_bank_iban',
    'applicant_non_uk_bank_branch_sort_code',
  ] as const;

  it('creates an error with the supplied message and priority', () => {
    expect(createCasesCreateCasefileError('Enter an address', 1)).toEqual({
      message: 'Enter an address',
      priority: 1,
    });
  });

  it('creates a maxlength error with the standard message and supplied priority', () => {
    expect(createCasesCreateCasefileMaxLengthError('Address line 1', 30, 3)).toEqual({
      maxlength: {
        message: 'Address line 1 must be 30 characters or fewer',
        priority: 3,
      },
    });
  });

  it.each(commonApplicantFields)('shares the identical %s applicant field errors', (fieldName) => {
    expect(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS[fieldName]).toBe(
      CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS[fieldName],
    );
  });
});
