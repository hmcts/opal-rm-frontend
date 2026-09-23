import { firstValueFrom } from 'rxjs';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CasesCreateCasefileCompletionService } from '../services/cases-create-casefile-completion.service';
import { isCasesCreateCasefileIndividualApplicantSelection } from '../utils/cases-create-casefile-individual-applicant-selection';
import { isCasesCreateCasefileOrganisationApplicantSelection } from '../utils/cases-create-casefile-organisation-applicant-selection';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    GovukBackLinkComponent,
    CasesCreateCasefileReviewSectionComponent,
    CasesCreateCasefileOrderTermCardComponent,
  ],
  templateUrl: './cases-create-casefile-check-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    button.govuk-link {
      border: 0;
      padding: 0;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    button.govuk-link:disabled {
      cursor: default;
    }
  `,
})
export class CasesCreateCasefileCheckDetailsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly errorRegion = viewChild<ElementRef<HTMLElement>>('errorRegion');
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS.children;
  private readonly root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
  private readonly countries: readonly IOpalMaintenanceCountryReferenceDataItem[] =
    this.route?.snapshot.data['countries']?.refData ?? [];
  private readonly applications: readonly IOpalMaintenanceApplicationReferenceDataItem[] =
    this.route?.snapshot.data['applications']?.refData ?? [];
  private readonly navigating = signal(false);
  private readonly submitting = signal(false);
  private readonly maintenance = inject(OpalMaintenanceService);
  private readonly completion = inject(CasesCreateCasefileCompletionService);
  private readonly snapshot = computed(() => getState(this.store));
  private readonly caseSections = computed(() =>
    reviewCaseSections(this.snapshot(), this.countries, this.applications),
  );
  public readonly navigationError = signal(false);
  public readonly accepted = computed(() => this.completion.result() !== null);
  public readonly blocked = computed(() => this.navigating() || this.submitting() || this.accepted());
  public readonly retryBlocked = computed(() => this.navigating() || this.submitting());
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
      ...(snapshot.respondentDetails ? [reviewRespondent(snapshot.respondentDetails, this.countries)] : []),
      ...(applicableApplicant ? [reviewApplicant(applicant, this.countries)] : []),
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
              ...reviewMinorCreditor(minor, this.countries),
              id: `minor-creditor-${minor.sequenceNumber}-term-${term.termId}`,
            }
          : null,
      };
    });
  });
  constructor() {
    afterNextRender(() => {
      this.focusTarget(this.reviewNavigation.focusId());
      this.reviewNavigation.clearContext();
    });
    effect(() => {
      if (this.navigationError()) {
        afterNextRender(() => this.errorRegion()?.nativeElement.focus(), { injector: this.injector });
      }
    });
  }

  private async navigate(path: string): Promise<boolean> {
    if (this.navigating()) return false;
    this.navigating.set(true);
    this.navigationError.set(false);
    try {
      const navigated = await this.router.navigateByUrl(path);
      this.navigationError.set(!navigated);
      return navigated;
    } catch {
      this.navigationError.set(true);
      return false;
    } finally {
      this.navigating.set(false);
    }
  }

  public focusTarget(id: string): void {
    const target =
      this.host.nativeElement.querySelector<HTMLElement>(`[id="${id}"]`) ??
      this.host.nativeElement.querySelector<HTMLElement>('#review-heading');
    target?.focus();
  }

  public handleSubmit(): void {
    if (this.blocked()) return;
    if (!this.store.checkCaseAvailable()) {
      void this.navigate(this.root + this.paths.taskList);
      return;
    }
    this.submitting.set(true);
    void this.acceptSubmission();
  }

  private async acceptSubmission(): Promise<void> {
    try {
      const result = await firstValueFrom(this.maintenance.submitCasefile());
      this.completion.record(result);
      this.store.resetStore();
      this.reviewNavigation.clearContext();
      await this.navigate(this.root + this.paths.submissionConfirmation);
    } finally {
      this.submitting.set(false);
    }
  }

  public retryConfirmation(): void {
    if (!this.accepted() || this.retryBlocked()) return;
    void this.navigate(this.root + this.paths.submissionConfirmation);
  }

  public async handleChange(section: string): Promise<void> {
    if (this.blocked()) return;
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
    if (this.blocked()) return;
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
    if (this.blocked()) return;
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
    this.reviewNavigation.clearContext();
    void this.navigate(this.root + this.paths.taskList);
  }

  public handleCancel(): void {
    if (this.blocked()) return;
    void this.navigate(this.root + this.paths.cancel);
  }
}
