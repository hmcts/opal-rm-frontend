import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { parseCasesDraftNavigation } from '../utils/cases-draft-navigation';

@Component({
  selector: 'app-cases-draft-placeholder',
  imports: [RouterLink],
  templateUrl: './cases-draft-placeholder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftPlaceholderComponent {
  private readonly mode = inject(CASES_DRAFT_DASHBOARD_MODE);
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(CasesDraftNavigationService);
  private readonly dashboard = inject(CasesDraftDashboardService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly fragment = toSignal(this.route.fragment, { initialValue: this.route.snapshot.fragment });
  private readonly kind = computed(() => this.data()['placeholderKind']);
  private readonly validId = computed(() => {
    const id = this.params().get('draftCasefileId');
    return id !== null && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  });
  public readonly allRejectedContext = computed(() =>
    this.navigation.contextForPlaceholder(this.kind(), this.params().get('draftCasefileId')),
  );
  public readonly backUrl = computed(() =>
    this.allRejectedContext()
      ? this.navigation.allRejectedUrl()
      : this.navigation.dashboardUrl(parseCasesDraftNavigation(this.fragment(), this.mode)),
  );
  public readonly gridClass = computed(() =>
    this.kind() === 'rejections' ? 'govuk-grid-column-full' : 'govuk-grid-column-two-thirds',
  );
  public readonly headingText = computed(() => {
    switch (this.kind()) {
      case 'review':
        return 'Review case';
      case 'view':
        return 'View case details';
      case 'rejections':
        return 'View all rejected cases';
      case 'amendment':
        return 'Amend case';
      default:
        return 'Check case details';
    }
  });
  public readonly bodyText = computed(() => {
    if (this.kind() === 'review' || this.kind() === 'view') {
      if (!this.validId()) return 'This case could not be opened. Return to Review cases.';
      return this.kind() === 'review' ? 'Case review will be available here.' : 'Case details will be available here.';
    }
    if (this.kind() === 'rejections') return 'The complete list of rejected cases will be available here.';
    if (!this.validId()) return 'This case could not be opened. Return to Create cases.';
    return this.kind() === 'amendment'
      ? 'Case amendment will be available here.'
      : 'Case details will be available here.';
  });
  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }
  public async backToAllRejected(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      await this.navigation.returnFromPlaceholder(this.kind(), this.params().get('draftCasefileId'));
    } catch (error: unknown) {
      this.dashboard.reportError(error);
    }
  }
}
