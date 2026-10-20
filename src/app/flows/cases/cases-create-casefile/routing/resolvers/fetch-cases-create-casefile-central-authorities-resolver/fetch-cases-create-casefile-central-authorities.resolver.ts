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
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileCentralAuthoritiesResolver: ResolveFn<
  IOpalMaintenanceMajorCreditorReferenceDataResponse
> = (): Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);
  const editable = inject(CasesCreateCasefileStore, { optional: true });
  const persisted = inject(CasesDraftCasefileStore, { optional: true });
  const selected = editable?.centralAuthorityDetails()?.majorCreditor?.major_creditor_id;
  const saved =
    editable?.submissionIntent() === 'amendment'
      ? persisted
          ?.references()
          ?.majorCreditors.find(
            (item) =>
              item.major_creditor_id === selected &&
              item.business_unit_id === OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID &&
              item.central_authority,
          )
      : null;

  return inject(OpalMaintenanceService)
    .getMajorCreditors({
      business_unit_id: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
      central_authority: true,
      active: true,
    })
    .pipe(
      map((response) =>
        saved && !response.refData.some((item) => item.major_creditor_id === saved.major_creditor_id)
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
