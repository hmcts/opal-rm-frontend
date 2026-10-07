import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { RedirectCommand, Router, type ResolveFn } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { catchError, defaultIfEmpty, defer, EMPTY, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CasesCreateCasefileOrderTermLookupsService } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { mapOrderTermParameters } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import { mapPersistedCasefile } from '../../../cases-create-casefile/services/cases-create-casefile-payload/utils/map-casefile/cases-create-casefile-payload-map-state';
import type { ICasesCreateCasefileOrderTermPage } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import type { ICasesDraftCasefileResolved } from '../../interfaces/cases-draft-casefile-resolved.interface';
import type { CasesDraftCasefileIntent } from '../../types/cases-draft-casefile-intent.type';
import type { CasesDraftDashboardMode } from '../../types/cases-draft-dashboard-mode.type';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from '../../utils/cases-draft-identity';
import { canReviewDraftCasefile, resolveCasesDraftReadIdentity } from '../../utils/cases-draft-casefile-permissions';

class CasefileAccessDenied extends Error {}

function savedResultPages(
  resultIds: string[],
  maintenance: OpalMaintenanceService,
  lookups: CasesCreateCasefileOrderTermLookupsService,
): Observable<ICasesCreateCasefileOrderTermPage[]> {
  if (!resultIds.length) return of([]);
  return forkJoin(
    resultIds.map((resultId) =>
      maintenance.getResult(resultId).pipe(
        take(1),
        defaultIfEmpty(null),
        switchMap((detail) => {
          if (
            !detail ||
            detail.result_id !== resultId ||
            !detail.result_title?.trim() ||
            typeof detail.result_parameters !== 'string'
          )
            throw new Error('Unusable saved result');
          const title = detail.result_title.trim();
          return lookups.resolve(mapOrderTermParameters(detail.result_parameters)).pipe(
            take(1),
            defaultIfEmpty(null),
            map((fields) => {
              if (
                !fields?.length ||
                fields.some(
                  (field) => ['select', 'radio', 'autocomplete'].includes(field.kind) && !field.options.length,
                )
              )
                throw new Error('Unusable saved result options');
              return { resultId, title, fields };
            }),
          );
        }),
      ),
    ),
  );
}

function routeIntent(value: unknown): CasesDraftCasefileIntent {
  if (value !== 'inputter-view' && value !== 'checker-view' && value !== 'checker-review' && value !== 'checker-delete')
    throw new Error('Unusable casefile intent');
  return value;
}

function routeId(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new Error('Unusable casefile ID');
  return Number(value);
}

/** Load and authorise a complete saved presentation without mutating either casefile store. */
export const casesDraftCasefileResolver: ResolveFn<ICasesDraftCasefileResolved> = (route) => {
  const maintenance = inject(OpalMaintenanceService);
  const lookups = inject(CasesCreateCasefileOrderTermLookupsService);
  const globalStore = inject(GlobalStore);
  const router = inject(Router);
  const isReleased = (): boolean => {
    const flags: Record<string, unknown> = globalStore.featureFlags();
    return flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true;
  };
  const readIdentity = () =>
    globalStore.authenticated() ? resolveCasesDraftReadIdentity(globalStore.userState(), isReleased()) : null;
  const denied = () => new RedirectCommand(router.parseUrl('/error/permission-denied'));

  return defer(() => {
    const identity = readIdentity();
    if (!identity) throw new CasefileAccessDenied();
    const id = routeId(route.paramMap.get('draftCasefileId'));
    const intent = routeIntent(route.data['casefileIntent']);
    const context: CasesDraftDashboardMode = intent === 'inputter-view' ? 'inputter' : 'checker';
    return maintenance.getDraftCasefile(id).pipe(
      take(1),
      defaultIfEmpty(null),
      switchMap((response) => {
        if (!response) throw new Error('Unusable saved casefile');
        const { draft, etag } = response;
        if (draft.business_unit_id !== identity.businessUnitId) throw new CasefileAccessDenied();
        if (draft.draft_casefile_id !== id) throw new Error('Unusable saved casefile ID');
        if (intent === 'checker-delete' && !canReviewDraftCasefile(draft, globalStore.userState(), isReleased()))
          throw new CasefileAccessDenied();
        const resultIds = [
          ...new Set(draft.casefile.respondent_account.order_details.order_terms.map((term) => term.result_id)),
        ];
        return forkJoin({
          countries: maintenance.getCountries(null).pipe(take(1), defaultIfEmpty(null)),
          applications: maintenance.getMaintenanceApplications(null).pipe(take(1), defaultIfEmpty(null)),
          majorCreditors: maintenance
            .getMajorCreditors({ business_unit_id: draft.business_unit_id })
            .pipe(take(1), defaultIfEmpty(null)),
          pages: savedResultPages(resultIds, maintenance, lookups),
        }).pipe(
          map((resolved) => {
            if (!sameCasesDraftIdentity(readIdentity(), identity)) throw new CasefileAccessDenied();
            const eligible = canReviewDraftCasefile(draft, globalStore.userState(), isReleased());
            if (intent === 'checker-delete' && !eligible) throw new CasefileAccessDenied();
            if (!resolved.countries || !resolved.applications || !resolved.majorCreditors)
              throw new Error('Unusable saved references');
            const references = {
              countries: resolved.countries.refData,
              applications: resolved.applications.refData,
              majorCreditors: resolved.majorCreditors.refData,
              resultPages: Object.fromEntries(resolved.pages.map((page) => [page.resultId, page])),
            };
            const state = mapPersistedCasefile(draft, references);
            const fallback: CasesDraftDashboardMode = context === 'inputter' ? 'checker' : 'inputter';
            const dashboardMode = resolveCasesDraftIdentity(globalStore.userState(), isReleased(), context)
              ? context
              : fallback;
            const mode = eligible && (intent === 'checker-review' || intent === 'checker-delete') ? 'review' : 'view';
            return {
              draft,
              etag,
              references,
              state,
              identity,
              intent,
              mode,
              context,
              dashboardMode,
            } satisfies ICasesDraftCasefileResolved;
          }),
        );
      }),
    );
  }).pipe(
    catchError((error: unknown) => {
      if (error instanceof CasefileAccessDenied) return of(denied());
      if (!(error instanceof HttpErrorResponse))
        globalStore.setBannerError({
          ...GLOBAL_ERROR_STATE,
          error: true,
          title: GENERIC_HTTP_ERROR_TITLE,
          message: GENERIC_HTTP_ERROR_MESSAGE,
        });
      return EMPTY;
    }),
  );
};
