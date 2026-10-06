import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { catchError, defer, filter, map, Observable, take, takeUntil, throwError, throwIfEmpty } from 'rxjs';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileListResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import type { CasesDraftOutcomeTab } from '../types/cases-draft-tab.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from '../utils/cases-draft-identity';
import type { IOpalMaintenanceDraftCasefileCountResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-count-response.interface';
import { getCasesDraftTabMetadata } from '../utils/cases-draft-tab-metadata';
import { buildCasesDraftListParams } from '../utils/cases-draft-list-params';

/** Fresh, identity-scoped consultations; no casefile rows are retained in the service. */
@Injectable({ providedIn: 'root' })
export class CasesDraftDashboardService {
  private readonly mode = inject(CASES_DRAFT_DASHBOARD_MODE);
  private readonly api = inject(OpalMaintenanceService);
  private readonly dates = inject(DateService);
  private readonly globalStore = inject(GlobalStore);
  private readonly identity = computed(() => this.getIdentity());
  private readonly identityChanges$ = toObservable(this.identity);

  private consultCount(
    identity: ICasesDraftIdentity,
    source: () => Observable<IOpalMaintenanceDraftCasefileCountResponse>,
  ): Observable<number> {
    return defer(source).pipe(
      take(1),
      throwIfEmpty(),
      map((response) => response.count),
      catchError((error: unknown) => {
        this.reportError(error);
        return throwError(() => error);
      }),
      takeUntil(this.identityChanges$.pipe(filter(() => !sameCasesDraftIdentity(this.getIdentity(), identity)))),
    );
  }

  public getIdentity(): ICasesDraftIdentity | null {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    return this.globalStore.authenticated()
      ? resolveCasesDraftIdentity(
          this.globalStore.userState(),
          flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true,
          this.mode,
        )
      : null;
  }

  /** A changed identity cancels even an initial resolver request, without returning an empty success. */
  public getList(
    identity: ICasesDraftIdentity,
    tab: CasesDraftTab,
  ): Observable<IOpalMaintenanceDraftCasefileListResponse> {
    return defer(() =>
      this.api.getDraftCasefiles(buildCasesDraftListParams(identity, tab, this.dates.getDateRange(7, 0), this.mode)),
    ).pipe(
      take(1),
      throwIfEmpty(),
      catchError((error: unknown) => {
        this.reportError(error);
        return throwError(() => error);
      }),
      takeUntil(this.identityChanges$.pipe(filter(() => !sameCasesDraftIdentity(this.getIdentity(), identity)))),
    );
  }

  public getRejectedCount(identity: ICasesDraftIdentity): Observable<number> {
    return this.consultCount(identity, () => this.api.getRejectedDraftCasefileCount(identity));
  }

  /** Consults the independent outcome count in the injected dashboard scope, with no date restriction. */
  public getOutcomeCount(identity: ICasesDraftIdentity, tab: CasesDraftOutcomeTab): Observable<number> {
    return this.consultCount(identity, () =>
      this.api.getDraftCasefileCount({
        business_unit_id: identity.businessUnitId,
        ...(this.mode === 'checker'
          ? { not_submitted_by: identity.submittedBy }
          : { submitted_by: identity.submittedBy }),
        casefile_status: getCasesDraftTabMetadata(tab, this.mode).statuses,
      }),
    );
  }

  /** HTTP errors already use the application's interceptor; decoding/navigation errors need the same generic banner. */
  public reportError(error: unknown): void {
    if (error instanceof HttpErrorResponse) return;
    this.globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
  }
}
