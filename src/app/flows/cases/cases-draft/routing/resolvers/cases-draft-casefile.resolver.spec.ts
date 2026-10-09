import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
  PERSISTED_CASEFILE_RESULT_PAGE,
} from '../../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CasesCreateCasefileOrderTermLookupsService } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { CasesCreateCasefileStore } from '../../../cases-create-casefile/stores/cases-create-casefile.store';
import { CasesDraftCasefileStore } from '../../stores/cases-draft-casefile.store';
import type { ICasesDraftCasefileResolved } from '../../interfaces/cases-draft-casefile-resolved.interface';
import { casesDraftCasefileResolver } from './cases-draft-casefile.resolver';

const userWith = (permissions: number[]): IOpalUserState => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  user_id: 10606,
  status: 'active',
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-CHECKER',
      permissions: permissions.map((permission_id) => ({ permission_id, permission_name: 'Synthetic' })),
    },
  ],
});
describe('casesDraftCasefileResolver', () => {
  let user: IOpalUserState;
  let released: unknown;
  let authenticated: boolean;
  const maintenance = {
    getDraftCasefile: vi.fn(),
    getCountries: vi.fn(),
    getMaintenanceApplications: vi.fn(),
    getMajorCreditors: vi.fn(),
    getResult: vi.fn(),
  };
  const lookups = { resolve: vi.fn() };
  const setBannerError = vi.fn();
  const route = (id: string | null = '17', intent: unknown = 'checker-review'): ActivatedRouteSnapshot =>
    ({
      paramMap: convertToParamMap(id === null ? {} : { draftCasefileId: id }),
      data: { casefileIntent: intent },
      queryParamMap: convertToParamMap({ checker: 'true', amend: 'true', mode: 'review' }),
    }) as unknown as ActivatedRouteSnapshot;
  const resolve = (snapshot = route()) => {
    const resolution = TestBed.runInInjectionContext(() =>
      casesDraftCasefileResolver(snapshot, {} as RouterStateSnapshot),
    );
    if (!(resolution instanceof Observable)) throw new Error('Expected observable');
    const values: (ICasesDraftCasefileResolved | RedirectCommand)[] = [];
    resolution.subscribe((value) => values.push(value));
    return values;
  };
  const expectDenied = (values: (ICasesDraftCasefileResolved | RedirectCommand)[]) => {
    expect(values).toHaveLength(1);
    expect(values[0]).toBeInstanceOf(RedirectCommand);
    if (values[0] instanceof RedirectCommand)
      expect(TestBed.inject(Router).serializeUrl(values[0].redirectTo)).toBe('/error/permission-denied');
  };
  beforeEach(() => {
    vi.resetAllMocks();
    user = userWith([21, 22]);
    released = true;
    authenticated = true;
    maintenance.getDraftCasefile.mockReturnValue(of({ draft: createPersistedCasefileDetail(), etag: '"0"' }));
    maintenance.getCountries.mockReturnValue(of({ refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) }));
    maintenance.getMaintenanceApplications.mockReturnValue(
      of({ refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) }),
    );
    maintenance.getMajorCreditors.mockReturnValue(of({ refData: [] }));
    maintenance.getResult.mockReturnValue(of(PERSISTED_CASEFILE_RESULT_DETAIL));
    lookups.resolve.mockImplementation((fields) => of(fields));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        CasesCreateCasefileStore,
        CasesDraftCasefileStore,
        { provide: OpalMaintenanceService, useValue: maintenance },
        { provide: CasesCreateCasefileOrderTermLookupsService, useValue: lookups },
        {
          provide: GlobalStore,
          useValue: {
            userState: () => user,
            featureFlags: () => ({ [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: released }),
            authenticated: () => authenticated,
            setBannerError,
          },
        },
      ],
    });
  });
  it('waits for GET and every reference, result and lookup before emitting without store hydration', () => {
    const draft = new Subject<{ draft: ReturnType<typeof createPersistedCasefileDetail>; etag: string }>();
    const countries = new Subject<{ refData: typeof PERSISTED_CASEFILE_REFERENCES.countries }>();
    const applications = new Subject<{ refData: typeof PERSISTED_CASEFILE_REFERENCES.applications }>();
    const creditors = new Subject<{ refData: typeof PERSISTED_CASEFILE_REFERENCES.majorCreditors }>();
    const result = new Subject<typeof PERSISTED_CASEFILE_RESULT_DETAIL>();
    const fields = new Subject<typeof PERSISTED_CASEFILE_RESULT_PAGE.fields>();
    maintenance.getDraftCasefile.mockReturnValue(draft);
    maintenance.getCountries.mockReturnValue(countries);
    maintenance.getMaintenanceApplications.mockReturnValue(applications);
    maintenance.getMajorCreditors.mockReturnValue(creditors);
    maintenance.getResult.mockReturnValue(result);
    lookups.resolve.mockReturnValue(fields);
    const creationLoad = vi.spyOn(TestBed.inject(CasesCreateCasefileStore), 'hydratePersistedCasefile');
    const envelopeLoad = vi.spyOn(TestBed.inject(CasesDraftCasefileStore), 'loadResolved');
    const values = resolve();
    expect(maintenance.getCountries).not.toHaveBeenCalled();
    draft.next({ draft: createPersistedCasefileDetail(), etag: '"0"' });
    draft.complete();
    expect(maintenance.getCountries).toHaveBeenCalledWith(null);
    expect(maintenance.getMaintenanceApplications).toHaveBeenCalledWith(null);
    expect(maintenance.getMajorCreditors).toHaveBeenCalledWith({ business_unit_id: 44 });
    expect(values).toEqual([]);
    countries.next({ refData: PERSISTED_CASEFILE_REFERENCES.countries });
    countries.complete();
    expect(values).toEqual([]);
    applications.next({ refData: PERSISTED_CASEFILE_REFERENCES.applications });
    applications.complete();
    expect(values).toEqual([]);
    creditors.next({ refData: [] });
    creditors.complete();
    expect(values).toEqual([]);
    result.next(PERSISTED_CASEFILE_RESULT_DETAIL);
    result.complete();
    expect(values).toEqual([]);
    fields.next(PERSISTED_CASEFILE_RESULT_PAGE.fields);
    fields.complete();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({
      etag: '"0"',
      mode: 'review',
      intent: 'checker-review',
      context: 'checker',
      dashboardMode: 'checker',
      identity: { userId: 10606, businessUnitId: 44, submittedBy: 'BUU-CHECKER' },
      state: { orderTerms: [{ resultId: 'TEST01' }] },
    });
    expect(creationLoad).not.toHaveBeenCalled();
    expect(envelopeLoad).not.toHaveBeenCalled();
  });
  it.each([null, '0', '-1', '1.5', '01', '9007199254740992', 'no'])('rejects unusable ID %s safely', (id) => {
    expect(resolve(route(id))).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
    expect(maintenance.getDraftCasefile).not.toHaveBeenCalled();
  });
  it.each(['', null, 'review'])('rejects untrusted intent %s', (intent) => {
    expect(resolve(route('17', intent))).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
  it.each(['inactive', 'unauthenticated', 'unreleased', 'nonboolean', 'revoked', 'other-bu'])(
    'denies %s without requests',
    (condition) => {
      if (condition === 'inactive') user.status = 'suspended';
      if (condition === 'unauthenticated') authenticated = false;
      if (condition === 'unreleased') released = false;
      if (condition === 'nonboolean') released = 'true';
      if (condition === 'revoked') user = userWith([]);
      if (condition === 'other-bu') user.business_unit_users[0].business_unit_id = 45;
      expectDenied(resolve());
      expect(maintenance.getDraftCasefile).not.toHaveBeenCalled();
      expect(setBannerError).not.toHaveBeenCalled();
    },
  );
  it('denies returned wrong owning BU before references', () => {
    maintenance.getDraftCasefile.mockReturnValue(
      of({ draft: { ...createPersistedCasefileDetail(), business_unit_id: 45 }, etag: '"0"' }),
    );
    expectDenied(resolve());
    expect(maintenance.getCountries).not.toHaveBeenCalled();
  });
  it.each([
    { permissions: [21], intent: 'checker-review', context: 'checker', dashboardMode: 'inputter', mode: 'view' },
    { permissions: [22], intent: 'inputter-view', context: 'inputter', dashboardMode: 'checker', mode: 'view' },
    { permissions: [21, 22], intent: 'checker-view', context: 'checker', dashboardMode: 'checker', mode: 'view' },
  ])('uses route context and accessible return for $intent/$permissions', (row) => {
    user = userWith(row.permissions);
    expect(resolve(route('17', row.intent))[0]).toMatchObject({
      context: row.context,
      dashboardMode: row.dashboardMode,
      mode: row.mode,
    });
  });
  it.each(['self', 'rejected'])('downgrades readable ineligible review %s and denies delete', (reason) => {
    const draft = createPersistedCasefileDetail();
    if (reason === 'self') draft.submitted_by = 'BUU-CHECKER';
    else draft.casefile_status = 'REJECTED';
    maintenance.getDraftCasefile.mockReturnValue(of({ draft, etag: '"0"' }));
    expect(resolve()[0]).toMatchObject({ mode: 'view' });
    expectDenied(resolve(route('17', 'checker-delete')));
  });
  it('permits eligible delete in review mode', () =>
    expect(resolve(route('17', 'checker-delete'))[0]).toMatchObject({ mode: 'review', intent: 'checker-delete' }));
  it.each(['identity', 'revoked', 'flag', 'checker-loss'])('rechecks live scope after dependencies: %s', (change) => {
    const countries = new Subject<{ refData: typeof PERSISTED_CASEFILE_REFERENCES.countries }>();
    maintenance.getCountries.mockReturnValue(countries);
    const values = resolve();
    if (change === 'identity') user.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
    if (change === 'revoked') user = userWith([]);
    if (change === 'flag') released = false;
    if (change === 'checker-loss') user = userWith([21]);
    countries.next({ refData: PERSISTED_CASEFILE_REFERENCES.countries });
    countries.complete();
    if (change === 'checker-loss') expect(values[0]).toMatchObject({ mode: 'view', dashboardMode: 'inputter' });
    else expectDenied(values);
  });
  it('denies delete when checker permission is lost while loading', () => {
    const countries = new Subject<{ refData: typeof PERSISTED_CASEFILE_REFERENCES.countries }>();
    maintenance.getCountries.mockReturnValue(countries);
    const values = resolve(route('17', 'checker-delete'));
    user = userWith([21]);
    countries.next({ refData: PERSISTED_CASEFILE_REFERENCES.countries });
    countries.complete();
    expectDenied(values);
  });
  it('fetches duplicate result IDs only once', () => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.respondent_account.order_details.order_terms.push(
      structuredClone(draft.casefile.respondent_account.order_details.order_terms[0]),
    );
    maintenance.getDraftCasefile.mockReturnValue(of({ draft, etag: '"0"' }));
    expect(resolve()).toHaveLength(1);
    expect(maintenance.getResult).toHaveBeenCalledTimes(1);
  });
  it('composes zero result IDs as an empty page collection before mapper rejects incomplete casefile', () => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.respondent_account.order_details.order_terms = [];
    maintenance.getDraftCasefile.mockReturnValue(of({ draft, etag: '"0"' }));
    expect(resolve()).toEqual([]);
    expect(maintenance.getResult).not.toHaveBeenCalled();
    expect(setBannerError).toHaveBeenCalled();
  });
  it.each([
    'getDraftCasefile',
    'getCountries',
    'getMaintenanceApplications',
    'getMajorCreditors',
    'getResult',
  ] as const)('fails safely on empty %s', (method) => {
    maintenance[method].mockReturnValue(EMPTY);
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
  it('fails safely on empty lookup emission', () => {
    lookups.resolve.mockReturnValue(EMPTY);
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
  it.each([
    null,
    undefined,
    { ...PERSISTED_CASEFILE_RESULT_DETAIL, result_id: 'WRONG' },
    { ...PERSISTED_CASEFILE_RESULT_DETAIL, result_title: ' ' },
    { ...PERSISTED_CASEFILE_RESULT_DETAIL, result_parameters: '[]' },
    { ...PERSISTED_CASEFILE_RESULT_DETAIL, result_parameters: '{' },
  ])('rejects unusable result %j', (detail) => {
    maintenance.getResult.mockReturnValue(of(detail));
    const creationLoad = vi.spyOn(TestBed.inject(CasesCreateCasefileStore), 'hydratePersistedCasefile');
    const envelopeLoad = vi.spyOn(TestBed.inject(CasesDraftCasefileStore), 'loadResolved');
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalledExactlyOnceWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    expect(creationLoad).not.toHaveBeenCalled();
    expect(envelopeLoad).not.toHaveBeenCalled();
  });
  it('rejects empty choice options', () => {
    lookups.resolve.mockReturnValue(of([{ ...PERSISTED_CASEFILE_RESULT_PAGE.fields[0], kind: 'select', options: [] }]));
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
  it('rejects missing reference data before exposing state', () => {
    maintenance.getCountries.mockReturnValue(of({ refData: [] }));
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
  it.each([400, 401, 403, 404, 409, 412, 500, 0])('preserves shared HTTP handling for status %s', (status) => {
    maintenance.getDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    expect(resolve()).toEqual([]);
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it('rejects a returned record ID that differs from the requested ID with the safe generic banner', () => {
    maintenance.getDraftCasefile.mockReturnValue(
      of({ draft: { ...createPersistedCasefileDetail(), draft_casefile_id: 18 }, etag: '"0"' }),
    );
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalledExactlyOnceWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    expect(maintenance.getCountries).not.toHaveBeenCalled();
  });
  it('restores historical inactive references and trims the saved result title', () => {
    maintenance.getCountries.mockReturnValue(
      of({ refData: PERSISTED_CASEFILE_REFERENCES.countries.map((item) => ({ ...item, active: false })) }),
    );
    maintenance.getMaintenanceApplications.mockReturnValue(
      of({ refData: PERSISTED_CASEFILE_REFERENCES.applications.map((item) => ({ ...item, active: false })) }),
    );
    maintenance.getResult.mockReturnValue(
      of({ ...PERSISTED_CASEFILE_RESULT_DETAIL, result_title: '  Historical term  ' }),
    );
    expect(resolve()[0]).toMatchObject({
      references: { resultPages: { TEST01: { title: 'Historical term' } } },
      state: { orderDetails: { applicationId: 901 } },
    });
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it('fails safely when the lookup service rejects unsupported metadata', () => {
    lookups.resolve.mockReturnValue(throwError(() => new Error('Unsupported lookup')));
    expect(resolve()).toEqual([]);
    expect(setBannerError).toHaveBeenCalled();
  });
});
