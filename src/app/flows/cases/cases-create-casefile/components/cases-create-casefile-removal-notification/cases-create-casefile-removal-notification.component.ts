import { ChangeDetectionStrategy, Component, ElementRef, output, viewChild } from '@angular/core';
import { GovukNotificationBannerComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-notification-banner';

@Component({
  selector: 'app-cases-create-casefile-removal-notification',
  imports: [GovukNotificationBannerComponent],
  templateUrl: './cases-create-casefile-removal-notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileRemovalNotificationComponent {
  private readonly notice = viewChild.required<ElementRef<HTMLElement>>('notice');
  public readonly dismissed = output<void>();

  public focus(): void {
    this.notice().nativeElement.focus();
  }
}
