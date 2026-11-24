import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GovukTagComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-tag';
import type { RespondentAccountAtAGlance } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import {
  RESPONDENT_ACCOUNT_ROUTE,
  type RespondentAccountActionInfo,
} from '../../routing/cases-account-respondent-navigation';
import { type AccountDisplayRow, applicantRows, respondentRows } from '../../utils/respondent-account-display';

function rowContext(rows: AccountDisplayRow[]) {
  return { $implicit: rows.map(({ label, value }) => ({ label, lines: value?.split('\n') ?? null })) };
}

@Component({
  selector: 'app-respondent-account-at-a-glance',
  imports: [GovukTagComponent, NgTemplateOutlet, RouterLink],
  templateUrl: './respondent-account-at-a-glance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RespondentAccountAtAGlanceComponent {
  protected readonly respondent = computed(() => rowContext(respondentRows(this.summary())));
  protected readonly applicant = computed(() => rowContext(applicantRows(this.summary())));
  protected readonly comment = computed(() => this.summary().comment?.trim() || null);
  protected readonly restrictedRespondent = computed(() => this.summary().respondent.restricted === true);
  protected readonly restrictedApplicant = computed(() => {
    const applicant = this.summary().applicant;
    return applicant?.kind === 'individual' && applicant.restricted === true;
  });
  protected readonly commentInfo = computed<RespondentAccountActionInfo>(() => ({
    ...this.actionInfo(),
    comment: this.comment() === null ? 'add' : 'change',
  }));
  protected readonly commentLink = computed(() => [
    RESPONDENT_ACCOUNT_ROUTE,
    this.summary().respondentAccountId,
    'comment',
    'change',
  ]);

  public readonly summary = input.required<RespondentAccountAtAGlance>();
  public readonly showActions = input.required<boolean>();
  public readonly actionInfo = input.required<RespondentAccountActionInfo>();
}
