import { DashboardPageType } from '../types/dashboard.type';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '@app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';

// Sections without a release mapping remain unavailable, regardless of user permissions.
export const DASHBOARD_SECTION_FEATURE_FLAGS: Partial<Record<DashboardPageType, readonly string[]>> = {
  cases: [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG],
};
