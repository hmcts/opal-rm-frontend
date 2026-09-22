import { InjectionToken } from '@angular/core';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED } from '../config/cases-create-casefile-mock.config';

export const CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN = new InjectionToken<boolean>('Casefile local mock enabled', {
  providedIn: 'root',
  factory: () => CASES_CREATE_CASEFILE_MOCK_ENABLED,
});
