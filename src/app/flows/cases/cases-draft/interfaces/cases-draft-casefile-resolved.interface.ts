import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { ICasesCreateCasefileHydrationContext } from '../../cases-create-casefile/services/cases-create-casefile-payload/interfaces/cases-create-casefile-hydration-context.interface';
import type { ICasesCreateCasefileState } from '../../cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
import type { CasesDraftCasefileIntent } from '../types/cases-draft-casefile-intent.type';
import type { CasesDraftCasefileMode } from '../types/cases-draft-casefile-mode.type';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';

export interface ICasesDraftCasefileResolved {
  draft: IOpalMaintenanceDraftCasefileDetail;
  etag: string;
  references: ICasesCreateCasefileHydrationContext;
  state: ICasesCreateCasefileState;
  identity: ICasesDraftIdentity;
  intent: CasesDraftCasefileIntent;
  mode: CasesDraftCasefileMode;
  context: CasesDraftDashboardMode;
  dashboardMode: CasesDraftDashboardMode;
}
