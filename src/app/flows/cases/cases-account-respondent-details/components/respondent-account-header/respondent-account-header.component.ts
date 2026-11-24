import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-respondent-account-header',
  imports: [
    RouterLink,
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
    return account ? `${account.accountNumber} - ${accountDisplayName(account.name)}` : 'Respondent account details';
  });
  protected readonly rows = computed(() => {
    const account = this.header();
    return account ? headerRows(account) : [];
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
