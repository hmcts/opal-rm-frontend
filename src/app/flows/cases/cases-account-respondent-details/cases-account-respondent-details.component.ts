import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomDeferredLiveRegionAnnouncement } from '@hmcts/opal-frontend-common/components/custom/custom-deferred-live-region-announcement';
import {
  MojAlertComponent,
  MojAlertContentComponent,
  MojAlertHeadingComponent,
  MojAlertIconComponent,
  MojAlertTextComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-alert';
import { MojSubNavigationComponent } from '@hmcts/opal-frontend-common/components/moj/moj-sub-navigation';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { RespondentAccountAtAGlanceComponent } from './components/respondent-account-at-a-glance/respondent-account-at-a-glance.component';
import { RespondentAccountHeaderComponent } from './components/respondent-account-header/respondent-account-header.component';
import {
  RESPONDENT_ACCOUNT_DETAILS_FLAG,
  type RespondentAccountActionInfo,
  respondentAccountReturnFragment,
  respondentAccountRouteId,
  respondentAccountTab,
} from './routing/cases-account-respondent-navigation';
import {
  RespondentAccountDetailsState,
  type RespondentAccountReadKind,
} from './services/respondent-account-details-state.service';

const headingId = 'respondent-account-heading';

@Component({
  selector: 'app-cases-account-respondent-details',
  imports: [
    RouterLink,
    NgTemplateOutlet,
    MojSubNavigationComponent,
    MojAlertComponent,
    MojAlertContentComponent,
    MojAlertHeadingComponent,
    MojAlertIconComponent,
    MojAlertTextComponent,
    CustomDeferredLiveRegionAnnouncement,
    RespondentAccountHeaderComponent,
    RespondentAccountAtAGlanceComponent,
  ],
  providers: [RespondentAccountDetailsState],
  templateUrl: './cases-account-respondent-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesAccountRespondentDetailsComponent {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(GlobalStore);
  private readonly focusIntent = signal<'refresh' | RespondentAccountReadKind | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly fragment = toSignal(this.route.fragment, { initialValue: this.route.snapshot.fragment });

  protected readonly state = inject(RespondentAccountDetailsState);
  protected readonly tab = computed(() => respondentAccountTab(this.fragment()));
  protected readonly tabs = [
    { key: 'at-a-glance', label: 'At a glance' },
    { key: 'respondent', label: 'Respondent' },
    { key: 'authority', label: 'Authority' },
  ] as const;
  protected readonly fragmentFor = respondentAccountReturnFragment;
  protected readonly actionInfo = computed<RespondentAccountActionInfo>(() => ({ returnTab: this.tab() }));
  protected readonly loadedHeader = computed(() => this.state.header().data?.body ?? null);
  protected readonly loadedSummary = computed(() => this.state.summary().data?.body ?? null);
  protected readonly showActions = computed(() => {
    const flags: Record<string, unknown> = this.store.featureFlags();
    return this.loadedHeader() !== null && flags[RESPONDENT_ACCOUNT_DETAILS_FLAG] === true;
  });
  protected readonly loading = computed(
    () => this.state.header().phase === 'loading' || this.state.summary().phase === 'loading',
  );
  protected readonly headerError = computed(() => ({
    $implicit: this.state.header().error,
    read: 'header' as const,
    label: 'respondent account header',
  }));
  protected readonly summaryError = computed(() => ({
    $implicit: this.state.summary().error,
    read: 'summary' as const,
    label: 'at a glance',
  }));

  constructor() {
    afterNextRender(() => {
      this.document.getElementById(headingId)?.focus();
      this.route.parent?.paramMap
        .pipe(
          map((params) => respondentAccountRouteId(params.get('respondentAccountId'))),
          filter((id) => id !== null),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((id) => {
          this.focusIntent.set(null);
          this.state.open(id, null);
        });
    });

    effect(() => this.restoreOperationFocus());
  }

  private restoreOperationFocus(): void {
    const intent = this.focusIntent();
    if (!intent) return;
    if (intent === 'refresh') {
      if (this.loading()) return;
      const target = this.state.freshness().confirmed
        ? 'respondent-account-freshness-confirmation'
        : 'respondent-account-refresh';
      this.focusAfterSettlement(target);
    } else {
      const phase = this.state[intent]().phase;
      if (phase === 'loading') return;
      this.focusAfterSettlement(phase === 'error' ? 'respondent-account-retry-' + intent : headingId);
    }
    this.focusIntent.set(null);
  }

  private focusAfterSettlement(id: string): void {
    afterNextRender(
      () => {
        if (this.document.activeElement === this.document.body) this.document.getElementById(id)?.focus();
      },
      { injector: this.injector },
    );
  }

  protected refreshAccount(): void {
    if (this.loading()) return;
    this.focusIntent.set('refresh');
    this.state.refresh();
  }

  protected retryRead(read: RespondentAccountReadKind): void {
    if (this.state[read]().phase !== 'error') return;
    this.focusIntent.set(read);
    this.state.retry(read);
  }

  protected dismissFreshness(): void {
    this.state.dismissConfirmation();
    this.focusAfterSettlement(headingId);
  }
}
