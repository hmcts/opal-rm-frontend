import type { ICasesDraftDecisionNotice } from '../interfaces/cases-draft-decision-notice.interface';
import {
  MojAlertComponent,
  MojAlertContentComponent,
  MojAlertIconComponent,
  MojAlertTextComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-alert';
import { AsyncPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';
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

@Component({
  selector: 'app-cases-draft-check-and-validate-tabs',
  imports: [
    AsyncPipe,
    MojAlertComponent,
    MojAlertContentComponent,
    MojAlertIconComponent,
    MojAlertTextComponent,
    CustomPageHeaderComponent,
    MojSubNavigationComponent,
    MojNotificationBadgeComponent,
    CasesDraftTableComponent,
  ],
  templateUrl: './cases-draft-check-and-validate-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCheckAndValidateTabsComponent extends CasesDraftDashboardBaseComponent {
  private readonly decisionSuccess = signal<ICasesDraftDecisionNotice | null>(null);
  private readonly successInjector = inject(Injector);
  protected readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  protected readonly mode = 'checker';
  protected readonly identity = computed(() => this.data.getIdentity());
  public readonly successText = computed(() => {
    const notice = this.decisionSuccess();
    if (!notice || !this.isCurrentIdentity(notice.identity)) return null;
    return 'You have ' + notice.outcome + ' ' + notice.respondentName + '’s case.';
  });
  public readonly tabs: readonly CasesDraftTab[] = ['to-review', 'rejected', 'deleted', 'failed'];
  public readonly tabData$: Observable<ICasesDraftTabData | null>;
  public readonly outcomeCounts$: Observable<{
    identity: ICasesDraftIdentity;
    rejected: number | null;
    failed: number | null;
  } | null>;

  constructor() {
    super();
    this.decisionSuccess.set(this.navigation.consumeCheckerDecision());
    effect(() => {
      const identity = this.identity();
      untracked(() => {
        if (!sameCasesDraftIdentity(this.decisionSuccess()?.identity ?? null, identity)) this.decisionSuccess.set(null);
        if (!identity) this.navigation.clearCheckerDecision();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.decisionSuccess.set(null);
      this.navigation.clearCheckerDecision();
    });
    this.tabData$ = this.initialiseDashboard().tabData$;
    const resolvedList = this.activatedRoute.snapshot.data['draftCasefiles'] as ICasesDraftResolvedList | undefined;
    const resolvedIdentity = resolvedList?.identity ?? null;
    let pendingCounts: { rejected: number | null; failed: number | null } | undefined = resolvedList
      ? {
          rejected: this.activatedRoute.snapshot.data['rejectedCount'] ?? null,
          failed: this.activatedRoute.snapshot.data['failedCount'] ?? null,
        }
      : undefined;
    this.outcomeCounts$ = this.tabData$.pipe(
      switchMap((result) => {
        // A loading or failed list cancels badges before a success can clear its global error.
        if (!result?.rows || !this.isCurrentData(result)) return of(null);
        const { identity, tab, count } = result;
        const resolved = pendingCounts;
        pendingCounts = undefined;
        return combineLatest(
          (['rejected', 'failed'] as const).map((outcome) => {
            if (tab === outcome) return of(count);
            if (resolved && sameCasesDraftIdentity(identity, resolvedIdentity)) return of(resolved[outcome]);
            return this.data.getOutcomeCount(identity, outcome).pipe(
              startWith<number | null>(null),
              catchError(() => of(null)),
            );
          }),
        ).pipe(map(([rejected, failed]) => ({ identity, rejected, failed })));
      }),
      takeUntilDestroyed(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  public dismissSuccess(): void {
    this.decisionSuccess.set(null);
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.successInjector });
  }

  public async openRow(id: number): Promise<void> {
    await this.navigate(
      this.navigation.placeholderUrl(this.navigation.selection().tab === 'to-review' ? 'review' : 'view', id),
    );
  }
}
