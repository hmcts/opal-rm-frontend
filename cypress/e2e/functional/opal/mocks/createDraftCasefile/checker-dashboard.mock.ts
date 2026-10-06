import { INPUTTER_USER } from './inputter-dashboard.mock';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import type { CasesDraftCheckerTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';

export type CheckerRole = 'checker' | 'dual' | 'inputter' | 'cross-bu' | 'inactive' | 'missing-id';
export type CheckerDestination = 'dashboard' | 'review' | 'view';

/** Validates human-readable roles before preparing a synthetic HTTP boundary. */
export function checkerRole(value: string): CheckerRole {
  const roles: readonly string[] = ['checker', 'dual', 'inputter', 'cross-bu', 'inactive', 'missing-id'];
  if (!roles.includes(value)) throw new Error('Unsupported synthetic checker role: ' + value);
  return value as CheckerRole;
}

/** Validates the named protected destination used by feature examples. */
export function checkerDestination(value: string): CheckerDestination {
  if (!['dashboard', 'review', 'view'].includes(value)) throw new Error('Unsupported checker destination: ' + value);
  return value as CheckerDestination;
}

/** Contains synthetic role data only; maintained authentication remains outside fixtures. */
export function checkerUser(role: CheckerRole) {
  const user = structuredClone(INPUTTER_USER);
  user.user_id = 10606;
  user.username = 'synthetic-checker';
  user.name = 'Synthetic checker';
  const unit = user.domains['maintenance']!.business_unit_users[0];
  unit.business_unit_user_id = role === 'missing-id' ? '' : 'BUU-CHECKER';
  unit.business_unit_id = role === 'cross-bu' ? 45 : 44;
  unit.permissions = [{ permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' }];
  if (role === 'dual')
    unit.permissions.push({ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' });
  if (role === 'inputter')
    unit.permissions = [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }];
  if (role === 'inactive') user.status = 'DEACTIVATED';
  return user;
}

/** Supplies a page boundary, original-created ordering and explicit resubmission history. */
export function checkerRows(tab: CasesDraftCheckerTab, count = 26): IOpalMaintenanceDraftCasefileSummary[] {
  const status = {
    'to-review': 'SUBMITTED',
    rejected: 'REJECTED',
    deleted: 'DELETED',
    failed: 'PUBLISHING_FAILED',
  } as const;
  return Array.from({ length: count }, (_, index) =>
    createCasesDraftSummary({
      draft_casefile_id: index + 1,
      submitted_by: 'BUU-OTHER',
      submitted_by_name: 'Synthetic submitter',
      created_date: '2026-09-' + String(index + 1).padStart(2, '0') + 'T10:00:00Z',
      casefile_status: tab === 'to-review' && index % 2 ? 'RESUBMITTED' : status[tab],
      casefile_status_date: '2026-10-05T10:00:00Z',
      casefile_snapshot: {
        respondent_account: { respondent_name: 'Synthetic respondent ' + String(index + 1).padStart(2, '0') },
        applicant_account: { applicant_name: 'Synthetic applicant ' + String(index + 1).padStart(2, '0') },
        minor_creditor_accounts: [],
      },
    }),
  );
}

export const CHECKER_SCOPE_ROWS = [
  ...checkerRows('to-review'),
  createCasesDraftSummary({ draft_casefile_id: 900, submitted_by: 'BUU-CHECKER' }),
  createCasesDraftSummary({ draft_casefile_id: 901, submitted_by: 'BUU-OTHER', business_unit_id: 45 }),
  createCasesDraftSummary({ draft_casefile_id: 902, submitted_by: 'BUU-OTHER', casefile_status: 'PUBLISHING_PENDING' }),
];
export const CHECKER_FAILURE = {
  operation_id: 'SYNTHETIC-RETRY',
  detail: 'Synthetic private detail',
  title: 'Synthetic backend title',
};
