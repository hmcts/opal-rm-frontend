import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import type { CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';

/** Synthetic HTTP identity; never contains authentication credentials or live user data. */
export const INPUTTER_USER: IOpalUserStateResponse = {
  user_id: 10605,
  username: 'synthetic-inputter',
  name: 'Synthetic inputter',
  status: 'ACTIVE',
  version: 1,
  cache_name: null,
  domains: {
    maintenance: {
      business_unit_users: [
        {
          business_unit_user_id: 'BUU-SYNTHETIC',
          business_unit_id: 44,
          permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
        },
      ],
    },
  },
};

export function inputterRows(tab: CasesDraftInputterTab, count = 26): IOpalMaintenanceDraftCasefileSummary[] {
  const status = { 'in-review': 'SUBMITTED', rejected: 'REJECTED', approved: 'PUBLISHED', deleted: 'DELETED' } as const;
  return Array.from({ length: count }, (_, index) =>
    createCasesDraftSummary({
      draft_casefile_id: index + 1,
      casefile_status: tab === 'in-review' && index % 2 ? 'RESUBMITTED' : status[tab],
      validated_date: '2026-09-01T10:00:00Z',
      casefile_snapshot: {
        respondent_account: {
          respondent_name: 'Synthetic respondent ' + String(index + 1).padStart(2, '0'),
          account_number: '000123A',
        },
        applicant_account: {
          applicant_name: 'Synthetic applicant ' + String(index + 1).padStart(2, '0'),
          account_number: 'A010',
        },
        minor_creditor_accounts: [{ account_number: 'M10' }, { account_number: 'M2' }],
      },
    }),
  );
}

export const PUBLISHED_ROWS = [
  ...inputterRows('approved', 1),
  createCasesDraftSummary({
    draft_casefile_id: 200,
    casefile_status: 'PUBLISHED',
    casefile_snapshot: {
      respondent_account: { account_number: null },
      applicant_account: { account_number: ' ' },
      minor_creditor_accounts: [],
    },
  }),
  createCasesDraftSummary({ draft_casefile_id: 201, casefile_status: 'PUBLISHING_PENDING' }),
];
