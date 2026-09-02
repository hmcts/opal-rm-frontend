import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from '../../interfaces/cases-create-casefile-applicant-organisation.interface';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';

const emptyFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  applicant_organisation_name: null,
  applicant_foreign_authority_reference: null,
  applicant_main_email_address: null,
  applicant_other_email_address: null,
  applicant_main_telephone_number: null,
  applicant_other_telephone_number: null,
  applicant_address_line_1: null,
  applicant_address_line_2: null,
  applicant_address_line_3: null,
  applicant_address_line_4: null,
  applicant_address_line_5: null,
  applicant_postal_or_zip_code: null,
  applicant_country_id: null,
  applicant_bank_type: null,
  applicant_uk_bank_name_on_account: null,
  applicant_uk_bank_sort_code: null,
  applicant_uk_bank_account_number: null,
  applicant_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name_on_account: null,
  applicant_non_uk_bank_bic_swift_code: null,
  applicant_non_uk_bank_iban: null,
  applicant_non_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name: null,
  applicant_non_uk_bank_branch_sort_code: null,
  applicant_non_uk_bank_account_number: null,
};

const validUkFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  ...emptyFormData,
  applicant_organisation_name: 'Example Organisation',
  applicant_foreign_authority_reference: 'FA-9803',
  applicant_main_email_address: 'main@example.org',
  applicant_other_email_address: 'other@example.org',
  applicant_main_telephone_number: '020 7946 0100',
  applicant_other_telephone_number: '020 7946 0101',
  applicant_address_line_1: '1 Example Street',
  applicant_address_line_2: 'Example District',
  applicant_address_line_3: 'Example Town',
  applicant_address_line_4: 'Example County',
  applicant_address_line_5: 'Example Region',
  applicant_postal_or_zip_code: 'EX1 1MP',
  applicant_country_id: 826,
  applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
  applicant_uk_bank_name_on_account: 'Example Organisation',
  applicant_uk_bank_sort_code: '112233',
  applicant_uk_bank_account_number: '12345678',
  applicant_uk_bank_payment_reference: 'PAY-9803',
};

const savedUk: ICasesCreateCasefileApplicantOrganisation = {
  organisationName: 'Example Organisation',
  foreignAuthorityReference: 'FA-9803',
  contactDetails: {
    mainEmailAddress: 'main@example.org',
    otherEmailAddress: 'other@example.org',
    mainTelephoneNumber: '020 7946 0100',
    otherTelephoneNumber: '020 7946 0101',
    address: {
      addressLine1: '1 Example Street',
      addressLine2: 'Example District',
      addressLine3: 'Example Town',
      addressLine4: 'Example County',
      addressLine5: 'Example Region',
      postalOrZipCode: 'EX1 1MP',
      countryId: 826,
    },
  },
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Example Organisation',
    sortCode: '112233',
    accountNumber: '12345678',
    paymentReference: 'PAY-9803',
  },
};

const validNonUkFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  ...validUkFormData,
  applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
  applicant_uk_bank_name_on_account: null,
  applicant_uk_bank_sort_code: null,
  applicant_uk_bank_account_number: null,
  applicant_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name_on_account: 'Example Organisation International',
  applicant_non_uk_bank_bic_swift_code: 'EXAMGB2L',
  applicant_non_uk_bank_iban: 'GB29NWBK60161331926819',
  applicant_non_uk_bank_payment_reference: 'INTL-9803',
  applicant_non_uk_bank_name: 'Example International Bank',
  applicant_non_uk_bank_branch_sort_code: 'EX-001',
  applicant_non_uk_bank_account_number: '87654321',
};

const savedNonUk: ICasesCreateCasefileApplicantOrganisation = {
  ...savedUk,
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
    nameOnAccount: 'Example Organisation International',
    bicSwiftCode: 'EXAMGB2L',
    iban: 'GB29NWBK60161331926819',
    paymentReference: 'INTL-9803',
    bankName: 'Example International Bank',
    branchSortCode: 'EX-001',
    accountNumber: '87654321',
  },
};

const validNoneFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  ...validUkFormData,
  applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
  applicant_uk_bank_name_on_account: null,
  applicant_uk_bank_sort_code: null,
  applicant_uk_bank_account_number: null,
  applicant_uk_bank_payment_reference: null,
};

const savedNone: ICasesCreateCasefileApplicantOrganisation = {
  ...savedUk,
  bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
};

export const CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS = {
  emptyFormData,
  validUkFormData,
  savedUk,
  validNonUkFormData,
  savedNonUk,
  validNoneFormData,
  savedNone,
};
