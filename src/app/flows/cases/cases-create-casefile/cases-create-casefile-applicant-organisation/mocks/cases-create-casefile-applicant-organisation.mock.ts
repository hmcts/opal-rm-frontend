import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from '../../interfaces/cases-create-casefile-applicant-organisation.interface';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';

const emptyFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  create_casefile_applicant_organisation_name: null,
  create_casefile_applicant_organisation_foreign_authority_reference: null,
  create_casefile_applicant_organisation_main_email_address: null,
  create_casefile_applicant_organisation_other_email_address: null,
  create_casefile_applicant_organisation_main_telephone_number: null,
  create_casefile_applicant_organisation_other_telephone_number: null,
  create_casefile_applicant_organisation_address_line_1: null,
  create_casefile_applicant_organisation_address_line_2: null,
  create_casefile_applicant_organisation_address_line_3: null,
  create_casefile_applicant_organisation_address_line_4: null,
  create_casefile_applicant_organisation_address_line_5: null,
  create_casefile_applicant_organisation_postal_or_zip_code: null,
  create_casefile_applicant_organisation_country_id: null,
  create_casefile_applicant_organisation_bank_type: null,
  create_casefile_applicant_organisation_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_uk_bank_sort_code: null,
  create_casefile_applicant_organisation_uk_bank_account_number: null,
  create_casefile_applicant_organisation_uk_bank_payment_reference: null,
  create_casefile_applicant_organisation_non_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: null,
  create_casefile_applicant_organisation_non_uk_bank_iban: null,
  create_casefile_applicant_organisation_non_uk_bank_payment_reference: null,
  create_casefile_applicant_organisation_non_uk_bank_name: null,
  create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: null,
  create_casefile_applicant_organisation_non_uk_bank_account_number: null,
};

const validUkFormData: ICasesCreateCasefileApplicantOrganisationFormData = {
  ...emptyFormData,
  create_casefile_applicant_organisation_name: 'Example Organisation',
  create_casefile_applicant_organisation_foreign_authority_reference: 'FA-9803',
  create_casefile_applicant_organisation_main_email_address: 'main@example.org',
  create_casefile_applicant_organisation_other_email_address: 'other@example.org',
  create_casefile_applicant_organisation_main_telephone_number: '020 7946 0100',
  create_casefile_applicant_organisation_other_telephone_number: '020 7946 0101',
  create_casefile_applicant_organisation_address_line_1: '1 Example Street',
  create_casefile_applicant_organisation_address_line_2: 'Example District',
  create_casefile_applicant_organisation_address_line_3: 'Example Town',
  create_casefile_applicant_organisation_address_line_4: 'Example County',
  create_casefile_applicant_organisation_address_line_5: 'Example Region',
  create_casefile_applicant_organisation_postal_or_zip_code: 'EX1 1MP',
  create_casefile_applicant_organisation_country_id: 826,
  create_casefile_applicant_organisation_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
  create_casefile_applicant_organisation_uk_bank_name_on_account: 'Example Organisation',
  create_casefile_applicant_organisation_uk_bank_sort_code: '112233',
  create_casefile_applicant_organisation_uk_bank_account_number: '12345678',
  create_casefile_applicant_organisation_uk_bank_payment_reference: 'PAY-9803',
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
  create_casefile_applicant_organisation_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
  create_casefile_applicant_organisation_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_uk_bank_sort_code: null,
  create_casefile_applicant_organisation_uk_bank_account_number: null,
  create_casefile_applicant_organisation_uk_bank_payment_reference: null,
  create_casefile_applicant_organisation_non_uk_bank_name_on_account: 'Example Organisation International',
  create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: 'EXAMGB2L',
  create_casefile_applicant_organisation_non_uk_bank_iban: 'GB29NWBK60161331926819',
  create_casefile_applicant_organisation_non_uk_bank_payment_reference: 'INTL-9803',
  create_casefile_applicant_organisation_non_uk_bank_name: 'Example International Bank',
  create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: 'EX-001',
  create_casefile_applicant_organisation_non_uk_bank_account_number: '87654321',
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
  create_casefile_applicant_organisation_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
  create_casefile_applicant_organisation_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_uk_bank_sort_code: null,
  create_casefile_applicant_organisation_uk_bank_account_number: null,
  create_casefile_applicant_organisation_uk_bank_payment_reference: null,
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
