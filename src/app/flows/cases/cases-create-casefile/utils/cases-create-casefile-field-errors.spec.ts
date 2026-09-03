import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS } from '../cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES } from '../cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS } from '../cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES } from '../cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-names.constant';
import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from './cases-create-casefile-field-errors';
import { CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS } from './cases-create-casefile-applicant-contact-address-field-errors';

describe('cases-create-casefile-field-errors', () => {
  const commonApplicantFields = [
    ...CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS,
    'bankType',
    'ukBankNameOnAccount',
    'ukBankSortCode',
    'ukBankAccountNumber',
    'ukBankPaymentReference',
    'nonUkBankNameOnAccount',
    'nonUkBankAccountNumber',
    'nonUkBankBicSwiftCode',
    'nonUkBankIban',
    'nonUkBankBranchSortCode',
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

  it.each(commonApplicantFields)('shares the identical %s applicant field errors', (fieldKey) => {
    const individualFieldName = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES[fieldKey];
    const organisationFieldName = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES[fieldKey];
    const individualErrors = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS[individualFieldName];
    const organisationErrors = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS[organisationFieldName];

    expect(individualErrors).toBeDefined();
    expect(organisationErrors).toBeDefined();
    expect(organisationErrors).toBe(individualErrors);
  });
});
