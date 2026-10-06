import { getCasesDraftTabs, getCasesDraftTabMetadata } from './cases-draft-tab-metadata';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function defaultCasesDraftNavigation(
  tab?: CasesDraftTab,
  mode: CasesDraftDashboardMode = 'inputter',
): ICasesDraftNavigation {
  const selected = tab ?? getCasesDraftTabs(mode)[0];
  return { tab: selected, page: 1, sort: getCasesDraftTabMetadata(selected, mode).defaultSort, direction: 'ascending' };
}

/** The fragment selects a supported queue; transient table state remains in memory. */
export function parseCasesDraftNavigation(
  fragment: string | null,
  mode: CasesDraftDashboardMode = 'inputter',
): ICasesDraftNavigation {
  const selected = fragment ?? getCasesDraftTabs(mode)[0];
  const tab = getCasesDraftTabs(mode).includes(selected as CasesDraftTab) ? (selected as CasesDraftTab) : undefined;
  return defaultCasesDraftNavigation(tab, mode);
}
