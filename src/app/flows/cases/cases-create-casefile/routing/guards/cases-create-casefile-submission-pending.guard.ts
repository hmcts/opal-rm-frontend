import type { CanDeactivateFn } from '@angular/router';
import type { CasesCreateCasefileCheckDetailsComponent } from '../../cases-create-casefile-check-details/cases-create-casefile-check-details.component';

/** Navigation must not discard the server receipt while a submission is in flight. */
export const casesCreateCasefileSubmissionPendingGuard: CanDeactivateFn<CasesCreateCasefileCheckDetailsComponent> = (
  component,
) => !component.submissionPending();
