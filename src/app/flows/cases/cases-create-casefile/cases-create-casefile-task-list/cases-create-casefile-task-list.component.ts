import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  protected navigateTo(path: string, event?: Event): void {
    event?.preventDefault();
    void this.router.navigateByUrl(path);
  }

  protected handleBack(event: Event): void {
    this.store.resetForCaseTypeEdit();
    this.navigateTo(this.paths.caseType, event);
  }
}
