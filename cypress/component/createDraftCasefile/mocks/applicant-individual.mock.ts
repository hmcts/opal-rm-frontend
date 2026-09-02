import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantIndividual } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-individual.interface';

export const SAVED_APPLICANT_INDIVIDUAL: ICasesCreateCasefileApplicantIndividual = {
  title: 'Mx',
  firstNames: 'Test',
  lastName: 'Applicant',
  aliases: [
    { firstNames: 'Example', lastName: 'Alias' },
    { firstNames: 'Second', lastName: 'Alias' },
  ],
  dateOfBirth: '1990-01-31',
  contactDetails: {
    mainEmailAddress: 'test@example.com',
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
  thirdParty: {
    nameOrOrganisation: 'Test Support',
    relationship: 'Representative',
    reference: 'REF-1',
    address: {
      addressLine1: '2 Test Street',
      addressLine2: 'Support Area',
      addressLine3: 'Support District',
      addressLine4: 'Support Town',
      addressLine5: 'Support County',
      postalOrZipCode: 'SU2 2ST',
      countryId: 250,
    },
  },
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Applicant',
    sortCode: '123456',
    accountNumber: '12345678',
    paymentReference: 'PAY-123',
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Synthetic restricted-information reason',
  },
};

export const VALID_UK_APPLICANT_INDIVIDUAL: ICasesCreateCasefileApplicantIndividual = {
  title: null,
  firstNames: 'Test',
  lastName: 'Applicant',
  aliases: [],
  dateOfBirth: null,
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
  thirdParty: null,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Applicant',
    sortCode: '112233',
    accountNumber: '12345678',
    paymentReference: 'PAY-123',
  },
  restrictedInformation: { restricted: false, reason: null },
};

export const VALID_NON_UK_BIC_APPLICANT_INDIVIDUAL: ICasesCreateCasefileApplicantIndividual = {
  ...VALID_UK_APPLICANT_INDIVIDUAL,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
    nameOnAccount: 'Test Applicant',
    accountNumber: 'NONUK123',
    paymentReference: 'PAY-NONUK',
    bicSwiftCode: 'ABCDEFGH',
    iban: null,
    bankName: 'Test Bank',
    branchSortCode: '123456',
  },
};

export const VALID_NON_UK_IBAN_APPLICANT_INDIVIDUAL: ICasesCreateCasefileApplicantIndividual = {
  ...VALID_UK_APPLICANT_INDIVIDUAL,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
    nameOnAccount: 'Test Applicant',
    accountNumber: null,
    paymentReference: null,
    bicSwiftCode: null,
    iban: 'GB82WEST12345698765432',
    bankName: null,
    branchSortCode: null,
  },
};
