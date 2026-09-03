import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../utils/cases-create-casefile-field-errors';

export const CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS = {
  contactAndAddress: {
    mainEmailAddress: {
      emailPattern: createCasesCreateCasefileError(
        'Enter an email address in the correct format, like name@example.com',
        2,
      ),
      ...createCasesCreateCasefileMaxLengthError('Main email address', 76, 3),
    },
    otherEmailAddress: {
      emailPattern: createCasesCreateCasefileError(
        'Enter an email address in the correct format, like name@example.com',
        2,
      ),
      ...createCasesCreateCasefileMaxLengthError('Other email address', 76, 3),
    },
    mainTelephoneNumber: createCasesCreateCasefileMaxLengthError('Main telephone number', 35, 1),
    otherTelephoneNumber: createCasesCreateCasefileMaxLengthError('Other telephone number', 35, 1),
    addressLine1: {
      required: createCasesCreateCasefileError('Enter an address', 1),
      ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 3),
    },
    addressLine2: createCasesCreateCasefileMaxLengthError('Address line 2', 30, 1),
    addressLine3: createCasesCreateCasefileMaxLengthError('Address line 3', 30, 1),
    addressLine4: createCasesCreateCasefileMaxLengthError('Address line 4', 30, 1),
    addressLine5: createCasesCreateCasefileMaxLengthError('Address line 5', 30, 1),
    postalOrZipCode: createCasesCreateCasefileMaxLengthError('Postal or zip code', 10, 1),
    countryId: {
      required: createCasesCreateCasefileError('Select a country', 1),
    },
  },
  bank: {
    bankType: {
      required: createCasesCreateCasefileError('Select an option', 1),
    },
    ukBankNameOnAccount: {
      required: createCasesCreateCasefileError('Enter name on account', 1),
    },
    ukBankSortCode: {
      required: createCasesCreateCasefileError('Enter sort code', 1),
      ukSortCodePattern: createCasesCreateCasefileError('Enter correct sort code', 2),
      ukSortCodeLength: createCasesCreateCasefileError('Sort code must only contain 6 numbers', 3),
    },
    ukBankAccountNumber: {
      required: createCasesCreateCasefileError('Enter account number', 1),
      ukAccountNumberPattern: createCasesCreateCasefileError('Account number must only contain numbers', 2),
      ukAccountNumberLength: createCasesCreateCasefileError('Account number must be between 6 and 8 numbers', 3),
    },
    ukBankPaymentReference: {
      required: createCasesCreateCasefileError('Enter UK bank account payment reference', 1),
    },
    nonUkBankNameOnAccount: {
      required: createCasesCreateCasefileError('Enter name on account', 1),
    },
    nonUkBankAccountNumber: createCasesCreateCasefileMaxLengthError('Account number', 20, 1),
    nonUkBankBicSwiftCode: {
      internationalIdentifierRequired: createCasesCreateCasefileError(
        'Enter either BIC or SWIFT code or IBAN number',
        2,
      ),
      internationalIdentifierPattern: createCasesCreateCasefileError(
        'Enter correct BIC or SWIFT code or IBAN number',
        2,
      ),
    },
    nonUkBankIban: {
      internationalIdentifierPattern: createCasesCreateCasefileError(
        'Enter correct BIC or SWIFT code or IBAN number',
        2,
      ),
    },
    nonUkBankBranchSortCode: {
      branchSortCodePattern: createCasesCreateCasefileError('Enter correct branch or sort code', 2),
      branchSortCodeLength: createCasesCreateCasefileError('Branch or sort code must be 12 numbers or fewer', 3),
    },
  },
} as const;
