import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-organisation.interface';

export const SAVED_APPLICANT_ORGANISATION: ICasesCreateCasefileApplicantOrganisation = {
  organisationName: 'Test Organisation',
  foreignAuthorityReference: 'FA-9803',
  contactDetails: {
    mainEmailAddress: 'main@example.com',
    otherEmailAddress: 'other@example.com',
    mainTelephoneNumber: '01234567890',
    otherTelephoneNumber: '09876543210',
    address: {
      addressLine1: '1 Test Street',
      addressLine2: 'Test Area',
      addressLine3: 'Test District',
      addressLine4: 'Test Town',
      addressLine5: 'Test County',
      postalOrZipCode: 'TE1 1ST',
      countryId: 826,
    },
  },
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Organisation',
    sortCode: '112233',
    accountNumber: '12345678',
    paymentReference: 'PAY-9803',
  },
};

export const VALID_UK_APPLICANT_ORGANISATION: ICasesCreateCasefileApplicantOrganisation = {
  organisationName: 'Test Organisation',
  foreignAuthorityReference: 'FA-9803',
  contactDetails: {
    mainEmailAddress: null,
    otherEmailAddress: null,
    mainTelephoneNumber: null,
    otherTelephoneNumber: null,
    address: {
      addressLine1: '1 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 826,
    },
  },
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Organisation',
    sortCode: '112233',
    accountNumber: '12345678',
    paymentReference: 'PAY-9803',
  },
};

export const VALID_NON_UK_BIC_APPLICANT_ORGANISATION: ICasesCreateCasefileApplicantOrganisation = {
  ...VALID_UK_APPLICANT_ORGANISATION,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
    nameOnAccount: 'Test Organisation',
    accountNumber: 'NONUK123',
    paymentReference: 'PAY-NONUK',
    bicSwiftCode: 'EXAMGB2L',
    iban: null,
    bankName: 'Test Bank',
    branchSortCode: '123456',
  },
};

export const VALID_NON_UK_IBAN_APPLICANT_ORGANISATION: ICasesCreateCasefileApplicantOrganisation = {
  ...VALID_UK_APPLICANT_ORGANISATION,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
    nameOnAccount: 'Test Organisation',
    accountNumber: null,
    paymentReference: null,
    bicSwiftCode: null,
    iban: 'GB29NWBK60161331926819',
    bankName: null,
    branchSortCode: null,
  },
};

export const VALID_NONE_APPLICANT_ORGANISATION: ICasesCreateCasefileApplicantOrganisation = {
  ...VALID_UK_APPLICANT_ORGANISATION,
  bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
};
