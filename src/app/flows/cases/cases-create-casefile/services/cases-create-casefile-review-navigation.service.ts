import { Injectable, computed, inject, signal } from '@angular/core';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileReviewReturnContext } from '../types/cases-create-casefile-review-return-context.type';

/** Closed, in-memory return context; it never contains case data or arbitrary return URLs. */
@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileReviewNavigationService {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly origin = signal<CasesCreateCasefileReviewReturnContext | null>(null);
  public readonly context = this.origin.asReadonly();
  public readonly focusId = computed(() => {
    const context = this.context();
    if (!context) return 'review-heading';
    return 'termId' in context ? `review-order-term-${context.termId}` : `review-${context.section}`;
  });

  public setContext(context: CasesCreateCasefileReviewReturnContext): void {
    this.origin.set(context);
  }

  public clearContext(): void {
    this.origin.set(null);
  }

  public destination(eligible: boolean): string {
    return '/cases/create-casefile/' + (eligible ? 'check-case-details' : 'task-list');
  }

  public returnPath(normalDestination: string): string {
    return this.context() ? this.destination(this.store.checkCaseAvailable()) : normalDestination;
  }
}
