import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTerm } from '../interfaces/cases-create-casefile-order-term.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { cancelOrderTermAmendmentAfterNavigation } from '../utils/cases-create-casefile-order-term-amendment-navigation';
import { CasesCreateCasefileOrderTermsInputFormComponent } from './cases-create-casefile-order-terms-input-form/cases-create-casefile-order-terms-input-form.component';
import type { ICasesCreateCasefileOrderTermDraftChange } from './interfaces/cases-create-casefile-order-term-draft-change.interface';
import type { ICasesCreateCasefileOrderTermPage } from './interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from './types/cases-create-casefile-order-term-raw-value.type';
import { amendmentRawValues } from './utils/cases-create-casefile-order-term-amendment-values';
import { canonicalOrderTerm } from './utils/cases-create-casefile-order-term-values';

interface OrderTermPageEntry {
  page: ICasesCreateCasefileOrderTermPage;
  values: Record<string, CasesCreateCasefileOrderTermRawValue>;
  dirty: boolean;
}

@Component({
  selector: 'app-cases-create-casefile-order-terms-input',
  imports: [GovukBackLinkComponent, GovukCancelLinkComponent, CasesCreateCasefileOrderTermsInputFormComponent],
  templateUrl: './cases-create-casefile-order-terms-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsInputComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly navigationRouter = inject(Router);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly dates = inject(DateService);
  private readonly title = inject(Title);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private accepted = false;
  private acceptedTermId: number | null = null;
  private retryDraft: ICasesCreateCasefileOrderTermDraftChange | null = null;
  private navigationInFlight = false;
  public readonly pages = signal<OrderTermPageEntry[]>([]);
  public readonly frequency = computed(() => this.store.orderDetails()?.paymentFrequency ?? '');
  public readonly amendmentInProgress = computed(() => this.store.orderTermAmendment() !== null);

  public constructor() {
    super();
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const page = data['orderTerm'] as ICasesCreateCasefileOrderTermPage;
      const hadDraft = this.store.orderTermDraft() !== null;
      this.store.prepareOrderTermDraft(page);
      const amendment = this.store.orderTermAmendment();
      if (
        amendment &&
        !hadDraft &&
        amendment.termId === this.store.currentOrderTermId() &&
        amendment.term.resultId === page.resultId
      ) {
        this.store.updateOrderTermDraft(amendmentRawValues(amendment.term, page, this.dates), false);
      }
      const draft = this.store.orderTermDraft();
      this.accepted = false;
      this.acceptedTermId = null;
      this.retryDraft = null;
      this.stateUnsavedChanges = draft?.dirty ?? false;
      this.store.setUnsavedChanges(this.stateUnsavedChanges);
      this.pages.set([
        {
          page,
          values: { ...draft?.values },
          dirty: draft?.dirty ?? false,
        },
      ]);
      this.title.setTitle(`OPAL - ${page.title}`);
    });
  }

  private async navigateToCreditor(): Promise<void> {
    if (this.navigationInFlight) return;
    this.navigationInFlight = true;
    try {
      await this.navigationRouter.navigateByUrl('/' + this.paths.root + '/' + this.paths.children.orderTermCreditor);
    } catch {
      // Keep the accepted term identity available so a safe retry can update the same record.
    } finally {
      this.navigationInFlight = false;
    }
  }

  public handleDraftChange(change: ICasesCreateCasefileOrderTermDraftChange): void {
    this.stateUnsavedChanges = change.dirty;
    if (this.accepted) {
      this.retryDraft = change;
      this.store.setUnsavedChanges(change.dirty);
      return;
    }
    this.store.updateOrderTermDraft(change.values, change.dirty);
  }

  public handleUnsavedChanges(changed: boolean): void {
    this.stateUnsavedChanges = changed;
    this.store.setUnsavedChanges(changed);
  }

  public handleFormSubmit(form: {
    formData: Record<string, CasesCreateCasefileOrderTermRawValue>;
    nestedFlow: boolean;
  }): void {
    if (this.navigationInFlight) return;
    const amendment = this.store.orderTermAmendment();
    if (amendment) {
      const current = this.pages()[0];
      if (!current || amendment.termId !== this.store.currentOrderTermId()) return;
      let term: ICasesCreateCasefileOrderTerm;
      try {
        term = canonicalOrderTerm(current.page, form.formData, this.dates);
      } catch {
        return;
      }
      if (!this.store.stageOrderTermAmendment(term, current.page)) return;
      this.handleUnsavedChanges(false);
      void this.navigateToCreditor();
      return;
    }
    if (!this.accepted) {
      const current = this.pages()[0];
      if (!current) return;
      let term: ICasesCreateCasefileOrderTerm;
      try {
        term = canonicalOrderTerm(current.page, form.formData, this.dates);
      } catch {
        return;
      }
      if (!this.store.acceptOrderTerm(term)) return;
      this.accepted = true;
      this.acceptedTermId = this.store.currentOrderTermId();
    } else if (this.retryDraft) {
      const current = this.pages()[0];
      if (!current || this.acceptedTermId === null) return;
      let term: ICasesCreateCasefileOrderTerm;
      try {
        term = canonicalOrderTerm(current.page, form.formData, this.dates);
      } catch {
        return;
      }
      if (!this.store.replaceAcceptedOrderTerm(this.acceptedTermId, term)) return;
      this.retryDraft = null;
    }
    this.handleUnsavedChanges(false);
    void this.navigateToCreditor();
  }

  public async handleCancel(): Promise<void> {
    const amendment = this.store.orderTermAmendment();
    if (amendment) {
      if (this.navigationInFlight) return;
      this.navigationInFlight = true;
      try {
        const destination = '/' + this.paths.root + '/' + this.paths.children.orderTermsSummary;
        await cancelOrderTermAmendmentAfterNavigation(this.navigationRouter, this.store, destination, amendment);
      } finally {
        this.navigationInFlight = false;
      }
      return;
    }
    const navigated = await this.navigationRouter.navigateByUrl(
      '/' + this.paths.root + '/' + this.paths.children.orderTermsSelect,
    );
    if (navigated) this.store.discardOrderTermDraft();
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
