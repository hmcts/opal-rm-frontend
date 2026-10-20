import {
  afterNextRender,
  effect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, defaultIfEmpty, firstValueFrom, take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukButtonDirective } from '@hmcts/opal-frontend-common/directives/govuk-button';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { canReviewDraftCasefile, resolveCasesDraftReadIdentity } from '../utils/cases-draft-casefile-permissions';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { isUsableDraftCasefileEtag } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-etag';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftDeletionAttempt } from '../interfaces/cases-draft-deletion-attempt.interface';
import type { ICasesDraftDeletionNotice } from '../interfaces/cases-draft-deletion-notice.interface';
import { CASES_DRAFT_DELETION_COPY } from '../constants/cases-draft-deletion-copy.constant';
import { CASES_DRAFT_DELETE_CANCEL_NAVIGATION_INFO } from '../constants/cases-draft-delete-cancel-navigation-info.constant';
import { readCasesDraftDeletionReceipt } from '../utils/cases-draft-deletion-receipt';
import { casefileStatusLabel } from '../utils/cases-draft-casefile-history';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from '../utils/cases-draft-identity';

const meaningfulReason: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

@Component({
  selector: 'app-cases-draft-delete',
  host: { id: 'create_casefile_delete_page' },
  imports: [
    ReactiveFormsModule,
    GovukErrorSummaryComponent,
    GovukTextAreaComponent,
    GovukCancelLinkComponent,
    GovukButtonDirective,
  ],
  templateUrl: './cases-draft-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftDeleteComponent extends AbstractFormBaseComponent {
  private readonly deleteRouter = inject(Router);
  private readonly deleteInjector = inject(Injector);
  private readonly deleteElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly maintenance = inject(OpalMaintenanceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(CasesDraftNavigationService);
  private readonly store = inject(CasesDraftCasefileStore);
  private readonly globalStore = inject(GlobalStore);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly resolved = signal<ICasesDraftCasefileResolved | null>(null);
  private entry = 0;
  private navigationRevision = 0;
  private readonly pendingNavigationId = signal<number | null>(null);
  private attempt: ICasesDraftDeletionAttempt | null = null;
  private completion: {
    receipt: ReturnType<typeof readCasesDraftDeletionReceipt>;
    notice: ICasesDraftDeletionNotice;
  } | null = null;
  private denialRequested = false;

  protected override fieldErrors = {
    create_casefile_delete_reason: {
      required: { message: 'Enter reason', priority: 1 },
      maxlength: { message: 'Reason must be 250 characters or fewer', priority: 2 },
    },
  };
  public readonly routeNavigationPending = computed(() => this.pendingNavigationId() !== null);
  public readonly phase = signal<'ready' | 'pending' | 'unresolved' | 'complete' | 'denied'>('ready');
  public readonly checking = signal(false);
  public readonly navigating = signal(false);
  public readonly returnFailed = signal(false);
  public readonly recoveryText = signal<string | null>(null);
  public readonly completionReturnText = CASES_DRAFT_DELETION_COPY.navigationFailed;
  public override form = new FormGroup({
    create_casefile_delete_reason: new FormControl('', {
      nonNullable: true,
      validators: [meaningfulReason, Validators.maxLength(250)],
    }),
  });
  public readonly readable = computed(() => {
    const result = this.resolved();
    const draft = this.store.draft();
    return (
      !!result &&
      !!draft &&
      this.phase() !== 'denied' &&
      result.intent === 'checker-delete' &&
      draft.draft_casefile_id === result.draft.draft_casefile_id &&
      draft.business_unit_id === result.identity.businessUnitId &&
      sameCasesDraftIdentity(this.store.identity(), result.identity) &&
      this.globalStore.authenticated() &&
      sameCasesDraftIdentity(
        resolveCasesDraftReadIdentity(this.globalStore.userState(), this.released()),
        result.identity,
      )
    );
  });
  public readonly eligible = computed(
    () => this.readable() && canReviewDraftCasefile(this.store.draft()!, this.globalStore.userState(), this.released()),
  );
  public readonly respondentName = computed(() =>
    this.readable() ? this.store.draft()!.casefile_snapshot.respondent_account.respondent_name : '',
  );

  constructor() {
    super();
    this.setInitialErrorMessages();
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.entry++;
      this.attempt = null;
      this.completion = null;
      this.denialRequested = false;
      this.checking.set(false);
      this.navigating.set(false);
      this.returnFailed.set(false);
      this.phase.set('ready');
      this.recoveryText.set(null);
      this.form.controls.create_casefile_delete_reason.enable({ emitEvent: false });
      this.form.reset({ create_casefile_delete_reason: '' });
      this.clearAllErrorMessages();
      const result: ICasesDraftCasefileResolved | undefined = data['draftCasefile'];
      this.resolved.set(result ?? null);
      if (result) this.store.loadResolved(result);
    });
    this.deleteRouter.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigationRevision++;
        this.pendingNavigationId.set(event.id);
      } else if (
        (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped) &&
        event.id === this.pendingNavigationId()
      ) {
        this.pendingNavigationId.set(null);
      }
    });
    effect(() => {
      const result = this.resolved();
      const denied = result && this.phase() !== 'denied' && this.readable() && !this.eligible();
      if (denied) untracked(() => this.deny(true));
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
    this.destroyRef.onDestroy(() => {
      this.entry++;
      this.attempt = null;
      this.completion = null;
    });
  }
  private released(): boolean {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    return flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true;
  }
  private currentCheckerIdentity(): ICasesDraftIdentity | null {
    return this.globalStore.authenticated()
      ? resolveCasesDraftIdentity(this.globalStore.userState(), this.released(), 'checker')
      : null;
  }
  private deny(navigate: boolean): void {
    if (this.denialRequested || this.destroyRef.destroyed) return;
    this.denialRequested = true;
    this.entry++;
    this.attempt = null;
    this.completion = null;
    this.phase.set('denied');
    this.checking.set(false);
    this.navigating.set(false);
    this.returnFailed.set(false);
    this.form.reset({ create_casefile_delete_reason: '' }, { emitEvent: false });
    this.navigation.clearCheckerDeletion();
    if (navigate)
      void this.deleteRouter
        .navigateByUrl('/error/permission-denied')
        .then((accepted) => {
          if (!accepted) this.showError();
        })
        .catch(() => this.showError());
  }
  private isCurrentAttempt(attempt: ICasesDraftDeletionAttempt): boolean {
    const draft = this.store.draft();
    return (
      !this.destroyRef.destroyed &&
      this.attempt === attempt &&
      this.entry === attempt.entry &&
      this.readable() &&
      !!draft &&
      draft.draft_casefile_id === attempt.id &&
      draft.business_unit_id === attempt.businessUnitId &&
      this.store.etag() === attempt.etag &&
      sameCasesDraftIdentity(this.currentCheckerIdentity(), attempt.identity)
    );
  }
  private canAutomaticallyReturn(revision: number): boolean {
    return this.navigationRevision === revision && !this.routeNavigationPending();
  }
  private handleNavigationFailure(error: unknown, message = GENERIC_HTTP_ERROR_MESSAGE): void {
    if (error instanceof HttpErrorResponse) {
      if ([401, 403].includes(error.status)) this.deny(false);
      return;
    }
    if (!this.routeNavigationPending() && !this.globalStore.bannerError().error) this.showError(message);
  }
  private showError(message = GENERIC_HTTP_ERROR_MESSAGE): void {
    if (this.destroyRef.destroyed) return;
    this.globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message,
    });
    this.utilsService.scrollToTop();
  }
  private lockAttempt(): void {
    this.phase.set('unresolved');
    this.recoveryText.set(CASES_DRAFT_DELETION_COPY.unresolved);
  }
  private handleFailure(error: unknown, attempt: ICasesDraftDeletionAttempt, allowCorrection: boolean): void {
    if (!this.isCurrentAttempt(attempt)) return;
    if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) {
      this.deny(false);
      return;
    }
    if (allowCorrection && error instanceof HttpErrorResponse && error.status === 400) {
      this.phase.set('ready');
      this.form.controls.create_casefile_delete_reason.enable({ emitEvent: false });
    } else {
      this.lockAttempt();
    }
    if (!(error instanceof HttpErrorResponse)) this.showError();
    else this.utilsService.scrollToTop();
  }
  private complete(
    receipt: ReturnType<typeof readCasesDraftDeletionReceipt>,
    outcome: ICasesDraftDeletionNotice['outcome'],
    attempt: ICasesDraftDeletionAttempt,
  ): void {
    this.completion = {
      receipt,
      notice: {
        identity: { ...attempt.identity },
        draftCasefileId: attempt.id,
        respondentName: receipt.draft.casefile_snapshot.respondent_account.respondent_name,
        outcome,
      },
    };
    this.recoveryText.set(null);
    this.phase.set('complete');
  }
  private observeLatestStatus(
    latest: ReturnType<typeof readCasesDraftDeletionReceipt> | null,
    attempt: ICasesDraftDeletionAttempt,
  ): void {
    if (
      !latest ||
      latest.draft.draft_casefile_id !== attempt.id ||
      latest.draft.business_unit_id !== attempt.businessUnitId ||
      !isUsableDraftCasefileEtag(latest.etag)
    )
      throw new Error('Invalid latest case status');
    if (latest.draft.casefile_status === 'DELETED') {
      if (!latest.draft.casefile_snapshot.respondent_account.respondent_name.trim()) {
        throw new Error('Invalid latest case status');
      }
      this.complete(latest, 'observed', attempt);
    } else if (['SUBMITTED', 'RESUBMITTED'].includes(latest.draft.casefile_status)) {
      this.recoveryText.set(CASES_DRAFT_DELETION_COPY.awaitingReview);
    } else {
      this.recoveryText.set(
        CASES_DRAFT_DELETION_COPY.otherStatus.replace(
          '{caseStatusLabel}',
          casefileStatusLabel(latest.draft.casefile_status, 'checker'),
        ),
      );
    }
  }
  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void this.handleDelete();
  }

  public async handleCancel(): Promise<void> {
    const result = this.resolved();
    if (!result || !this.eligible() || this.phase() !== 'ready' || this.navigating() || this.routeNavigationPending())
      return;
    const entry = this.entry;
    this.navigating.set(true);
    this.globalStore.resetBannerError();
    try {
      await this.deleteRouter.navigateByUrl(this.navigation.placeholderUrl('review', result.draft.draft_casefile_id), {
        info: CASES_DRAFT_DELETE_CANCEL_NAVIGATION_INFO,
      });
    } catch (error: unknown) {
      if (entry === this.entry && !this.destroyRef.destroyed) this.handleNavigationFailure(error);
    } finally {
      if (entry === this.entry && !this.destroyRef.destroyed) this.navigating.set(false);
    }
  }

  public async handleDelete(): Promise<void> {
    if (!this.eligible() || this.phase() !== 'ready' || this.navigating() || this.routeNavigationPending()) return;
    this.form.markAllAsTouched();
    this.handleErrorMessages();
    if (this.form.invalid) {
      afterNextRender(
        () => this.deleteElement.nativeElement.querySelector<HTMLElement>('.govuk-error-summary')?.focus(),
        {
          injector: this.deleteInjector,
        },
      );
      return;
    }
    const identity = this.currentCheckerIdentity();
    const draft = this.store.draft();
    const etag = this.store.etag();
    if (!identity || !draft || !isUsableDraftCasefileEtag(etag)) {
      this.showError();
      return;
    }
    const attempt: ICasesDraftDeletionAttempt = {
      entry: this.entry,
      id: draft.draft_casefile_id,
      businessUnitId: draft.business_unit_id,
      etag,
      reason: this.form.controls.create_casefile_delete_reason.value,
      identity: { ...identity },
    };
    this.attempt = attempt;
    const returnRevision = this.navigationRevision;
    this.form.controls.create_casefile_delete_reason.disable({ emitEvent: false });
    this.phase.set('pending');
    this.globalStore.resetBannerError();
    try {
      const response = await firstValueFrom(
        defer(() =>
          this.maintenance.deleteDraftCasefile(
            attempt.id,
            { business_unit_id: attempt.businessUnitId, casefile_status: 'DELETED', status_message: attempt.reason },
            attempt.etag,
          ),
        ).pipe(take(1), defaultIfEmpty(null), takeUntilDestroyed(this.destroyRef)),
      );
      if (!this.isCurrentAttempt(attempt)) return;
      if (!response) {
        this.lockAttempt();
        return;
      }
      const receipt = readCasesDraftDeletionReceipt(response, attempt);
      this.complete(receipt, 'confirmed', attempt);
      if (this.canAutomaticallyReturn(returnRevision)) await this.handleReturnToReviewCases();
    } catch (error: unknown) {
      this.handleFailure(error, attempt, true);
    }
  }

  public async handleCheckLatestStatus(): Promise<void> {
    const attempt = this.attempt;
    if (
      !attempt ||
      !this.isCurrentAttempt(attempt) ||
      this.phase() !== 'unresolved' ||
      this.checking() ||
      this.navigating() ||
      this.routeNavigationPending()
    )
      return;
    const returnRevision = this.navigationRevision;
    this.checking.set(true);
    try {
      const latest = await firstValueFrom(
        defer(() => this.maintenance.getDraftCasefile(attempt.id)).pipe(
          take(1),
          defaultIfEmpty(null),
          takeUntilDestroyed(this.destroyRef),
        ),
      );
      if (!this.isCurrentAttempt(attempt)) return;
      this.observeLatestStatus(latest, attempt);
    } catch (error: unknown) {
      this.handleFailure(error, attempt, false);
    } finally {
      if (this.isCurrentAttempt(attempt)) this.checking.set(false);
    }
    if (this.isCurrentAttempt(attempt) && this.completion && this.canAutomaticallyReturn(returnRevision)) {
      await this.handleReturnToReviewCases();
    }
  }
  public async handleReturnToReviewCases(): Promise<void> {
    const attempt = this.attempt;
    if (
      !attempt ||
      !this.isCurrentAttempt(attempt) ||
      this.phase() === 'pending' ||
      this.checking() ||
      this.navigating() ||
      this.routeNavigationPending()
    )
      return;
    const completion = this.completion;
    const current = this.navigation.selection();
    const selection = current.tab === 'to-review' ? current : defaultCasesDraftNavigation('to-review', 'checker');
    if (completion && !this.navigation.recordCheckerDeletion(completion.notice)) {
      this.showError();
      return;
    }
    this.navigation.setSelection(selection);
    this.returnFailed.set(false);
    this.navigating.set(true);
    let accepted = false;
    try {
      accepted = await this.deleteRouter.navigateByUrl(this.navigation.dashboardUrl(selection));
    } catch (error: unknown) {
      if (this.isCurrentAttempt(attempt)) {
        this.handleNavigationFailure(
          error,
          completion ? CASES_DRAFT_DELETION_COPY.navigationFailed : GENERIC_HTTP_ERROR_MESSAGE,
        );
      }
    } finally {
      if (this.isCurrentAttempt(attempt)) {
        this.navigating.set(false);
        if (!accepted) {
          this.navigation.clearCheckerDeletion();
          if (!this.routeNavigationPending()) this.returnFailed.set(completion !== null);
        }
      }
    }
  }
}
