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
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import type { ICasesDraftDeletionNotice } from '../interfaces/cases-draft-deletion-notice.interface';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { canReviewDraftCasefile, resolveCasesDraftReadIdentity } from '../utils/cases-draft-casefile-permissions';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { sameCasesDraftIdentity } from '../utils/cases-draft-identity';

const meaningfulReason: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

@Component({
  selector: 'app-cases-draft-delete',
  host: { id: 'create_casefile_delete_page' },
  imports: [ReactiveFormsModule, GovukErrorSummaryComponent, GovukTextAreaComponent, GovukCancelLinkComponent],
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
  private readonly returnButton = viewChild<ElementRef<HTMLButtonElement>>('returnButton');
  private readonly completedNotice = signal<ICasesDraftDeletionNotice | null>(null);
  private readonly resolved = signal<ICasesDraftCasefileResolved | null>(null);
  private readonly denied = signal(false);
  private entry = 0;
  private navigationRevision = 0;

  protected override fieldErrors = {
    create_casefile_delete_reason: {
      required: { message: 'Enter reason', priority: 1 },
      maxlength: { message: 'Reason must be 250 characters or fewer', priority: 2 },
    },
  };
  public readonly submitting = signal(false);
  public readonly navigating = signal(false);
  public readonly deleted = computed(() => this.completedNotice() !== null);
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
      !this.denied() &&
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
      this.denied.set(false);
      this.submitting.set(false);
      this.navigating.set(false);
      this.completedNotice.set(null);
      this.navigation.clearCheckerDeletion();
      this.form.controls.create_casefile_delete_reason.enable({ emitEvent: false });
      this.form.reset({ create_casefile_delete_reason: '' });
      this.clearAllErrorMessages();
      const result: ICasesDraftCasefileResolved | undefined = data['draftCasefile'];
      this.resolved.set(result ?? null);
      if (result) this.store.loadResolved(result);
    });
    this.deleteRouter.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) this.navigationRevision++;
    });
    effect(() => {
      if (this.readable() && !this.eligible()) untracked(() => this.denyAccess());
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  private released(): boolean {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    return flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true;
  }

  private currentEntry(entry: number): boolean {
    return !this.destroyRef.destroyed && this.entry === entry && this.eligible();
  }

  private denyAccess(): void {
    this.denied.set(true);
    this.completedNotice.set(null);
    this.form.reset({ create_casefile_delete_reason: '' });
    void this.deleteRouter
      .navigateByUrl('/error/permission-denied')
      .then((accepted) => {
        if (!accepted) this.showNavigationError();
      })
      .catch(() => this.showNavigationError());
  }

  private showNavigationError(): void {
    if (this.destroyRef.destroyed || this.globalStore.bannerError().error) return;
    this.globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    this.utilsService.scrollToTop();
  }

  public async handleReturnToReviewCases(): Promise<void> {
    const notice = this.completedNotice();
    if (!notice || !this.eligible() || this.navigating()) return;
    const current = this.navigation.selection();
    const selection = current.tab === 'to-review' ? current : defaultCasesDraftNavigation('to-review', 'checker');
    if (!this.navigation.recordCheckerDeletion(notice)) return;
    const entry = this.entry;
    this.navigation.setSelection(selection);
    this.navigating.set(true);
    let accepted = false;
    try {
      accepted = await this.deleteRouter.navigateByUrl(this.navigation.dashboardUrl(selection));
    } catch {
      if (this.currentEntry(entry)) this.utilsService.scrollToTop();
    } finally {
      if (this.currentEntry(entry)) {
        this.navigating.set(false);
        if (!accepted) {
          this.navigation.clearCheckerDeletion();
          afterNextRender(() => this.returnButton()?.nativeElement.focus(), { injector: this.deleteInjector });
        }
      }
    }
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void this.handleDelete();
  }

  public async handleCancel(): Promise<void> {
    const result = this.resolved();
    if (!result || !this.eligible() || this.submitting() || this.deleted() || this.navigating()) return;
    const entry = this.entry;
    this.navigating.set(true);
    try {
      await this.deleteRouter.navigateByUrl(this.navigation.placeholderUrl('review', result.draft.draft_casefile_id));
    } catch {
      if (this.currentEntry(entry)) this.utilsService.scrollToTop();
    } finally {
      if (this.currentEntry(entry)) this.navigating.set(false);
    }
  }

  public async handleDelete(): Promise<void> {
    if (!this.eligible() || this.submitting() || this.deleted() || this.navigating()) return;
    this.form.markAllAsTouched();
    this.handleErrorMessages();
    if (this.form.invalid) {
      afterNextRender(
        () => this.deleteElement.nativeElement.querySelector<HTMLElement>('.govuk-error-summary')?.focus(),
        { injector: this.deleteInjector },
      );
      return;
    }
    const draft = this.store.draft()!;
    const identity = this.resolved()!.identity;
    const etag = this.store.etag();
    if (!etag) return;
    const entry = this.entry;
    const revision = this.navigationRevision;
    const reason = this.form.controls.create_casefile_delete_reason.value;
    this.submitting.set(true);
    this.form.controls.create_casefile_delete_reason.disable({ emitEvent: false });
    try {
      const response = await firstValueFrom(
        defer(() =>
          this.maintenance.patchDraftCasefile(
            draft.draft_casefile_id,
            { business_unit_id: draft.business_unit_id, casefile_status: 'DELETED', status_message: reason },
            etag,
          ),
        ).pipe(take(1), defaultIfEmpty(null), takeUntilDestroyed(this.destroyRef)),
      );
      if (!this.currentEntry(entry) || !response?.body) return;
      this.completedNotice.set({
        identity,
        draftCasefileId: draft.draft_casefile_id,
        respondentName: response.body.casefile_snapshot.respondent_account.respondent_name,
      });
      if (this.navigationRevision !== revision) return;
      await this.handleReturnToReviewCases();
    } catch {
      if (this.currentEntry(entry)) this.utilsService.scrollToTop();
    } finally {
      if (this.currentEntry(entry)) {
        this.submitting.set(false);
        this.navigating.set(false);
        if (!this.deleted()) this.form.controls.create_casefile_delete_reason.enable({ emitEvent: false });
      }
    }
  }
}
