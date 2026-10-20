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
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';

export const fetchCasesCreateCasefileCountriesResolver: ResolveFn<IOpalMaintenanceCountryReferenceDataResponse> = (
  route,
): Observable<IOpalMaintenanceCountryReferenceDataResponse> => {
  const globalStore = inject(GlobalStore);
  const editable = inject(CasesCreateCasefileStore, { optional: true });
  const persisted = inject(CasesDraftCasefileStore, { optional: true });
  const path = route.routeConfig?.path ?? '';
  const respondent = path === 'respondent-details' ? editable?.respondentDetails() : null;
  const applicant = path.startsWith('applicant-details/') ? editable?.applicantDetails() : null;
  const currentTerm = editable?.orderTerms().find((term) => term.termId === editable.currentOrderTermId());
  const assignment = currentTerm?.creditor;
  const minor =
    path.endsWith('minor-creditor-details') && assignment?.type === 'minor'
      ? editable?.minorCreditors().find((item) => item.sequenceNumber === assignment.sequenceNumber)
      : null;
  const selected = [
    respondent?.contactDetails.address.countryId,
    respondent?.thirdParty?.address.countryId,
    respondent?.employer?.address.countryId,
    applicant?.contactDetails.address.countryId,
    applicant && 'thirdParty' in applicant ? applicant.thirdParty?.address.countryId : undefined,
    minor?.details.address.countryId,
  ];
  const saved =
    editable?.submissionIntent() === 'amendment'
      ? (persisted?.references()?.countries.filter((item) => selected.includes(item.country_id)) ?? [])
      : [];

  return inject(OpalMaintenanceService)
    .getCountries(true)
    .pipe(
      map((response) => {
        const refData = [
          ...response.refData,
          ...saved.filter((item) => !response.refData.some((current) => current.country_id === item.country_id)),
        ];
        return { ...response, count: refData.length, refData };
      }),
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
