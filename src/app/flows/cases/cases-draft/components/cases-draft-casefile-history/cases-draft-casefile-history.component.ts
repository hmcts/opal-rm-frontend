import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GovukTagComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-tag';
import {
  MojTimelineComponent,
  MojTimelineItemComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-timeline';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { CasesDraftDashboardMode } from '../../types/cases-draft-dashboard-mode.type';
import { casefileStatusLabel, chronologicalCasefileTimeline } from '../../utils/cases-draft-casefile-history';

@Component({
  selector: 'app-cases-draft-casefile-history',
  imports: [DatePipe, GovukTagComponent, MojTimelineComponent, MojTimelineItemComponent],
  templateUrl: './cases-draft-casefile-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCasefileHistoryComponent {
  public readonly draft = input.required<IOpalMaintenanceDraftCasefileDetail>();
  public readonly context = input.required<CasesDraftDashboardMode>();
  public readonly statusLabel = computed(() => casefileStatusLabel(this.draft().casefile_status, this.context()));
  public readonly items = computed(() => chronologicalCasefileTimeline(this.draft().timeline_data));
}
