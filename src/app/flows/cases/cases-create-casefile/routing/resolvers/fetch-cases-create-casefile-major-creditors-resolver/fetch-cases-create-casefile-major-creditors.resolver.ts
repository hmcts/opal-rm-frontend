import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, Observable } from 'rxjs';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileMajorCreditorsResolver: ResolveFn<
  IOpalMaintenanceMajorCreditorReferenceDataResponse
> = (): Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse> =>
  inject(OpalMaintenanceService)
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
        return { count: refData.length, refData };
      }),
    );
