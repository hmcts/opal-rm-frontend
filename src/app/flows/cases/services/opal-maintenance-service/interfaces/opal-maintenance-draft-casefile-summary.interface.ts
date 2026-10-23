import type { CasesCreateCasefileCaseType } from '../../../cases-create-casefile/types/cases-create-casefile-case-type.type';
import type { OpalMaintenanceDraftCasefileStatus } from '../types/opal-maintenance-draft-casefile-status.type';
import type { IOpalMaintenanceDraftCasefileSnapshot } from './opal-maintenance-draft-casefile-snapshot.interface';

export interface IOpalMaintenanceDraftCasefileSummary {
  draft_casefile_id: number;
  business_unit_id: number;
  submitted_by: string;
  created_date: string;
  validated_date?: string | null;
  casefile_type: CasesCreateCasefileCaseType;
  casefile_status: OpalMaintenanceDraftCasefileStatus;
  casefile_status_date: string;
  casefile_snapshot: IOpalMaintenanceDraftCasefileSnapshot;
}
