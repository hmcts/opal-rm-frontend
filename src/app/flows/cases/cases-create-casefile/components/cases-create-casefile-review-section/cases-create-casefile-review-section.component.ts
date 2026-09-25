import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GovukDetailsComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-details';
import { GovukSummaryCardListComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-card-list';
import {
  GovukSummaryListComponent,
  GovukSummaryListRowComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import type { ReviewSection } from '../../interfaces/cases-create-casefile-review-section.interface';

@Component({
  selector: 'app-cases-create-casefile-review-section',
  imports: [
    GovukDetailsComponent,
    GovukSummaryCardListComponent,
    GovukSummaryListComponent,
    GovukSummaryListRowComponent,
  ],
  templateUrl: './cases-create-casefile-review-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    button.govuk-link {
      border: 0;
      padding: 0;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    button.govuk-link:disabled {
      cursor: default;
    }
  `,
})
export class CasesCreateCasefileReviewSectionComponent {
  public readonly section = input.required<ReviewSection>();
  public readonly disabled = input(false);
  public readonly actionable = input(true);
  public readonly changeEvent = output<string>();
  public readonly id = computed(() => `review-${this.section().id}`);
  public readonly listId = computed(() => `${this.id()}-list`);
  public readonly bankId = computed(() => `${this.id()}-bank`);
  public readonly bankListId = computed(() => `${this.bankId()}-list`);
}
