import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';

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
  private readonly injector = inject(Injector);
  private readonly errorRegion = viewChild<ElementRef<HTMLElement>>('errorRegion');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  public readonly navigationError = signal(false);
  public readonly navigating = signal(false);
  public readonly caseTypeUrl =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  public async startNewCase(event: Event): Promise<void> {
    event.preventDefault();
    if (this.navigating()) return;
    this.navigating.set(true);
    this.navigationError.set(false);
    try {
      const navigated = await this.router.navigateByUrl(this.caseTypeUrl, { state: { startNewCase: true } });
      this.navigationError.set(!navigated);
    } catch {
      this.navigationError.set(true);
    } finally {
      this.navigating.set(false);
      if (this.navigationError()) {
        afterNextRender(() => this.errorRegion()?.nativeElement.focus(), { injector: this.injector });
      }
    }
  }
}
