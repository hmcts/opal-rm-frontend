import { InjectionToken } from '@angular/core';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';

export const CASES_DRAFT_DASHBOARD_MODE = new InjectionToken<CasesDraftDashboardMode>('Cases draft dashboard mode', {
  providedIn: 'root',
  factory: () => 'inputter',
});
