import { HttpErrorResponse } from '@angular/common/http';
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
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GovukButtonDirective } from '@hmcts/opal-frontend-common/directives/govuk-button';
import type { SortDirectionType } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import { CasesDraftTableComponent } from '../../cases-draft-table/cases-draft-table.component';
import { CASES_DRAFT_ALL_REJECTED } from '../../constants/cases-draft-all-rejected.constant';
import type { ICasesDraftIdentity } from '../../interfaces/cases-draft-identity.interface';
import type { ICasesDraftNavigation } from '../../interfaces/cases-draft-navigation.interface';
import type { ICasesDraftResubmissionSuccess } from '../../interfaces/cases-draft-resubmission-success.interface';
import type { CasesDraftSortColumn } from '../../types/cases-draft-sort-column.type';
import type { CasesDraftAllRejectedResolvedState } from '../../types/cases-draft-all-rejected-resolved-state.type';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../../services/cases-draft-navigation.service';
import { sameCasesDraftIdentity } from '../../utils/cases-draft-identity';

@Component({
  selector: 'app-cases-draft-create-and-manage-view-all-rejected',
  imports: [GovukButtonDirective, CasesDraftTableComponent],
  templateUrl: './cases-draft-create-and-manage-view-all-rejected.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCreateAndManageViewAllRejectedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly data = inject(CasesDraftDashboardService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  private readonly success = signal<ICasesDraftResubmissionSuccess | null>(null);
  private readonly resolving = signal(false);
  private readonly terminalFailure = signal(false);
  private readonly attemptedIdentity = signal<ICasesDraftIdentity | null>(null);
  private readonly navigationInFlight = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private resolveOperation = 0;
  private readonly identity = computed(() => this.data.getIdentity());
  private readonly resolved = computed(
    () => this.routeData()['allRejectedCasefiles'] as CasesDraftAllRejectedResolvedState | undefined,
  );
  public readonly navigation = inject(CasesDraftNavigationService);
  public readonly copy = CASES_DRAFT_ALL_REJECTED;
  public readonly backHref = computed(() => this.router.serializeUrl(this.navigation.allRejectedDashboardUrl()));
  public readonly state = computed(() => {
    const identity = this.identity();
    if (!identity || this.terminalFailure()) return null;
    if (this.resolving()) return { status: 'loading' as const, identity };
    const resolved = this.resolved();
    return resolved && sameCasesDraftIdentity(resolved.identity, identity) ? resolved : null;
  });
  public readonly tableSelection = computed<ICasesDraftNavigation>(() => ({
    tab: 'rejected',
    ...this.navigation.allRejectedSelection(),
  }));
  public readonly successText = computed(() => {
    const event = this.success();
    if (!event || this.terminalFailure() || !sameCasesDraftIdentity(event.identity, this.identity())) return null;
    return `You have submitted ${event.respondentForename} ${event.respondentSurname}'s case for review.`;
  });

  constructor() {
    this.success.set(this.navigation.consumeAllRejectedResubmission());
    effect(() => {
      const identity = this.identity();
      const resolved = this.resolved();
      const attempted = this.attemptedIdentity();
      untracked(() => {
        if (!sameCasesDraftIdentity(this.success()?.identity ?? null, identity)) this.success.set(null);
        if (!identity) {
          this.success.set(null);
          this.navigation.clearAllRejectedSuccess();
          void this.denyAccess();
        } else if (
          resolved &&
          !sameCasesDraftIdentity(resolved.identity, identity) &&
          !sameCasesDraftIdentity(attempted, identity)
        ) {
          void this.resolveAgain(identity);
        }
      });
    });
    effect(() => {
      const current = this.state();
      if (current?.status !== 'success') return;
      const selection = this.navigation.allRejectedSelection();
      const page = Math.max(1, Math.min(selection.page, Math.ceil(current.rows.length / this.copy.pageSize)));
      if (page !== selection.page) untracked(() => this.navigation.setAllRejectedSelection({ ...selection, page }));
      if (!current.rows.length) this.focusHeading();
    });
    this.focusHeading();
    this.destroyRef.onDestroy(() => {
      this.resolveOperation++;
      this.success.set(null);
      this.navigation.clearAllRejectedSuccess();
    });
  }
  private focusHeading(): void {
    afterNextRender(
      () => {
        this.heading()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
  private restoreFocus(element: Element | null, identity: ICasesDraftIdentity | null): void {
    if (
      !this.destroyRef.destroyed &&
      sameCasesDraftIdentity(identity, this.identity()) &&
      element instanceof HTMLElement &&
      element.isConnected
    )
      element.focus();
  }
  private async denyAccess(): Promise<void> {
    if (this.router.url === '/access-denied') return;
    try {
      await this.router.navigateByUrl('/access-denied');
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) this.data.reportError(error);
    }
  }
  private async resolveAgain(identity: ICasesDraftIdentity, focus = false): Promise<void> {
    const operation = ++this.resolveOperation;
    this.attemptedIdentity.set({ ...identity });
    this.terminalFailure.set(false);
    if (focus) this.heading()?.nativeElement.focus();
    this.resolving.set(true);
    try {
      await this.router.navigateByUrl(this.router.url, {
        onSameUrlNavigation: 'reload',
      });
    } catch (error: unknown) {
      if (this.destroyRef.destroyed || operation !== this.resolveOperation) return;
      if (
        error instanceof HttpErrorResponse &&
        ([401, 403].includes(error.status) || error.error?.retriable === false)
      ) {
        this.terminalFailure.set(true);
        this.success.set(null);
      }
      this.data.reportError(error);
    } finally {
      if (!this.destroyRef.destroyed && operation === this.resolveOperation) {
        this.resolving.set(false);
        if (focus) this.focusHeading();
      }
    }
  }
  public retry(): void {
    const identity = this.identity();
    if (!this.destroyRef.destroyed && identity && this.state()?.status === 'failure' && !this.resolving())
      void this.resolveAgain(identity, true);
  }
  public changeSort(change: { key: CasesDraftSortColumn; direction: SortDirectionType }): void {
    if (this.state()?.status !== 'success' || change.direction === 'none') return;
    const sort = this.copy.columns.find((column) => column === change.key);
    if (sort)
      this.navigation.setAllRejectedSelection({
        page: 1,
        sort,
        direction: change.direction,
      });
  }
  public changePage(page: number): void {
    const state = this.state();
    if (state?.status !== 'success' || !Number.isSafeInteger(page)) return;
    const clamped = Math.max(1, Math.min(page, Math.ceil(state.rows.length / this.copy.pageSize)));
    this.navigation.setAllRejectedSelection({
      ...this.navigation.allRejectedSelection(),
      page: clamped,
    });
  }
  public async openRow(id: number): Promise<void> {
    const state = this.state();
    if (
      state?.status !== 'success' ||
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !state.rows.some((row) => row.id === id) ||
      this.navigationInFlight()
    )
      return;
    const focus = document.activeElement;
    const identity = this.identity();
    this.navigationInFlight.set(true);
    try {
      const accepted = await this.navigation.navigateToPlaceholder('details', id, 'all-rejected');
      if (!accepted) this.restoreFocus(focus, identity);
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) this.data.reportError(error);
      this.restoreFocus(focus, identity);
    } finally {
      if (!this.destroyRef.destroyed) this.navigationInFlight.set(false);
    }
  }
  public async backToYourCases(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const focus = document.activeElement;
    const identity = this.identity();
    try {
      const accepted = await this.navigation.returnFromAllRejected();
      if (!accepted) this.restoreFocus(focus, identity);
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) this.data.reportError(error);
      this.restoreFocus(focus, identity);
    }
  }
  public dismissSuccess(): void {
    this.success.set(null);
    this.focusHeading();
  }
}
