import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CasesCreateCasefileCompletionService } from '../../services/cases-create-casefile-completion.service';
import { casesCreateCasefileSubmissionConfirmationGuard } from './cases-create-casefile-submission-confirmation.guard';

describe('casesCreateCasefileSubmissionConfirmationGuard', () => {
  let completion: CasesCreateCasefileCompletionService;
  let router: ReturnType<typeof createSpyObj>;
  let expectedRedirectUrlTree: UrlTree;

  beforeEach(() => {
    router = createSpyObj(Router, ['createUrlTree']);
    expectedRedirectUrlTree = new UrlTree();
    router['createUrlTree'].mockReturnValue(expectedRedirectUrlTree);
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    completion = TestBed.inject(CasesCreateCasefileCompletionService);
    completion.clear();
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      casesCreateCasefileSubmissionConfirmationGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  it('allows repeat reads without consuming the completion result', () => {
    const result = { draft_casefile_id: 'synthetic-completion' };
    completion.record(result);

    expect(runGuard()).toBe(true);
    expect(runGuard()).toBe(true);
    expect(completion.result()).toEqual(result);
    expect(router['createUrlTree']).not.toHaveBeenCalled();
  });

  it('redirects missing completion state to Case Type', () => {
    expect(runGuard()).toBe(expectedRedirectUrlTree);
    expect(router['createUrlTree']).toHaveBeenCalledWith(['/cases/create-casefile/case-type']);
  });
});
