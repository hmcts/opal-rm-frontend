import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { catchError, defaultIfEmpty, defer, EMPTY, map, of, switchMap, take } from 'rxjs';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../../../cases-create-casefile-order-details/constants/cases-create-casefile-order-details-payment-frequencies.constant';
import type { ICasesCreateCasefileOrderTermPage } from '../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import { CasesCreateCasefileOrderTermLookupsService } from '../../../cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { mapOrderTermParameters } from '../../../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';

export const fetchCasesCreateCasefileOrderTermResolver: ResolveFn<ICasesCreateCasefileOrderTermPage> = (route) => {
  const service = inject(OpalMaintenanceService);
  const lookupService = inject(CasesCreateCasefileOrderTermLookupsService);
  const store = inject(CasesCreateCasefileStore);
  const globalStore = inject(GlobalStore);
  const resultId = route.paramMap.get('resultId');
  const reject = (): never => {
    throw new Error('Unusable order-term data');
  };

  return defer(() => (resultId ? service.getResult(resultId) : of(null))).pipe(
    take(1),
    defaultIfEmpty(null),
    switchMap((detail) => {
      if (
        !detail ||
        detail.result_id !== resultId ||
        detail.active !== true ||
        detail.order_term !== true ||
        typeof detail.result_title !== 'string' ||
        !detail.result_title.trim() ||
        typeof detail.result_parameters !== 'string'
      ) {
        return reject();
      }

      const fields = mapOrderTermParameters(detail.result_parameters);
      if (
        fields.some((field) => field.kind === 'readonly') &&
        !CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.some(
          (value) => value === store.orderDetails()?.paymentFrequency,
        )
      ) {
        return reject();
      }

      return lookupService.resolve(fields).pipe(
        take(1),
        defaultIfEmpty(null),
        map((resolved) => {
          if (
            !resolved ||
            resolved.some((field) => ['select', 'radio', 'autocomplete'].includes(field.kind) && !field.options.length)
          ) {
            return reject();
          }
          return { resultId: detail.result_id, title: detail.result_title.trim(), fields: resolved };
        }),
      );
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        globalStore.setBannerError({
          ...GLOBAL_ERROR_STATE,
          error: true,
          title: GENERIC_HTTP_ERROR_TITLE,
          message: GENERIC_HTTP_ERROR_MESSAGE,
        });
      }
      return EMPTY;
    }),
  );
};
