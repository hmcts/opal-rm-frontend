import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { ActivatedRoute } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
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
  const maintenance = { createDraftCasefile: vi.fn(), getMajorCreditors: vi.fn() };
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    router.navigateByUrl.mockReset().mockResolvedValue(true);
    maintenance.createDraftCasefile
      .mockReset()
      .mockReturnValue(
        of(new HttpResponse({ status: 201, body: { draft_casefile_id: 123, casefile_status: 'SUBMITTED' } })),
      );
    maintenance.getMajorCreditors.mockReset().mockReturnValue(of({ refData: [] }));
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCheckDetailsComponent],
      providers: [
        { provide: Router, useValue: router },
        CasesCreateCasefileStore,
        { provide: GlobalStore, useValue: new GlobalStore() },
        { provide: OpalMaintenanceService, useValue: maintenance },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                countries: {
                  refData: [{ country_id: 1, cjs_code: 101, country_name: 'United Kingdom', active: true }],
                },
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
    vi.spyOn(TestBed.inject(UtilsService), 'scrollToTop').mockImplementation(() => {});
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
  const seedCompleteDraft = () =>
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );

  it('submits the mapped case and hands successful submission to the placeholder', async () => {
    seedCompleteDraft();
    await fixture.componentInstance.handleSubmit();
    expect(maintenance.createDraftCasefile).toHaveBeenCalledOnce();
    expect(maintenance.createDraftCasefile.mock.calls[0][0]).toMatchObject({
      business_unit_id: 44,
      casefile_type: 'REMO In',
    });
    expect(store.submissionSucceeded()).toBe(true);
    expect(store.respondentDetails()).toEqual(createCasesCreateCasefileReviewState().respondentDetails);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/submission-confirmation');
  });

  it('blocks duplicate submission and changes while waiting for the POST', async () => {
    seedCompleteDraft();
    const pending = new Subject<HttpResponse<unknown>>();
    maintenance.createDraftCasefile.mockReturnValue(pending);
    const submit = fixture.componentInstance.handleSubmit();
    await Promise.resolve();
    await fixture.componentInstance.handleSubmit();
    await fixture.componentInstance.handleChange('respondent');
    fixture.componentInstance.handleBack();
    expect(fixture.componentInstance.blocked()).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[disabled]').length).toBe(0);
    expect(maintenance.createDraftCasefile).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    pending.next(new HttpResponse({ status: 201, body: { draft_casefile_id: 123, casefile_status: 'SUBMITTED' } }));
    await submit;
  });

  it.each([0, 400, 401, 403, 409, 500, 503])('preserves the draft after HTTP %i', async (status) => {
    seedCompleteDraft();
    const before = structuredClone(getState(store));
    maintenance.createDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await fixture.componentInstance.handleSubmit();
    fixture.detectChanges();
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#review-errors')).toBeNull();
    expect(fixture.componentInstance.blocked()).toBe(false);
  });

  it('resolves selected major creditor IDs to codes before posting', async () => {
    seedCompleteDraft();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [
        {
          ...store.orderTerms()[0],
          creditor: { type: 'major', majorCreditorId: 77, displayName: 'Synthetic creditor' },
        },
      ],
    });
    maintenance.getMajorCreditors.mockReturnValue(
      of({
        refData: [
          {
            major_creditor_id: 77,
            major_creditor_code: '0077',
            business_unit_id: 44,
            active: true,
            central_authority: false,
          },
        ],
      }),
    );
    await fixture.componentInstance.handleSubmit();
    expect(maintenance.getMajorCreditors).toHaveBeenCalledWith({
      business_unit_id: 44,
      active: true,
      central_authority: false,
    });
    expect(
      maintenance.createDraftCasefile.mock.calls[0][0].casefile.respondent_account.order_details.order_terms[0],
    ).toMatchObject({ major_creditor_code: '0077' });
  });

  it('retains the draft when submission reference data cannot be loaded', async () => {
    seedCompleteDraft();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [
        {
          ...store.orderTerms()[0],
          creditor: { type: 'major', majorCreditorId: 77, displayName: 'Synthetic creditor' },
        },
      ],
    });
    const before = structuredClone(getState(store));
    maintenance.getMajorCreditors.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    await fixture.componentInstance.handleSubmit();
    expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('unsubscribes when the review page is destroyed without applying a later receipt', async () => {
    seedCompleteDraft();
    const pending = new Subject<HttpResponse<unknown>>();
    maintenance.createDraftCasefile.mockReturnValue(pending);
    const submit = fixture.componentInstance.handleSubmit();
    fixture.destroy();
    await submit;
    expect(pending.observed).toBe(false);
    expect(store.submissionSucceeded()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('reports mapping failures without sending or discarding the case', async () => {
    seedCompleteDraft();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderDetails: { ...store.orderDetails()!, applicationId: 999 },
    });
    const before = structuredClone(getState(store));
    await fixture.componentInstance.handleSubmit();
    fixture.detectChanges();
    expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
    expect(fixture.nativeElement.querySelector('#review-errors')).toBeNull();
  });

  it('retries confirmation navigation without repeating a successful POST', async () => {
    seedCompleteDraft();
    router.navigateByUrl.mockResolvedValueOnce(false);
    await fixture.componentInstance.handleSubmit();
    expect(store.submissionSucceeded()).toBe(true);
    await fixture.componentInstance.handleSubmit();
    expect(maintenance.createDraftCasefile).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
  });

  it.each([
    new HttpResponse({ status: 200, body: { draft_casefile_id: 123, casefile_status: 'SUBMITTED' } }),
    new HttpResponse({ status: 201, body: null }),
    new HttpResponse({ status: 201, body: { draft_casefile_id: 0, casefile_status: 'SUBMITTED' } }),
    new HttpResponse({ status: 201, body: { draft_casefile_id: 123, casefile_status: 'DRAFT' } }),
  ])('does not show confirmation for an invalid receipt', async (response) => {
    seedCompleteDraft();
    const before = structuredClone(getState(store));
    maintenance.createDraftCasefile.mockReturnValue(of(response));
    await fixture.componentInstance.handleSubmit();
    expect(getState(store)).toEqual(before);
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
    expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toBeNull();
    expect(fixture.nativeElement.querySelector('#review-errors')).toBeNull();
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
