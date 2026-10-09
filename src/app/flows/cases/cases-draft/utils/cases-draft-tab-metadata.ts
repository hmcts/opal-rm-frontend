import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import { CASES_DRAFT_CHECKER_TABS } from '../constants/cases-draft-checker-tabs.constant';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';
import type { CasesDraftTab, CasesDraftInputterTab, CasesDraftCheckerTab } from '../types/cases-draft-tab.type';
import type { CasesDraftTabMetadata } from '../interfaces/cases-draft-tab-metadata.interface';

export function getCasesDraftTabs(mode: CasesDraftDashboardMode): readonly CasesDraftTab[] {
  return mode === 'checker'
    ? ['to-review', 'rejected', 'deleted', 'failed']
    : ['in-review', 'rejected', 'approved', 'deleted'];
}

/** Callers must validate user-supplied tabs before accessing mode-specific metadata. */
export function getCasesDraftTabMetadata(tab: CasesDraftTab, mode: CasesDraftDashboardMode): CasesDraftTabMetadata {
  const metadata = mode === 'checker' ? CASES_DRAFT_CHECKER_TABS : CASES_DRAFT_TABS;
  if (!Object.hasOwn(metadata, tab)) throw new Error('Invalid cases draft tab');
  return mode === 'checker'
    ? CASES_DRAFT_CHECKER_TABS[tab as CasesDraftCheckerTab]
    : CASES_DRAFT_TABS[tab as CasesDraftInputterTab];
}
