import type { ParamMap } from '@angular/router';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftSortDirection } from '../types/cases-draft-sort-direction.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function defaultCasesDraftNavigation(tab: CasesDraftTab = 'in-review'): ICasesDraftNavigation {
  return { tab, page: 1, sort: CASES_DRAFT_TABS[tab].defaultSort, direction: 'ascending' };
}

/** Invalid supplied metadata discards the complete selection; unknown query fields are ignored. */
export function parseCasesDraftNavigation(fragment: string | null, query: ParamMap): ICasesDraftNavigation {
  const fallback = defaultCasesDraftNavigation();
  const selected = fragment ?? 'in-review';
  if (!Object.hasOwn(CASES_DRAFT_TABS, selected)) return fallback;
  const tab = selected as CasesDraftTab;
  const defaults = defaultCasesDraftNavigation(tab);
  const pageText = query.get('page') ?? '1';
  const sort = query.get('sort') ?? defaults.sort;
  const direction = query.get('direction') ?? defaults.direction;
  const columns: readonly string[] = CASES_DRAFT_TABS[tab].columns;
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
    direction: direction as CasesDraftSortDirection,
  };
}
