import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { SortDirectionType } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export interface ICasesDraftNavigation {
  tab: CasesDraftTab;
  page: number;
  sort: CasesDraftSortColumn;
  direction: SortDirectionType;
}
