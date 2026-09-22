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
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import {
  GovukSummaryCardActionComponent,
  GovukSummaryCardListComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-card-list';
import {
  GovukSummaryListComponent,
  GovukSummaryListRowComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import type { ICasesCreateCasefileCreditorDraft } from '../interfaces/cases-create-casefile-creditor-draft.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { cancelOrderTermAmendmentAfterNavigation } from '../utils/cases-create-casefile-order-term-amendment-navigation';
import { minorCreditorSummaryRows } from './utils/cases-create-casefile-minor-creditor-summary-rows';

@Component({
  selector: 'app-cases-create-casefile-minor-creditor-summary',
  imports: [
    GovukCancelLinkComponent,
    GovukSummaryCardActionComponent,
    GovukSummaryCardListComponent,
    GovukSummaryListComponent,
    GovukSummaryListRowComponent,
  ],
  templateUrl: './cases-create-casefile-minor-creditor-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileMinorCreditorSummaryComponent {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly entryTermId = this.store.currentOrderTermId();
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly root = '/' + this.paths.root + '/';
  private navigationInFlight = false;
  private acceptedSequence: number | null = null;
  private readonly errorHeading = viewChild<ElementRef<HTMLHeadingElement>>('navigationErrorHeading');

  private readonly pendingDraft = computed(() => {
    const draft = this.store.creditorDraft();
    return this.entryTermId !== null &&
      this.store.currentOrderTermId() === this.entryTermId &&
      this.store.orderTerms().some((term) => term.termId === this.entryTermId) &&
      draft?.termId === this.entryTermId
      ? draft
      : null;
  });
  private readonly reviewedDraft: ICasesCreateCasefileCreditorDraft | null = this.pendingDraft();
  public readonly detailsPath = this.root + this.paths.children.minorCreditorDetails;
  public readonly removePath = this.root + this.paths.children.minorCreditorRemove;
  public readonly creditorPath = this.root + this.paths.children.orderTermCreditor;
  public readonly orderTermsPath = this.root + this.paths.children.orderTermsSummary;
  public readonly navigationFailed = signal(false);
  public readonly safeNavigationErrorMessage = GENERIC_HTTP_ERROR_MESSAGE;

  public readonly rows = computed(() => {
    if (
      this.store.currentOrderTermId() !== this.entryTermId ||
      !this.store.orderTerms().some((term) => term.termId === this.entryTermId)
    ) {
      return [];
    }
    const draft = this.pendingDraft() ?? (this.acceptedSequence !== null ? this.reviewedDraft : null);
    return draft?.details && draft.countryName ? minorCreditorSummaryRows(draft.details, draft.countryName) : [];
  });

  private showNavigationError(): void {
    this.navigationFailed.set(true);
    afterNextRender(() => this.errorHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  public async handleContinue(): Promise<void> {
    const pending = this.store.orderTermAmendment();
    if (pending) {
      if (
        this.entryTermId !== pending.termId ||
        this.navigationInFlight ||
        !this.store.prepareAmendmentCompletion(pending.termId)
      ) {
        return;
      }
      const ready = this.store.orderTermAmendment()!;
      const draft = this.store.creditorDraft();
      this.navigationInFlight = true;
      try {
        if (await this.router.navigateByUrl(this.orderTermsPath)) {
          this.store.completeOrderTermAmendment(ready, draft);
        }
      } catch {
        return;
      } finally {
        this.navigationInFlight = false;
      }
      return;
    }
    if (this.navigationInFlight || this.entryTermId === null || this.store.currentOrderTermId() !== this.entryTermId) {
      return;
    }
    if (this.acceptedSequence === null) {
      this.acceptedSequence = this.store.acceptPendingMinorCreditor(this.entryTermId);
      if (this.acceptedSequence === null) return;
    } else {
      const term = this.store.orderTerms().find((item) => item.termId === this.entryTermId);
      if (
        this.store.creditorDraft() ||
        term?.creditor?.type !== 'minor' ||
        term.creditor.sequenceNumber !== this.acceptedSequence
      ) {
        return;
      }
    }
    this.navigationInFlight = true;
    try {
      await this.router.navigateByUrl(this.orderTermsPath);
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }

  public async handleCancel(): Promise<void> {
    const amendment = this.store.orderTermAmendment();
    if (amendment) {
      if (
        this.navigationInFlight ||
        this.entryTermId !== amendment.termId ||
        this.store.currentOrderTermId() !== this.entryTermId
      ) {
        return;
      }
      this.navigationInFlight = true;
      try {
        await cancelOrderTermAmendmentAfterNavigation(this.router, this.store, this.orderTermsPath, amendment);
      } finally {
        this.navigationInFlight = false;
      }
      return;
    }
    const draft = this.store.creditorDraft();
    if (
      this.navigationInFlight ||
      draft?.termId !== this.entryTermId ||
      this.store.currentOrderTermId() !== this.entryTermId
    ) {
      return;
    }
    this.navigationInFlight = true;
    try {
      if (await this.router.navigateByUrl(this.creditorPath)) {
        if (this.store.creditorDraft() === draft) this.store.clearCreditorDraft();
      }
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }

  /** Captures the reviewed draft and opens its removal confirmation. */
  public async handleRemove(): Promise<void> {
    if (this.navigationInFlight || this.pendingDraft() !== this.reviewedDraft) return;
    const selection = this.store.beginMinorCreditorRemoval();
    if (!selection) return;
    this.navigationInFlight = true;
    this.navigationFailed.set(false);
    try {
      if (!(await this.router.navigateByUrl(this.removePath))) {
        this.store.clearMinorCreditorRemoval(selection);
        this.showNavigationError();
      }
    } catch {
      this.store.clearMinorCreditorRemoval(selection);
      this.showNavigationError();
    } finally {
      this.navigationInFlight = false;
    }
  }

  public navigateTo(path: string): void {
    if (!this.navigationInFlight && this.pendingDraft()?.details) void this.router.navigateByUrl(path);
  }
}
