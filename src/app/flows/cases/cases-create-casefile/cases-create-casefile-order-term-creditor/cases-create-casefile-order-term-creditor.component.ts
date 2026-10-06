import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-order-term-creditor',
  imports: [RouterLink],
  templateUrl: './cases-create-casefile-order-term-creditor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermCreditorComponent {
  public readonly summaryPath =
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary;
}
