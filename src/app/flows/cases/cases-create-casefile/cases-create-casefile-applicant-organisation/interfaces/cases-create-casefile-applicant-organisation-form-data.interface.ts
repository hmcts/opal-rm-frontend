import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';

export interface ICasesCreateCasefileApplicantOrganisationFormData {
  create_casefile_applicant_organisation_name: string | null;
  create_casefile_applicant_organisation_foreign_authority_reference: string | null;
  create_casefile_applicant_organisation_main_email_address: string | null;
  create_casefile_applicant_organisation_other_email_address: string | null;
  create_casefile_applicant_organisation_main_telephone_number: string | null;
  create_casefile_applicant_organisation_other_telephone_number: string | null;
  create_casefile_applicant_organisation_address_line_1: string | null;
  create_casefile_applicant_organisation_address_line_2: string | null;
  create_casefile_applicant_organisation_address_line_3: string | null;
  create_casefile_applicant_organisation_address_line_4: string | null;
  create_casefile_applicant_organisation_address_line_5: string | null;
  create_casefile_applicant_organisation_postal_or_zip_code: string | null;
  create_casefile_applicant_organisation_country_id: number | null;
  create_casefile_applicant_organisation_bank_type: CasesCreateCasefileApplicantBankType | null;
  create_casefile_applicant_organisation_uk_bank_name_on_account: string | null;
  create_casefile_applicant_organisation_uk_bank_sort_code: string | null;
  create_casefile_applicant_organisation_uk_bank_account_number: string | null;
  create_casefile_applicant_organisation_uk_bank_payment_reference: string | null;
  create_casefile_applicant_organisation_non_uk_bank_name_on_account: string | null;
  create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: string | null;
  create_casefile_applicant_organisation_non_uk_bank_iban: string | null;
  create_casefile_applicant_organisation_non_uk_bank_payment_reference: string | null;
  create_casefile_applicant_organisation_non_uk_bank_name: string | null;
  create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: string | null;
  create_casefile_applicant_organisation_non_uk_bank_account_number: string | null;
}
