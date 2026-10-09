import {
  MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  MINOR_CREDITOR_UK_MOCK,
  MINOR_CREDITOR_BIC_MOCK,
} from './minor-creditor.mock';

export const MINOR_CREDITOR_BRANCH_MOCKS = {
  individual: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  uk: MINOR_CREDITOR_UK_MOCK,
  nonUk: MINOR_CREDITOR_BIC_MOCK,
} as const;

export const MINOR_CREDITOR_REQUIRED_FIELDS = [
  { field: 'firstNames', branch: 'individual' },
  { field: 'lastName', branch: 'individual' },
  { field: 'organisationName', branch: 'uk' },
  { field: 'addressLine1', branch: 'uk' },
  { field: 'ukNameOnAccount', branch: 'uk' },
  { field: 'ukSortCode', branch: 'uk' },
  { field: 'ukAccountNumber', branch: 'uk' },
  { field: 'ukPaymentReference', branch: 'uk' },
  { field: 'nonUkNameOnAccount', branch: 'nonUk' },
  { field: 'nonUkPaymentReference', branch: 'nonUk' },
] as const;

export const MINOR_CREDITOR_LENGTH_BOUNDARIES = [
  { field: 'title', branch: 'individual', maximum: 20, character: 'A', storedPath: 'identity.title' },
  { field: 'firstNames', branch: 'individual', maximum: 40, character: 'A', storedPath: 'identity.firstNames' },
  { field: 'lastName', branch: 'individual', maximum: 40, character: 'A', storedPath: 'identity.lastName' },
  { field: 'organisationName', branch: 'uk', maximum: 40, character: 'A', storedPath: 'identity.organisationName' },
  { field: 'addressLine1', branch: 'uk', maximum: 40, character: 'A', storedPath: 'address.addressLine1' },
  { field: 'addressLine2', branch: 'uk', maximum: 30, character: 'A', storedPath: 'address.addressLine2' },
  { field: 'addressLine3', branch: 'uk', maximum: 30, character: 'A', storedPath: 'address.addressLine3' },
  { field: 'addressLine4', branch: 'uk', maximum: 30, character: 'A', storedPath: 'address.addressLine4' },
  { field: 'addressLine5', branch: 'uk', maximum: 30, character: 'A', storedPath: 'address.addressLine5' },
  { field: 'postalOrZipCode', branch: 'uk', maximum: 10, character: '1', storedPath: 'address.postalOrZipCode' },
  { field: 'ukNameOnAccount', branch: 'uk', maximum: 18, character: 'A', storedPath: 'bank.nameOnAccount' },
  { field: 'ukPaymentReference', branch: 'uk', maximum: 18, character: 'A', storedPath: 'bank.paymentReference' },
  { field: 'nonUkNameOnAccount', branch: 'nonUk', maximum: 18, character: 'A', storedPath: 'bank.nameOnAccount' },
  { field: 'nonUkPaymentReference', branch: 'nonUk', maximum: 18, character: 'A', storedPath: 'bank.paymentReference' },
  { field: 'nonUkAccountNumber', branch: 'nonUk', maximum: 20, character: '1', storedPath: 'bank.accountNumber' },
  { field: 'nonUkBranchSortCode', branch: 'nonUk', maximum: 12, character: '1', storedPath: 'bank.branchSortCode' },
] as const;

export const MINOR_CREDITOR_INVALID_FORMATS = [
  { field: 'ukSortCode', branch: 'uk', value: '00112', errorKey: 'sortCodeLength' },
  { field: 'ukSortCode', branch: 'uk', value: '0011223', errorKey: 'sortCodeLength' },
  { field: 'ukSortCode', branch: 'uk', value: '00AB22', errorKey: 'sortCodeFormat' },
  { field: 'ukSortCode', branch: 'uk', value: '0-01122', errorKey: 'sortCodeFormat' },
  { field: 'ukAccountNumber', branch: 'uk', value: '12345', errorKey: 'pattern' },
  { field: 'ukAccountNumber', branch: 'uk', value: '123456789', errorKey: 'pattern' },
  { field: 'ukAccountNumber', branch: 'uk', value: '12AB5678', errorKey: 'pattern' },
  { field: 'nonUkAccountNumber', branch: 'nonUk', value: 'ABC123', errorKey: 'pattern' },
  { field: 'nonUkBicSwiftCode', branch: 'nonUk', value: 'ABCDEFG', errorKey: 'pattern' },
  { field: 'nonUkBicSwiftCode', branch: 'nonUk', value: 'ABCDEFGHIJKL', errorKey: 'pattern' },
  { field: 'nonUkBicSwiftCode', branch: 'nonUk', value: 'ABCD!FGH', errorKey: 'pattern' },
  { field: 'nonUkIban', branch: 'nonUk', value: 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', errorKey: 'pattern' },
  { field: 'nonUkIban', branch: 'nonUk', value: 'GB!123', errorKey: 'pattern' },
  { field: 'nonUkBranchSortCode', branch: 'nonUk', value: '12AB34', errorKey: 'pattern' },
] as const;

export const MINOR_CREDITOR_VALID_FORMATS = [
  { field: 'ukAccountNumber', branch: 'uk', value: '001122', storedPath: 'bank.accountNumber' },
  { field: 'ukAccountNumber', branch: 'uk', value: '0011223', storedPath: 'bank.accountNumber' },
  { field: 'nonUkBicSwiftCode', branch: 'nonUk', value: 'ABCDEFGHIJK', storedPath: 'bank.bicSwiftCode' },
  { field: 'nonUkIban', branch: 'nonUk', value: 'GB00' + '1'.repeat(30), storedPath: 'bank.iban' },
] as const;
