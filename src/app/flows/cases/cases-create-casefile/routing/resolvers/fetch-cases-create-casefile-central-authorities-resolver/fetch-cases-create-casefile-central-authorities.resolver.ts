import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { filter, Observable, tap } from 'rxjs';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileCentralAuthoritiesResolver: ResolveFn<
  IOpalMaintenanceMajorCreditorReferenceDataResponse
> = (): Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);

  return inject(OpalMaintenanceService)
    .getMajorCreditors({
      business_unit_id: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
      central_authority: true,
      active: true,
    })
    .pipe(
      tap((response) => {
        if (response.refData.length === 0) {
          globalStore.setBannerError({
            ...GLOBAL_ERROR_STATE,
            error: true,
            title: GENERIC_HTTP_ERROR_TITLE,
            message: GENERIC_HTTP_ERROR_MESSAGE,
          });
        }
      }),
      filter((response) => response.refData.length > 0),
    );
};
