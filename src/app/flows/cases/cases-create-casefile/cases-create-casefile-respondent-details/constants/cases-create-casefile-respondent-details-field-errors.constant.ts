import type { ICasesCreateCasefileRespondentDetailsFieldErrors } from '../interfaces/cases-create-casefile-respondent-details-field-errors.interface';

export const CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS: ICasesCreateCasefileRespondentDetailsFieldErrors = {
  respondent_title: {
    maxlength: { message: 'Title must be 20 characters or fewer', priority: 2 },
  },
  respondent_first_names: {
    required: { message: 'Enter respondent’s first name(s)', priority: 1 },
    maxlength: { message: 'First name(s) must be 50 characters or fewer', priority: 2 },
  },
  respondent_last_name: {
    required: { message: 'Enter respondent’s last name', priority: 1 },
    maxlength: { message: 'Last name must be 50 characters or fewer', priority: 2 },
  },
  respondent_alias_first_names_0: {
    required: { message: 'Enter alias 1 first name(s)', priority: 1 },
    maxlength: { message: 'Alias 1 first name(s) must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_last_name_0: {
    required: { message: 'Enter alias 1 last name', priority: 1 },
    maxlength: { message: 'Alias 1 last name must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_first_names_1: {
    required: { message: 'Enter alias 2 first name(s)', priority: 1 },
    maxlength: { message: 'Alias 2 first name(s) must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_last_name_1: {
    required: { message: 'Enter alias 2 last name', priority: 1 },
    maxlength: { message: 'Alias 2 last name must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_first_names_2: {
    required: { message: 'Enter alias 3 first name(s)', priority: 1 },
    maxlength: { message: 'Alias 3 first name(s) must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_last_name_2: {
    required: { message: 'Enter alias 3 last name', priority: 1 },
    maxlength: { message: 'Alias 3 last name must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_first_names_3: {
    required: { message: 'Enter alias 4 first name(s)', priority: 1 },
    maxlength: { message: 'Alias 4 first name(s) must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_last_name_3: {
    required: { message: 'Enter alias 4 last name', priority: 1 },
    maxlength: { message: 'Alias 4 last name must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_first_names_4: {
    required: { message: 'Enter alias 5 first name(s)', priority: 1 },
    maxlength: { message: 'Alias 5 first name(s) must be 40 characters or fewer', priority: 2 },
  },
  respondent_alias_last_name_4: {
    required: { message: 'Enter alias 5 last name', priority: 1 },
    maxlength: { message: 'Alias 5 last name must be 40 characters or fewer', priority: 2 },
  },
  respondent_date_of_birth: {
    invalidDateFormat: { message: 'Enter date of birth in the format DD/MM/YYYY', priority: 1 },
    invalidDate: { message: 'Enter a valid date of birth', priority: 1 },
    invalidDateOfBirth: { message: 'Date must be in the past', priority: 1 },
  },
  respondent_national_insurance_number: {
    nationalInsuranceNumberPattern: {
      message: 'Enter a National Insurance number in the format AANNNNNNA',
      priority: 1,
    },
  },
  respondent_other_personal_information: {
    maxlength: { message: 'Other personal information must be 200 characters or fewer', priority: 2 },
  },
  respondent_main_email_address: {
    emailPattern: {
      message: 'Enter an email address in the correct format, like name@example.com',
      priority: 1,
    },
    maxlength: { message: 'Main email address must be 76 characters or fewer', priority: 2 },
  },
  respondent_other_email_address: {
    emailPattern: {
      message: 'Enter an email address in the correct format, like name@example.com',
      priority: 1,
    },
    maxlength: { message: 'Other email address must be 76 characters or fewer', priority: 2 },
  },
  respondent_main_telephone_number: {
    maxlength: { message: 'Main telephone number must be 35 characters or fewer', priority: 2 },
  },
  respondent_other_telephone_number: {
    maxlength: { message: 'Other telephone number must be 35 characters or fewer', priority: 2 },
  },
  respondent_address_line_1: {
    required: { message: 'Enter an address', priority: 1 },
    maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 2 },
  },
  respondent_address_line_2: {
    maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 2 },
  },
  respondent_address_line_3: {
    maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 2 },
  },
  respondent_address_line_4: {
    maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 2 },
  },
  respondent_address_line_5: {
    maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 2 },
  },
  respondent_postal_or_zip_code: {
    maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 2 },
  },
  respondent_country_id: {
    required: { message: 'Select a country', priority: 1 },
  },
  respondent_third_party_name_or_organisation: {
    required: { message: 'Enter name or organisation', priority: 1 },
    maxlength: { message: 'Name or organisation must be 40 characters or fewer', priority: 2 },
  },
  respondent_third_party_relationship: {
    required: { message: 'Enter relationship to the respondent', priority: 1 },
    maxlength: { message: 'Relationship to the respondent must be 40 characters or fewer', priority: 2 },
  },
  respondent_third_party_reference: {
    maxlength: { message: 'Reference must be 40 characters or fewer', priority: 2 },
  },
  respondent_third_party_address_line_1: {
    required: { message: 'Enter an address', priority: 1 },
    maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 2 },
  },
  respondent_third_party_address_line_2: {
    maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 2 },
  },
  respondent_third_party_address_line_3: {
    maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 2 },
  },
  respondent_third_party_address_line_4: {
    maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 2 },
  },
  respondent_third_party_address_line_5: {
    maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 2 },
  },
  respondent_third_party_postal_or_zip_code: {
    maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 2 },
  },
  respondent_third_party_country_id: {
    required: { message: 'Select a country', priority: 1 },
  },
  respondent_employer_name: {
    required: { message: 'Enter employer name', priority: 1 },
    maxlength: { message: 'Employer name must be 50 characters or fewer', priority: 2 },
  },
  respondent_employee_reference: {
    maxlength: { message: 'Employee reference must be 20 characters or fewer', priority: 2 },
  },
  respondent_employer_email_address: {
    emailPattern: {
      message: 'Enter an email address in the correct format, like name@example.com',
      priority: 1,
    },
    maxlength: { message: 'Employer email address must be 76 characters or fewer', priority: 2 },
  },
  respondent_employer_telephone_number: {
    maxlength: { message: 'Employer telephone number must be 35 characters or fewer', priority: 2 },
  },
  respondent_employer_address_line_1: {
    required: { message: 'Enter employer address', priority: 1 },
    maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 2 },
  },
  respondent_employer_address_line_2: {
    maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 2 },
  },
  respondent_employer_address_line_3: {
    maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 2 },
  },
  respondent_employer_address_line_4: {
    maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 2 },
  },
  respondent_employer_address_line_5: {
    maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 2 },
  },
  respondent_employer_postal_or_zip_code: {
    maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 2 },
  },
  respondent_employer_country_id: {
    required: { message: 'Select a country', priority: 1 },
  },
  respondent_restricted_information_reason: {
    required: {
      message: 'Enter a reason why the respondent’s personal information should not be shared',
      priority: 1,
    },
    maxlength: { message: 'Reason must be 250 characters or fewer', priority: 2 },
  },
};
