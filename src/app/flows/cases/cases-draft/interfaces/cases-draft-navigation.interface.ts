import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftSortDirection } from '../types/cases-draft-sort-direction.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export interface ICasesDraftNavigation {
  tab: CasesDraftTab;
  page: number;
  sort: CasesDraftSortColumn;
  direction: CasesDraftSortDirection;
}
