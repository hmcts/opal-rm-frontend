import type { ICasesCreateCasefileMinorCreditorDetails } from '../../interfaces/cases-create-casefile-minor-creditor-details.interface';
import type { ICasesCreateCasefilePartyAddress } from '../../interfaces/cases-create-casefile-party-address.interface';
import type { CasesCreateCasefileMinorCreditorBank } from '../../types/cases-create-casefile-minor-creditor-bank.type';
import type { CasesCreateCasefileMinorCreditorIdentity } from '../../types/cases-create-casefile-minor-creditor-identity.type';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorFormData } from '../interfaces/cases-create-casefile-minor-creditor-form-data.interface';

const text = (value: string | null): string => (value ?? '').trim();
const optional = (value: string | null): string | null => text(value) || null;

export const toMinorCreditorDetails = (
  data: ICasesCreateCasefileMinorCreditorFormData,
): ICasesCreateCasefileMinorCreditorDetails => {
  const identity: CasesCreateCasefileMinorCreditorIdentity =
    data[F.creditorType] === 'individual'
      ? {
          type: 'individual',
          title: optional(data[F.title]),
          firstNames: text(data[F.firstNames]),
          lastName: text(data[F.lastName]),
        }
      : { type: 'organisation', organisationName: text(data[F.organisationName]) };
  const address: ICasesCreateCasefilePartyAddress = {
    addressLine1: text(data[F.addressLine1]),
    addressLine2: optional(data[F.addressLine2]),
    addressLine3: optional(data[F.addressLine3]),
    addressLine4: optional(data[F.addressLine4]),
    addressLine5: optional(data[F.addressLine5]),
    postalOrZipCode: optional(data[F.postalOrZipCode]),
    countryId: Number(data[F.countryId]),
  };
  const bank: CasesCreateCasefileMinorCreditorBank =
    data[F.bankType] === 'uk'
      ? {
          type: 'uk',
          nameOnAccount: text(data[F.ukNameOnAccount]),
          sortCode: text(data[F.ukSortCode]).replaceAll('-', ''),
          accountNumber: text(data[F.ukAccountNumber]),
          paymentReference: text(data[F.ukPaymentReference]),
        }
      : data[F.bankType] === 'non-uk'
        ? {
            type: 'non-uk',
            nameOnAccount: text(data[F.nonUkNameOnAccount]),
            accountNumber: optional(data[F.nonUkAccountNumber]),
            paymentReference: text(data[F.nonUkPaymentReference]),
            bicSwiftCode: optional(data[F.nonUkBicSwiftCode]),
            iban: optional(data[F.nonUkIban]),
            bankName: optional(data[F.nonUkBankName]),
            branchSortCode: optional(data[F.nonUkBranchSortCode]),
          }
        : { type: 'none' };
  return { identity, address, bank };
};

export const toMinorCreditorFormData = (
  details: ICasesCreateCasefileMinorCreditorDetails | null,
): ICasesCreateCasefileMinorCreditorFormData => {
  const data: ICasesCreateCasefileMinorCreditorFormData = {
    [F.creditorType]: null,
    [F.title]: null,
    [F.firstNames]: null,
    [F.lastName]: null,
    [F.organisationName]: null,
    [F.addressLine1]: null,
    [F.addressLine2]: null,
    [F.addressLine3]: null,
    [F.addressLine4]: null,
    [F.addressLine5]: null,
    [F.postalOrZipCode]: null,
    [F.countryId]: null,
    [F.bankType]: null,
    [F.ukNameOnAccount]: null,
    [F.ukSortCode]: null,
    [F.ukAccountNumber]: null,
    [F.ukPaymentReference]: null,
    [F.nonUkNameOnAccount]: null,
    [F.nonUkAccountNumber]: null,
    [F.nonUkPaymentReference]: null,
    [F.nonUkBicSwiftCode]: null,
    [F.nonUkIban]: null,
    [F.nonUkBankName]: null,
    [F.nonUkBranchSortCode]: null,
  };
  if (!details) return data;

  data[F.creditorType] = details.identity.type;
  if (details.identity.type === 'individual') {
    data[F.title] = details.identity.title;
    data[F.firstNames] = details.identity.firstNames;
    data[F.lastName] = details.identity.lastName;
  } else {
    data[F.organisationName] = details.identity.organisationName;
  }
  data[F.addressLine1] = details.address.addressLine1;
  data[F.addressLine2] = details.address.addressLine2;
  data[F.addressLine3] = details.address.addressLine3;
  data[F.addressLine4] = details.address.addressLine4;
  data[F.addressLine5] = details.address.addressLine5;
  data[F.postalOrZipCode] = details.address.postalOrZipCode;
  data[F.countryId] = details.address.countryId;
  data[F.bankType] = details.bank.type;
  if (details.bank.type === 'uk') {
    data[F.ukNameOnAccount] = details.bank.nameOnAccount;
    data[F.ukSortCode] = details.bank.sortCode;
    data[F.ukAccountNumber] = details.bank.accountNumber;
    data[F.ukPaymentReference] = details.bank.paymentReference;
  } else if (details.bank.type === 'non-uk') {
    data[F.nonUkNameOnAccount] = details.bank.nameOnAccount;
    data[F.nonUkAccountNumber] = details.bank.accountNumber;
    data[F.nonUkPaymentReference] = details.bank.paymentReference;
    data[F.nonUkBicSwiftCode] = details.bank.bicSwiftCode;
    data[F.nonUkIban] = details.bank.iban;
    data[F.nonUkBankName] = details.bank.bankName;
    data[F.nonUkBranchSortCode] = details.bank.branchSortCode;
  }
  return data;
};
