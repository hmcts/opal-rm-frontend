import { CasesDraftCasefileStore } from '../../../../cases-draft/stores/cases-draft-casefile.store';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';
import { createPersistedCasefileResolved } from '../../../../cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { fetchCasesCreateCasefileCountriesResolver } from './fetch-cases-create-casefile-countries.resolver';

describe('fetchCasesCreateCasefileCountriesResolver', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  const countriesResponse: IOpalMaintenanceCountryReferenceDataResponse = {
    count: 1,
    refData: [
      {
        country_id: 1,
        cjs_code: 1,
        country_name: 'England',
        date_used_from: '2020-01-01',
        active: true,
      },
    ],
  };
  const countryService = { getCountries: vi.fn() };
  const globalStore = { setBannerError: vi.fn() };

  const executeResolver = (activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) =>
    TestBed.runInInjectionContext(() => fetchCasesCreateCasefileCountriesResolver(activatedRoute, routerState));

  beforeEach(() => {
    vi.clearAllMocks();
    countryService.getCountries.mockReturnValue(of(countriesResponse));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: countryService },
        { provide: GlobalStore, useValue: globalStore },
      ],
    });
  });

  it('resolves the unmodified active-Countries response', async () => {
    await expect(
      firstValueFrom(executeResolver(route, state) as Observable<IOpalMaintenanceCountryReferenceDataResponse>),
    ).resolves.toEqual(countriesResponse);
    expect(countryService.getCountries).toHaveBeenCalledWith(true);
  });

  it('propagates service failures so route activation is cancelled', async () => {
    const problem = new HttpErrorResponse({ status: 503, error: { detail: 'Countries unavailable' } });
    countryService.getCountries.mockReturnValue(throwError(() => problem));

    await expect(firstValueFrom(executeResolver(route, state) as Observable<never>)).rejects.toBe(problem);
  });

  it('cancels route activation and sets the generic banner when Countries resolves empty', async () => {
    countryService.getCountries.mockReturnValue(of({ count: 0, refData: [] }));

    const result = await firstValueFrom(
      executeResolver(route, state) as Observable<IOpalMaintenanceCountryReferenceDataResponse>,
      { defaultValue: null },
    );

    expect(result).toBeNull();
    expect(globalStore.setBannerError).toHaveBeenCalledOnce();
    expect(globalStore.setBannerError).toHaveBeenCalledWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
  });
});

describe('amendment Countries selected historical options', () => {
  let editable: InstanceType<typeof CasesCreateCasefileStore>;
  let persisted: InstanceType<typeof CasesDraftCasefileStore>;
  const activeCountry = {
    country_id: 1,
    cjs_code: 1,
    country_name: 'Current Country',
    active: true,
    date_used_from: '2000-01-01',
  };
  const countryService = { getCountries: vi.fn() };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CasesCreateCasefileStore,
        CasesDraftCasefileStore,
        { provide: OpalMaintenanceService, useValue: countryService },
        { provide: GlobalStore, useValue: { setBannerError: vi.fn() } },
      ],
    });
    countryService.getCountries.mockReturnValue(of({ count: 1, refData: [activeCountry] }));
    editable = TestBed.inject(CasesCreateCasefileStore);
    persisted = TestBed.inject(CasesDraftCasefileStore);
    const resolved = createPersistedCasefileResolved({ intent: 'inputter-amend', mode: 'amend' });
    const snapshot = resolved.state;
    snapshot.submissionIntent = 'amendment';
    const respondent = snapshot.respondentDetails!;
    respondent.contactDetails.address.countryId = 11;
    respondent.thirdParty = {
      nameOrOrganisation: 'Synthetic third party',
      relationship: 'Test',
      reference: null,
      address: { ...respondent.contactDetails.address, countryId: 12 },
    };
    respondent.employer = {
      employerName: 'Synthetic employer',
      employeeReference: null,
      emailAddress: null,
      telephoneNumber: null,
      address: { ...respondent.contactDetails.address, countryId: 13 },
    };
    snapshot.applicantDetails!.contactDetails.address.countryId = 14;
    if ('thirdParty' in snapshot.applicantDetails!)
      snapshot.applicantDetails.thirdParty = {
        ...respondent.thirdParty,
        address: { ...respondent.thirdParty.address, countryId: 15 },
      };
    resolved.references.countries = [11, 12, 13, 14, 15, 99].map((country_id) => ({
      ...activeCountry,
      country_id,
      cjs_code: country_id,
      country_name: 'Saved Country ' + country_id,
      active: false,
    }));
    persisted.loadResolved(resolved);
    editable.hydratePersistedCasefile(snapshot);
  });
  async function resolve(path: string): Promise<IOpalMaintenanceCountryReferenceDataResponse> {
    return firstValueFrom(
      TestBed.runInInjectionContext(() =>
        fetchCasesCreateCasefileCountriesResolver(
          { routeConfig: { path } } as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ) as Observable<IOpalMaintenanceCountryReferenceDataResponse>,
    );
  }
  it.each([
    ['respondent-details', [1, 11, 12, 13]],
    ['applicant-details/individual', [1, 14, 15]],
  ])(
    'includes only the saved %s address selections and excludes unrelated historical references',
    async (path, ids) => {
      const before = structuredClone(persisted.references());
      const response = await resolve(path as string);
      expect(response.refData.map((item) => item.country_id)).toEqual(ids);
      expect(response.refData.filter((item) => item.country_id !== 1).every((item) => item.active === false)).toBe(
        true,
      );
      expect(persisted.references()).toEqual(before);
      expect(countryService.getCountries).toHaveBeenCalledWith(true);
    },
  );
  it('does not append historical Countries to an unrelated route', async () => {
    expect((await resolve('check-case-details')).refData).toEqual([activeCountry]);
  });
  it('keeps an active server record instead of duplicating its historical selection', async () => {
    countryService.getCountries.mockReturnValue(
      of({
        count: 2,
        refData: [activeCountry, { ...activeCountry, country_id: 11, country_name: 'Current replacement label' }],
      }),
    );
    const response = await resolve('respondent-details');
    expect(response.refData.filter((item) => item.country_id === 11)).toEqual([
      { ...activeCountry, country_id: 11, country_name: 'Current replacement label' },
    ]);
  });
  it('includes a historical Country once when several saved addresses select it', async () => {
    const respondent = structuredClone(editable.respondentDetails()!);
    respondent.thirdParty!.address.countryId = respondent.contactDetails.address.countryId;
    respondent.employer!.address.countryId = respondent.contactDetails.address.countryId;
    editable.setRespondentDetails(respondent);

    const response = await resolve('respondent-details');

    expect(response.refData.map((item) => item.country_id)).toEqual([1, 11]);
    expect(response.count).toBe(2);
  });
  it('returns only active options when amendment context was lost', async () => {
    persisted.resetStore();
    expect((await resolve('respondent-details')).refData).toEqual([activeCountry]);
    expect(editable.submissionIntent()).toBe('amendment');
  });
  it('returns only active options when the historical references are missing', async () => {
    vi.spyOn(persisted, 'references').mockReturnValue(null);
    expect((await resolve('respondent-details')).refData).toEqual([activeCountry]);
  });
  it('does not fabricate a historical option when the selected Country is absent from saved references', async () => {
    const respondent = structuredClone(editable.respondentDetails()!);
    respondent.contactDetails.address.countryId = 123;
    respondent.thirdParty = null;
    respondent.employer = null;
    editable.setRespondentDetails(respondent);
    expect((await resolve('respondent-details')).refData).toEqual([activeCountry]);
  });
});
