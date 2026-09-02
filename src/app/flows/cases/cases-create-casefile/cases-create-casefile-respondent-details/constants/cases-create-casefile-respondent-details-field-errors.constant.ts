import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
import type { ICasesCreateCasefileRespondentDetailsFieldErrors } from '../interfaces/cases-create-casefile-respondent-details-field-errors.interface';

export const CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS: ICasesCreateCasefileRespondentDetailsFieldErrors = {
  respondent_title: createCasesCreateCasefileMaxLengthError('Title', 20, 2),
  respondent_first_names: {
    required: createCasesCreateCasefileError('Enter respondent’s first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('First name(s)', 50, 2),
  },
  respondent_last_name: {
    required: createCasesCreateCasefileError('Enter respondent’s last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Last name', 50, 2),
  },
  respondent_alias_first_names_0: {
    required: createCasesCreateCasefileError('Enter alias 1 first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 1 first name(s)', 40, 2),
  },
  respondent_alias_last_name_0: {
    required: createCasesCreateCasefileError('Enter alias 1 last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 1 last name', 40, 2),
  },
  respondent_alias_first_names_1: {
    required: createCasesCreateCasefileError('Enter alias 2 first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 2 first name(s)', 40, 2),
  },
  respondent_alias_last_name_1: {
    required: createCasesCreateCasefileError('Enter alias 2 last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 2 last name', 40, 2),
  },
  respondent_alias_first_names_2: {
    required: createCasesCreateCasefileError('Enter alias 3 first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 3 first name(s)', 40, 2),
  },
  respondent_alias_last_name_2: {
    required: createCasesCreateCasefileError('Enter alias 3 last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 3 last name', 40, 2),
  },
  respondent_alias_first_names_3: {
    required: createCasesCreateCasefileError('Enter alias 4 first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 4 first name(s)', 40, 2),
  },
  respondent_alias_last_name_3: {
    required: createCasesCreateCasefileError('Enter alias 4 last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 4 last name', 40, 2),
  },
  respondent_alias_first_names_4: {
    required: createCasesCreateCasefileError('Enter alias 5 first name(s)', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 5 first name(s)', 40, 2),
  },
  respondent_alias_last_name_4: {
    required: createCasesCreateCasefileError('Enter alias 5 last name', 1),
    ...createCasesCreateCasefileMaxLengthError('Alias 5 last name', 40, 2),
  },
  respondent_date_of_birth: {
    invalidDateFormat: createCasesCreateCasefileError('Enter date of birth in the format DD/MM/YYYY', 1),
    invalidDate: createCasesCreateCasefileError('Enter a valid date of birth', 1),
    invalidDateOfBirth: createCasesCreateCasefileError('Date must be in the past', 1),
  },
  respondent_national_insurance_number: {
    nationalInsuranceNumberPattern: createCasesCreateCasefileError(
      'Enter a National Insurance number in the format AANNNNNNA',
      1,
    ),
  },
  respondent_other_personal_information: createCasesCreateCasefileMaxLengthError('Other personal information', 200, 2),
  respondent_main_email_address: {
    emailPattern: createCasesCreateCasefileError(
      'Enter an email address in the correct format, like name@example.com',
      1,
    ),
    ...createCasesCreateCasefileMaxLengthError('Main email address', 76, 2),
  },
  respondent_other_email_address: {
    emailPattern: createCasesCreateCasefileError(
      'Enter an email address in the correct format, like name@example.com',
      1,
    ),
    ...createCasesCreateCasefileMaxLengthError('Other email address', 76, 2),
  },
  respondent_main_telephone_number: createCasesCreateCasefileMaxLengthError('Main telephone number', 35, 2),
  respondent_other_telephone_number: createCasesCreateCasefileMaxLengthError('Other telephone number', 35, 2),
  respondent_address_line_1: {
    required: createCasesCreateCasefileError('Enter an address', 1),
    ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 2),
  },
  respondent_address_line_2: createCasesCreateCasefileMaxLengthError('Address line 2', 30, 2),
  respondent_address_line_3: createCasesCreateCasefileMaxLengthError('Address line 3', 30, 2),
  respondent_address_line_4: createCasesCreateCasefileMaxLengthError('Address line 4', 30, 2),
  respondent_address_line_5: createCasesCreateCasefileMaxLengthError('Address line 5', 30, 2),
  respondent_postal_or_zip_code: createCasesCreateCasefileMaxLengthError('Postal or zip code', 10, 2),
  respondent_country_id: {
    required: createCasesCreateCasefileError('Select a country', 1),
  },
  respondent_third_party_name_or_organisation: {
    required: createCasesCreateCasefileError('Enter name or organisation', 1),
    ...createCasesCreateCasefileMaxLengthError('Name or organisation', 40, 2),
  },
  respondent_third_party_relationship: {
    required: createCasesCreateCasefileError('Enter relationship to the respondent', 1),
    ...createCasesCreateCasefileMaxLengthError('Relationship to the respondent', 40, 2),
  },
  respondent_third_party_reference: createCasesCreateCasefileMaxLengthError('Reference', 40, 2),
  respondent_third_party_address_line_1: {
    required: createCasesCreateCasefileError('Enter an address', 1),
    ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 2),
  },
  respondent_third_party_address_line_2: createCasesCreateCasefileMaxLengthError('Address line 2', 30, 2),
  respondent_third_party_address_line_3: createCasesCreateCasefileMaxLengthError('Address line 3', 30, 2),
  respondent_third_party_address_line_4: createCasesCreateCasefileMaxLengthError('Address line 4', 30, 2),
  respondent_third_party_address_line_5: createCasesCreateCasefileMaxLengthError('Address line 5', 30, 2),
  respondent_third_party_postal_or_zip_code: createCasesCreateCasefileMaxLengthError('Postal or zip code', 10, 2),
  respondent_third_party_country_id: {
    required: createCasesCreateCasefileError('Select a country', 1),
  },
  respondent_employer_name: {
    required: createCasesCreateCasefileError('Enter employer name', 1),
    ...createCasesCreateCasefileMaxLengthError('Employer name', 50, 2),
  },
  respondent_employee_reference: createCasesCreateCasefileMaxLengthError('Employee reference', 20, 2),
  respondent_employer_email_address: {
    emailPattern: createCasesCreateCasefileError(
      'Enter an email address in the correct format, like name@example.com',
      1,
    ),
    ...createCasesCreateCasefileMaxLengthError('Employer email address', 76, 2),
  },
  respondent_employer_telephone_number: createCasesCreateCasefileMaxLengthError('Employer telephone number', 35, 2),
  respondent_employer_address_line_1: {
    required: createCasesCreateCasefileError('Enter employer address', 1),
    ...createCasesCreateCasefileMaxLengthError('Address line 1', 30, 2),
  },
  respondent_employer_address_line_2: createCasesCreateCasefileMaxLengthError('Address line 2', 30, 2),
  respondent_employer_address_line_3: createCasesCreateCasefileMaxLengthError('Address line 3', 30, 2),
  respondent_employer_address_line_4: createCasesCreateCasefileMaxLengthError('Address line 4', 30, 2),
  respondent_employer_address_line_5: createCasesCreateCasefileMaxLengthError('Address line 5', 30, 2),
  respondent_employer_postal_or_zip_code: createCasesCreateCasefileMaxLengthError('Postal or zip code', 10, 2),
  respondent_employer_country_id: {
    required: createCasesCreateCasefileError('Select a country', 1),
  },
  respondent_restricted_information_reason: {
    required: createCasesCreateCasefileError(
      'Enter a reason why the respondent’s personal information should not be shared',
      1,
    ),
    ...createCasesCreateCasefileMaxLengthError('Reason', 250, 2),
  },
};
