import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { DRAFT_CASEFILE_RECOVERY_REQUEST } from './mocks/draft-casefile-request.mock';

/**
 * Clones the synthetic fixture and substitutes only the per-run marker and live references.
 * @param marker Exact E2E marker generated for this creation.
 * @param applicationCode Active Create Casefile application from the target environment.
 * @param countryCjsCode Unique active United Kingdom CJS code from the target environment.
 * @returns An independent request containing only client-owned creation fields.
 */
export function buildSyntheticDraftRequest(
  marker: string,
  applicationCode: string,
  countryCjsCode: number,
): IOpalMaintenanceDraftCasefileRequest {
  if (!/^E2E-[0-9a-f]{16}$/.test(marker)) throw new Error('Invalid fixture run marker');
  if (!applicationCode.trim() || applicationCode.length > 8) throw new Error('Invalid live application code');
  if (!Number.isSafeInteger(countryCjsCode) || countryCjsCode < 1 || countryCjsCode > 32767)
    throw new Error('Invalid live country CJS code');
  const request = structuredClone(DRAFT_CASEFILE_RECOVERY_REQUEST);
  request.casefile.respondent_account.application_code = applicationCode;
  request.casefile.respondent_account.remo_reference = marker;
  request.casefile.respondent_account.respondent.party_details.address.cjs_code = countryCjsCode;
  request.casefile.applicant.party_details.address.cjs_code = countryCjsCode;
  return request;
}
