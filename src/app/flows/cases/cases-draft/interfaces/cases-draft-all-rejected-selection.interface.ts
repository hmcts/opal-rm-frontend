import type { SortDirectionType } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import { CASES_DRAFT_ALL_REJECTED } from '../constants/cases-draft-all-rejected.constant';
export interface ICasesDraftAllRejectedSelection {
  page: number;
  sort: (typeof CASES_DRAFT_ALL_REJECTED.columns)[number];
  direction: SortDirectionType;
}
