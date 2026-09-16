import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile-order-terms-input',
  imports: [GovukBackLinkComponent],
  templateUrl: './cases-create-casefile-order-terms-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsInputComponent {
  private readonly router = inject(Router);
  public readonly selectedId = inject(CasesCreateCasefileStore).pendingOrderTermResultId;

  public handleBack(): void {
    const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
    void this.router.navigateByUrl('/' + paths.root + '/' + paths.children.orderTermsSelect);
  }
}
