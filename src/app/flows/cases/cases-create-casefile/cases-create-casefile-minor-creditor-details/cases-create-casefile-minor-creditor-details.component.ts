import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-minor-creditor-details',
  imports: [RouterLink],
  templateUrl: './cases-create-casefile-minor-creditor-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileMinorCreditorDetailsComponent {
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  public readonly creditorPath = '/' + this.paths.root + '/' + this.paths.children.orderTermCreditor;
}
