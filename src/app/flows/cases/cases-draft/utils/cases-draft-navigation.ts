import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function defaultCasesDraftNavigation(tab: CasesDraftTab = 'in-review'): ICasesDraftNavigation {
  return { tab, page: 1, sort: CASES_DRAFT_TABS[tab].defaultSort, direction: 'ascending' };
}

/** The fragment selects a supported tab; table state remains in memory. */
export function parseCasesDraftNavigation(fragment: string | null): ICasesDraftNavigation {
  return defaultCasesDraftNavigation(
    fragment !== null && Object.hasOwn(CASES_DRAFT_TABS, fragment) ? (fragment as CasesDraftTab) : 'in-review',
  );
}
