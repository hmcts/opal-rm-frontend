import type { IOpalMaintenanceDraftCasefileSummary } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';

export function createCasesDraftSummary(
  overrides: Partial<IOpalMaintenanceDraftCasefileSummary> = {},
): IOpalMaintenanceDraftCasefileSummary {
  return {
    draft_casefile_id: 123,
    business_unit_id: 44,
    submitted_by: 'BUU-SYNTHETIC',
    created_date: '2026-09-01T10:00:00Z',
    validated_date: null,
    casefile_type: 'REMO In',
    casefile_status: 'SUBMITTED',
    casefile_status_date: '2026-10-05T10:00:00Z',
    casefile_snapshot: {
      respondent_account: { respondent_name: 'Synthetic respondent', account_number: null },
      applicant_account: { applicant_name: 'Synthetic applicant', account_number: null },
      minor_creditor_accounts: [],
    },
    ...structuredClone(overrides),
  };
}
