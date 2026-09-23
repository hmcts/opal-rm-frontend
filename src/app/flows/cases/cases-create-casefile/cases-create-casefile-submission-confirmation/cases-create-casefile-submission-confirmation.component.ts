import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';

import { RouterLink } from '@angular/router';
import { GovukPanelComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-panel';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-submission-confirmation',
  imports: [RouterLink, GovukPanelComponent],
  templateUrl: './cases-create-casefile-submission-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileSubmissionConfirmationComponent {
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  public readonly caseTypeUrl =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }
}
