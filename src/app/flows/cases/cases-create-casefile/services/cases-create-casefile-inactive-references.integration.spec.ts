import { CasesCreateCasefileApplicantIndividualFormComponent } from '../cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual-form/cases-create-casefile-applicant-individual-form.component';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from '../cases-create-casefile-minor-creditor-details/cases-create-casefile-minor-creditor-details-form/cases-create-casefile-minor-creditor-details-form.component';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { CasesCreateCasefileCentralAuthorityFormComponent } from '../cases-create-casefile-central-authority/cases-create-casefile-central-authority-form/cases-create-casefile-central-authority-form.component';
import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AppComponent } from '../../../../app.component';
import { appConfig } from '../../../../app.config';
import { routing as pageRoutes } from '../../../../pages/routing/pages.routes';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileRespondentDetailsFormComponent } from '../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component';
import { CasesCreateCasefileOrderDetailsFormComponent } from '../cases-create-casefile-order-details/cases-create-casefile-order-details-form/cases-create-casefile-order-details-form.component';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from '../cases-create-casefile-order-term-creditor/cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component';
import { createPersistedCasefileResolved } from '../../cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

@Component({ template: '<h1>Existing error destination</h1>' })
class ErrorPageForTest {}

const amendmentUrl = '/cases/create-casefile/task-list/17';
const reviewUrl = '/cases/create-casefile/check-case-details';
const replacementUrl = '/opal-maintenance-service/draft-casefiles/17';

