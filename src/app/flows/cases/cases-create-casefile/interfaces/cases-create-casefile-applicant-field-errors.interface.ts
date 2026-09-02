import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';

export interface ICasesCreateCasefileApplicantFieldErrors extends IAbstractFormBaseFieldErrors {
  applicant_main_email_address: IAbstractFormBaseFieldError;
  applicant_other_email_address: IAbstractFormBaseFieldError;
  applicant_main_telephone_number: IAbstractFormBaseFieldError;
  applicant_other_telephone_number: IAbstractFormBaseFieldError;
  applicant_address_line_1: IAbstractFormBaseFieldError;
  applicant_address_line_2: IAbstractFormBaseFieldError;
  applicant_address_line_3: IAbstractFormBaseFieldError;
  applicant_address_line_4: IAbstractFormBaseFieldError;
  applicant_address_line_5: IAbstractFormBaseFieldError;
  applicant_postal_or_zip_code: IAbstractFormBaseFieldError;
  applicant_country_id: IAbstractFormBaseFieldError;
  applicant_bank_type: IAbstractFormBaseFieldError;
  applicant_uk_bank_name_on_account: IAbstractFormBaseFieldError;
  applicant_uk_bank_sort_code: IAbstractFormBaseFieldError;
  applicant_uk_bank_account_number: IAbstractFormBaseFieldError;
  applicant_uk_bank_payment_reference: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_name_on_account: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_account_number: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_bic_swift_code: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_iban: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_branch_sort_code: IAbstractFormBaseFieldError;
}
