import type { RespondentAccountTab } from 'src/app/flows/cases/cases-account-respondent-details/routing/cases-account-respondent-navigation';

export const RespondentAccountDetailsSelectors = {
  header: '#respondent-account-header',
  heading: '#respondent-account-heading',
  accountNumber: '#respondent-account-number',
  loading: '#respondent-account-loading output[role="status"]',
  error: (read: 'header' | 'summary') => '#respondent-account-read-error-' + read,
  retry: (read: 'header' | 'summary') => '#respondent-account-retry-' + read,
  warning: '#respondent-account-freshness-warning',
  refresh: '#respondent-account-refresh',
  confirmation: '#respondent-account-freshness-confirmation',
  dismissFreshness: '#respondent-account-freshness-confirmation opal-lib-moj-alert-dismiss button',
  tab: (tab: RespondentAccountTab) => '#respondent-account-tab-' + tab,
  panel: (tab: RespondentAccountTab) => '#respondent-account-panel-' + tab,
  respondentRestriction: '#respondent-account-respondent-restriction',
  applicantRestriction: '#respondent-account-applicant-restriction',
  moreActionOptions: '#respondent-account-more-action-options',
  addNote: '#respondent-account-add-note',
  moreActions: '#respondent-account-more-actions button',
  changeCaseType: '#respondent-account-change-case-type',
  changeComment: '#respondent-account-change-comment',
  cancel: '#respondent-account-placeholder-cancel',
} as const;
