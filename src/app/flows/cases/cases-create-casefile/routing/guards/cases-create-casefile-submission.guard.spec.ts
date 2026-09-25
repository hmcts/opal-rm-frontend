import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileSubmissionGuard } from './cases-create-casefile-submission.guard';

describe('Submission success guard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      casesCreateCasefileSubmissionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  it('redirects an unsubmitted case to review', () => {
    expect(runGuard()).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/check-case-details'));
  });

  it('permits confirmation after a successful response without consuming success', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setSubmissionSucceeded(true);
    expect(runGuard()).toBe(true);
    expect(store.submissionSucceeded()).toBe(true);
  });

  it('denies confirmation after resetting the journey', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setSubmissionSucceeded(true);
    store.resetStore();
    expect(store.submissionSucceeded()).toBe(false);
    expect(runGuard()).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/check-case-details'));
  });
});
