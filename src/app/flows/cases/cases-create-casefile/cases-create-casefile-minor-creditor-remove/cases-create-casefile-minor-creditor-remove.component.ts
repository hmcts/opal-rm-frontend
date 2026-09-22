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
import { GovukSummaryCardListComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-card-list';
import {
  GovukSummaryListComponent,
  GovukSummaryListRowComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-summary-list';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import type { ICasesCreateCasefileMinorCreditorRemovalOutcome } from '../interfaces/cases-create-casefile-minor-creditor-removal-outcome.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { minorCreditorSummaryRows } from '../cases-create-casefile-minor-creditor-summary/utils/cases-create-casefile-minor-creditor-summary-rows';

type RemovalNavigation = 'confirm' | 'cancel' | 'recover';

@Component({
  selector: 'app-cases-create-casefile-minor-creditor-remove',
  imports: [GovukSummaryCardListComponent, GovukSummaryListComponent, GovukSummaryListRowComponent],
  templateUrl: './cases-create-casefile-minor-creditor-remove.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileMinorCreditorRemoveComponent {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly root = '/' + this.paths.root + '/';
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('heading');
  private readonly errorHeading = viewChild<ElementRef<HTMLHeadingElement>>('errorHeading');
  private entryOutcome: ICasesCreateCasefileMinorCreditorRemovalOutcome | null = null;
  private lastNavigation: RemovalNavigation | null = null;

  public readonly entrySelection = this.store.minorCreditorRemoval();
  public readonly summaryPath = this.root + this.paths.children.minorCreditorSummary;
  public readonly creditorPath = this.root + this.paths.children.orderTermCreditor;
  public readonly orderTermsSelectPath = this.root + this.paths.children.orderTermsSelect;
  public readonly safeNavigationErrorMessage = GENERIC_HTTP_ERROR_MESSAGE;
  public readonly busy = signal(false);
  public readonly committed = signal(false);
  public readonly navigationFailed = signal(false);

  public readonly available = computed(
    () =>
      !this.committed() &&
      this.entrySelection !== null &&
      this.store.isMinorCreditorRemovalCurrent(this.entrySelection),
  );
  public readonly rows = computed(() => {
    const draft = this.entrySelection?.expectedDraft;
    return this.available() && draft?.details && draft.countryName
      ? minorCreditorSummaryRows(draft.details, draft.countryName, 'removal')
      : [];
  });
  public readonly retryAvailable = computed(() => {
    if (!this.navigationFailed() || this.busy()) return false;
    if (this.lastNavigation === 'cancel') return this.available();
    if (this.lastNavigation === 'recover') return true;
    if (this.lastNavigation !== 'confirm') return false;
    const outcome = this.entryOutcome;
    return (
      outcome !== null &&
      this.store.minorCreditorRemovalOutcome() === outcome &&
      this.store.currentOrderTermId() === outcome.termId &&
      this.store.creditorDraft() === null &&
      this.store.orderTerms().find((term) => term.termId === outcome.termId) === outcome.expectedTerm &&
      this.store.orderTermAmendment() === outcome.expectedAmendment
    );
  });

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  private async navigate(action: RemovalNavigation): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.navigationFailed.set(false);
    this.lastNavigation = action;
    const termId = this.store.currentOrderTermId();
    const hasTerm = termId !== null && this.store.orderTerms().some((term) => term.termId === termId);
    const target =
      action === 'cancel'
        ? this.summaryPath
        : action === 'recover' && !hasTerm
          ? this.orderTermsSelectPath
          : this.creditorPath;
    try {
      const success =
        action === 'cancel'
          ? await this.router.navigateByUrl(target, { state: { minorCreditorRemovalReturnFocus: true } })
          : await this.router.navigateByUrl(target);
      this.navigationFailed.set(!success);
      if (success && action === 'cancel' && this.entrySelection) {
        this.store.clearMinorCreditorRemoval(this.entrySelection);
      }
      if (!success) this.focusNavigationError();
    } catch {
      this.navigationFailed.set(true);
      this.focusNavigationError();
    } finally {
      this.busy.set(false);
    }
  }

  private focusNavigationError(): void {
    afterNextRender(() => this.errorHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Removes the captured creditor once and navigates back to Creditor. */
  public async handleConfirm(): Promise<void> {
    if (this.busy() || this.committed() || !this.entrySelection || !this.available()) return;
    if (!this.store.confirmMinorCreditorRemoval(this.entrySelection)) return;
    this.entryOutcome = this.store.minorCreditorRemovalOutcome();
    this.committed.set(true);
    await this.navigate('confirm');
  }

  /** Returns to Summary without changing the captured business state. */
  public async handleCancel(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy() || this.committed() || !this.available()) return;
    await this.navigate('cancel');
  }

  /** Retries only the failed navigation whose source state is still current. */
  public async retryNavigation(): Promise<void> {
    if (!this.retryAvailable() || !this.lastNavigation) return;
    await this.navigate(this.lastNavigation);
  }

  /** Leaves a stale removal screen through the safest valid journey route. */
  public async recover(): Promise<void> {
    if (!this.busy()) await this.navigate('recover');
  }
}
