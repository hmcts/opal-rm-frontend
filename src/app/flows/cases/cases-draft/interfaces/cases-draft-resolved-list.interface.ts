import type { IOpalMaintenanceDraftCasefileListResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export interface ICasesDraftResolvedList {
  identity: ICasesDraftIdentity;
  tab: CasesDraftTab;
  response: IOpalMaintenanceDraftCasefileListResponse;
}
