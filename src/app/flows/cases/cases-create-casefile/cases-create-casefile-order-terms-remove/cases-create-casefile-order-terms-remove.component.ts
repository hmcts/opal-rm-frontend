import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-order-terms-remove',
  imports: [GovukButtonComponent],
  templateUrl: './cases-create-casefile-order-terms-remove.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsRemoveComponent {
  private readonly router = inject(Router);

  public handleReturn(): void {
    const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
    void this.router.navigateByUrl('/' + paths.root + '/' + paths.children.orderTermsSummary);
  }
}
