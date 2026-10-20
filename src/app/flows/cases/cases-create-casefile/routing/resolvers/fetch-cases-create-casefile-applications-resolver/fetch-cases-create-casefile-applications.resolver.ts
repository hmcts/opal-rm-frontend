import { CasesDraftCasefileStore } from '../../../../cases-draft/stores/cases-draft-casefile.store';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { filter, map, Observable, tap } from 'rxjs';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileApplicationsResolver: ResolveFn<
  IOpalMaintenanceApplicationReferenceDataResponse
> = (): Observable<IOpalMaintenanceApplicationReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);
  const editable = inject(CasesCreateCasefileStore, { optional: true });
  const persisted = inject(CasesDraftCasefileStore, { optional: true });
  const selected = editable?.orderDetails()?.applicationId;
  const saved =
    editable?.submissionIntent() === 'amendment'
      ? persisted?.references()?.applications.find((item) => item.application_id === selected)
      : null;

  return inject(OpalMaintenanceService)
    .getMaintenanceApplications()
    .pipe(
      map((response) =>
        saved && !response.refData.some((item) => item.application_id === saved.application_id)
          ? { ...response, count: response.refData.length + 1, refData: [...response.refData, saved] }
          : response,
      ),
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
