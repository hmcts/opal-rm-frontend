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

  const expectedApplicantIndividualFieldErrorEntries = [
    [
      'create_casefile_applicant_individual_title',
      { maxlength: { message: 'Title must be 20 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_first_names',
      {
        required: { message: 'Enter applicant’s first name(s)', priority: 1 },
        maxlength: { message: 'First name(s) must be 50 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_last_name',
      {
        required: { message: 'Enter applicant’s last name', priority: 1 },
        maxlength: { message: 'Last name must be 50 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_first_names_0',
      {
        required: { message: 'Enter alias first name(s)', priority: 1 },
        maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_last_name_0',
      {
        required: { message: 'Enter alias last name', priority: 1 },
        maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_first_names_1',
      {
        required: { message: 'Enter alias first name(s)', priority: 1 },
        maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_last_name_1',
      {
        required: { message: 'Enter alias last name', priority: 1 },
        maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_first_names_2',
      {
        required: { message: 'Enter alias first name(s)', priority: 1 },
        maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_last_name_2',
      {
        required: { message: 'Enter alias last name', priority: 1 },
        maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_first_names_3',
      {
        required: { message: 'Enter alias first name(s)', priority: 1 },
        maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_last_name_3',
      {
        required: { message: 'Enter alias last name', priority: 1 },
        maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_first_names_4',
      {
        required: { message: 'Enter alias first name(s)', priority: 1 },
        maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_alias_last_name_4',
      {
        required: { message: 'Enter alias last name', priority: 1 },
        maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_date_of_birth',
      {
        invalidDateFormat: { message: 'Enter date of birth in the format DD/MM/YYYY', priority: 2 },
        invalidDate: { message: 'Enter a valid date of birth', priority: 2 },
        invalidDateOfBirth: { message: 'Date must be in the past', priority: 2 },
      },
    ],
    [
      'create_casefile_applicant_individual_main_email_address',
      {
        emailPattern: { message: 'Enter an email address in the correct format, like name@example.com', priority: 2 },
        maxlength: { message: 'Main email address must be 76 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_other_email_address',
      {
        emailPattern: { message: 'Enter an email address in the correct format, like name@example.com', priority: 2 },
        maxlength: { message: 'Other email address must be 76 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_main_telephone_number',
      { maxlength: { message: 'Main telephone number must be 35 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_other_telephone_number',
      { maxlength: { message: 'Other telephone number must be 35 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_address_line_1',
      {
        required: { message: 'Enter an address', priority: 1 },
        maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_address_line_2',
      { maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_address_line_3',
      { maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_address_line_4',
      { maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_address_line_5',
      { maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_postal_or_zip_code',
      { maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 } },
    ],
    ['create_casefile_applicant_individual_country_id', { required: { message: 'Select a country', priority: 1 } }],
    [
      'create_casefile_applicant_individual_third_party_name_or_organisation',
      {
        required: { message: 'Enter name or organisation', priority: 1 },
        maxlength: { message: 'Name or organisation must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_third_party_relationship',
      {
        required: { message: 'Enter relationship to the applicant', priority: 1 },
        maxlength: { message: 'Relationship to the applicant must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_third_party_reference',
      { maxlength: { message: 'Reference must be 40 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_address_line_1',
      {
        required: { message: 'Enter an address', priority: 1 },
        maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_third_party_address_line_2',
      { maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_address_line_3',
      { maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_address_line_4',
      { maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_address_line_5',
      { maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_postal_or_zip_code',
      { maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_third_party_country_id',
      { required: { message: 'Select a country', priority: 1 } },
    ],
    ['create_casefile_applicant_individual_bank_type', { required: { message: 'Select an option', priority: 1 } }],
    [
      'create_casefile_applicant_individual_uk_bank_name_on_account',
      { required: { message: 'Enter name on account', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_uk_bank_sort_code',
      {
        required: { message: 'Enter sort code', priority: 1 },
        ukSortCodePattern: { message: 'Enter correct sort code', priority: 2 },
        ukSortCodeLength: { message: 'Sort code must only contain 6 numbers', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_uk_bank_account_number',
      {
        required: { message: 'Enter account number', priority: 1 },
        ukAccountNumberPattern: { message: 'Account number must only contain numbers', priority: 2 },
        ukAccountNumberLength: { message: 'Account number must be between 6 and 8 numbers', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_uk_bank_payment_reference',
      { required: { message: 'Enter UK bank account payment reference', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_non_uk_bank_name_on_account',
      { required: { message: 'Enter name on account', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_non_uk_bank_account_number',
      { maxlength: { message: 'Account number must be 20 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_individual_non_uk_bank_bic_swift_code',
      {
        internationalIdentifierRequired: { message: 'Enter either BIC or SWIFT code or IBAN number', priority: 2 },
        internationalIdentifierPattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 },
      },
    ],
    [
      'create_casefile_applicant_individual_non_uk_bank_iban',
      { internationalIdentifierPattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 } },
    ],
    [
      'create_casefile_applicant_individual_non_uk_bank_branch_sort_code',
      {
        branchSortCodePattern: { message: 'Enter correct branch or sort code', priority: 2 },
        branchSortCodeLength: { message: 'Branch or sort code must be 12 numbers or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_individual_restricted_information_reason',
      {
        required: { message: 'Enter a reason', priority: 1 },
        maxlength: { message: 'Reason must be 250 characters or fewer', priority: 3 },
      },
    ],
  ];

  const expectedApplicantOrganisationFieldErrorEntries = [
    [
      'create_casefile_applicant_organisation_name',
      {
        required: { message: 'Enter organisation name', priority: 1 },
        maxlength: { message: 'Organisation name must be 80 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_foreign_authority_reference',
      {
        required: { message: 'Enter a foreign authority reference number', priority: 1 },
        maxlength: { message: 'Foreign authority reference must be 40 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_main_email_address',
      {
        emailPattern: { message: 'Enter an email address in the correct format, like name@example.com', priority: 2 },
        maxlength: { message: 'Main email address must be 76 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_other_email_address',
      {
        emailPattern: { message: 'Enter an email address in the correct format, like name@example.com', priority: 2 },
        maxlength: { message: 'Other email address must be 76 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_main_telephone_number',
      { maxlength: { message: 'Main telephone number must be 35 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_other_telephone_number',
      { maxlength: { message: 'Other telephone number must be 35 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_address_line_1',
      {
        required: { message: 'Enter an address', priority: 1 },
        maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_address_line_2',
      { maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_address_line_3',
      { maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_address_line_4',
      { maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_address_line_5',
      { maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_postal_or_zip_code',
      { maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 } },
    ],
    ['create_casefile_applicant_organisation_country_id', { required: { message: 'Select a country', priority: 1 } }],
    ['create_casefile_applicant_organisation_bank_type', { required: { message: 'Select an option', priority: 1 } }],
    [
      'create_casefile_applicant_organisation_uk_bank_name_on_account',
      { required: { message: 'Enter name on account', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_uk_bank_sort_code',
      {
        required: { message: 'Enter sort code', priority: 1 },
        ukSortCodePattern: { message: 'Enter correct sort code', priority: 2 },
        ukSortCodeLength: { message: 'Sort code must only contain 6 numbers', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_uk_bank_account_number',
      {
        required: { message: 'Enter account number', priority: 1 },
        ukAccountNumberPattern: { message: 'Account number must only contain numbers', priority: 2 },
        ukAccountNumberLength: { message: 'Account number must be between 6 and 8 numbers', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_uk_bank_payment_reference',
      { required: { message: 'Enter UK bank account payment reference', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_non_uk_bank_name_on_account',
      { required: { message: 'Enter name on account', priority: 1 } },
    ],
    [
      'create_casefile_applicant_organisation_non_uk_bank_bic_swift_code',
      {
        internationalIdentifierRequired: { message: 'Enter either BIC or SWIFT code or IBAN number', priority: 2 },
        internationalIdentifierPattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 },
      },
    ],
    [
      'create_casefile_applicant_organisation_non_uk_bank_iban',
      { internationalIdentifierPattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 } },
    ],
    ['create_casefile_applicant_organisation_non_uk_bank_payment_reference', {}],
    ['create_casefile_applicant_organisation_non_uk_bank_name', {}],
    [
      'create_casefile_applicant_organisation_non_uk_bank_branch_sort_code',
      {
        branchSortCodePattern: { message: 'Enter correct branch or sort code', priority: 2 },
        branchSortCodeLength: { message: 'Branch or sort code must be 12 numbers or fewer', priority: 3 },
      },
    ],
    [
      'create_casefile_applicant_organisation_non_uk_bank_account_number',
      { maxlength: { message: 'Account number must be 20 characters or fewer', priority: 1 } },
    ],
  ];

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

  it('preserves the Individual Applicant field-error order and complete baseline shape', () => {
    expect(Object.entries(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS)).toEqual(
      expectedApplicantIndividualFieldErrorEntries,
    );
  });

  it('preserves the Organisation Applicant field-error order and complete baseline shape', () => {
    expect(Object.entries(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS)).toEqual(
      expectedApplicantOrganisationFieldErrorEntries,
    );
  });
});
