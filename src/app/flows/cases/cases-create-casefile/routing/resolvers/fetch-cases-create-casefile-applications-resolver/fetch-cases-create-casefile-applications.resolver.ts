import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { filter, Observable, tap } from 'rxjs';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileApplicationsResolver: ResolveFn<
  IOpalMaintenanceApplicationReferenceDataResponse
> = (): Observable<IOpalMaintenanceApplicationReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);

  return inject(OpalMaintenanceService)
    .getMaintenanceApplications()
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
