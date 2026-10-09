export interface IOpalMaintenanceDraftCasefileSnapshot {
  respondent_account?: { respondent_name?: string; account_number?: string | null } | null;
  applicant_account?: { applicant_name?: string; account_number?: string | null } | null;
  minor_creditor_accounts?: { creditor_sequence?: number; account_number?: string | null }[] | null;
}
