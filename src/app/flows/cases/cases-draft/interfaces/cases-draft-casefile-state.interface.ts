import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { ICasesCreateCasefileHydrationContext } from '../../cases-create-casefile/services/cases-create-casefile-payload/interfaces/cases-create-casefile-hydration-context.interface';
import type { ICasesDraftIdentity } from './cases-draft-identity.interface';

export interface ICasesDraftCasefileState {
  draft: IOpalMaintenanceDraftCasefileDetail | null;
  etag: string | null;
  identity: ICasesDraftIdentity | null;
  references: ICasesCreateCasefileHydrationContext | null;
  requiresReload: boolean;
}
