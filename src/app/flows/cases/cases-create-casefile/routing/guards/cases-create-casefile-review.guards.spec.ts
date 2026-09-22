import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CasesCreateCasefileSubmissionService } from '../../services/cases-create-casefile-submission.service';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../../tokens/cases-create-casefile-mock-enabled.token';
import { casesCreateCasefileCheckDetailsGuard } from './cases-create-casefile-check-details.guard';
import { casesCreateCasefileReceiptGuard } from './cases-create-casefile-receipt.guard';
import { casesCreateCasefileSubmissionPendingGuard } from './cases-create-casefile-submission-pending.guard';

describe('Review route protection', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true }],
    }),
  );
  const route = new ActivatedRouteSnapshot();
  const state = { url: '/cases/create-casefile/check-case-details' } as RouterStateSnapshot;

  it('denies incomplete entry with no submission and allows complete accepted state', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    const router = TestBed.inject(Router);
    const denied = TestBed.runInInjectionContext(() => casesCreateCasefileCheckDetailsGuard(route, state));
    expect(router.serializeUrl(denied as ReturnType<typeof router.parseUrl>)).toContain('task-list');
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileCheckDetailsGuard(route, state))).toBe(true);
  });

  it('does not treat direct confirmation entry as successful submission', () => {
    const router = TestBed.inject(Router);
    const denied = TestBed.runInInjectionContext(() => casesCreateCasefileReceiptGuard(route, state));
    expect(router.serializeUrl(denied as ReturnType<typeof router.parseUrl>)).toBe('/cases/create-casefile/case-type');
    const service = TestBed.inject(CasesCreateCasefileSubmissionService);
    vi.spyOn(service, 'receipt').mockReturnValue('MOCK-9817-1');
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileReceiptGuard(route, state))).toBe(true);
  });

  it('blocks navigation outright while submitting, without a discard prompt', () => {
    const service = TestBed.inject(CasesCreateCasefileSubmissionService);
    vi.spyOn(service, 'pending').mockReturnValue(true);
    expect(
      TestBed.runInInjectionContext(() => casesCreateCasefileSubmissionPendingGuard({}, route, state, state)),
    ).toBe(false);
    vi.spyOn(service, 'pending').mockReturnValue(false);
    expect(
      TestBed.runInInjectionContext(() => casesCreateCasefileSubmissionPendingGuard({}, route, state, state)),
    ).toBe(true);
  });
});
