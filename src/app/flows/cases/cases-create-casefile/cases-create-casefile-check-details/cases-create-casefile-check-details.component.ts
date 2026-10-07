import { CasesDraftCasefileDecisionComponent } from '../../cases-draft/components/cases-draft-casefile-decision/cases-draft-casefile-decision.component';
import { defaultCasesDraftNavigation } from '../../cases-draft/utils/cases-draft-navigation';
import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import type { ICasesDraftCasefileResolved } from '../../cases-draft/interfaces/cases-draft-casefile-resolved.interface';
import {
  canReviewDraftCasefile,
  resolveCasesDraftReadIdentity,
} from '../../cases-draft/utils/cases-draft-casefile-permissions';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from '../../cases-draft/utils/cases-draft-identity';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CasesDraftCasefileHistoryComponent } from '../../cases-draft/components/cases-draft-casefile-history/cases-draft-casefile-history.component';
import { GovukSummaryListRowActionItemComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import { CasesCreateCasefilePayloadService } from '../services/cases-create-casefile-payload/cases-create-casefile-payload.service';
import { isCasesCreateCasefileIndividualApplicantSelection } from '../utils/cases-create-casefile-individual-applicant-selection';
import { isCasesCreateCasefileOrganisationApplicantSelection } from '../utils/cases-create-casefile-organisation-applicant-selection';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { getState } from '@ngrx/signals';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import type { IOpalMaintenanceCountryReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import { CasesCreateCasefileReviewSectionComponent } from '../components/cases-create-casefile-review-section/cases-create-casefile-review-section.component';
import { CasesCreateCasefileOrderTermCardComponent } from '../components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import type { CasesCreateCasefileReviewReturnContext } from '../types/cases-create-casefile-review-return-context.type';
import { reviewRespondent, reviewApplicant, reviewMinorCreditor } from '../utils/cases-create-casefile-party-review';
import { reviewCaseSections } from '../utils/cases-create-casefile-case-review';
import { buildOrderTermCard } from '../utils/cases-create-casefile-order-term-card';

@Component({
  selector: 'app-cases-create-casefile-check-details',
  imports: [
    CasesDraftCasefileDecisionComponent,
    CasesDraftCasefileHistoryComponent,
    GovukSummaryListRowActionItemComponent,
    GovukCancelLinkComponent,
    GovukBackLinkComponent,
    CasesCreateCasefileReviewSectionComponent,
    CasesCreateCasefileOrderTermCardComponent,
  ],
  templateUrl: './cases-create-casefile-check-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCheckDetailsComponent {
  private readonly globalStore = inject(GlobalStore);
  private readonly utils = inject(UtilsService);
  private readonly payloadService = inject(CasesCreateCasefilePayloadService);
  private readonly maintenance = inject(OpalMaintenanceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS.children;
  private readonly root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
  private readonly persistedStore = inject(CasesDraftCasefileStore);
  private readonly draftNavigation = inject(CasesDraftNavigationService);
  private readonly countries = computed<readonly IOpalMaintenanceCountryReferenceDataItem[]>(
    () => this.persistedResult()?.references.countries ?? this.route?.snapshot.data['countries']?.refData ?? [],
  );
  private readonly applications = computed<readonly IOpalMaintenanceApplicationReferenceDataItem[]>(
    () => this.persistedResult()?.references.applications ?? this.route?.snapshot.data['applications']?.refData ?? [],
  );
  private readonly navigating = signal(false);
  private readonly snapshot = computed(() => getState(this.store));
  private readonly caseSections = computed(() =>
    reviewCaseSections(this.snapshot(), this.countries(), this.applications()),
  );
  private readonly submitting = signal(false);
  public readonly persistedResult = signal<ICasesDraftCasefileResolved | null>(null);
  public readonly draft = this.persistedStore.draft;
  public readonly editable = computed(() => this.route?.snapshot.data['casefileIntent'] === 'create');
  public readonly readable = computed(() => {
    const result = this.persistedResult();
    const draft = this.persistedStore.draft();
    const released =
      (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
      true;
    return (
      !!result &&
      !!draft &&
      draft.business_unit_id === result.identity.businessUnitId &&
      this.globalStore.authenticated() &&
      sameCasesDraftIdentity(resolveCasesDraftReadIdentity(this.globalStore.userState(), released), result.identity)
    );
  });
  public readonly reviewable = computed(
    () =>
      this.readable() &&
      this.persistedResult()?.intent === 'checker-review' &&
      canReviewDraftCasefile(
        this.persistedStore.draft()!,
        this.globalStore.userState(),
        (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
          true,
      ),
  );
  // Recreate page-local decision state when another eligible draft replaces the current one.
  public readonly decisionDrafts = computed(() => (this.reviewable() ? [this.persistedStore.draft()!] : []));
  public readonly submissionPending = this.submitting.asReadonly();
  public readonly busy = computed(() => this.navigating() || this.submitting());
  public readonly blocked = computed(() => this.busy() || this.store.submissionSucceeded());
  public readonly beforeTerms = computed(() => {
    const snapshot = this.snapshot();
    const applicant = snapshot.applicantDetails;
    const applicableApplicant =
      applicant &&
      ('organisationName' in applicant
        ? isCasesCreateCasefileOrganisationApplicantSelection(snapshot.caseTypeSelection)
        : isCasesCreateCasefileIndividualApplicantSelection(snapshot.caseTypeSelection));
    return [
      ...this.caseSections().filter((section) => section.id === 'caseType'),
      ...(snapshot.respondentDetails ? [reviewRespondent(snapshot.respondentDetails, this.countries())] : []),
      ...(applicableApplicant ? [reviewApplicant(applicant, this.countries())] : []),
      ...this.caseSections().filter((section) => ['centralAuthority', 'orderDetails'].includes(section.id)),
    ];
  });
  public readonly afterTerms = computed(() =>
    this.caseSections().filter((section) =>
      ['interestAndIndexation', 'managingPayments', 'commentsAndNotes'].includes(section.id),
    ),
  );
  public readonly cards = computed(() => {
    const state = getState(this.store);
    return state.orderTerms.map((term, index) => {
      const creditor = term.creditor;
      const minor =
        creditor?.type === 'minor'
          ? state.minorCreditors.find((item) => item.sequenceNumber === creditor.sequenceNumber)
          : undefined;
      const card = buildOrderTermCard(term, state);
      return {
        ...card,
        bankRows: minor ? [] : card.bankRows,
        ariaLabel: `${card.title}, order term ${index + 1}`,
        minor: minor
          ? {
              ...reviewMinorCreditor(minor, this.countries()),
              id: `minor-creditor-${minor.sequenceNumber}-term-${term.termId}`,
            }
          : null,
      };
    });
  });
  constructor() {
    this.route?.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved: ICasesDraftCasefileResolved | undefined = data['draftCasefile'];
      if (!resolved) return;
      this.store.hydratePersistedCasefile(resolved.state);
      this.persistedStore.loadResolved(resolved);
      this.persistedResult.set(resolved);
      this.reviewNavigation.clearContext();
      afterNextRender(() => this.focusTarget('review-heading'), { injector: this.injector });
    });
    afterNextRender(() => {
      this.focusTarget(this.reviewNavigation.focusId());
      this.reviewNavigation.clearContext();
    });
  }

  private async navigate(path: string | UrlTree): Promise<boolean> {
    this.navigating.set(true);
    try {
      const navigated = await this.router.navigateByUrl(path);
      if (!navigated) this.showError();
      return navigated;
    } catch {
      this.showError();
      return false;
    } finally {
      this.navigating.set(false);
    }
  }

  private showError(): void {
    this.globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    this.utils.scrollToTop();
  }

  public focusTarget(id: string): void {
    const target =
      this.host.nativeElement.querySelector<HTMLElement>(`[id="${id}"]`) ??
      this.host.nativeElement.querySelector<HTMLElement>('#review-heading');
    target?.focus();
  }

  /** Returns validated local completion to the checker queue without recording a decision. */
  public async handleDecision(): Promise<void> {
    if (!this.reviewable() || this.busy()) return;
    const current = this.draftNavigation.selection();
    const selection = current.tab === 'to-review' ? current : defaultCasesDraftNavigation('to-review', 'checker');
    await this.navigate(this.draftNavigation.dashboardUrl(selection));
  }

  public async handleSubmit(): Promise<void> {
    if (!this.editable() || this.busy()) return;
    this.globalStore.resetBannerError();
    if (this.store.submissionSucceeded()) {
      await this.navigate(this.root + this.paths.submissionConfirmation);
      return;
    }
    this.submitting.set(true);
    try {
      const state = getState(this.store);
      const centralAuthority = state.centralAuthorityDetails?.majorCreditor;
      const majorCreditors = state.orderTerms.some((term) => term.creditor?.type === 'major')
        ? (
            await firstValueFrom(
              this.maintenance
                .getMajorCreditors({
                  business_unit_id: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
                  central_authority: false,
                  active: true,
                })
                .pipe(takeUntilDestroyed(this.destroyRef)),
            )
          ).refData
        : [];
      if (this.destroyRef.destroyed) return;
      const request = this.payloadService.buildAddCasefilePayload(
        state,
        {
          countries: this.countries(),
          applications: this.applications(),
          majorCreditors: [...majorCreditors, ...(centralAuthority ? [centralAuthority] : [])],
        },
        OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
      );
      const response = await firstValueFrom(
        this.maintenance.createDraftCasefile(request).pipe(takeUntilDestroyed(this.destroyRef)),
      );
      const receipt = response.body;
      if (
        response.status !== 201 ||
        !receipt ||
        !Number.isSafeInteger(receipt.draft_casefile_id) ||
        receipt.draft_casefile_id <= 0 ||
        receipt.casefile_status !== 'SUBMITTED'
      ) {
        throw new Error('Invalid submission receipt');
      }
      if (this.destroyRef.destroyed) return;
      this.store.completeSubmission();
      this.reviewNavigation.clearContext();
      this.submitting.set(false);
      await this.navigate(this.root + this.paths.submissionConfirmation);
    } catch (error) {
      if (this.destroyRef.destroyed) return;
      // HTTP failures already use the shared interceptor's banner or error-page handling.
      if (!(error instanceof HttpErrorResponse) && !this.globalStore.bannerError().error) this.showError();
      else this.utils.scrollToTop();
    } finally {
      this.submitting.set(false);
    }
  }

  public async handleChange(section: string): Promise<void> {
    if (!this.editable() || this.blocked()) return;
    const destinations: Record<string, string> = {
      respondent: this.paths.respondentDetails,
      applicant: isCasesCreateCasefileOrganisationApplicantSelection(this.store.caseTypeSelection())
        ? this.paths.applicantOrganisation
        : this.paths.applicantIndividual,
      centralAuthority: this.paths.centralAuthorityDetails,
      orderDetails: this.paths.orderDetails,
      interestAndIndexation: this.paths.interestAndIndexation,
      managingPayments: this.paths.managingPayments,
      commentsAndNotes: this.paths.commentsAndNotes,
    };
    if (!Object.hasOwn(destinations, section)) return;
    this.reviewNavigation.setContext({ origin: 'review', section } as CasesCreateCasefileReviewReturnContext);
    if (!(await this.navigate(this.root + destinations[section]))) this.reviewNavigation.clearContext();
  }

  public async handleTermChange(termId: number): Promise<void> {
    if (!this.editable() || this.blocked()) return;
    const term = this.store.orderTerms().find((item) => item.termId === termId);
    const previous = this.store.orderTermAmendment();
    if (!term || !this.store.beginOrderTermAmendment(termId)) return;
    const amendment = this.store.orderTermAmendment();
    this.reviewNavigation.setContext({ origin: 'review', section: 'orderTerm', termId });
    if (!(await this.navigate(this.root + this.paths.orderTermsInput + '/' + encodeURIComponent(term.resultId)))) {
      if (
        !previous &&
        this.store.orderTermAmendment() === amendment &&
        !this.store.orderTermDraft()?.dirty &&
        !this.store.unsavedChanges() &&
        !this.store.creditorDraft()
      )
        this.store.cancelOrderTermAmendment(termId);
      this.reviewNavigation.clearContext();
    }
  }

  public async handleTermRemove(termId: number): Promise<void> {
    if (!this.editable() || this.blocked()) return;
    const selection = this.store.beginOrderTermRemoval(termId);
    if (!selection) return;
    this.reviewNavigation.setContext({ origin: 'review', section: 'orderTerm', termId });
    if (!(await this.navigate(this.root + this.paths.orderTermsRemove + '/' + selection.index))) {
      this.store.clearOrderTermRemoval(selection);
      this.reviewNavigation.clearContext();
    }
  }

  public handleBack(): void {
    if (this.blocked()) return;
    if (!this.editable()) {
      const result = this.persistedResult();
      if (!result || !this.readable()) return;
      const idText = this.route?.snapshot.paramMap?.get('draftCasefileId') ?? String(result.draft.draft_casefile_id);
      const user = this.globalStore.userState();
      const released =
        (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
        true;
      const inputterIdentity = resolveCasesDraftIdentity(user, released, 'inputter');
      if (inputterIdentity && this.draftNavigation.contextForPlaceholder('details', idText)) {
        this.navigating.set(true);
        void this.draftNavigation
          .returnFromPlaceholder('details', idText)
          .then((accepted) => {
            if (!accepted) this.showError();
          })
          .catch(() => this.showError())
          .finally(() => this.navigating.set(false));
      } else {
        const preferredIdentity = resolveCasesDraftIdentity(user, released, result.dashboardMode);
        const fallbackMode = result.dashboardMode === 'checker' ? 'inputter' : 'checker';
        const dashboardMode = preferredIdentity ? result.dashboardMode : fallbackMode;
        void this.navigate(this.draftNavigation.persistedDashboardUrl(dashboardMode));
      }
      return;
    }
    this.reviewNavigation.clearContext();
    void this.navigate(this.root + this.paths.taskList);
  }

  public handleCancel(): void {
    if (!this.editable() || this.blocked()) return;
    void this.navigate(this.root + this.paths.cancel);
  }
}