describe('saved inactive references in real amendment editors', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let router: Router;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let persisted: InstanceType<typeof CasesDraftCasefileStore>;

  beforeEach(() => {
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.user_id = 10606;
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-INPUTTER',
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ];
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        // This is the actual production HTTP provider, without startup or SSR hydration.
        appConfig.providers[2],
        provideRouter([...pageRoutes, { path: 'error/:kind', component: ErrorPageForTest }]),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(user) } },
        { provide: AppInsightsService, useValue: { logException: vi.fn(), logPageView: vi.fn() } },
        { provide: SessionService, useValue: { getTokenExpiry: () => of({ expiry: null }) } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: vi.fn(),
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: vi.fn(),
          },
        },
      ],
    });
    const global = TestBed.inject(GlobalStore);
    global.setUserState(user);
    global.setAuthenticated(true);
    global.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    store = TestBed.inject(CasesCreateCasefileStore);
    fixture = TestBed.createComponent(AppComponent);
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function flushReferences(savedDetails = false): Promise<void> {
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/maintenance-applications')
        .flush({ refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) }),
    );
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/countries'))
      request.flush({
        refData: structuredClone(
          savedDetails ? PERSISTED_CASEFILE_REFERENCES.countries : [PERSISTED_CASEFILE_REFERENCES.countries[1]],
        ),
      });
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/major-creditors'))
      request.flush({ refData: [] });
    if (savedDetails)
      http.expectOne('/opal-maintenance-service/results/TEST01').flush(PERSISTED_CASEFILE_RESULT_DETAIL);
  }
  async function openAmendmentReview(applicantCountryChanged = false): Promise<void> {
    fixture.detectChanges();
    const arrival = router.navigateByUrl(amendmentUrl);
    await vi.waitFor(() => {
      const draft = createPersistedCasefileDetail();
      draft.casefile_status = 'REJECTED';
      if (applicantCountryChanged) draft.casefile.applicant.party_details.address!.cjs_code = 101;
      http.expectOne(replacementUrl).flush(draft, { headers: { ETag: '"4"' } });
    });
    await flushReferences(true);
    await arrival;
    await settle();
    persisted = fixture.debugElement
      .query(By.directive(CasesCreateCasefileComponent))
      .injector.get(CasesDraftCasefileStore);
    const respondent = structuredClone(store.respondentDetails()!);
    respondent.firstNames = 'Corrected';
    store.setRespondentDetails(respondent);
    const review = router.navigateByUrl(reviewUrl);
    await flushReferences();
    await review;
    await settle();
  }

  function retainInactiveReferences(): void {
    const references = structuredClone(persisted.references()!);
    references.countries[0].active = false;
    references.applications[0].active = false;
    references.majorCreditors = [
      {
        major_creditor_id: 47,
        business_unit_id: 44,
        major_creditor_code: 'MC47',
        name: 'Saved inactive creditor',
        address_line_1: '1 Example Street',
        address_line_2: null,
        address_line_3: null,
        address_line_4: null,
        address_line_5: null,
        postcode: null,
        country_id: null,
        country_name: null,
        contact_name: null,
        contact_email: null,
        active: false,
        central_authority: false,
      },
    ];
    persisted.loadResolved(
      createPersistedCasefileResolved({
        draft: persisted.draft()!,
        etag: persisted.etag()!,
        identity: persisted.identity()!,
        references,
        state: getState(store),
        intent: 'inputter-amend',
        mode: 'amend',
      }),
    );
  }
  it('shows the saved inactive respondent Country and rejects it until a current Country is selected', async () => {
    await openAmendmentReview();
    retainInactiveReferences();
    const arrival = router.navigateByUrl('/cases/create-casefile/respondent-details');
    await arrival;
    await settle();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileRespondentDetailsFormComponent))
      .componentInstance as CasesCreateCasefileRespondentDetailsFormComponent;
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
          '#create_casefile_respondent_details_country_id-autocomplete',
        )?.value,
      ).toBe('Test Country One'),
    );
    const control = child.form.controls['create_casefile_respondent_details_country_id'];
    expect(control.invalid).toBe(true);
    control.setValue(2);
    expect(control.valid).toBe(true);
    expect(store.respondentDetails()?.contactDetails.address.countryId).toBe(1);
  });
  it('retains the saved inactive applicant Country label and accepted details when cancelling', async () => {
    await openAmendmentReview(true);
    retainInactiveReferences();
    const before = structuredClone(store.applicantDetails());
    await router.navigateByUrl('/cases/create-casefile/applicant-details/individual');
    await settle();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileApplicantIndividualFormComponent))
      .componentInstance as CasesCreateCasefileApplicantIndividualFormComponent;
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
          '#create_casefile_applicant_individual_country_id-autocomplete',
        )?.value,
      ).toBe('Test Country One'),
    );
    expect(child.form.controls.create_casefile_applicant_individual_country_id.invalid).toBe(true);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('#cancelApplicantDetails a')!.click();
    await settle();
    expect(router.url).toBe('/cases/create-casefile/task-list');
    expect(store.applicantDetails()).toEqual(before);
  });
  it('retains an existing Minor creditor inactive Country label and accepted details on Cancel', async () => {
    await openAmendmentReview();
    retainInactiveReferences();
    const minor = {
      sequenceNumber: 7,
      displayName: 'Saved minor creditor',
      details: {
        ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
        address: {
          ...MINOR_CREDITOR_DETAILS_MOCK.address,
          countryId: 1,
        },
      },
    };
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      currentOrderTermId: 1,
      minorCreditors: [minor],
      orderTerms: [{ ...store.orderTerms()[0], creditor: { type: 'minor', sequenceNumber: 7 } }],
    });
    const before = structuredClone(store.minorCreditors());
    await router.navigateByUrl('/cases/create-casefile/order-terms/creditor/minor-creditor-details');
    await settle();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileMinorCreditorDetailsFormComponent))
      .componentInstance as CasesCreateCasefileMinorCreditorDetailsFormComponent;
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
          '#create_casefile_minor_creditor_country_id-autocomplete',
        )?.value,
      ).toBe('Test Country One'),
    );
    expect(child.form.controls.create_casefile_minor_creditor_country_id.invalid).toBe(true);
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLAnchorElement>('#create_casefile_minor_creditor_cancel a')!
      .click();
    await vi.waitFor(() =>
      http.expectOne((request) => request.url === '/opal-maintenance-service/major-creditors').flush({ refData: [] }),
    );
    await settle();
    expect(router.url).toBe('/cases/create-casefile/order-terms/creditor');
    expect(store.minorCreditors()).toEqual(before);
  });
  it('shows the saved inactive Application and rejects it until a current Application is selected', async () => {
    await openAmendmentReview();
    retainInactiveReferences();
    const arrival = router.navigateByUrl('/cases/create-casefile/order-details');
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/maintenance-applications')
        .flush({
          refData: [
            {
              ...PERSISTED_CASEFILE_REFERENCES.applications[0],
              application_id: 902,
              application_code: 'NEW',
              application_title: 'Current application',
            },
          ],
        }),
    );
    await arrival;
    await settle();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderDetailsFormComponent))
      .componentInstance as CasesCreateCasefileOrderDetailsFormComponent;
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
          '#create_casefile_order_details_application_id-autocomplete',
        )?.value,
      ).toContain('TEST'),
    );
    const control = child.form.controls['create_casefile_order_details_application_id'];
    expect(control.invalid).toBe(true);
    control.setValue(902);
    expect(control.valid).toBe(true);
    expect(store.orderDetails()?.applicationId).toBe(901);
  });
  it('preserves a saved inactive Central authority on opening and cancelling its editor', async () => {
    await openAmendmentReview();
    retainInactiveReferences();
    const saved = { ...persisted.references()!.majorCreditors[0], central_authority: true };
    store.setCentralAuthorityDetails({
      remoReference: 'SYNTHETIC',
      centralAuthorityReference: null,
      majorCreditor: saved,
    });
    const references = structuredClone(persisted.references()!);
    references.majorCreditors = [...references.majorCreditors, saved];
    persisted.loadResolved(
      createPersistedCasefileResolved({
        draft: persisted.draft()!,
        etag: persisted.etag()!,
        identity: persisted.identity()!,
        references,
        state: getState(store),
        intent: 'inputter-amend',
        mode: 'amend',
      }),
    );
    const before = structuredClone(store.centralAuthorityDetails());
    const arrival = router.navigateByUrl('/cases/create-casefile/central-authority-details');
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/major-creditors')
        .flush({ refData: [{ ...saved, major_creditor_id: 48, active: true, name: 'Current authority' }] }),
    );
    await arrival;
    await settle();
    expect(store.centralAuthorityDetails()).toEqual(before);
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
          '#create_casefile_central_authority_major_creditor_id-autocomplete',
        )?.value,
      ).toContain('Saved inactive creditor'),
    );
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileCentralAuthorityFormComponent))
      .componentInstance as CasesCreateCasefileCentralAuthorityFormComponent;
    const control = child.form.controls.create_casefile_central_authority_major_creditor_id;
    expect(control.invalid).toBe(true);
    control.setValue(48);
    expect(control.valid).toBe(true);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('#cancelCentralAuthority a')!.click();
    await settle();
    expect(router.url).toBe('/cases/create-casefile/task-list');
    expect(store.centralAuthorityDetails()).toEqual(before);
  });
  it('shows only the saved inactive Major creditor and rejects accepting it', async () => {
    await openAmendmentReview();
    retainInactiveReferences();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      currentOrderTermId: 1,
      orderTerms: [
        {
          ...store.orderTerms()[0],
          creditor: { type: 'major', majorCreditorId: 47, displayName: 'Saved inactive creditor' },
        },
      ],
    });
    const arrival = router.navigateByUrl('/cases/create-casefile/order-terms/creditor');
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/major-creditors')
        .flush({
          refData: [
            {
              ...persisted.references()!.majorCreditors[0],
              major_creditor_id: 48,
              major_creditor_code: 'MC48',
              name: 'Current creditor',
              active: true,
            },
          ],
        }),
    );
    await arrival;
    await settle();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '#create_casefile_order_term_creditor_major_creditor_id',
    );
    expect(select?.selectedOptions[0]?.textContent).toContain('Saved inactive creditor');
    const control = child.form.controls['create_casefile_order_term_creditor_major_creditor_id'];
    expect(control.invalid).toBe(true);
    control.setValue(48);
    expect(control.valid).toBe(true);
  });
});
