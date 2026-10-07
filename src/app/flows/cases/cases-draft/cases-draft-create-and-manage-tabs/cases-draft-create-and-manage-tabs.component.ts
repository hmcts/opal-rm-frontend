import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, viewChild, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  map,
  merge,
  Observable,
  of,
  skip,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import { GovukButtonDirective } from '@hmcts/opal-frontend-common/directives/govuk-button';
import { CustomPageHeaderComponent } from '@hmcts/opal-frontend-common/components/custom/custom-page-header';
import { MojSubNavigationComponent } from '@hmcts/opal-frontend-common/components/moj/moj-sub-navigation';
import { MojNotificationBadgeComponent } from '@hmcts/opal-frontend-common/components/moj/moj-notification-badge';
import { CasesDraftDashboardBaseComponent } from '../components/abstract/cases-draft-dashboard-base/cases-draft-dashboard-base.component';
import { CasesDraftTableComponent } from '../cases-draft-table/cases-draft-table.component';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftResolvedList } from '../interfaces/cases-draft-resolved-list.interface';
import type { ICasesDraftTabData } from '../interfaces/cases-draft-tab-data.interface';
import { sameCasesDraftIdentity } from '../utils/cases-draft-identity';

import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../../cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-draft-create-and-manage-tabs',
  imports: [
    AsyncPipe,
    CustomPageHeaderComponent,
    GovukButtonDirective,
    MojSubNavigationComponent,
    MojNotificationBadgeComponent,
    CasesDraftTableComponent,
  ],
  templateUrl: './cases-draft-create-and-manage-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCreateAndManageTabsComponent extends CasesDraftDashboardBaseComponent {
  private readonly httpDenied = signal(false);
  protected readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  protected readonly mode = 'inputter';
  protected readonly identity = computed(() => (this.httpDenied() ? null : this.data.getIdentity()));
  public readonly tabs: readonly CasesDraftTab[] = ['in-review', 'rejected', 'approved', 'deleted'];
  public readonly allRejectedUrl = computed(() =>
    this.dashboardRouter.serializeUrl(this.navigation.placeholderUrl('rejections')),
  );
  public readonly tabData$: Observable<ICasesDraftTabData | null>;
  public readonly rejectedCount$: Observable<{ identity: ICasesDraftIdentity; count: number | null }>;

  constructor() {
    super();
    const { identity$, tab$, tabData$ } = this.initialiseDashboard((error) => this.handleRequestError(error));
    this.tabData$ = tabData$;
    const resolvedList = this.activatedRoute.snapshot.data['draftCasefiles'] as ICasesDraftResolvedList | undefined;
    const resolvedIdentity = resolvedList?.identity ?? null;
    const resolvedCount = this.activatedRoute.snapshot.data['rejectedCount'] as number | null | undefined;
    const initialCount$ = identity$.pipe(
      withLatestFrom(tab$),
      switchMap(([identity, tab]) => {
        if (!identity) return of(null);
        // Without resolver data, Rejected still supplies its own badge count from the selected list.
        if (tab === 'rejected') return of({ identity, count: null });
        if (sameCasesDraftIdentity(identity, resolvedIdentity)) return of({ identity, count: resolvedCount ?? null });
        return this.data.getRejectedCount(identity).pipe(
          map((count) => ({ identity, count })),
          startWith({ identity, count: null }),
          takeUntil(tab$.pipe(skip(1))),
          catchError((error: unknown) => {
            this.handleRequestError(error);
            return of({ identity, count: null });
          }),
        );
      }),
    );
    this.rejectedCount$ = merge(
      initialCount$,
      this.tabData$.pipe(
        filter((result): result is ICasesDraftTabData => result?.tab === 'rejected' && result.count !== null),
        map(({ identity, count }) => ({ identity, count })),
      ),
    ).pipe(
      filter((result) => result !== null),
      takeUntilDestroyed(),
    );
  }

  private handleRequestError(error: unknown): void {
    if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) {
      this.httpDenied.set(true);
    }
  }
  public async openRow(id: number): Promise<void> {
    await this.navigate(this.navigation.placeholderUrl('details', id));
  }
  public async openAllRejected(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await this.navigate(this.navigation.placeholderUrl('rejections'));
  }
  public async startNewCase(): Promise<void> {
    this.navigation.rememberCreateOrigin();
    await this.navigate(
      '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
      { state: { startNewCase: true, focusCaseTypeHeading: true } },
    );
  }
}
