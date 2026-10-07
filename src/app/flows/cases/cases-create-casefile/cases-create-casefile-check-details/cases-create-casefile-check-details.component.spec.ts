import { By } from '@angular/platform-browser';
import { CasesDraftCasefileDecisionComponent } from '../../cases-draft/components/cases-draft-casefile-decision/cases-draft-casefile-decision.component';
import { defaultCasesDraftNavigation } from '../../cases-draft/utils/cases-draft-navigation';
import type { ICasesDraftNavigation } from '../../cases-draft/interfaces/cases-draft-navigation.interface';
import { createPersistedCasefileResolved } from '../../cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import type { Data } from '@angular/router';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
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
  let routeData: BehaviorSubject<Data>;
  const userState = signal({
    ...structuredClone(OPAL_USER_STATE_MOCK),
    user_id: 10606,
    status: 'active' as const,
    business_unit_users: [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-CHECKER',
        permissions: [
          { permission_id: 21, permission_name: 'Create' },
          { permission_id: 22, permission_name: 'Review' },
        ],
      },
    ],
  });
  const authenticated = signal(true);
  const featureFlags = signal<Record<string, boolean>>({ 'release-1c-rm-create-case-files': true });
  const selection = signal<ICasesDraftNavigation>(defaultCasesDraftNavigation('to-review', 'checker'));
  const draftNavigation = {
    selection,
    deleteCasefileUrl: vi.fn().mockImplementation((id: number) => `/cases/draft/check-and-validate/delete/${id}`),
    dashboardUrl: vi
      .fn()
      .mockImplementation((value: ICasesDraftNavigation) => `/cases/draft/check-and-validate/tabs#${value.tab}`),
    persistedDashboardUrl: vi
      .fn()
      .mockImplementation((mode: 'inputter' | 'checker') =>
        mode === 'checker'
          ? '/cases/draft/check-and-validate/tabs#to-review'
          : '/cases/draft/create-and-manage/tabs#in-review',
      ),
    contextForPlaceholder: vi.fn().mockReturnValue(null),
    returnFromPlaceholder: vi.fn().mockResolvedValue(true),
  };
  const persisted = createPersistedCasefileResolved;
  beforeEach(async () => {
    router.navigateByUrl.mockReset().mockResolvedValue(true);
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    userState.set({
      ...structuredClone(OPAL_USER_STATE_MOCK),
      user_id: 10606,
      status: 'active',
      business_unit_users: [
        {
          business_unit_id: 44,
          business_unit_user_id: 'BUU-CHECKER',
          permissions: [
            { permission_id: 21, permission_name: 'Create' },
            { permission_id: 22, permission_name: 'Review' },
          ],
        },
      ],
    });
    selection.set(defaultCasesDraftNavigation('to-review', 'checker'));
    draftNavigation.deleteCasefileUrl.mockClear();
    draftNavigation.dashboardUrl.mockClear();
    draftNavigation.persistedDashboardUrl.mockClear();
    draftNavigation.contextForPlaceholder.mockReturnValue(null);
    draftNavigation.returnFromPlaceholder.mockReset().mockResolvedValue(true);
    routeData = new BehaviorSubject<Data>({ casefileIntent: 'create' });
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
        CasesDraftCasefileStore,
        { provide: CasesDraftNavigationService, useValue: draftNavigation },
        {
          provide: GlobalStore,
          useValue: Object.assign(new GlobalStore(), { userState, authenticated, featureFlags }),
        },
        { provide: OpalMaintenanceService, useValue: maintenance },
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData,
            snapshot: {
              data: {
                casefileIntent: 'create',
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
    routeData.next(TestBed.inject(ActivatedRoute).snapshot.data);
    vi.spyOn(TestBed.inject(UtilsService), 'scrollToTop').mockImplementation(() => {});
    store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    fixture = TestBed.createComponent(CasesCreateCasefileCheckDetailsComponent);
  });

  const loadReview = (resolved = persisted()) => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = resolved.intent;
    routeData.next({ draftCasefile: resolved });
  };
  const decisionForm = (): CasesDraftCasefileDecisionComponent =>
    fixture.debugElement.query(By.directive(CasesDraftCasefileDecisionComponent))?.componentInstance;

  it('navigates an eligible review Delete action without changing saved or creation state', async () => {
    loadReview();
    fixture.detectChanges();
    const saved = structuredClone(getState(TestBed.inject(CasesDraftCasefileStore)));
    const creation = structuredClone(getState(store));
    const button = fixture.nativeElement.querySelector('opal-lib-govuk-button #create_casefile_review_delete');
    expect(button).not.toBeNull();
    expect(button.type).toBe('button');
    expect(button.textContent.trim()).toBe('Delete casefile');
    button.click();
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith(
      '/cases/draft/check-and-validate/delete/' + saved.draft!.draft_casefile_id,
    );
    expect(draftNavigation.deleteCasefileUrl).toHaveBeenCalledExactlyOnceWith(saved.draft!.draft_casefile_id);
    expect(getState(TestBed.inject(CasesDraftCasefileStore))).toEqual(saved);
    expect(getState(store)).toEqual(creation);
    expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
  });

  it.each([
    'create',
    'inputter-view',
    'checker-view',
    'own submission',
    'published',
    'permission',
    'authentication',
    'release',
    'identity',
    'missing draft',
  ])('blocks Delete rendering and direct invocation for %s', async (condition) => {
    const result = persisted();
    if (condition === 'inputter-view' || condition === 'checker-view') result.intent = condition;
    if (condition === 'own submission') result.draft.submitted_by = 'BUU-CHECKER';
    if (condition === 'published') result.draft.casefile_status = 'PUBLISHED';
    if (condition !== 'create') loadReview(result);
    if (condition === 'permission')
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
        ],
      });
    if (condition === 'authentication') authenticated.set(false);
    if (condition === 'release') featureFlags.set({});
    if (condition === 'identity') userState.set({ ...userState(), user_id: 99 });
    if (condition === 'missing draft') TestBed.inject(CasesDraftCasefileStore).resetStore();
    await fixture.componentInstance.handleDelete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#create_casefile_review_delete')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it.each(['false', 'reject'])(
    'shows the shared error banner on Delete navigation %s and allows another attempt',
    async (failure) => {
      loadReview();
      const saved = structuredClone(getState(TestBed.inject(CasesDraftCasefileStore)));
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic failure'));
      await fixture.componentInstance.handleDelete();
      expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
      expect(TestBed.inject(UtilsService).scrollToTop).toHaveBeenCalledOnce();
      expect(getState(TestBed.inject(CasesDraftCasefileStore))).toEqual(saved);
      await fixture.componentInstance.handleDelete();
      expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    },
  );

  it('ignores repeat Delete or decision calls while Delete navigation is pending', async () => {
    loadReview();
    let finish!: (accepted: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const pending = fixture.componentInstance.handleDelete();
    await fixture.componentInstance.handleDelete();
    await fixture.componentInstance.handleDecision();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    finish(true);
    await pending;
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it.each(['SUBMITTED', 'RESUBMITTED'] as const)('renders decisions only for an eligible %s review', (status) => {
    const resolved = persisted();
    resolved.draft.casefile_status = status;
    loadReview(resolved);
    fixture.detectChanges();
    expect(decisionForm()).toBeDefined();
    expect(fixture.nativeElement.querySelector('#create_casefile_review_continue')).not.toBeNull();
  });

  it.each(['create', 'inputter-view', 'checker-view', 'approved', 'own draft'] as const)(
    'hides decisions for %s',
    (mode) => {
      const resolved = persisted();
      if (mode === 'approved') resolved.draft.casefile_status = 'PUBLISHING_PENDING';
      else if (mode === 'own draft') resolved.draft.submitted_by = 'BUU-CHECKER';
      else if (mode !== 'create') resolved.intent = mode;
      if (mode !== 'create') loadReview(resolved);
      fixture.detectChanges();
      expect(decisionForm()).toBeUndefined();
    },
  );

  it.each(['approve', 'reject'] as const)(
    'returns a validated %s to the checker queue without persisting it',
    async (decision) => {
      loadReview();
      const selected = {
        ...defaultCasesDraftNavigation('to-review', 'checker'),
        page: 3,
        direction: 'descending' as const,
      };
      selection.set(selected);
      const completeSubmission = vi.spyOn(store, 'completeSubmission');
      fixture.detectChanges();
      const creationBefore = structuredClone(getState(store));
      const persistedBefore = structuredClone(getState(TestBed.inject(CasesDraftCasefileStore)));
      const globalBefore = structuredClone(getState(TestBed.inject(GlobalStore)));
      const child = decisionForm();
      child.form.setValue({
        create_casefile_review_decision: decision,
        create_casefile_review_rejection_reason: 'Synthetic reason',
      });
      child.handleContinue();
      await fixture.whenStable();
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/cases/draft/check-and-validate/tabs#to-review');
      expect(draftNavigation.dashboardUrl).toHaveBeenCalledExactlyOnceWith(selected);
      expect(selection()).toEqual(selected);
      expect(getState(store)).toEqual(creationBefore);
      expect(getState(TestBed.inject(CasesDraftCasefileStore))).toEqual(persistedBefore);
      expect(getState(TestBed.inject(GlobalStore))).toEqual(globalBefore);
      expect(completeSubmission).not.toHaveBeenCalled();
      expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
      expect(maintenance.getMajorCreditors).not.toHaveBeenCalled();
    },
  );

  it('uses default to-review context when the current checker selection belongs to another queue', async () => {
    loadReview();
    const selected = { ...defaultCasesDraftNavigation('rejected', 'checker'), page: 4 };
    selection.set(selected);
    fixture.detectChanges();
    decisionForm().form.controls.create_casefile_review_decision.setValue('approve');
    decisionForm().handleContinue();
    await fixture.whenStable();
    expect(draftNavigation.dashboardUrl).toHaveBeenCalledExactlyOnceWith(
      defaultCasesDraftNavigation('to-review', 'checker'),
    );
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/cases/draft/check-and-validate/tabs#to-review');
    expect(selection()).toEqual(selected);
  });

  it('retains invalid local input without navigating', async () => {
    loadReview();
    fixture.detectChanges();
    const child = decisionForm();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.nativeElement.querySelector('#create_casefile_review_decision-reject').click();
    fixture.detectChanges();
    const reason = fixture.nativeElement.querySelector(
      '#create_casefile_review_rejection_reason',
    ) as HTMLTextAreaElement;
    reason.value = '   ';
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(child.form.controls.create_casefile_review_rejection_reason.value).toBe('   ');
    expect(fixture.nativeElement.textContent).toContain('Enter reason for rejection');
  });

  it.each(['false', 'rejected'] as const)(
    'retains decision and reason on %s navigation with the safe banner',
    async (result) => {
      loadReview();
      if (result === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
      fixture.detectChanges();
      const child = decisionForm();
      fixture.nativeElement.querySelector('#create_casefile_review_decision-reject').click();
      fixture.detectChanges();
      const reason = fixture.nativeElement.querySelector(
        '#create_casefile_review_rejection_reason',
      ) as HTMLTextAreaElement;
      reason.value = 'Synthetic retained reason';
      reason.dispatchEvent(new Event('input', { bubbles: true }));
      const before = structuredClone(getState(TestBed.inject(CasesDraftCasefileStore)));
      fixture.nativeElement
        .querySelector('form')
        .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(decisionForm()).toBe(child);
      expect(fixture.nativeElement.querySelector('#create_casefile_review_decision-reject').checked).toBe(true);
      expect(fixture.nativeElement.querySelector('#create_casefile_review_rejection_reason').value).toBe(
        'Synthetic retained reason',
      );
      expect(child.form.getRawValue()).toEqual({
        create_casefile_review_decision: 'reject',
        create_casefile_review_rejection_reason: 'Synthetic retained reason',
      });
      expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
      expect(TestBed.inject(UtilsService).scrollToTop).toHaveBeenCalled();
      expect(getState(TestBed.inject(CasesDraftCasefileStore))).toEqual(before);
      expect(fixture.componentInstance.busy()).toBe(false);
    },
  );

  it.each(['permission', 'status'] as const)(
    'rechecks live %s before accepting a retained form completion',
    async (condition) => {
      loadReview();
      fixture.detectChanges();
      const child = decisionForm();
      child.form.controls.create_casefile_review_decision.setValue('approve');
      if (condition === 'permission')
        userState.set({
          ...userState(),
          business_unit_users: [
            { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
          ],
        });
      else {
        const replacement = persisted();
        replacement.draft.casefile_status = 'PUBLISHING_PENDING';
        TestBed.inject(CasesDraftCasefileStore).loadResolved(replacement);
      }
      child.handleContinue();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(decisionForm()).toBeUndefined();
    },
  );

  it('ignores duplicate decision completion while navigation is pending', async () => {
    loadReview();
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    fixture.detectChanges();
    const child = decisionForm();
    child.form.controls.create_casefile_review_decision.setValue('approve');
    child.handleContinue();
    child.handleContinue();
    expect(fixture.componentInstance.busy()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    finish(true);
    await fixture.whenStable();
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it.each(['SUBMITTED', 'RESUBMITTED'] as const)(
    'replaces old decision, reason and errors for another eligible %s draft',
    async (status) => {
      const first = persisted();
      first.draft.casefile_status = status;
      loadReview(first);
      fixture.detectChanges();
      const previous = decisionForm();
      fixture.nativeElement.querySelector('#create_casefile_review_decision-reject').click();
      fixture.detectChanges();
      const reason = fixture.nativeElement.querySelector(
        '#create_casefile_review_rejection_reason',
      ) as HTMLTextAreaElement;
      reason.value = 'x'.repeat(251);
      reason.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.nativeElement
        .querySelector('form')
        .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(previous.formErrorSummaryMessage).not.toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('Reason for rejection must be 250 characters or fewer');
      const second = persisted();
      second.draft.draft_casefile_id = first.draft.draft_casefile_id + 1;
      second.draft.casefile_status = status;
      loadReview(second);
      fixture.detectChanges();
      await fixture.whenStable();
      const replacement = decisionForm();
      expect(replacement).not.toBe(previous);
      expect(replacement.form.getRawValue()).toEqual({
        create_casefile_review_decision: null,
        create_casefile_review_rejection_reason: '',
      });
      expect(replacement.formErrorSummaryMessage).toEqual([]);
      expect(replacement.reasonValue()).toBe('');
      expect(replacement.reasonError()).toBe(false);
      expect(fixture.nativeElement.querySelector('.govuk-error-summary')).toBeNull();
      expect(fixture.nativeElement.querySelector('#create_casefile_review_rejection_reason')).toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    },
  );

  it('hydrates completed persisted data without another request or creation controls', () => {
    const resolved = persisted();
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    routeData.next({ draftCasefile: resolved, casefileIntent: 'checker-review' });
    fixture.detectChanges();
    expect(store.caseTypeSelection()).toEqual(resolved.state.caseTypeSelection);
    expect(TestBed.inject(CasesDraftCasefileStore).etag()).toBe('"0"');
    expect(fixture.nativeElement.textContent).toContain('Test Country One');
    expect(fixture.nativeElement.querySelector('#create_casefile_review_submit')).toBeNull();
    expect(fixture.nativeElement.querySelector('#review-term-change-1')).toBeNull();
    expect(fixture.nativeElement.querySelector('#review-term-remove-1')).toBeNull();
    expect(maintenance.getMajorCreditors).not.toHaveBeenCalled();
  });
  it.each(['inputter-view', 'checker-view', 'checker-review'] as const)(
    'guards every creation handler in %s',
    async (intent) => {
      const resolved = { ...persisted(), intent };
      TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = intent;
      routeData.next({ draftCasefile: resolved, casefileIntent: intent });
      fixture.detectChanges();
      const before = structuredClone(getState(store));
      const component = fixture.componentInstance;
      await component.handleSubmit();
      await component.handleChange('respondent');
      await component.handleTermChange(1);
      await component.handleTermRemove(1);
      component.handleCancel();
      expect(getState(store)).toEqual(before);
      expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    },
  );
  it('replaces optional state and references on A to B route reuse', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    const first = persisted();
    first.state.commentsAndNotes = { comment: 'First case', note: 'First notes' };
    routeData.next({ draftCasefile: first });
    fixture.detectChanges();
    const second = persisted();
    second.draft.draft_casefile_id = 18;
    second.state.applicantDetails = null;
    second.state.commentsAndNotes = null;
    second.references = {
      ...second.references,
      countries: second.references.countries.map((country) => ({ ...country, country_name: 'Replacement country' })),
    };
    routeData.next({ draftCasefile: second });
    fixture.detectChanges();
    expect(store.applicantDetails()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('First case');
    expect(fixture.nativeElement.textContent).toContain('Replacement country');
    expect(TestBed.inject(CasesDraftCasefileStore).draft()?.draft_casefile_id).toBe(18);
  });
  it.each(['authentication', 'release', 'identity', 'all permissions'])(
    'immediately hides sensitive persisted DOM on %s loss',
    (condition) => {
      TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
      routeData.next({ draftCasefile: persisted() });
      fixture.detectChanges();
      if (condition === 'authentication') authenticated.set(false);
      if (condition === 'release') featureFlags.set({});
      if (condition === 'identity') userState.set({ ...userState(), user_id: 55 });
      if (condition === 'all permissions') userState.set({ ...userState(), business_unit_users: [] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#review-orderTerms')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Synthetic Respondent');
    },
  );
  it('retains readable data when checker permission is lost but inputter permission remains', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    routeData.next({ draftCasefile: persisted() });
    fixture.detectChanges();
    userState.set({
      ...userState(),
      business_unit_users: [
        { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#review-orderTerms')).not.toBeNull();
    expect(TestBed.inject(CasesDraftCasefileStore).draft()).not.toBeNull();
  });
  it('returns persisted summaries to their authorised dashboard', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    routeData.next({ draftCasefile: persisted() });
    fixture.detectChanges();
    fixture.componentInstance.handleBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/draft/check-and-validate/tabs#to-review');
  });
  it.each([
    ['checker', 21, 'inputter', '/cases/draft/create-and-manage/tabs#in-review'],
    ['inputter', 22, 'checker', '/cases/draft/check-and-validate/tabs#to-review'],
  ] as const)(
    'returns from %s through the remaining authorised dashboard after permission loss',
    (preferred, permission, remaining, url) => {
      TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] =
        preferred === 'checker' ? 'checker-view' : 'inputter-view';
      routeData.next({
        draftCasefile: persisted({
          intent: preferred === 'checker' ? 'checker-view' : 'inputter-view',
          dashboardMode: preferred,
        }),
      });
      fixture.detectChanges();
      userState.set({
        ...userState(),
        business_unit_users: [
          {
            ...userState().business_unit_users[0],
            permissions: [{ permission_id: permission, permission_name: 'Remaining' }],
          },
        ],
      });
      fixture.detectChanges();
      fixture.componentInstance.handleBack();
      expect(draftNavigation.persistedDashboardUrl).toHaveBeenCalledWith(remaining);
      expect(router.navigateByUrl).toHaveBeenCalledWith(url);
      expect(TestBed.inject(CasesDraftCasefileStore).draft()).not.toBeNull();
    },
  );
  it('keeps the preferred inputter dashboard while its permission remains', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'inputter-view';
    routeData.next({ draftCasefile: persisted({ intent: 'inputter-view', dashboardMode: 'inputter' }) });
    fixture.detectChanges();
    fixture.componentInstance.handleBack();
    expect(draftNavigation.persistedDashboardUrl).toHaveBeenCalledWith('inputter');
  });
  it('discards all-rejected return authority when inputter permission is lost', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'inputter-view';
    routeData.next({ draftCasefile: persisted({ intent: 'inputter-view', dashboardMode: 'inputter' }) });
    draftNavigation.contextForPlaceholder.mockReturnValue({} as never);
    fixture.detectChanges();
    userState.set({
      ...userState(),
      business_unit_users: [
        { ...userState().business_unit_users[0], permissions: [{ permission_id: 22, permission_name: 'Checker' }] },
      ],
    });
    fixture.detectChanges();
    fixture.componentInstance.handleBack();
    expect(draftNavigation.returnFromPlaceholder).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/draft/check-and-validate/tabs#to-review');
  });
  it.each(['false', 'rejected'])(
    'retains saved data and reports %s navigation after dashboard downgrade',
    async (failure) => {
      TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-view';
      routeData.next({ draftCasefile: persisted({ intent: 'checker-view' }) });
      fixture.detectChanges();
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Inputter' }] },
        ],
      });
      if (failure === 'false') router.navigateByUrl.mockResolvedValue(false);
      else router.navigateByUrl.mockRejectedValue(new Error('Navigation failed'));
      fixture.componentInstance.handleBack();
      await fixture.whenStable();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/draft/create-and-manage/tabs#in-review');
      expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
      expect(TestBed.inject(CasesDraftCasefileStore).draft()).not.toBeNull();
      expect(fixture.componentInstance.busy()).toBe(false);
    },
  );
  it('keeps persisted content hidden until completed resolver data exists', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#review-heading')).toBeNull();
    expect(fixture.componentInstance.reviewable()).toBe(false);
    fixture.componentInstance.handleBack();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
  it.each([
    'view intent',
    'own submission',
    'published',
    'review permission',
    'release',
    'authentication',
    'identity',
    'cleared envelope',
  ])('suppresses review eligibility on %s', (condition) => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    const result = persisted();
    if (condition === 'view intent') result.intent = 'checker-view';
    if (condition === 'own submission') result.draft.submitted_by = 'BUU-CHECKER';
    if (condition === 'published') result.draft.casefile_status = 'PUBLISHED';
    routeData.next({ draftCasefile: result });
    fixture.detectChanges();
    if (condition === 'review permission')
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
        ],
      });
    if (condition === 'release') featureFlags.set({});
    if (condition === 'authentication') authenticated.set(false);
    if (condition === 'identity') userState.set({ ...userState(), user_id: 55 });
    if (condition === 'cleared envelope') TestBed.inject(CasesDraftCasefileStore).resetStore();
    expect(fixture.componentInstance.reviewable()).toBe(false);
  });
  it('allows live review only for a different submitter with current checker access', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    routeData.next({ draftCasefile: persisted() });
    fixture.detectChanges();
    expect(fixture.componentInstance.reviewable()).toBe(true);
  });
  it('retains all-rejected origin and uses its existing return helper before dashboard fallback', async () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'inputter-view';
    routeData.next({
      draftCasefile: persisted({ intent: 'inputter-view', context: 'inputter', dashboardMode: 'inputter' }),
    });
    draftNavigation.contextForPlaceholder.mockReturnValue({} as never);
    fixture.detectChanges();
    fixture.componentInstance.handleBack();
    await Promise.resolve();
    expect(draftNavigation.returnFromPlaceholder).toHaveBeenCalledWith('details', '17');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
  it.each(['false', 'rejected'])('preserves persisted data and reports a %s all-rejected return', async (failure) => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'inputter-view';
    routeData.next({ draftCasefile: persisted({ intent: 'inputter-view' }) });
    draftNavigation.contextForPlaceholder.mockReturnValue({} as never);
    if (failure === 'false') draftNavigation.returnFromPlaceholder.mockResolvedValue(false);
    else draftNavigation.returnFromPlaceholder.mockRejectedValue(new Error('Navigation failed'));
    fixture.detectChanges();
    fixture.componentInstance.handleBack();
    await fixture.whenStable();
    expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
    expect(TestBed.inject(CasesDraftCasefileStore).draft()).not.toBeNull();
    expect(fixture.componentInstance.busy()).toBe(false);
  });
  it('stops consuming completed route data when destroyed', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['casefileIntent'] = 'checker-review';
    fixture.destroy();
    routeData.next({ draftCasefile: persisted() });
    expect(TestBed.inject(CasesDraftCasefileStore).draft()).toBeNull();
  });
  it('renders creation safely when optional route references are absent', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = { casefileIntent: 'create' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#create_casefile_review_submit')).not.toBeNull();
  });
  it('opens term removal in creation mode with its accepted selection', async () => {
    seedCompleteDraft();
    const termId = store.orderTerms()[0].termId;
    await fixture.componentInstance.handleTermRemove(termId);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/remove/0');
    expect(store.orderTerms()[0].termId).toBe(termId);
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
    expect(getState(store)).toEqual({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
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
    expect(fixture.nativeElement.querySelectorAll('[disabled]')).toHaveLength(0);
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
    expect(getState(store)).toEqual({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
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
  it('renders an applicable organisation and separates minor-creditor bank details from the term card', () => {
    const state = createCasesCreateCasefileReviewState();
    state.caseTypeSelection = { caseType: 'REMO In', applicantType: 'Organisation' };
    state.applicantDetails = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNone;
    state.minorCreditors = [
      { sequenceNumber: 1, displayName: 'Synthetic creditor', details: MINOR_CREDITOR_DETAILS_MOCK },
    ];
    state.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 1 };
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#review-applicant').textContent).toContain('Example Organisation');
    const card = fixture.componentInstance.cards()[0];
    expect(card.bankRows).toEqual([]);
    expect(card.minor?.id).toBe('minor-creditor-1-term-' + state.orderTerms[0].termId);
    expect(card.minor?.rows.some((row) => row.id === 'address')).toBe(true);
    expect(card.minor?.bankRows.length).toBeGreaterThan(0);
  });

  it('renders an unmatched minor creditor without fabricating creditor details', () => {
    seedCompleteDraft();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...store.orderTerms()[0], creditor: { type: 'minor', sequenceNumber: 99 } }],
    });
    expect(fixture.componentInstance.cards()[0].minor).toBeNull();
  });

  it('passes the cached central authority into the payload mapper without fetching ordinary creditors', async () => {
    seedCompleteDraft();
    const authority = {
      major_creditor_id: 501,
      major_creditor_code: 'CA01',
      business_unit_id: 44,
      active: true,
      central_authority: true,
      name: 'Synthetic authority',
      address_line_1: 'Test Street',
      address_line_2: null,
      address_line_3: null,
      address_line_4: null,
      address_line_5: null,
      postcode: null,
      country_id: null,
      country_name: null,
      contact_name: null,
      contact_email: null,
    };
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      centralAuthorityDetails: { remoReference: 'TEST', centralAuthorityReference: 'REF', majorCreditor: authority },
    });
    await fixture.componentInstance.handleSubmit();
    expect(maintenance.getMajorCreditors).not.toHaveBeenCalled();
    expect(maintenance.createDraftCasefile.mock.calls[0][0].casefile.respondent_account.central_authority_code).toBe(
      'CA01',
    );
  });

  it('does not post when destroyed immediately after reference data arrives', async () => {
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
    const pending = new Subject<{ refData: [] }>();
    maintenance.getMajorCreditors.mockReturnValue(pending);
    const submit = fixture.componentInstance.handleSubmit();
    pending.next({ refData: [] });
    fixture.destroy();
    await submit;
    expect(maintenance.createDraftCasefile).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not accept a receipt when destroyed before its continuation runs', async () => {
    seedCompleteDraft();
    const before = structuredClone(getState(store));
    const pending = new Subject<HttpResponse<unknown>>();
    maintenance.createDraftCasefile.mockReturnValue(pending);
    const submit = fixture.componentInstance.handleSubmit();
    pending.next(new HttpResponse({ status: 201, body: { draft_casefile_id: 123, casefile_status: 'SUBMITTED' } }));
    fixture.destroy();
    await submit;
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('opens the accepted term correction and preserves its return context', async () => {
    seedCompleteDraft();
    const term = store.orderTerms()[0];
    await fixture.componentInstance.handleTermChange(term.termId);
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/cases/create-casefile/order-terms/add/' + encodeURIComponent(term.resultId),
    );
    expect(store.orderTermAmendment()?.termId).toBe(term.termId);
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toEqual({
      origin: 'review',
      section: 'orderTerm',
      termId: term.termId,
    });
  });

  it('blocks every edit and cancellation while a correction navigation is pending', async () => {
    seedCompleteDraft();
    const before = structuredClone(getState(store));
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const change = fixture.componentInstance.handleChange('respondent');
    await fixture.componentInstance.handleTermChange(store.orderTerms()[0].termId);
    await fixture.componentInstance.handleTermRemove(store.orderTerms()[0].termId);
    fixture.componentInstance.handleCancel();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(getState(store)).toEqual(before);
    finish(true);
    await change;
  });
});
