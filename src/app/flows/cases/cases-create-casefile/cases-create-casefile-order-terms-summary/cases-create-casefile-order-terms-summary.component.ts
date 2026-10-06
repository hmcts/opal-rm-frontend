import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  afterRenderEffect,
  computed,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { CasesCreateCasefileOrderTermCardComponent } from '../components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
import { CasesCreateCasefileRemovalNotificationComponent } from '../components/cases-create-casefile-removal-notification/cases-create-casefile-removal-notification.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { buildOrderTermCard } from '../utils/cases-create-casefile-order-term-card';
import { cancelOrderTermAmendmentAfterNavigation } from '../utils/cases-create-casefile-order-term-amendment-navigation';

@Component({
  selector: 'app-cases-create-casefile-order-terms-summary',
  imports: [CasesCreateCasefileOrderTermCardComponent, CasesCreateCasefileRemovalNotificationComponent],
  templateUrl: './cases-create-casefile-order-terms-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSummaryComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly root = '/' + this.paths.root + '/';
  private readonly taskListPath = this.root + this.paths.children.taskList;
  private readonly selectionPath = this.root + this.paths.children.orderTermsSelect;
  private navigationInFlight = false;
  private focusedOutcome: string | null = null;
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly removeLinks = viewChildren<ElementRef<HTMLElement>>('removeLink');
  private readonly notice = viewChild(CasesCreateCasefileRemovalNotificationComponent);
  public readonly removalOutcome = this.store.orderTermRemovalOutcome;
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

  public ngOnInit(): void {
    afterRenderEffect(
      () => {
        const outcome = this.removalOutcome();
        if (outcome === 'removed') {
          if (this.focusedOutcome !== outcome && this.notice()) {
            this.notice()?.focus();
            this.focusedOutcome = outcome;
          }
          return;
        }
        this.focusedOutcome = null;
        const focusId = this.store.orderTermRemovalReturnFocusId();
        if (focusId === null) return;
        const link = this.removeLinks().find((item) => item.nativeElement.id === `order-term-${focusId}-remove`);
        (link?.nativeElement ?? this.heading().nativeElement).focus();
        this.store.setOrderTermRemovalReturnFocusId(null);
      },
      { injector: this.injector },
    );
  }

  public ngOnDestroy(): void {
    this.store.clearOrderTermRemovalOutcome();
  }

  public handleDismissRemovalOutcome(): void {
    this.store.clearOrderTermRemovalOutcome();
    this.heading().nativeElement.focus();
  }

  public async handleChange(termId: number): Promise<void> {
    if (this.navigationInFlight) return;
    const card = this.cards().find((item) => item.termId === termId);
    if (!card) return;
    this.store.clearOrderTermRemovalOutcome();
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

  public async handleRemove(event: Event, termId: number): Promise<void> {
    event.preventDefault();
    if (this.navigationInFlight) return;
    const selected = this.store.beginOrderTermRemoval(termId);
    if (!selected) return;
    this.navigationInFlight = true;
    try {
      const path = this.root + this.paths.children.orderTermsRemove + '/' + selected.index;
      if (!(await this.router.navigateByUrl(path))) this.store.clearOrderTermRemoval(selected);
    } catch {
      this.store.clearOrderTermRemoval(selected);
    } finally {
      this.navigationInFlight = false;
    }
  }

  public handleAddTerms(): void {
    if (this.navigationInFlight) return;
    this.store.clearOrderTermRemovalOutcome();
    const amendment = this.store.orderTermAmendment();
    if (amendment) this.store.cancelOrderTermAmendment(amendment.termId);
    else this.store.setPendingOrderTermResultId(null);
    void this.router.navigateByUrl(this.selectionPath);
  }

  public async handleBack(): Promise<void> {
    if (this.navigationInFlight) return;
    this.store.clearOrderTermRemovalOutcome();
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
