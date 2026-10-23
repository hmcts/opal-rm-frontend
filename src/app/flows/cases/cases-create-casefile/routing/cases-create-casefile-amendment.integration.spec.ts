import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { getState } from '@ngrx/signals';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { routing } from '@app/pages/routing/pages.routes';
import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileTaskListComponent } from '../cases-create-casefile-task-list/cases-create-casefile-task-list.component';
import { CasesCreateCasefileRespondentDetailsFormComponent } from '../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

@Component({ template: '<h1>Permission denied</h1>' })
class DeniedPage {}

describe('authorised amendment route lifecycle', () => {
  const user = signal(structuredClone(OPAL_USER_STATE_MOCK));
  const authenticated = signal(true);
  let http: HttpTestingController;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const entry = (id = 17) => '/cases/create-casefile/task-list/' + id;

  beforeEach(() => {
    const current = structuredClone(OPAL_USER_STATE_MOCK);
    current.user_id = 10606;
    current.status = 'active';
    current.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-CHECKER',
        permissions: [{ permission_id: 21, permission_name: 'Create' }],
      },
    ];
    user.set(current);
    authenticated.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          ...routing,
          { path: 'error/permission-denied', component: DeniedPage },
          { path: 'access-denied', component: DeniedPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { checkAuthenticated: () => of(authenticated()) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(user()) } },
        {
          provide: GlobalStore,
          useValue: {
            userState: user,
            authenticated,
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
            setBannerError: vi.fn(),
          },
        },
        {
          provide: LaunchDarklyService,
          useValue: { initializeLaunchDarklyFlags: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CasesCreateCasefileStore);
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  async function getRequest(id = 17): Promise<TestRequest> {
    let request!: TestRequest;
    await vi.waitFor(() => {
      request = http.expectOne('/opal-maintenance-service/draft-casefiles/' + id);
    });
    return request;
  }
  async function references(): Promise<void> {
    for (const request of http.match((request) => request.url.endsWith('/maintenance-applications')))
      request.flush({ refData: PERSISTED_CASEFILE_REFERENCES.applications });
    for (const request of http.match((request) => request.url.endsWith('/countries')))
      request.flush({ refData: PERSISTED_CASEFILE_REFERENCES.countries });
    http.expectOne((request) => request.url.endsWith('/major-creditors')).flush({ refData: [] });
    http.expectOne('/opal-maintenance-service/results/TEST01').flush(PERSISTED_CASEFILE_RESULT_DETAIL);
  }
  async function flush(id = 17, submittedBy = 'BUU-OTHER'): Promise<void> {
    const draft = createPersistedCasefileDetail();
    draft.draft_casefile_id = id;
    draft.casefile_status = 'REJECTED';
    draft.submitted_by = submittedBy;
    (await getRequest(id)).flush(draft, { headers: { ETag: '"9007199254740993"' } });
    await references();
  }
  function persisted(harness: RouterTestingHarness) {
    return harness.fixture.debugElement
      .query(By.directive(CasesCreateCasefileTaskListComponent))
      .injector.get(CasesDraftCasefileStore);
  }
  async function open(submittedBy = 'BUU-OTHER') {
    const arrival = RouterTestingHarness.create(entry());
    await flush(17, submittedBy);
    return arrival;
  }

  it.each(['BUU-CHECKER', 'BUU-OTHER'])(
    'hydrates complete draft submitted by %s and preserves ID/version through a real correction',
    async (submittedBy) => {
      const harness = await open(submittedBy);
      const saved = persisted(harness);
      expect(store.submissionIntent()).toBe('amendment');
      expect(saved.etag()).toBe('"9007199254740993"');
      expect(harness.routeNativeElement?.querySelector('app-cases-draft-casefile-history')).not.toBeNull();
      const edit = harness.navigateByUrl('/cases/create-casefile/respondent-details');
      await vi.waitFor(() =>
        http
          .expectOne((request) => request.url.endsWith('/countries'))
          .flush({ refData: PERSISTED_CASEFILE_REFERENCES.countries }),
      );
      await edit;
      const form = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileRespondentDetailsFormComponent))
        .componentInstance as CasesCreateCasefileRespondentDetailsFormComponent;
      form.form.get('create_casefile_respondent_details_first_names')!.setValue('Corrected');
      harness.routeNativeElement
        ?.querySelector<HTMLFormElement>('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(store.respondentDetails()?.firstNames).toBe('Corrected');
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/task-list');
      expect(saved.draft()?.draft_casefile_id).toBe(17);
      expect(saved.etag()).toBe('"9007199254740993"');
      http.expectNone((request) => request.url.includes('/draft-casefiles/'));
      http.expectNone((request) => ['POST', 'PUT', 'DELETE'].includes(request.method));
    },
  );

  it.each([false, true])('uses existing departure confirmation for fresh-ID replacement: %s', async (decision) => {
    const harness = await open();
    store.setRespondentDetails({ ...store.respondentDetails()!, firstNames: 'Corrected' });
    const before = structuredClone(getState(store));
    const saved = persisted(harness);
    vi.spyOn(window, 'confirm').mockReturnValue(decision);
    const arrival = harness.navigateByUrl(entry(18));
    if (decision) await flush(18);
    await arrival;
    expect(saved.draft()?.draft_casefile_id).toBe(decision ? 18 : 17);
    if (!decision) expect(getState(store)).toEqual(before);
    expect(TestBed.inject(Router).url).toBe(entry(decision ? 18 : 17));
  });

  it.each(['respondent-details', 'order-terms/summary'])(
    'does not replace accepted corrections from %s when departure is declined',
    async (child) => {
      const harness = await open();
      store.setRespondentDetails({ ...store.respondentDetails()!, firstNames: 'Corrected' });
      const editing = harness.navigateByUrl('/cases/create-casefile/' + child);
      if (child === 'respondent-details') {
        await vi.waitFor(() =>
          http
            .expectOne((request) => request.url.endsWith('/countries'))
            .flush({ refData: PERSISTED_CASEFILE_REFERENCES.countries }),
        );
      }
      await editing;
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const arrival = harness.navigateByUrl(entry(18));
      await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
      await arrival;
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/' + child);
      expect(store.respondentDetails()?.firstNames).toBe('Corrected');
      http.expectNone('/opal-maintenance-service/draft-casefiles/18');
    },
  );

  it.each(['18;source=history', '%31%38'])(
    'protects accepted corrections on a history entry using %s',
    async (idText) => {
      const harness = await open();
      store.setRespondentDetails({ ...store.respondentDetails()!, firstNames: 'Corrected' });
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      await harness.navigateByUrl('/cases/create-casefile/task-list/' + idText);
      expect(confirm).toHaveBeenCalledOnce();
      expect(TestBed.inject(Router).url).toBe(entry());
      expect(store.respondentDetails()?.firstNames).toBe('Corrected');
      http.expectNone('/opal-maintenance-service/draft-casefiles/18');
    },
  );

  it('cancels an older GET so it cannot hydrate over the newer route', async () => {
    const harness = await RouterTestingHarness.create();
    const first = harness.navigateByUrl(entry());
    const old = await getRequest();
    const second = harness.navigateByUrl(entry(18));
    await flush(18);
    await Promise.all([first, second]);
    expect(old.cancelled).toBe(true);
    expect(persisted(harness).draft()?.draft_casefile_id).toBe(18);
  });

  it.each(['0', '01', '-1', '1.5', '1e2', '9007199254740992', 'not-an-id'])(
    'renders an existing denial page on direct malformed amendment entry %s',
    async (id) => {
      const harness = await RouterTestingHarness.create('/cases/create-casefile/task-list/' + id);
      expect(TestBed.inject(Router).url).toBe('/error/permission-denied');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Permission denied');
      expect(store.respondentDetails()).toBeNull();
      expect(store.submissionIntent()).toBe('create');
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );

  it('denies a non-rejected draft before references or hydration', async () => {
    const arrival = RouterTestingHarness.create(entry());
    (await getRequest()).flush(createPersistedCasefileDetail(), { headers: { ETag: '"4"' } });
    await arrival;
    expect(TestBed.inject(Router).url).toBe('/error/permission-denied');
    expect(store.caseTypeSelection()).toBeNull();
    http.expectNone((request) => request.url.endsWith('/countries'));
  });
});
