import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { CasesCreateCasefileOrderTermCardComponent } from '../components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { buildOrderTermCard } from '../utils/cases-create-casefile-order-term-card';
import { cancelOrderTermAmendmentAfterNavigation } from '../utils/cases-create-casefile-order-term-amendment-navigation';

@Component({
  selector: 'app-cases-create-casefile-order-terms-summary',
  imports: [GovukBackLinkComponent, GovukButtonComponent, CasesCreateCasefileOrderTermCardComponent],
  templateUrl: './cases-create-casefile-order-terms-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSummaryComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly root = '/' + this.paths.root + '/';
  private readonly taskListPath = this.root + this.paths.children.taskList;
  private readonly selectionPath = this.root + this.paths.children.orderTermsSelect;
  private navigationInFlight = false;

  public readonly cards = computed(() => {
    const context = {
      applicantDetails: this.store.applicantDetails(),
      minorCreditors: this.store.minorCreditors(),
      orderDetails: this.store.orderDetails(),
    };
    return this.store.orderTerms().map((term, index) => {
      return {
        ...buildOrderTermCard(term, context),
        ariaLabel: `${term.presentation.title} order term ${index + 1}`,
        inputPath: this.root + this.paths.children.orderTermsInput + '/' + encodeURIComponent(term.resultId),
        removePath: this.root + this.paths.children.orderTermsRemove + '/' + index,
      };
    });
  });

  public async handleChange(termId: number): Promise<void> {
    if (this.navigationInFlight) return;
    const card = this.cards().find((item) => item.termId === termId);
    if (!card) return;
    const pendingAmendment = this.store.orderTermAmendment();
    if (pendingAmendment && pendingAmendment.termId !== termId) {
      if (!this.document.defaultView?.confirm('Discard your unfinished changes to the other order term?')) return;
      this.store.cancelOrderTermAmendment(pendingAmendment.termId);
    }
    const existingAmendment = this.store.orderTermAmendment();
    if (!this.store.beginOrderTermAmendment(termId)) return;
    const amendment = this.store.orderTermAmendment();
    let navigated = false;

    this.navigationInFlight = true;
    try {
      navigated = await this.router.navigateByUrl(card.inputPath);
    } catch {
      return;
    } finally {
      if (
        !navigated &&
        !existingAmendment &&
        amendment &&
        this.store.orderTermAmendment() === amendment &&
        !this.store.orderTermDraft()?.dirty &&
        !this.store.unsavedChanges() &&
        !this.store.creditorDraft()
      ) {
        this.store.cancelOrderTermAmendment(amendment.termId);
      }
      this.navigationInFlight = false;
    }
  }

  public handleRemove(path: string): void {
    if (!this.navigationInFlight) void this.router.navigateByUrl(path);
  }

  public handleAddTerms(): void {
    if (this.navigationInFlight) return;
    const amendment = this.store.orderTermAmendment();
    if (amendment) this.store.cancelOrderTermAmendment(amendment.termId);
    else this.store.setPendingOrderTermResultId(null);
    void this.router.navigateByUrl(this.selectionPath);
  }

  public async handleBack(): Promise<void> {
    if (this.navigationInFlight) return;
    const amendment = this.store.orderTermAmendment();
    this.navigationInFlight = true;
    try {
      if (amendment) {
        await cancelOrderTermAmendmentAfterNavigation(this.router, this.store, this.taskListPath, amendment);
      } else {
        await this.router.navigateByUrl(this.taskListPath);
      }
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }
}
