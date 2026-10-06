import type { ParamMap } from '@angular/router';
import { getCasesDraftTabs, getCasesDraftTabMetadata } from './cases-draft-tab-metadata';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function defaultCasesDraftNavigation(
  tab?: CasesDraftTab,
  mode: CasesDraftDashboardMode = 'inputter',
): ICasesDraftNavigation {
  const selected = tab ?? getCasesDraftTabs(mode)[0];
  return { tab: selected, page: 1, sort: getCasesDraftTabMetadata(selected, mode).defaultSort, direction: 'ascending' };
}

/** Invalid supplied metadata discards the complete selection; unknown query fields are ignored. */
export function parseCasesDraftNavigation(
  fragment: string | null,
  query: ParamMap,
  mode: CasesDraftDashboardMode = 'inputter',
): ICasesDraftNavigation {
  const fallback = defaultCasesDraftNavigation(undefined, mode);
  const selected = fragment ?? fallback.tab;
  if (!getCasesDraftTabs(mode).includes(selected as CasesDraftTab)) return fallback;
  const tab = selected as CasesDraftTab;
  const defaults = defaultCasesDraftNavigation(tab, mode);
  const pageText = query.get('page') ?? '1';
  const sort = query.get('sort') ?? defaults.sort;
  const direction = query.get('direction') ?? defaults.direction;
  const columns: readonly string[] = getCasesDraftTabMetadata(tab, mode).columns;
  if (
    !/^[1-9]\d*$/.test(pageText) ||
    !Number.isSafeInteger(Number(pageText)) ||
    !columns.includes(sort) ||
    !['ascending', 'descending'].includes(direction)
  )
    return fallback;
  return {
    tab,
    page: Number(pageText),
    sort: sort as CasesDraftSortColumn,
    direction: direction as ICasesDraftNavigation['direction'],
  };
}
