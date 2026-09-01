import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { filter, Observable, tap } from 'rxjs';
import { CasesCreateCasefileCountryService } from '../../../services/cases-create-casefile-country.service';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../../../services/interfaces/cases-create-casefile-country-reference-data-response.interface';

export const fetchCasesCreateCasefileCountriesResolver: ResolveFn<
  ICasesCreateCasefileCountryReferenceDataResponse
> = (): Observable<ICasesCreateCasefileCountryReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);

  return inject(CasesCreateCasefileCountryService)
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
