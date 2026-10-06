import { HttpContextToken } from '@angular/common/http';

/** Checker request ownership includes safe reporting, explicit Retry and terminal access denial. */
export const CASES_DRAFT_CHECKER_HTTP_ERROR = new HttpContextToken<boolean>(() => false);
