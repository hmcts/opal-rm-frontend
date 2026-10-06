import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { CasesCreateCasefileOrderTermCardComponent } from '../components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { buildOrderTermCard } from '../utils/cases-create-casefile-order-term-card';

@Component({
  selector: 'app-cases-create-casefile-order-terms-remove',
  imports: [CasesCreateCasefileOrderTermCardComponent, GovukCancelLinkComponent],
  templateUrl: './cases-create-casefile-order-terms-remove.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsRemoveComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly injector = inject(Injector);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly selection = this.store.orderTermRemoval();
  private readonly outcome = this.store.orderTermRemovalOutcome;
  public readonly summaryPath =
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary;
  public readonly busy = signal(false);
  public readonly card = this.selection
    ? buildOrderTermCard(this.selection.expectedTerm, {
        applicantDetails: this.store.applicantDetails(),
        minorCreditors: this.store.minorCreditors(),
        orderDetails: this.store.orderDetails(),
      })
    : null;

  private async navigateToSummary(): Promise<boolean> {
    this.busy.set(true);
    try {
      return await this.router.navigateByUrl(
        this.outcome() ? this.reviewNavigation.returnPath(this.summaryPath) : this.summaryPath,
      );
    } catch {
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private async handleReturn(): Promise<void> {
    if (this.busy()) return;
    const active = this.store.orderTermRemoval();
    if (active && active !== this.selection) return;
    await this.navigateToSummary();
  }

  public ngOnInit(): void {
    effect(
      () => {
        if (!this.selection || this.outcome()) return;
        const active = this.store.orderTermRemoval();
        if (active && active !== this.selection) return;
        if (active === this.selection && this.store.isOrderTermRemovalCurrent(this.selection)) return;
        if (active === this.selection) this.store.markOrderTermRemovalUnavailable();
        untracked(() => {
          void this.handleReturn();
        });
      },
      { injector: this.injector },
    );
  }

  public ngOnDestroy(): void {
    if (this.selection) this.store.clearOrderTermRemoval(this.selection);
  }

  public async handleConfirm(): Promise<void> {
    if (this.busy()) return;
    const active = this.store.orderTermRemoval();
    if (active && active !== this.selection) return;
    if (this.outcome() || !this.selection || !active) {
      await this.handleReturn();
      return;
    }
    if (!this.store.isOrderTermRemovalCurrent(this.selection)) {
      this.store.markOrderTermRemovalUnavailable();
      await this.handleReturn();
      return;
    }
    this.store.confirmOrderTermRemoval(this.selection);
    await this.handleReturn();
  }

  public async handleCancel(): Promise<void> {
    if (this.busy()) return;
    const active = this.store.orderTermRemoval();
    if (active && active !== this.selection) return;
    if (this.outcome() || !this.selection || !active) {
      await this.handleReturn();
      return;
    }
    if (!this.store.isOrderTermRemovalCurrent(this.selection)) {
      this.store.markOrderTermRemovalUnavailable();
      await this.handleReturn();
      return;
    }
    this.store.setOrderTermRemovalReturnFocusId(this.selection.termId);
    const navigated = await this.navigateToSummary();
    if (navigated) this.store.clearOrderTermRemoval(this.selection);
    else if (this.store.orderTermRemoval() === this.selection) this.store.setOrderTermRemovalReturnFocusId(null);
  }
}
