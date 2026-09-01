import type { ICasesCreateCasefileApplicantIndividualFieldErrors } from '../interfaces/cases-create-casefile-applicant-individual-field-errors.interface';

export const CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS: ICasesCreateCasefileApplicantIndividualFieldErrors =
  {
    applicant_title: {
      maxlength: { message: 'Title must be 20 characters or fewer', priority: 1 },
    },
    applicant_first_names: {
      required: { message: 'Enter applicant’s first name(s)', priority: 1 },
      maxlength: { message: 'First name(s) must be 50 characters or fewer', priority: 3 },
    },
    applicant_last_name: {
      required: { message: 'Enter applicant’s last name', priority: 1 },
      maxlength: { message: 'Last name must be 50 characters or fewer', priority: 3 },
    },
    applicant_alias_first_names_0: {
      required: { message: 'Enter alias first name(s)', priority: 1 },
      maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_last_name_0: {
      required: { message: 'Enter alias last name', priority: 1 },
      maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_first_names_1: {
      required: { message: 'Enter alias first name(s)', priority: 1 },
      maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_last_name_1: {
      required: { message: 'Enter alias last name', priority: 1 },
      maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_first_names_2: {
      required: { message: 'Enter alias first name(s)', priority: 1 },
      maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_last_name_2: {
      required: { message: 'Enter alias last name', priority: 1 },
      maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_first_names_3: {
      required: { message: 'Enter alias first name(s)', priority: 1 },
      maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_last_name_3: {
      required: { message: 'Enter alias last name', priority: 1 },
      maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_first_names_4: {
      required: { message: 'Enter alias first name(s)', priority: 1 },
      maxlength: { message: 'Alias first name(s) must be 40 characters or fewer', priority: 3 },
    },
    applicant_alias_last_name_4: {
      required: { message: 'Enter alias last name', priority: 1 },
      maxlength: { message: 'Alias last name must be 40 characters or fewer', priority: 3 },
    },
    applicant_date_of_birth: {
      invalidDateFormat: { message: 'Enter date of birth in the format DD/MM/YYYY', priority: 2 },
      invalidDate: { message: 'Enter a valid date of birth', priority: 2 },
      invalidDateOfBirth: { message: 'Date must be in the past', priority: 2 },
    },
    applicant_main_email_address: {
      emailPattern: {
        message: 'Enter an email address in the correct format, like name@example.com',
        priority: 2,
      },
      maxlength: { message: 'Main email address must be 76 characters or fewer', priority: 3 },
    },
    applicant_other_email_address: {
      emailPattern: {
        message: 'Enter an email address in the correct format, like name@example.com',
        priority: 2,
      },
      maxlength: { message: 'Other email address must be 76 characters or fewer', priority: 3 },
    },
    applicant_main_telephone_number: {
      maxlength: { message: 'Main telephone number must be 35 characters or fewer', priority: 1 },
    },
    applicant_other_telephone_number: {
      maxlength: { message: 'Other telephone number must be 35 characters or fewer', priority: 1 },
    },
    applicant_address_line_1: {
      required: { message: 'Enter an address', priority: 1 },
      maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
    },
    applicant_address_line_2: {
      maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_3: {
      maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_4: {
      maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_5: {
      maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 },
    },
    applicant_postal_or_zip_code: {
      maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 },
    },
    applicant_country_id: {
      required: { message: 'Select a country', priority: 1 },
    },
    applicant_third_party_name_or_organisation: {
      required: { message: 'Enter name or organisation', priority: 1 },
      maxlength: { message: 'Name or organisation must be 40 characters or fewer', priority: 3 },
    },
    applicant_third_party_relationship: {
      required: { message: 'Enter relationship to the applicant', priority: 1 },
      maxlength: { message: 'Relationship to the applicant must be 40 characters or fewer', priority: 3 },
    },
    applicant_third_party_reference: {
      maxlength: { message: 'Reference must be 40 characters or fewer', priority: 1 },
    },
    applicant_third_party_address_line_1: {
      required: { message: 'Enter an address', priority: 1 },
      maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
    },
    applicant_third_party_address_line_2: {
      maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 },
    },
    applicant_third_party_address_line_3: {
      maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 },
    },
    applicant_third_party_address_line_4: {
      maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 },
    },
    applicant_third_party_address_line_5: {
      maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 },
    },
    applicant_third_party_postal_or_zip_code: {
      maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 },
    },
    applicant_third_party_country_id: {
      required: { message: 'Select a country', priority: 1 },
    },
    applicant_bank_type: {
      required: { message: 'Select an option', priority: 1 },
    },
    applicant_uk_bank_name_on_account: {
      required: { message: 'Enter name on account', priority: 1 },
    },
    applicant_uk_bank_sort_code: {
      required: { message: 'Enter sort code', priority: 1 },
      ukSortCodePattern: { message: 'Enter correct sort code', priority: 2 },
      ukSortCodeLength: { message: 'Sort code must only contain 6 numbers', priority: 3 },
    },
    applicant_uk_bank_account_number: {
      required: { message: 'Enter account number', priority: 1 },
      ukAccountNumberPattern: { message: 'Account number must only contain numbers', priority: 2 },
      ukAccountNumberLength: { message: 'Account number must be between 6 and 8 numbers', priority: 3 },
    },
    applicant_uk_bank_payment_reference: {
      required: { message: 'Enter UK bank account payment reference', priority: 1 },
    },
    applicant_non_uk_bank_name_on_account: {
      required: { message: 'Enter name on account', priority: 1 },
    },
    applicant_non_uk_bank_account_number: {
      maxlength: { message: 'Account number must be 20 characters or fewer', priority: 1 },
    },
    applicant_non_uk_bank_bic_swift_code: {
      internationalIdentifierRequired: {
        message: 'Enter either BIC or SWIFT code or IBAN number',
        priority: 2,
      },
      internationalIdentifierPattern: {
        message: 'Enter correct BIC or SWIFT code or IBAN number',
        priority: 2,
      },
    },
    applicant_non_uk_bank_iban: {
      internationalIdentifierPattern: {
        message: 'Enter correct BIC or SWIFT code or IBAN number',
        priority: 2,
      },
    },
    applicant_non_uk_bank_branch_sort_code: {
      branchSortCodePattern: { message: 'Enter correct branch or sort code', priority: 2 },
      branchSortCodeLength: { message: 'Branch or sort code must be 12 numbers or fewer', priority: 3 },
    },
    applicant_restricted_information_reason: {
      required: { message: 'Enter a reason', priority: 1 },
      maxlength: { message: 'Reason must be 250 characters or fewer', priority: 3 },
    },
  };
