import { CASES_ACCOUNT_RESPONDENT_ROUTING_PATHS } from './constants/cases-account-respondent-routing-paths.constant';

export const RESPONDENT_ACCOUNT_ROUTE = `/${CASES_ACCOUNT_RESPONDENT_ROUTING_PATHS.root}`;
export const RESPONDENT_ACCOUNT_DETAILS_FLAG = 'release-1c-rm-account-details';

export type RespondentAccountTab = 'at-a-glance' | 'respondent' | 'authority';

export interface RespondentAccountActionInfo {
  returnTab: RespondentAccountTab;
  comment?: 'add' | 'change';
}

export function respondentAccountTab(value: unknown): RespondentAccountTab {
  return value === 'authority' || value === 'respondent' ? value : 'at-a-glance';
}

export function respondentAccountReturnFragment(tab: RespondentAccountTab): string | undefined {
  return tab === 'at-a-glance' ? undefined : tab;
}

export function respondentAccountRouteId(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
