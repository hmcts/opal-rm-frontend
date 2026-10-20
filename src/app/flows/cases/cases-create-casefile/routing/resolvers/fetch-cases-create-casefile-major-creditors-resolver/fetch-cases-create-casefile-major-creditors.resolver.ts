import { CasesDraftCasefileStore } from '../../../../cases-draft/stores/cases-draft-casefile.store';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, Observable } from 'rxjs';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileMajorCreditorsResolver: ResolveFn<
  IOpalMaintenanceMajorCreditorReferenceDataResponse
> = (): Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse> => {
  const editable = inject(CasesCreateCasefileStore, { optional: true });
  const persisted = inject(CasesDraftCasefileStore, { optional: true });
  const assignment =
    editable?.orderTermAmendment()?.term.creditor ??
    editable?.orderTerms().find((term) => term.termId === editable.currentOrderTermId())?.creditor;
  const saved =
    editable?.submissionIntent() === 'amendment' && assignment?.type === 'major'
      ? persisted
          ?.references()
          ?.majorCreditors.find(
            (item) =>
              item.major_creditor_id === assignment.majorCreditorId &&
              item.business_unit_id === OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID &&
              !item.central_authority,
          )
      : null;
  return inject(OpalMaintenanceService)
    .getMajorCreditors({
      business_unit_id: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
      active: true,
      central_authority: false,
    })
    .pipe(
      map((response) => {
        const refData = response.refData.filter(
          (record) =>
            record.business_unit_id === OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID &&
            record.active &&
            !record.central_authority &&
            Number.isInteger(record.major_creditor_id) &&
            record.major_creditor_id > 0,
        );
        if (saved && !refData.some((item) => item.major_creditor_id === saved.major_creditor_id)) refData.push(saved);
        return { count: refData.length, refData };
      }),
    );
};
