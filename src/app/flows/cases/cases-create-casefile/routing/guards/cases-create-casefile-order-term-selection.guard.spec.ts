import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileOrderTermSelectionGuard } from './cases-create-casefile-order-term-selection.guard';

describe('Order term input selection guard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] }));

  it.each([
    ['MOCK01', 'MOCK01', true],
    ['MOCK01', 'MOCK02', false],
    [null, 'MOCK01', false],
    ['MOCK01', null, false],
  ] as const)('checks saved %s against URL %s', (saved, urlId, allowed) => {
    TestBed.inject(CasesCreateCasefileStore).setPendingOrderTermResultId(saved);
    const route = new ActivatedRouteSnapshot();
    Object.defineProperty(route, 'paramMap', { value: convertToParamMap(urlId ? { resultId: urlId } : {}) });
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermSelectionGuard(route, {} as RouterStateSnapshot),
    );
    expect(result).toEqual(
      allowed ? true : TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/select'),
    );
  });
});
