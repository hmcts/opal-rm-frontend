import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../utils/cases-create-casefile-field-errors';

export const CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS = {
  contactAndAddress: {
    applicant_main_email_address: {
      emailPattern: createCasesCreateCasefileError(
        'Enter an email address in the correct format, like name@example.com',
        2,
      ),
      ...createCasesCreateCasefileMaxLengthError('Main email address', 76, 3),
    },
    applicant_other_email_address: {
      emailPattern: createCasesCreateCasefileError(
        'Enter an email address in the correct format, like name@example.com',
        2,
      ),
      ...createCasesCreateCasefileMaxLengthError('Other email address', 76, 3),
    },
    applicant_main_telephone_number: createCasesCreateCasefileMaxLengthError('Main telephone number', 35, 1),
    applicant_other_telephone_number: createCasesCreateCasefileMaxLengthError('Other telephone number', 35, 1),
    applicant_address_line_1: {
      required: createCasesCreateCasefileError('Enter an address', 1),
      ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 3),
    },
    applicant_address_line_2: createCasesCreateCasefileMaxLengthError('Address line 2', 30, 1),
    applicant_address_line_3: createCasesCreateCasefileMaxLengthError('Address line 3', 30, 1),
    applicant_address_line_4: createCasesCreateCasefileMaxLengthError('Address line 4', 30, 1),
    applicant_address_line_5: createCasesCreateCasefileMaxLengthError('Address line 5', 30, 1),
    applicant_postal_or_zip_code: createCasesCreateCasefileMaxLengthError('Postal or zip code', 10, 1),
    applicant_country_id: {
      required: createCasesCreateCasefileError('Select a country', 1),
    },
  },
  bank: {
    applicant_bank_type: {
      required: createCasesCreateCasefileError('Select an option', 1),
    },
    applicant_uk_bank_name_on_account: {
      required: createCasesCreateCasefileError('Enter name on account', 1),
    },
    applicant_uk_bank_sort_code: {
      required: createCasesCreateCasefileError('Enter sort code', 1),
      ukSortCodePattern: createCasesCreateCasefileError('Enter correct sort code', 2),
      ukSortCodeLength: createCasesCreateCasefileError('Sort code must only contain 6 numbers', 3),
    },
    applicant_uk_bank_account_number: {
      required: createCasesCreateCasefileError('Enter account number', 1),
      ukAccountNumberPattern: createCasesCreateCasefileError('Account number must only contain numbers', 2),
      ukAccountNumberLength: createCasesCreateCasefileError('Account number must be between 6 and 8 numbers', 3),
    },
    applicant_uk_bank_payment_reference: {
      required: createCasesCreateCasefileError('Enter UK bank account payment reference', 1),
    },
    applicant_non_uk_bank_name_on_account: {
      required: createCasesCreateCasefileError('Enter name on account', 1),
    },
    applicant_non_uk_bank_account_number: createCasesCreateCasefileMaxLengthError('Account number', 20, 1),
    applicant_non_uk_bank_bic_swift_code: {
      internationalIdentifierRequired: createCasesCreateCasefileError(
        'Enter either BIC or SWIFT code or IBAN number',
        2,
      ),
      internationalIdentifierPattern: createCasesCreateCasefileError(
        'Enter correct BIC or SWIFT code or IBAN number',
        2,
      ),
    },
    applicant_non_uk_bank_iban: {
      internationalIdentifierPattern: createCasesCreateCasefileError(
        'Enter correct BIC or SWIFT code or IBAN number',
        2,
      ),
    },
    applicant_non_uk_bank_branch_sort_code: {
      branchSortCodePattern: createCasesCreateCasefileError('Enter correct branch or sort code', 2),
      branchSortCodeLength: createCasesCreateCasefileError('Branch or sort code must be 12 numbers or fewer', 3),
    },
  },
} as const;
