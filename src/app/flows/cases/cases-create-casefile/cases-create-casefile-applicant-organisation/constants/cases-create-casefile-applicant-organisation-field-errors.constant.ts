import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
import { createCasesCreateCasefileApplicantContactAddressFieldErrors } from '../../utils/cases-create-casefile-applicant-contact-address-field-errors';
import { CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS } from '../../constants/cases-create-casefile-applicant-field-errors.constant';
import type { ICasesCreateCasefileApplicantOrganisationFieldErrors } from '../interfaces/cases-create-casefile-applicant-organisation-field-errors.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES as FIELD_NAMES } from './cases-create-casefile-applicant-organisation-field-names.constant';

export const CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS: ICasesCreateCasefileApplicantOrganisationFieldErrors =
  {
    create_casefile_applicant_organisation_name: {
      required: createCasesCreateCasefileError('Enter organisation name', 1),
      ...createCasesCreateCasefileMaxLengthError('Organisation name', 80, 3),
    },
    create_casefile_applicant_organisation_foreign_authority_reference: {
      required: createCasesCreateCasefileError('Enter a foreign authority reference number', 1),
      ...createCasesCreateCasefileMaxLengthError('Foreign authority reference', 40, 3),
    },
    ...createCasesCreateCasefileApplicantContactAddressFieldErrors(FIELD_NAMES),
    create_casefile_applicant_organisation_bank_type: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.bankType,
    create_casefile_applicant_organisation_uk_bank_name_on_account:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankNameOnAccount,
    create_casefile_applicant_organisation_uk_bank_sort_code:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankSortCode,
    create_casefile_applicant_organisation_uk_bank_account_number:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankAccountNumber,
    create_casefile_applicant_organisation_uk_bank_payment_reference:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankPaymentReference,
    create_casefile_applicant_organisation_non_uk_bank_name_on_account:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankNameOnAccount,
    create_casefile_applicant_organisation_non_uk_bank_bic_swift_code:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankBicSwiftCode,
    create_casefile_applicant_organisation_non_uk_bank_iban:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankIban,
    create_casefile_applicant_organisation_non_uk_bank_payment_reference: {},
    create_casefile_applicant_organisation_non_uk_bank_name: {},
    create_casefile_applicant_organisation_non_uk_bank_branch_sort_code:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankBranchSortCode,
    create_casefile_applicant_organisation_non_uk_bank_account_number:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankAccountNumber,
  };
