import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomPageHeaderComponent } from '@hmcts/opal-frontend-common/components/custom/custom-page-header';
import { CustomSummaryMetricBarComponent } from '@hmcts/opal-frontend-common/components/custom/custom-summary-metric-bar';
import { CustomSummaryMetricBarItemComponent } from '@hmcts/opal-frontend-common/components/custom/custom-summary-metric-bar/custom-summary-metric-bar-item';
import { CustomSummaryMetricBarItemLabelComponent } from '@hmcts/opal-frontend-common/components/custom/custom-summary-metric-bar/custom-summary-metric-bar-item/custom-summary-metric-bar-item-label';
import { GovukTagComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-tag';
import {
  MojAlertComponent,
  MojAlertContentComponent,
  MojAlertIconComponent,
  MojAlertTextComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-alert';
import { MojButtonMenuComponent } from '@hmcts/opal-frontend-common/components/moj/moj-button-menu';
import type { RespondentAccountHeaderSummary } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import {
  RESPONDENT_ACCOUNT_ROUTE,
  type RespondentAccountActionInfo,
} from '../../routing/cases-account-respondent-navigation';
import { accountDisplayName, headerRows } from '../../utils/respondent-account-display';

const metricStyles = new Map([
  ['Arrears', { background: 'govuk-blue-background-colour', text: 'govuk-white-text-colour' }],
  ['Balance', { background: 'govuk-lighter-blue-background-colour', text: 'govuk-dark-blue-text-colour' }],
]);

@Component({
  selector: 'app-respondent-account-header',
  imports: [
    RouterLink,
    CustomPageHeaderComponent,
    CustomSummaryMetricBarComponent,
    CustomSummaryMetricBarItemComponent,
    CustomSummaryMetricBarItemLabelComponent,
    GovukTagComponent,
    MojAlertComponent,
    MojAlertContentComponent,
    MojAlertIconComponent,
    MojAlertTextComponent,
    MojButtonMenuComponent,
  ],
  templateUrl: './respondent-account-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RespondentAccountHeaderComponent {
  protected readonly heading = computed(() => {
    const account = this.header();
    return account ? accountDisplayName(account.name) : 'Respondent account details';
  });
  protected readonly metrics = computed(() => {
    const account = this.header();
    if (!account) return null;

    return headerRows(account).map((row) => {
      const style = metricStyles.get(row.label);
      return { ...row, backgroundColour: style?.background ?? '', textColour: style?.text ?? '' };
    });
  });
  protected readonly actionLinks = computed(() => {
    const id = this.header()?.respondentAccountId;
    return {
      note: [RESPONDENT_ACCOUNT_ROUTE, id, 'note', 'add'],
      caseType: [RESPONDENT_ACCOUNT_ROUTE, id, 'case-type', 'change'],
    };
  });

  public readonly header = input.required<RespondentAccountHeaderSummary | null>();
  public readonly showActions = input.required<boolean>();
  public readonly actionInfo = input.required<RespondentAccountActionInfo>();
  public readonly freshness = input.required<{ warning: boolean; confirmed: boolean }>();
  public readonly loading = input.required<boolean>();
  public readonly refresh = output<void>();
  public readonly dismissConfirmation = output<void>();
}
