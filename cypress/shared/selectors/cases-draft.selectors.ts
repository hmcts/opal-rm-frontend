import type { CasesDraftTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
export const CasesDraftSelectors = {
  heading: '#cases-draft-heading',
  tab: (tab: CasesDraftTab) => '#cases-draft-' + tab + '-tab',
  empty: '#cases-draft-empty',
  row: (id: number) => '[data-draft-id="' + id + '"]',
  column: (key: string) => '[data-column="' + key + '"]',
  sort: (key: string) => 'th[columnKey="' + key + '"] button',
  pagination: '#cases-draft-pagination',
  create: '#cases-draft-create',
  allRejected: '#cases-draft-all-rejected',
  obsoleteLocalControls:
    '#cases-draft-list-retry, #cases-draft-badge-retry, #cases-draft-list-error, #cases-draft-badge-error, #cases-draft-navigation-error',
  rejectedCount: '#cases-draft-rejected-count',
  loading: '#cases-draft-loading',
  selectedHeading: '#cases-draft-selected-heading',
  tabs: '#cases-draft-tabs',
  table: 'app-cases-draft-table',
  scrollRegion: '#cases-draft-table-scroll',
  pageStatus: 'app-cases-draft-table output',
};
