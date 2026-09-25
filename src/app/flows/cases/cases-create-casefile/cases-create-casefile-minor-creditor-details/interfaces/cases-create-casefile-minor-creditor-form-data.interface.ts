export interface ICasesCreateCasefileMinorCreditorFormData {
  create_casefile_minor_creditor_type: 'individual' | 'organisation' | null;
  create_casefile_minor_creditor_title: string | null;
  create_casefile_minor_creditor_first_names: string | null;
  create_casefile_minor_creditor_last_name: string | null;
  create_casefile_minor_creditor_organisation_name: string | null;
  create_casefile_minor_creditor_address_line_1: string | null;
  create_casefile_minor_creditor_address_line_2: string | null;
  create_casefile_minor_creditor_address_line_3: string | null;
  create_casefile_minor_creditor_address_line_4: string | null;
  create_casefile_minor_creditor_address_line_5: string | null;
  create_casefile_minor_creditor_postal_or_zip_code: string | null;
  create_casefile_minor_creditor_country_id: number | string | null;
  create_casefile_minor_creditor_bank_type: 'uk' | 'non-uk' | 'none' | null;
  create_casefile_minor_creditor_uk_bank_name_on_account: string | null;
  create_casefile_minor_creditor_uk_bank_sort_code: string | null;
  create_casefile_minor_creditor_uk_bank_account_number: string | null;
  create_casefile_minor_creditor_uk_bank_payment_reference: string | null;
  create_casefile_minor_creditor_non_uk_bank_name_on_account: string | null;
  create_casefile_minor_creditor_non_uk_bank_account_number: string | null;
  create_casefile_minor_creditor_non_uk_bank_payment_reference: string | null;
  create_casefile_minor_creditor_non_uk_bank_bic_swift_code: string | null;
  create_casefile_minor_creditor_non_uk_bank_iban: string | null;
  create_casefile_minor_creditor_non_uk_bank_name: string | null;
  create_casefile_minor_creditor_non_uk_bank_branch_sort_code: string | null;
}
