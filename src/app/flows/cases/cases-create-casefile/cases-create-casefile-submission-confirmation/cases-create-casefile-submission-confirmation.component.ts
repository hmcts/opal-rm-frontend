import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';

import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { Router } from '@angular/router';
import { GovukPanelComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-panel';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-create-casefile-submission-confirmation',
  imports: [GovukPanelComponent],
  templateUrl: './cases-create-casefile-submission-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileSubmissionConfirmationComponent {
  private readonly router = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  public readonly caseTypeUrl =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  public startNewCase(event: Event): void {
    event.preventDefault();
    this.store.resetStore();
    this.reviewNavigation.clearContext();
    void this.router.navigateByUrl(this.caseTypeUrl);
  }
}
