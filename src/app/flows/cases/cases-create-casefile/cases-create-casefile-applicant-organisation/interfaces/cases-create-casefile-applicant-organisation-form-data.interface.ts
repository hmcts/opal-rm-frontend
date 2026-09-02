import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';

export interface ICasesCreateCasefileApplicantOrganisationFormData {
  applicant_organisation_name: string | null;
  applicant_foreign_authority_reference: string | null;
  applicant_main_email_address: string | null;
  applicant_other_email_address: string | null;
  applicant_main_telephone_number: string | null;
  applicant_other_telephone_number: string | null;
  applicant_address_line_1: string | null;
  applicant_address_line_2: string | null;
  applicant_address_line_3: string | null;
  applicant_address_line_4: string | null;
  applicant_address_line_5: string | null;
  applicant_postal_or_zip_code: string | null;
  applicant_country_id: number | null;
  applicant_bank_type: CasesCreateCasefileApplicantBankType | null;
  applicant_uk_bank_name_on_account: string | null;
  applicant_uk_bank_sort_code: string | null;
  applicant_uk_bank_account_number: string | null;
  applicant_uk_bank_payment_reference: string | null;
  applicant_non_uk_bank_name_on_account: string | null;
  applicant_non_uk_bank_bic_swift_code: string | null;
  applicant_non_uk_bank_iban: string | null;
  applicant_non_uk_bank_payment_reference: string | null;
  applicant_non_uk_bank_name: string | null;
  applicant_non_uk_bank_branch_sort_code: string | null;
  applicant_non_uk_bank_account_number: string | null;
}
