import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
import { CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS } from '../../constants/cases-create-casefile-applicant-field-errors.constant';
import type { ICasesCreateCasefileApplicantOrganisationFieldErrors } from '../interfaces/cases-create-casefile-applicant-organisation-field-errors.interface';

export const CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS: ICasesCreateCasefileApplicantOrganisationFieldErrors =
  {
    applicant_organisation_name: {
      required: createCasesCreateCasefileError('Enter organisation name', 1),
      ...createCasesCreateCasefileMaxLengthError('Organisation name', 80, 3),
    },
    applicant_foreign_authority_reference: {
      required: createCasesCreateCasefileError('Enter a foreign authority reference number', 1),
      ...createCasesCreateCasefileMaxLengthError('Foreign authority reference', 40, 3),
    },
    ...CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress,
    applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_bank_type,
    applicant_uk_bank_name_on_account:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_uk_bank_name_on_account,
    applicant_uk_bank_sort_code: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_uk_bank_sort_code,
    applicant_uk_bank_account_number:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_uk_bank_account_number,
    applicant_uk_bank_payment_reference:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_uk_bank_payment_reference,
    applicant_non_uk_bank_name_on_account:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_non_uk_bank_name_on_account,
    applicant_non_uk_bank_bic_swift_code:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_non_uk_bank_bic_swift_code,
    applicant_non_uk_bank_iban: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_non_uk_bank_iban,
    applicant_non_uk_bank_payment_reference: {},
    applicant_non_uk_bank_name: {},
    applicant_non_uk_bank_branch_sort_code:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_non_uk_bank_branch_sort_code,
    applicant_non_uk_bank_account_number:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.applicant_non_uk_bank_account_number,
  };
