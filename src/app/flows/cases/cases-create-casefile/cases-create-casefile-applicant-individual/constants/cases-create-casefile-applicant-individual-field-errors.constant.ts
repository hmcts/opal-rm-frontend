import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
import { CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS } from '../../constants/cases-create-casefile-applicant-field-errors.constant';
import type { ICasesCreateCasefileApplicantIndividualFieldErrors } from '../interfaces/cases-create-casefile-applicant-individual-field-errors.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES as FIELD_NAMES } from './cases-create-casefile-applicant-individual-field-names.constant';

const aliasFieldErrors = {
  requiredFirstNames: createCasesCreateCasefileError('Enter alias first name(s)', 1),
  requiredLastName: createCasesCreateCasefileError('Enter alias last name', 1),
  firstNamesMaxLength: createCasesCreateCasefileMaxLengthError('Alias first name(s)', 40, 3).maxlength,
  lastNameMaxLength: createCasesCreateCasefileMaxLengthError('Alias last name', 40, 3).maxlength,
};

export const CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS: ICasesCreateCasefileApplicantIndividualFieldErrors =
  {
    create_casefile_applicant_individual_title: createCasesCreateCasefileMaxLengthError('Title', 20, 1),
    create_casefile_applicant_individual_first_names: {
      required: createCasesCreateCasefileError('Enter applicant’s first name(s)', 1),
      ...createCasesCreateCasefileMaxLengthError('First name(s)', 50, 3),
    },
    create_casefile_applicant_individual_last_name: {
      required: createCasesCreateCasefileError('Enter applicant’s last name', 1),
      ...createCasesCreateCasefileMaxLengthError('Last name', 50, 3),
    },
    create_casefile_applicant_individual_alias_first_names_0: {
      required: aliasFieldErrors.requiredFirstNames,
      maxlength: aliasFieldErrors.firstNamesMaxLength,
    },
    create_casefile_applicant_individual_alias_last_name_0: {
      required: aliasFieldErrors.requiredLastName,
      maxlength: aliasFieldErrors.lastNameMaxLength,
    },
    create_casefile_applicant_individual_alias_first_names_1: {
      required: aliasFieldErrors.requiredFirstNames,
      maxlength: aliasFieldErrors.firstNamesMaxLength,
    },
    create_casefile_applicant_individual_alias_last_name_1: {
      required: aliasFieldErrors.requiredLastName,
      maxlength: aliasFieldErrors.lastNameMaxLength,
    },
    create_casefile_applicant_individual_alias_first_names_2: {
      required: aliasFieldErrors.requiredFirstNames,
      maxlength: aliasFieldErrors.firstNamesMaxLength,
    },
    create_casefile_applicant_individual_alias_last_name_2: {
      required: aliasFieldErrors.requiredLastName,
      maxlength: aliasFieldErrors.lastNameMaxLength,
    },
    create_casefile_applicant_individual_alias_first_names_3: {
      required: aliasFieldErrors.requiredFirstNames,
      maxlength: aliasFieldErrors.firstNamesMaxLength,
    },
    create_casefile_applicant_individual_alias_last_name_3: {
      required: aliasFieldErrors.requiredLastName,
      maxlength: aliasFieldErrors.lastNameMaxLength,
    },
    create_casefile_applicant_individual_alias_first_names_4: {
      required: aliasFieldErrors.requiredFirstNames,
      maxlength: aliasFieldErrors.firstNamesMaxLength,
    },
    create_casefile_applicant_individual_alias_last_name_4: {
      required: aliasFieldErrors.requiredLastName,
      maxlength: aliasFieldErrors.lastNameMaxLength,
    },
    create_casefile_applicant_individual_date_of_birth: {
      invalidDateFormat: createCasesCreateCasefileError('Enter date of birth in the format DD/MM/YYYY', 2),
      invalidDate: createCasesCreateCasefileError('Enter a valid date of birth', 2),
      invalidDateOfBirth: createCasesCreateCasefileError('Date must be in the past', 2),
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
    create_casefile_applicant_individual_third_party_name_or_organisation: {
      required: createCasesCreateCasefileError('Enter name or organisation', 1),
      ...createCasesCreateCasefileMaxLengthError('Name or organisation', 40, 3),
    },
    create_casefile_applicant_individual_third_party_relationship: {
      required: createCasesCreateCasefileError('Enter relationship to the applicant', 1),
      ...createCasesCreateCasefileMaxLengthError('Relationship to the applicant', 40, 3),
    },
    create_casefile_applicant_individual_third_party_reference: createCasesCreateCasefileMaxLengthError(
      'Reference',
      40,
      1,
    ),
    create_casefile_applicant_individual_third_party_address_line_1: {
      required: createCasesCreateCasefileError('Enter an address', 1),
      ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 3),
    },
    create_casefile_applicant_individual_third_party_address_line_2: createCasesCreateCasefileMaxLengthError(
      'Address line 2',
      30,
      1,
    ),
    create_casefile_applicant_individual_third_party_address_line_3: createCasesCreateCasefileMaxLengthError(
      'Address line 3',
      30,
      1,
    ),
    create_casefile_applicant_individual_third_party_address_line_4: createCasesCreateCasefileMaxLengthError(
      'Address line 4',
      30,
      1,
    ),
    create_casefile_applicant_individual_third_party_address_line_5: createCasesCreateCasefileMaxLengthError(
      'Address line 5',
      30,
      1,
    ),
    create_casefile_applicant_individual_third_party_postal_or_zip_code: createCasesCreateCasefileMaxLengthError(
      'Postal or zip code',
      10,
      1,
    ),
    create_casefile_applicant_individual_third_party_country_id: {
      required: createCasesCreateCasefileError('Select a country', 1),
    },
    [FIELD_NAMES.bankType]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.bankType,
    [FIELD_NAMES.ukBankNameOnAccount]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankNameOnAccount,
    [FIELD_NAMES.ukBankSortCode]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankSortCode,
    [FIELD_NAMES.ukBankAccountNumber]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankAccountNumber,
    [FIELD_NAMES.ukBankPaymentReference]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.ukBankPaymentReference,
    [FIELD_NAMES.nonUkBankNameOnAccount]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankNameOnAccount,
    [FIELD_NAMES.nonUkBankAccountNumber]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankAccountNumber,
    [FIELD_NAMES.nonUkBankBicSwiftCode]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankBicSwiftCode,
    [FIELD_NAMES.nonUkBankIban]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankIban,
    [FIELD_NAMES.nonUkBankBranchSortCode]: CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.bank.nonUkBankBranchSortCode,
    create_casefile_applicant_individual_restricted_information_reason: {
      required: createCasesCreateCasefileError('Enter a reason', 1),
      ...createCasesCreateCasefileMaxLengthError('Reason', 250, 3),
    },
  };
