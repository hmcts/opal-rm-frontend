import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { ActivatedRoute } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../tokens/cases-create-casefile-mock-enabled.token';
import { CasesCreateCasefileSubmissionGateway } from '../services/cases-create-casefile-submission-gateway.service';
import { Subject } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCheckDetailsComponent } from './cases-create-casefile-check-details.component';

describe('CasesCreateCasefileCheckDetailsComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCheckDetailsComponent>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    router.navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCheckDetailsComponent],
      providers: [
        { provide: Router, useValue: router },
        CasesCreateCasefileStore,
        { provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                countries: { refData: [{ country_id: 1, country_name: 'United Kingdom', active: true }] },
                applications: {
                  refData: [
                    {
                      application_id: 901,
                      application_code: 'TEST',
                      application_title: 'Synthetic application',
                      active: true,
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    fixture = TestBed.createComponent(CasesCreateCasefileCheckDetailsComponent);
  });

  it('renders Check case details and returns to Case details without changing state', () => {
    fixture.detectChanges();
    const before = {
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    };
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds h1')?.textContent.trim()).toBe(
      'Check case details',
    );
    fixture.nativeElement.querySelector('a.govuk-back-link').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
    expect({
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });
  it('renders accepted summaries and locks correction and submission during the mock request', () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const gateway = TestBed.inject(CasesCreateCasefileSubmissionGateway);
    const submit = vi.spyOn(gateway, 'submit').mockReturnValue(new Subject());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Local mock');
    expect(fixture.nativeElement.textContent).toContain('Synthetic application');
    expect(fixture.nativeElement.textContent).toContain('Test');
    const before = structuredClone(getState(store));
    fixture.nativeElement.querySelector('#create_casefile_review_submit').click();
    fixture.nativeElement.querySelector('#create_casefile_review_submit').click();
    fixture.detectChanges();
    expect(submit).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('#create_casefile_review_submit').disabled).toBe(true);
    fixture.componentInstance.handleChange('respondent');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
  });

  it('does not submit stale accepted state and identifies the correction section', () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const gateway = TestBed.inject(CasesCreateCasefileSubmissionGateway);
    const submit = vi.spyOn(gateway, 'submit');
    fixture.detectChanges();
    store.setRespondentDetails({ ...store.respondentDetails()!, firstNames: '' });
    fixture.componentInstance.handleSubmit();
    fixture.detectChanges();
    expect(submit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#review-errors').textContent).toContain('respondent details');
  });

  it('keeps the correction context if Back is activated during a pending Change navigation', async () => {
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const change = fixture.componentInstance.handleChange('respondent');
    fixture.componentInstance.handleBack();
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()?.section).toBe('respondent');
    finish(true);
    await change;
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });
  it('reports a failed correction navigation and clears only its return context', async () => {
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    await fixture.componentInstance.handleChange('commentsAndNotes');
    fixture.detectChanges();
    expect(fixture.componentInstance.navigationError()).toBe(true);
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toBeNull();
    expect(fixture.nativeElement.querySelector('#review-errors').textContent).toContain('The page could not be opened');
    await fixture.componentInstance.handleChange('untrusted-section');
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('rolls back failed term navigation without changing accepted values', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const before = structuredClone(store.orderTerms());
    const id = before[0].termId;
    router.navigateByUrl.mockResolvedValueOnce(false);
    await fixture.componentInstance.handleTermChange(id);
    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(before);
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    await fixture.componentInstance.handleTermRemove(id);
    expect(store.orderTermRemoval()).toBeNull();
    expect(store.orderTerms()).toEqual(before);
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toBeNull();
    await fixture.componentInstance.handleTermChange(-1);
    await fixture.componentInstance.handleTermRemove(-1);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
  });

  it('does not roll back an amendment changed while navigation is pending', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const pending = fixture.componentInstance.handleTermChange(store.orderTerms()[0].termId);
    store.setUnsavedChanges(true);
    finish(false);
    await pending;
    expect(store.orderTermAmendment()).not.toBeNull();
    expect(store.unsavedChanges()).toBe(true);
  });

  it('retains accepted data when opening cancellation and selects organisation corrections by active case type', async () => {
    const state = createCasesCreateCasefileReviewState();
    state.caseTypeSelection = { caseType: 'REMO In', applicantType: 'Organisation' };
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#review-applicant')).toBeNull();
    await fixture.componentInstance.handleChange('applicant');
    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/applicant-details/organisation');
    const before = structuredClone(getState(store));
    fixture.componentInstance.handleCancel();
    await Promise.resolve();
    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/cancel');
    expect(getState(store)).toEqual(before);
  });
});
