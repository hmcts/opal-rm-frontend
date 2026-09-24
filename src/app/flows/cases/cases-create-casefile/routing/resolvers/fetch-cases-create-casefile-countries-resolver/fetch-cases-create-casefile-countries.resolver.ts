import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { filter, Observable, tap } from 'rxjs';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';

export const fetchCasesCreateCasefileCountriesResolver: ResolveFn<
  IOpalMaintenanceCountryReferenceDataResponse
> = (): Observable<IOpalMaintenanceCountryReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);

  return inject(OpalMaintenanceService)
    .getCountries(true)
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
