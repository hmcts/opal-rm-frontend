import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile-order-terms-summary',
  imports: [GovukBackLinkComponent, GovukButtonComponent],
  templateUrl: './cases-create-casefile-order-terms-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSummaryComponent {
  private readonly router = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
  private readonly selectionPath =
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect;

  public handleAddTerms(): void {
    this.store.setPendingOrderTermResultId(null);
    void this.router.navigateByUrl(this.selectionPath);
  }

  public handleBack(): void {
    void this.router.navigateByUrl(this.taskListPath);
  }
}
