import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
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
    [FIELD_NAMES.mainEmailAddress]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.mainEmailAddress,
    [FIELD_NAMES.otherEmailAddress]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.otherEmailAddress,
    [FIELD_NAMES.mainTelephoneNumber]:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.mainTelephoneNumber,
    [FIELD_NAMES.otherTelephoneNumber]:
      CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.otherTelephoneNumber,
    [FIELD_NAMES.addressLine1]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.addressLine1,
    [FIELD_NAMES.addressLine2]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.addressLine2,
    [FIELD_NAMES.addressLine3]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.addressLine3,
    [FIELD_NAMES.addressLine4]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.addressLine4,
    [FIELD_NAMES.addressLine5]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.addressLine5,
    [FIELD_NAMES.postalOrZipCode]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.postalOrZipCode,
    [FIELD_NAMES.countryId]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress.countryId,
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
