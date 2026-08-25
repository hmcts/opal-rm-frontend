import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../constants/cases-create-casefile-case-types.constant';
import { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileFlowStateGuard } from './cases-create-casefile-flow-state.guard';

describe('casesCreateCasefileFlowStateGuard', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let router: ReturnType<typeof createSpyObj>;
  let expectedRedirectUrlTree: UrlTree;

  beforeEach(() => {
    router = createSpyObj(Router, ['createUrlTree']);
    expectedRedirectUrlTree = new UrlTree();
    router['createUrlTree'].mockReturnValue(expectedRedirectUrlTree);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });

    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  const runGuard = (queryParams?: Record<string, string>, fragment?: string | null) => {
    const route = { queryParams, fragment } as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() => casesCreateCasefileFlowStateGuard(route, {} as RouterStateSnapshot));
  };

  const setCaseTypeSelection = (selection: unknown): void => {
    const stateSource = store as unknown as WritableStateSource<ICasesCreateCasefileState>;
    patchState(stateSource, { caseTypeSelection: selection as ICasesCreateCasefileState['caseTypeSelection'] });
  };

  it.each([
    ['null', null],
    ['malformed REMO In', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN }],
    [
      'outbound data carrying Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
    ],
  ])('redirects %s state to Case Type', (_description, selection) => {
    setCaseTypeSelection(selection);

    const result = runGuard();

    expect(result).toBe(expectedRedirectUrlTree);
    expect(router['createUrlTree']).toHaveBeenCalledWith(['cases/create-casefile/case-type'], {
      queryParams: undefined,
      fragment: undefined,
    });
  });

  it.each([
    [
      'REMO In Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
    ],
    [
      'REMO In Organisation',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
    ],
    ['REMO Out', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }],
    ['REMO Out (CMS)', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }],
  ])('allows valid %s state', (_description, selection) => {
    setCaseTypeSelection(selection);

    const result = runGuard();

    expect(result).toBe(true);
    expect(router['createUrlTree']).not.toHaveBeenCalled();
  });

  it('preserves source query parameters and fragment when redirecting', () => {
    const result = runGuard({ returnTo: 'task-list' }, 'section-one');

    expect(result).toBe(expectedRedirectUrlTree);
    expect(router['createUrlTree']).toHaveBeenCalledWith(['cases/create-casefile/case-type'], {
      queryParams: { returnTo: 'task-list' },
      fragment: 'section-one',
    });
  });
});
