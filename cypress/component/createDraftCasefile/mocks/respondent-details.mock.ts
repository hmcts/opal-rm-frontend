import type { ICasesCreateCasefileRespondentDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-respondent-details.interface';

export const SAVED_RESPONDENT: ICasesCreateCasefileRespondentDetails = {
  title: 'Mx',
  firstNames: 'Test',
  lastName: 'Respondent',
  aliases: [
    { firstNames: 'Example', lastName: 'Alias' },
    { firstNames: 'Second', lastName: 'Alias' },
  ],
  dateOfBirth: '1990-01-31',
  nationalInsuranceNumber: 'QQ123456C',
  otherPersonalInformation: 'Synthetic test information',
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
  employer: {
    employerName: 'Test Employer',
    employeeReference: 'EMP-1',
    emailAddress: 'employer@example.com',
    telephoneNumber: '01111111111',
    address: {
      addressLine1: '3 Test Street',
      addressLine2: 'Employer Area',
      addressLine3: 'Employer District',
      addressLine4: 'Employer Town',
      addressLine5: 'Employer County',
      postalOrZipCode: 'EM3 3ST',
      countryId: 826,
    },
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Synthetic restricted-information reason',
  },
};

export const VALID_EXPANDED_RESPONDENT: ICasesCreateCasefileRespondentDetails = {
  title: null,
  firstNames: 'Test',
  lastName: 'Respondent',
  aliases: [{ firstNames: 'Example', lastName: 'Alias' }],
  dateOfBirth: null,
  nationalInsuranceNumber: null,
  otherPersonalInformation: null,
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
  thirdParty: {
    nameOrOrganisation: 'Test Support',
    relationship: 'Representative',
    reference: null,
    address: {
      addressLine1: '2 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 250,
    },
  },
  employer: {
    employerName: 'Test Employer',
    employeeReference: null,
    emailAddress: null,
    telephoneNumber: null,
    address: {
      addressLine1: '3 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 826,
    },
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Synthetic restricted-information reason',
  },
};

export const REQUIRED_RESPONDENT: ICasesCreateCasefileRespondentDetails = {
  ...VALID_EXPANDED_RESPONDENT,
  aliases: [],
  thirdParty: null,
  employer: null,
  restrictedInformation: { restricted: false, reason: null },
};
