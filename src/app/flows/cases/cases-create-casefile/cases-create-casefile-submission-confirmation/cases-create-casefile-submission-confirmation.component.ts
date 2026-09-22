import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CasesCreateCasefileSubmissionService } from '../services/cases-create-casefile-submission.service';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';

@Component({
  selector: 'app-cases-create-casefile-submission-confirmation',
  templateUrl: './cases-create-casefile-submission-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileSubmissionConfirmationComponent {
  private readonly router = inject(Router);
  private readonly submission = inject(CasesCreateCasefileSubmissionService);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  public readonly receipt = this.submission.receipt;
  public readonly navigationFailed = signal(false);
  public readonly navigating = signal(false);

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  public async startNewCase(): Promise<void> {
    if (this.navigating()) return;
    this.navigating.set(true);
    try {
      const navigated = await this.router.navigateByUrl('/cases/create-casefile/case-type');
      this.navigationFailed.set(!navigated);
      if (navigated) {
        this.submission.reset();
        this.reviewNavigation.clearContext();
      }
    } catch {
      this.navigationFailed.set(true);
    } finally {
      this.navigating.set(false);
    }
  }
}
