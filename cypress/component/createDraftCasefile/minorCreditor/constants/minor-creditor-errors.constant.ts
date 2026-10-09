export const MINOR_CREDITOR_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  creditorType: {
    required: 'Select minor creditor type',
    invalidSelection: 'Select minor creditor type',
  },
  title: { maxlength: 'Title must be 20 characters or fewer' },
  firstNames: {
    required: 'Enter minor creditor first name(s)',
    maxlength: 'First names must be 40 characters or fewer',
  },
  lastName: {
    required: 'Enter minor creditor last name',
    maxlength: 'Last name must be 40 characters or fewer',
  },
  organisationName: {
    required: 'Enter minor creditor organisation name',
    maxlength: 'Organisation name must be 40 characters or fewer',
  },
  addressLine1: {
    required: 'Enter an address',
    maxlength: 'Address line 1 must be 40 characters or fewer',
  },
  addressLine2: { maxlength: 'Address line 2 must be 30 characters or fewer' },
  addressLine3: { maxlength: 'Address line 3 must be 30 characters or fewer' },
  addressLine4: { maxlength: 'Address line 4 must be 30 characters or fewer' },
  addressLine5: { maxlength: 'Address line 5 must be 30 characters or fewer' },
  postalOrZipCode: { maxlength: 'Postal or zip code must be 10 characters or fewer' },
  countryId: { required: 'Select a country' },
  bankType: {
    required: 'Select an option',
    invalidSelection: 'Select an option',
  },
  ukNameOnAccount: {
    required: 'Enter name on account',
    maxlength: 'Name on account must be 18 characters or fewer',
  },
  ukSortCode: {
    required: 'Enter sort code',
    sortCodeFormat: 'Enter correct sort code',
    sortCodeLength: 'Sort code must only contain 6 numbers',
  },
  ukAccountNumber: {
    required: 'Enter account number',
    pattern: 'Account number must contain 6 to 8 numbers',
  },
  ukPaymentReference: {
    required: 'Enter UK bank account payment reference',
    maxlength: 'Payment reference must be 18 characters or fewer',
  },
  nonUkNameOnAccount: {
    required: 'Enter name on account',
    maxlength: 'Name on account must be 18 characters or fewer',
  },
  nonUkAccountNumber: {
    pattern: 'Account number must contain 20 numbers or fewer',
    maxlength: 'Account number must contain 20 numbers or fewer',
  },
  nonUkPaymentReference: {
    required: 'Enter non-UK bank account payment reference',
    maxlength: 'Payment reference must be 18 characters or fewer',
  },
  nonUkBicSwiftCode: {
    pattern: 'Enter correct BIC or SWIFT code or IBAN number',
  },
  nonUkIban: {
    pattern: 'Enter correct BIC or SWIFT code or IBAN number',
  },
  nonUkBankName: {},
  nonUkBranchSortCode: {
    pattern: 'Enter correct branch or sort code',
    maxlength: 'Branch or sort code must be 12 numbers or fewer',
  },
};
