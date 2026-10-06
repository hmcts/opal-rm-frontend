import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';

export interface CasesDraftTabMetadata {
  label: string;
  statuses: string;
  defaultSort: CasesDraftSortColumn;
  columns: readonly CasesDraftSortColumn[];
  empty: string;
  statusDateLabel?: string;
}
