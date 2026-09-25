import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile-order-terms-remove',
  imports: [GovukButtonComponent],
  templateUrl: './cases-create-casefile-order-terms-remove.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsRemoveComponent {
  private readonly router = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly selection = this.store.orderTermRemoval();
  private removed = false;
  public readonly busy = signal(false);
  public readonly unavailable = signal(!this.selection);
  public readonly navigationFailed = signal(false);
  public readonly termTitle = this.selection?.expectedTerm.presentation.title;

  private async navigate(path: string): Promise<boolean> {
    this.busy.set(true);
    try {
      const navigated = await this.router.navigateByUrl(path);
      this.navigationFailed.set(!navigated);
      return navigated;
    } catch {
      this.navigationFailed.set(true);
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  public async handleRemove(): Promise<void> {
    if (this.busy() || !this.selection || this.unavailable()) return;
    if (!this.removed) {
      this.removed = this.store.confirmOrderTermRemoval(this.selection);
      if (!this.removed) {
        this.unavailable.set(true);
        return;
      }
    }
    await this.navigate(this.reviewNavigation.returnPath('/cases/create-casefile/order-terms/summary'));
  }

  public async handleReturn(): Promise<void> {
    if (this.busy()) return;
    // The summary completes return-to-review after this captured cancellation is committed.
    const navigated = await this.navigate('/cases/create-casefile/order-terms/summary');
    if (navigated && this.selection) this.store.clearOrderTermRemoval(this.selection);
  }
}
