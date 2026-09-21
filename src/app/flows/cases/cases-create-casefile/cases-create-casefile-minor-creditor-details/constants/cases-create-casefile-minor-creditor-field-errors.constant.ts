import type { IAbstractFormBaseFieldErrors } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from './cases-create-casefile-minor-creditor-field-names.constant';

const error = (message: string, priority: number) => ({ message, priority });

export const CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS: IAbstractFormBaseFieldErrors = {
  [F.creditorType]: {
    required: error('Select minor creditor type', 1),
    invalidSelection: error('Select minor creditor type', 2),
  },
  [F.title]: { maxlength: error('Title must be 20 characters or fewer', 3) },
  [F.firstNames]: {
    required: error('Enter minor creditor first name(s)', 1),
    maxlength: error('First names must be 40 characters or fewer', 3),
  },
  [F.lastName]: {
    required: error('Enter minor creditor last name', 1),
    maxlength: error('Last name must be 40 characters or fewer', 3),
  },
  [F.organisationName]: {
    required: error('Enter minor creditor organisation name', 1),
    maxlength: error('Organisation name must be 40 characters or fewer', 3),
  },
  [F.addressLine1]: {
    required: error('Enter an address', 1),
    maxlength: error('Address line 1 must be 40 characters or fewer', 3),
  },
  [F.addressLine2]: { maxlength: error('Address line 2 must be 30 characters or fewer', 3) },
  [F.addressLine3]: { maxlength: error('Address line 3 must be 30 characters or fewer', 3) },
  [F.addressLine4]: { maxlength: error('Address line 4 must be 30 characters or fewer', 3) },
  [F.addressLine5]: { maxlength: error('Address line 5 must be 30 characters or fewer', 3) },
  [F.postalOrZipCode]: { maxlength: error('Postal or zip code must be 10 characters or fewer', 3) },
  [F.countryId]: { required: error('Select a country', 1) },
  [F.bankType]: {
    required: error('Select an option', 1),
    invalidSelection: error('Select an option', 2),
  },
  [F.ukNameOnAccount]: {
    required: error('Enter name on account', 1),
    maxlength: error('Name on account must be 18 characters or fewer', 3),
  },
  [F.ukSortCode]: {
    required: error('Enter sort code', 1),
    sortCodeFormat: error('Enter correct sort code', 2),
    sortCodeLength: error('Sort code must only contain 6 numbers', 3),
  },
  [F.ukAccountNumber]: {
    required: error('Enter account number', 1),
    pattern: error('Account number must contain 6 to 8 numbers', 2),
  },
  [F.ukPaymentReference]: {
    required: error('Enter UK bank account payment reference', 1),
    maxlength: error('Payment reference must be 18 characters or fewer', 3),
  },
  [F.nonUkNameOnAccount]: {
    required: error('Enter name on account', 1),
    maxlength: error('Name on account must be 18 characters or fewer', 3),
  },
  [F.nonUkAccountNumber]: {
    pattern: error('Account number must contain 20 numbers or fewer', 2),
    maxlength: error('Account number must contain 20 numbers or fewer', 3),
  },
  [F.nonUkPaymentReference]: {
    required: error('Enter non-UK bank account payment reference', 1),
    maxlength: error('Payment reference must be 18 characters or fewer', 3),
  },
  [F.nonUkBicSwiftCode]: {
    pattern: error('Enter correct BIC or SWIFT code or IBAN number', 2),
  },
  [F.nonUkIban]: {
    pattern: error('Enter correct BIC or SWIFT code or IBAN number', 2),
  },
  [F.nonUkBankName]: {},
  [F.nonUkBranchSortCode]: {
    pattern: error('Enter correct branch or sort code', 2),
    maxlength: error('Branch or sort code must be 12 numbers or fewer', 3),
  },
};
