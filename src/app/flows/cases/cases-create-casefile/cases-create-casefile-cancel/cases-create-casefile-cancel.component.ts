import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile-cancel',
  imports: [GovukCancelLinkComponent],
  templateUrl: './cases-create-casefile-cancel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCancelComponent {
  private readonly router = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly error = viewChild<ElementRef<HTMLElement>>('navigationError');
  private readonly root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
  private readonly caseTypePath = this.root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;
  private readonly reviewPath = this.root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails;
  public readonly busy = signal(false);
  public readonly deleted = signal(false);
  public readonly navigationFailed = signal(false);
  public readonly blocked = computed(() => this.busy());

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  private async navigate(path: string): Promise<void> {
    this.busy.set(true);
    this.navigationFailed.set(false);
    try {
      const success =
        path === this.caseTypePath
          ? await this.router.navigateByUrl(path, { state: { focusCaseTypeHeading: true } })
          : await this.router.navigateByUrl(path);
      this.navigationFailed.set(!success);
    } catch {
      this.navigationFailed.set(true);
    } finally {
      this.busy.set(false);
      if (this.navigationFailed()) {
        afterNextRender(() => this.error()?.nativeElement.focus(), { injector: this.injector });
      }
    }
  }

  /** Discards once; after failure subsequent activations retry only navigation. */
  public async handleConfirm(): Promise<void> {
    if (this.blocked()) return;
    if (!this.deleted()) {
      this.store.resetStore();
      this.reviewNavigation.clearContext();
      this.deleted.set(true);
    }

    await this.navigate(this.caseTypePath);
  }

  public async handleBack(): Promise<void> {
    if (this.blocked() || this.deleted()) return;
    await this.navigate(this.reviewPath);
  }
}
