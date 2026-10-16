import type { IOpalMaintenanceDraftCasefileSummary } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

function populated(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function mapCasesDraftRows(
  summaries: readonly IOpalMaintenanceDraftCasefileSummary[],
  tab: CasesDraftTab,
): ICasesDraftRow[] {
  const statuses = new Set(CASES_DRAFT_TABS[tab].statuses.split(','));
  return summaries
    .filter(({ casefile_status }) => statuses.has(casefile_status))
    .map((summary) => {
      const snapshot = summary.casefile_snapshot;
      return {
        id: summary.draft_casefile_id,
        respondent: populated(snapshot.respondent_account?.respondent_name),
        applicant: populated(snapshot.applicant_account?.applicant_name),
        caseType: summary.casefile_type,
        created: summary.created_date,
        statusDate: summary.casefile_status_date,
        approved: summary.validated_date ?? null,
        respondentAccount: populated(snapshot.respondent_account?.account_number),
        applicantAccount: populated(snapshot.applicant_account?.account_number),
        minorCreditorAccounts: (snapshot.minor_creditor_accounts ?? [])
          .map(({ account_number }) => populated(account_number))
          .filter((value): value is string => value !== null),
      };
    });
}
