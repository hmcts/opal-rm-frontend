import type { IAbstractFormBaseFieldError } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import type { ICasesCreateCasefileApplicantFieldErrors } from '../../interfaces/cases-create-casefile-applicant-field-errors.interface';

export interface ICasesCreateCasefileApplicantIndividualFieldErrors extends ICasesCreateCasefileApplicantFieldErrors {
  applicant_title: IAbstractFormBaseFieldError;
  applicant_first_names: IAbstractFormBaseFieldError;
  applicant_last_name: IAbstractFormBaseFieldError;
  applicant_alias_first_names_0: IAbstractFormBaseFieldError;
  applicant_alias_last_name_0: IAbstractFormBaseFieldError;
  applicant_alias_first_names_1: IAbstractFormBaseFieldError;
  applicant_alias_last_name_1: IAbstractFormBaseFieldError;
  applicant_alias_first_names_2: IAbstractFormBaseFieldError;
  applicant_alias_last_name_2: IAbstractFormBaseFieldError;
  applicant_alias_first_names_3: IAbstractFormBaseFieldError;
  applicant_alias_last_name_3: IAbstractFormBaseFieldError;
  applicant_alias_first_names_4: IAbstractFormBaseFieldError;
  applicant_alias_last_name_4: IAbstractFormBaseFieldError;
  applicant_date_of_birth: IAbstractFormBaseFieldError;
  applicant_third_party_name_or_organisation: IAbstractFormBaseFieldError;
  applicant_third_party_relationship: IAbstractFormBaseFieldError;
  applicant_third_party_reference: IAbstractFormBaseFieldError;
  applicant_third_party_address_line_1: IAbstractFormBaseFieldError;
  applicant_third_party_address_line_2: IAbstractFormBaseFieldError;
  applicant_third_party_address_line_3: IAbstractFormBaseFieldError;
  applicant_third_party_address_line_4: IAbstractFormBaseFieldError;
  applicant_third_party_address_line_5: IAbstractFormBaseFieldError;
  applicant_third_party_postal_or_zip_code: IAbstractFormBaseFieldError;
  applicant_third_party_country_id: IAbstractFormBaseFieldError;
  applicant_restricted_information_reason: IAbstractFormBaseFieldError;
}
