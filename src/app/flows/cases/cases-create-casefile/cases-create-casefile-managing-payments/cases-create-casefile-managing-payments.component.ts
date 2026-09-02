import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-managing-payments',
  imports: [GovukBackLinkComponent],
  templateUrl: './cases-create-casefile-managing-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileManagingPaymentsComponent {
  private readonly router = inject(Router);
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

  public handleBack(): void {
    void this.router.navigateByUrl(this.taskListPath);
  }
}
