import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-cases-create-casefile-submission-confirmation',
  templateUrl: './cases-create-casefile-submission-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileSubmissionConfirmationComponent {
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }
}
