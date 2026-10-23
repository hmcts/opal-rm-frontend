import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import { CasesDraftCasefileHistoryComponent } from '../../cases-draft/components/cases-draft-casefile-history/cases-draft-casefile-history.component';
import type { ICasesDraftCasefileResolved } from '../../cases-draft/interfaces/cases-draft-casefile-resolved.interface';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  DestroyRef,
  ElementRef,
  Injector,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import {
  GovukSummaryListComponent,
  GovukSummaryListRowComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import { GovukTagComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-tag';
import {
  GovukTaskListComponent,
  GovukTaskListItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-task-list';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';

const createAbsolutePath = (child: string): string => '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + child;

@Component({
  selector: 'app-cases-create-casefile-task-list',
  imports: [
    CasesDraftCasefileHistoryComponent,
    GovukBackLinkComponent,
    GovukSummaryListComponent,
    GovukSummaryListRowComponent,
    GovukTaskListComponent,
    GovukTaskListItemComponent,
    GovukTagComponent,
    GovukButtonComponent,
  ],
  templateUrl: './cases-create-casefile-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileTaskListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly draftNavigation = inject(CasesDraftNavigationService);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  protected readonly persistedStore = inject(CasesDraftCasefileStore);
  protected readonly store = inject(CasesCreateCasefileStore);
  protected readonly statuses = CASES_CREATE_CASEFILE_TASK_STATUSES;
  protected readonly paths = {
    caseType: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType),
    respondentDetails: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails),
    applicantIndividual: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual),
    applicantOrganisation: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation),
    centralAuthorityDetails: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails),
    orderDetails: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderDetails),
    orderTermsSummary: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary),
    interestAndIndexation: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation),
    managingPayments: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments),
    commentsAndNotes: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.commentsAndNotes),
    checkCaseDetails: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails),
    cancel: createAbsolutePath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.cancel),
  } as const;

  protected readonly amendment = computed(() => this.store.submissionIntent() === 'amendment');
  protected readonly respondentName = computed(() => {
    const respondent = this.store.respondentDetails();
    return [respondent?.title, respondent?.firstNames, respondent?.lastName].filter(Boolean).join(' ');
  });

  protected readonly caseTypeSelection = computed(() => this.store.caseTypeSelection());
  protected readonly showApplicantType = computed(
    () => this.caseTypeSelection()?.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
  );
  protected readonly applicantType = computed(() => {
    const selection = this.caseTypeSelection();
    return selection?.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN ? selection.applicantType : null;
  });
  protected readonly applicantPath = computed(() =>
    this.applicantType() === CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION
      ? this.paths.applicantOrganisation
      : this.paths.applicantIndividual,
  );

  protected readonly statusTagClasses: Record<CasesCreateCasefileTaskStatus, string> = {
    [CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED]: 'govuk-tag--purple',
    [CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL]: 'govuk-tag--grey',
    [CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED]: '',
  };

  constructor() {
    // Arrival at the task list ends a correction return; incomplete drafts must
    // remain free to open their editors rather than bouncing back from summaries.
    this.reviewNavigation.clearContext();
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved: ICasesDraftCasefileResolved | undefined = data['draftCasefile'];
      if (!resolved) {
        if (this.amendment()) this.focusAmendmentHeading();
        return;
      }
      this.store.hydratePersistedCasefile({ ...resolved.state, submissionIntent: 'amendment' });
      this.persistedStore.loadResolved(resolved);
      this.focusAmendmentHeading();
    });
  }

  private focusAmendmentHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  protected navigateTo(path: string, event?: Event): void {
    event?.preventDefault();
    void this.router.navigateByUrl(path);
  }

  protected handleBack(event: Event): void {
    if (this.store.submissionIntent() === 'amendment') {
      event.preventDefault();
      const id = this.persistedStore.draft()?.draft_casefile_id;
      if (id) void this.router.navigateByUrl(this.draftNavigation.amendmentReturnUrl(id));
      return;
    }
    this.store.resetForCaseTypeEdit();
    this.navigateTo(this.paths.caseType, event);
  }
  public canDeactivate(): boolean {
    return (
      !this.store.unsavedChanges() &&
      !this.store.stateChanges() &&
      this.store.creditorDraft() === null &&
      this.store.orderTermAmendment() === null
    );
  }
}
