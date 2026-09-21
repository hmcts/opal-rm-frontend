import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { GovukSummaryCardListComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-card-list';
import {
  GovukSummaryListComponent,
  GovukSummaryListRowComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { cancelOrderTermAmendmentAfterNavigation } from '../utils/cases-create-casefile-order-term-amendment-navigation';
import { creditorBankRows, orderTermRows } from './utils/cases-create-casefile-order-terms-summary-rows';

@Component({
  selector: 'app-cases-create-casefile-order-terms-summary',
  imports: [
    GovukBackLinkComponent,
    GovukButtonComponent,
    GovukSummaryCardListComponent,
    GovukSummaryListComponent,
    GovukSummaryListRowComponent,
  ],
  templateUrl: './cases-create-casefile-order-terms-summary.component.html',
  styleUrl: './cases-create-casefile-order-terms-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSummaryComponent {
  private readonly router = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly root = '/' + this.paths.root + '/';
  private readonly taskListPath = this.root + this.paths.children.taskList;
  private readonly selectionPath = this.root + this.paths.children.orderTermsSelect;
  private navigationInFlight = false;

  public readonly expanded = signal<ReadonlySet<number>>(new Set());
  public readonly cards = computed(() => {
    const applicant = this.store.applicantDetails();
    return this.store.orderTerms().map((term, index) => {
      const assignment = term.creditor;
      const minor =
        assignment?.type === 'minor'
          ? this.store.minorCreditors().find((item) => item.sequenceNumber === assignment.sequenceNumber)
          : undefined;
      const applicantName =
        applicant === null
          ? ''
          : 'organisationName' in applicant
            ? applicant.organisationName
            : [applicant.title, applicant.firstNames, applicant.lastName].filter(Boolean).join(' ');
      const creditorName =
        assignment?.type === 'applicant'
          ? applicantName
          : assignment?.type === 'major'
            ? assignment.displayName
            : minor?.displayName;
      const bank = assignment?.type === 'applicant' ? (applicant?.bankDetails ?? null) : (minor?.details.bank ?? null);
      const rows = orderTermRows(term, this.store.orderDetails()?.paymentFrequency ?? '');
      if (creditorName) rows.push({ id: 'assigned-creditor', label: 'Creditor', value: creditorName });
      return {
        termId: term.termId,
        title: term.presentation.title,
        ariaLabel: `${term.presentation.title} order term ${index + 1}`,
        rows,
        bankRows: creditorBankRows(bank),
        id: 'order-term-' + term.termId,
        bankId: 'order-term-' + term.termId + '-bank',
        bankListId: 'order-term-' + term.termId + '-bank-list',
        inputPath: this.root + this.paths.children.orderTermsInput + '/' + encodeURIComponent(term.resultId),
        removePath: this.root + this.paths.children.orderTermsRemove + '/' + index,
      };
    });
  });

  public async handleChange(termId: number): Promise<void> {
    if (this.navigationInFlight) return;
    const card = this.cards().find((item) => item.termId === termId);
    if (!card || !this.store.beginOrderTermAmendment(termId)) return;

    this.navigationInFlight = true;
    try {
      await this.router.navigateByUrl(card.inputPath);
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }

  public handleRemove(path: string): void {
    if (!this.navigationInFlight) void this.router.navigateByUrl(path);
  }

  public toggleCreditor(termId: number): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(termId)) next.delete(termId);
      else next.add(termId);
      return next;
    });
  }

  public handleAddTerms(): void {
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
