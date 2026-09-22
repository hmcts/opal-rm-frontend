import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { take } from 'rxjs';
import { CASES_CREATE_CASEFILE_SUBMISSION_COPY as COPY } from '../constants/cases-create-casefile-submission-copy.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileReviewIssue } from '../types/cases-create-casefile-review-issue.type';
import type { CasesCreateCasefileSubmissionState } from '../types/cases-create-casefile-submission-state.type';
import { acceptedCasefileSnapshot } from '../utils/cases-create-casefile-accepted-snapshot';
import { reviewEligibility } from '../utils/cases-create-casefile-review-eligibility';
import { CasesCreateCasefileAuthorityService } from './cases-create-casefile-authority.service';
import { CasesCreateCasefileSubmissionGateway } from './cases-create-casefile-submission-gateway.service';

/** Owns a local simulation across review component recreation, separately from the draft. */
@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileSubmissionService {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly gateway = inject(CasesCreateCasefileSubmissionGateway);
  private readonly authority = inject(CasesCreateCasefileAuthorityService);
  private readonly global = inject(GlobalStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly status = signal<CasesCreateCasefileSubmissionState>('idle');
  private readonly confirmedReceipt = signal<string | null>(null);
  private readonly validation = signal<readonly CasesCreateCasefileReviewIssue[]>([]);
  private readonly failedNavigation = signal(false);
  private navigating = false;
  public readonly available = this.gateway.available;
  public readonly state = this.status.asReadonly();
  public readonly receipt = this.confirmedReceipt.asReadonly();
  public readonly issues = this.validation.asReadonly();
  public readonly navigationFailed = this.failedNavigation.asReadonly();
  public readonly pending = computed(() => this.state() === 'submitting');
  public readonly feedback = computed(() => {
    if (this.state() === 'definiteFailure') return COPY.rejected;
    if (this.state() === 'outcomeUnknown') return COPY.unknown;
    return '';
  });

  constructor() {
    effect(() => {
      const message = this.feedback();
      // Restore our feedback after unrelated successful reference-data requests.
      // An unrelated error retains its own global banner; our local summary remains visible.
      if (message && !this.global.bannerError().error) this.publishError(message);
    });
  }

  private publishError(message: string): void {
    this.global.setBannerError({ error: true, title: COPY.title, message, operationId: null });
  }

  private clearOwnedError(): void {
    if (this.global.bannerError().title === COPY.title) {
      this.global.setBannerError({ error: false, title: null, message: null, operationId: null });
    }
  }

  private fail(status: 'definiteFailure' | 'outcomeUnknown'): void {
    this.status.set(status);
    this.publishError(this.feedback());
  }

  /** Captures one validated accepted snapshot and locks before invoking the boundary. */
  public submit(): void {
    if (this.state() !== 'idle' && this.state() !== 'definiteFailure') return;
    const accepted = getState(this.store);
    const issues = reviewEligibility(accepted, this.available && this.authority.authorised());
    this.validation.set(issues);
    if (issues.length) return;
    this.status.set('submitting');
    this.clearOwnedError();
    try {
      const snapshot = acceptedCasefileSnapshot(accepted);
      this.gateway
        .submit(snapshot)
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (outcome) => {
            if (outcome.status === 'success' && /^MOCK-9817-[1-9]\d*$/.test(outcome.receipt)) {
              this.confirmedReceipt.set(outcome.receipt);
              this.status.set('succeeded');
              this.store.resetStore();
              void this.retryConfirmation();
            } else {
              this.fail(outcome.status === 'definiteFailure' ? 'definiteFailure' : 'outcomeUnknown');
            }
          },
          error: () => this.fail('outcomeUnknown'),
          complete: () => {
            if (this.pending()) this.fail('outcomeUnknown');
          },
        });
    } catch {
      this.fail('definiteFailure');
    }
  }

  /** A failed navigation can only retry navigation, never submission. */
  public async retryConfirmation(): Promise<void> {
    if (this.state() !== 'succeeded' || !this.receipt() || this.navigating) return;
    this.navigating = true;
    try {
      this.failedNavigation.set(!(await this.router.navigateByUrl('/cases/create-casefile/submission-confirmation')));
    } catch {
      this.failedNavigation.set(true);
    } finally {
      this.navigating = false;
    }
  }

  /** Clear only at an explicit new journey or confirmed departure, never during a pending operation. */
  public reset(): void {
    if (this.pending()) return;
    this.status.set('idle');
    this.confirmedReceipt.set(null);
    this.validation.set([]);
    this.failedNavigation.set(false);
    this.clearOwnedError();
  }
}
