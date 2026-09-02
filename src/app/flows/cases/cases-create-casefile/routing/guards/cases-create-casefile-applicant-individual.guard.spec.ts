import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../constants/cases-create-casefile-case-types.constant';
import { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileApplicantIndividualGuard } from './cases-create-casefile-applicant-individual.guard';

describe('casesCreateCasefileApplicantIndividualGuard', () => {
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

    return TestBed.runInInjectionContext(() =>
      casesCreateCasefileApplicantIndividualGuard(route, {} as RouterStateSnapshot),
    );
  };

  const setCaseTypeSelection = (selection: unknown): void => {
    const stateSource = store as unknown as WritableStateSource<ICasesCreateCasefileState>;
    patchState(stateSource, { caseTypeSelection: selection as ICasesCreateCasefileState['caseTypeSelection'] });
  };

  it.each([
    [
      'REMO In Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
    ],
    ['REMO Out', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }],
    ['REMO Out (CMS)', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }],
  ])('allows %s', (_description, selection) => {
    setCaseTypeSelection(selection);

    const result = runGuard();

    expect(result).toBe(true);
    expect(router['createUrlTree']).not.toHaveBeenCalled();
  });

  it('redirects REMO In Organisation to the task list', () => {
    setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    });

    const result = runGuard({ returnTo: 'task-list' }, 'section-one');

    expect(result).toBe(expectedRedirectUrlTree);
    expect(router['createUrlTree']).toHaveBeenCalledWith(['cases/create-casefile/task-list'], {
      queryParams: { returnTo: 'task-list' },
      fragment: 'section-one',
    });
  });

  it.each([
    ['null', null],
    ['malformed', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN }],
  ])('redirects %s state to the task list when invoked directly', (_description, selection) => {
    setCaseTypeSelection(selection);

    const result = runGuard();

    expect(result).toBe(expectedRedirectUrlTree);
    expect(router['createUrlTree']).toHaveBeenCalledWith(['cases/create-casefile/task-list'], {
      queryParams: undefined,
      fragment: undefined,
    });
  });
});
