import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EMPTY, Subject, of } from 'rxjs';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceCasefileSubmissionResult } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-casefile-submission-result.interface';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { ActivatedRoute } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCheckDetailsComponent } from './cases-create-casefile-check-details.component';

describe('CasesCreateCasefileCheckDetailsComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCheckDetailsComponent>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    router.navigateByUrl.mockReset().mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCheckDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        CasesCreateCasefileStore,
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
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('invalidates earlier submission success when review is entered', () => {
    store.setSubmissionSucceeded(true);
    fixture.detectChanges();
    expect(store.submissionSucceeded()).toBe(false);
  });

  it('retains the draft and review context until confirmation activates', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    fixture.detectChanges();
    await fixture.whenStable();
    review.setContext({ origin: 'review', section: 'respondent' });
    const before = structuredClone(getState(store));
    router.navigateByUrl.mockImplementationOnce(async () => {
      expect(getState(store)).toEqual({ ...before, submissionSucceeded: true });
      expect(review.context()?.section).toBe('respondent');
      return true;
    });
    fixture.componentInstance.handleSubmit();
    await fixture.whenStable();
    expect(fixture.componentInstance.navigationError()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/submission-confirmation');
    expect(getState(store)).toEqual({ ...before, submissionSucceeded: true });
  });

  it('preserves an incomplete draft and redirects without submitting', async () => {
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile');
    const before = structuredClone(getState(store));
    fixture.componentInstance.handleSubmit();
    await fixture.whenStable();
    expect(submit).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
  });

  it('locks actions during submission and retains the draft until confirmation activates', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const pending = new Subject<IOpalMaintenanceCasefileSubmissionResult>();
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile').mockReturnValue(pending);
    fixture.detectChanges();
    await fixture.whenStable();
    const before = structuredClone(getState(store));
    const termId = store.orderTerms()[0].termId;
    fixture.componentInstance.handleSubmit();
    fixture.componentInstance.handleSubmit();
    fixture.componentInstance.handleBack();
    fixture.componentInstance.handleCancel();
    await fixture.componentInstance.handleChange('respondent');
    await fixture.componentInstance.handleTermChange(termId);
    await fixture.componentInstance.handleTermRemove(termId);
    expect(submit).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    pending.next({ draft_casefile_id: 'synthetic-completion' });
    pending.complete();
    await fixture.whenStable();
    expect(getState(store)).toEqual({ ...before, submissionSucceeded: true });
  });

  it('retains the draft and permits resubmission after a failed request', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const pending = new Subject<IOpalMaintenanceCasefileSubmissionResult>();
    const submit = vi
      .spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile')
      .mockReturnValueOnce(pending)
      .mockReturnValueOnce(of({ draft_casefile_id: 'synthetic-retry' }));
    const before = structuredClone(getState(store));
    store.setSubmissionSucceeded(true);
    const scrollToTop = vi.spyOn(TestBed.inject(UtilsService), 'scrollToTop').mockImplementation(() => undefined);
    fixture.componentInstance.handleSubmit();
    expect(store.submissionSucceeded()).toBe(false);
    pending.error(new Error('Synthetic timeout'));
    await fixture.whenStable();
    expect(scrollToTop).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    fixture.componentInstance.handleSubmit();
    await fixture.whenStable();
    expect(submit).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/submission-confirmation');
  });

  it('does not navigate when the global error handler completes without a response', async () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile').mockReturnValue(EMPTY);
    const before = structuredClone(getState(store));
    store.setSubmissionSucceeded(true);
    fixture.componentInstance.handleSubmit();
    await fixture.whenStable();
    expect(store.submissionSucceeded()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    fixture.componentInstance.handleSubmit();
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes from a pending submission when destroyed', () => {
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const pending = new Subject<IOpalMaintenanceCasefileSubmissionResult>();
    vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile').mockReturnValue(pending);
    fixture.componentInstance.handleSubmit();
    expect(pending.observed).toBe(true);
    fixture.destroy();
    expect(pending.observed).toBe(false);
    pending.next({ draft_casefile_id: 'synthetic-late' });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
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
