import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileApplicantIndividualComponent } from '../cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual.component';
import { CasesCreateCasefileApplicantOrganisationComponent } from '../cases-create-casefile-applicant-organisation/cases-create-casefile-applicant-organisation.component';
import { CasesCreateCasefileCancelComponent } from '../cases-create-casefile-cancel/cases-create-casefile-cancel.component';
import { CasesCreateCasefileCentralAuthorityComponent } from '../cases-create-casefile-central-authority/cases-create-casefile-central-authority.component';
import { CasesCreateCasefileCheckDetailsComponent } from '../cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { CasesCreateCasefileCommentsNotesComponent } from '../cases-create-casefile-comments-notes/cases-create-casefile-comments-notes.component';
import { CasesCreateCasefileInterestIndexationComponent } from '../cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation.component';
import { CasesCreateCasefileManagingPaymentsComponent } from '../cases-create-casefile-managing-payments/cases-create-casefile-managing-payments.component';
import { CasesCreateCasefileOrderTermCreditorComponent } from '../cases-create-casefile-order-term-creditor/cases-create-casefile-order-term-creditor.component';
import { CasesCreateCasefileOrderTermLookupsService } from '../cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { CasesCreateCasefileOrderDetailsComponent } from '../cases-create-casefile-order-details/cases-create-casefile-order-details.component';
import { CasesCreateCasefileOrderTermsSummaryComponent } from '../cases-create-casefile-order-terms-summary/cases-create-casefile-order-terms-summary.component';
import { CasesCreateCasefileRespondentDetailsComponent } from '../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details.component';
import { CasesCreateCasefileTaskListComponent } from '../cases-create-casefile-task-list/cases-create-casefile-task-list.component';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_TITLES } from './constants/cases-create-casefile-routing-titles.constant';
import { routing } from './cases-create-casefile.routes';
import { casesCreateCasefileApplicantIndividualGuard } from './guards/cases-create-casefile-applicant-individual.guard';
import { casesCreateCasefileApplicantOrganisationGuard } from './guards/cases-create-casefile-applicant-organisation.guard';
import { casesCreateCasefileChildCanDeactivateGuard } from './guards/cases-create-casefile-child-can-deactivate.guard';
import { casesCreateCasefileFlowStateGuard } from './guards/cases-create-casefile-flow-state.guard';
import { casesCreateCasefileOrderTermSelectionGuard } from './guards/cases-create-casefile-order-term-selection.guard';
import { casesCreateCasefileOrderTermCreditorGuard } from './guards/cases-create-casefile-order-term-creditor.guard';
import { fetchCasesCreateCasefileOrderTermResolver } from './resolvers/fetch-cases-create-casefile-order-term-resolver/fetch-cases-create-casefile-order-term.resolver';
import { fetchCasesCreateCasefileCentralAuthoritiesResolver } from './resolvers/fetch-cases-create-casefile-central-authorities-resolver/fetch-cases-create-casefile-central-authorities.resolver';
import { fetchCasesCreateCasefileApplicationsResolver } from './resolvers/fetch-cases-create-casefile-applications-resolver/fetch-cases-create-casefile-applications.resolver';
import { fetchCasesCreateCasefileCountriesResolver } from './resolvers/fetch-cases-create-casefile-countries-resolver/fetch-cases-create-casefile-countries.resolver';
import { fetchCasesCreateCasefileOrderTermsResolver } from './resolvers/fetch-cases-create-casefile-order-terms-resolver/fetch-cases-create-casefile-order-terms.resolver';

@Component({ template: '' })
class TestDestinationComponent {}

const guardedRouteCases = [
  ['taskList', 'Case details'],
  ['orderTermsSummary', 'Order terms'],
  ['checkCaseDetails', 'Check case details'],
  ['cancel', 'Cancel case creation'],
] as const;

const expectedComponents = {
  taskList: CasesCreateCasefileTaskListComponent,
  applicantIndividual: CasesCreateCasefileApplicantIndividualComponent,
  centralAuthorityDetails: CasesCreateCasefileCentralAuthorityComponent,
  orderDetails: CasesCreateCasefileOrderDetailsComponent,
  orderTermsSummary: CasesCreateCasefileOrderTermsSummaryComponent,
  interestAndIndexation: CasesCreateCasefileInterestIndexationComponent,
  managingPayments: CasesCreateCasefileManagingPaymentsComponent,
  commentsAndNotes: CasesCreateCasefileCommentsNotesComponent,
  checkCaseDetails: CasesCreateCasefileCheckDetailsComponent,
  cancel: CasesCreateCasefileCancelComponent,
} as const;

describe('Create Casefile routes', () => {
  it('redirects the empty child route to Case Type', () => {
    expect(routing[0]).toEqual({
      path: '',
      redirectTo: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
      pathMatch: 'full',
    });
  });

  it('registers Case Type without temporary permission metadata or a flow-state guard', () => {
    const route = routing.find((candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType);

    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.canActivate).toBeUndefined();
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.caseType });
    expect(route?.resolve).toEqual({ title: TitleResolver });
  });

  it('registers Respondent details with flow and unsaved-change guards and resolves active Countries', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.respondentDetails });
    expect(route?.resolve).toEqual({
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileRespondentDetailsComponent.name);
  });

  it('registers Individual applicant with ordered flow guards, unsaved-change protection and active Countries', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([
      casesCreateCasefileFlowStateGuard,
      casesCreateCasefileApplicantIndividualGuard,
    ]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantIndividual });
    expect(route?.resolve).toEqual({
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileApplicantIndividualComponent.name);
  });

  it('registers Organisation applicant with ordered flow guards, unsaved-change protection and active Countries', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([
      casesCreateCasefileFlowStateGuard,
      casesCreateCasefileApplicantOrganisationGuard,
    ]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantOrganisation });
    expect(route?.resolve).toEqual({
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileApplicantOrganisationComponent.name);
  });

  it('registers Central authority details with flow and unsaved-change guards and resolves active Central Authorities', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.centralAuthorityDetails });
    expect(route?.resolve).toEqual({
      title: TitleResolver,
      centralAuthorities: fetchCasesCreateCasefileCentralAuthoritiesResolver,
    });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileCentralAuthorityComponent.name);
  });

  it('registers Order details with flow and unsaved-change guards and resolves active applications', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderDetails,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderDetails });
    expect(route?.resolve).toEqual({
      title: TitleResolver,
      applications: fetchCasesCreateCasefileApplicationsResolver,
    });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileOrderDetailsComponent.name);
  });

  it('registers Order term selection with flow and unsaved-change guards and an immediate load owner', () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderTermsSelect });
    expect(route?.resolve).toEqual({ title: TitleResolver, orderTerms: fetchCasesCreateCasefileOrderTermsResolver });
  });

  it('redirects an Order term input URL without a result ID to selection', () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsInput,
    );

    expect(route).toEqual({
      path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsInput,
      pathMatch: 'full',
      redirectTo: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect,
    });
  });

  it('registers Order term input with guards, route-scoped lookups and resolved page data', () => {
    const route = routing.find(
      (candidate) => candidate.path === `${CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsInput}/:resultId`,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard, casesCreateCasefileOrderTermSelectionGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.providers).toEqual([CasesCreateCasefileOrderTermLookupsService]);
    expect(route?.data).toBeUndefined();
    expect(route?.resolve).toEqual({ orderTerm: fetchCasesCreateCasefileOrderTermResolver });
  });

  it('registers the guarded Creditor placeholder destination', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermCreditor,
    );

    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard, casesCreateCasefileOrderTermCreditorGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderTermCreditor });
    expect(route?.resolve).toEqual({ title: TitleResolver });
    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);
    expect(component?.name).toBe(CasesCreateCasefileOrderTermCreditorComponent.name);
  });

  it('prevents creditor data resolution when the current order term is stale', async () => {
    const creditorResolver = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        CasesCreateCasefileStore,
        provideRouter([
          {
            path: `${CASES_CREATE_CASEFILE_ROUTING_PATHS.root}/${CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect}`,
            component: TestDestinationComponent,
          },
          {
            path: `${CASES_CREATE_CASEFILE_ROUTING_PATHS.root}/${CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermCreditor}`,
            component: TestDestinationComponent,
            canActivate: [casesCreateCasefileOrderTermCreditorGuard],
            resolve: { majorCreditors: creditorResolver },
          },
        ]),
      ],
    });
    patchState(TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      currentOrderTermId: 999,
    });

    await RouterTestingHarness.create('/cases/create-casefile/order-terms/creditor');

    expect(creditorResolver).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/select');
  });

  it('registers Interest and indexation with flow and unsaved-change guards and no permission metadata', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.interestAndIndexation });
    expect(route?.resolve).toEqual({ title: TitleResolver });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileInterestIndexationComponent.name);
  });

  it('registers Managing payments with flow and unsaved-change guards and no permission metadata', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.managingPayments });
    expect(route?.resolve).toEqual({ title: TitleResolver });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileManagingPaymentsComponent.name);
  });

  it('registers Comments and notes with flow and unsaved-change guards and no permission metadata', async () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.commentsAndNotes,
    );

    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
    expect(route?.canDeactivate).toEqual([casesCreateCasefileChildCanDeactivateGuard]);
    expect(route?.data).toEqual({ title: CASES_CREATE_CASEFILE_ROUTING_TITLES.commentsAndNotes });
    expect(route?.resolve).toEqual({ title: TitleResolver });

    const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

    expect(component?.name).toBe(CasesCreateCasefileCommentsNotesComponent.name);
  });

  it.each(guardedRouteCases)(
    'registers %s as a guarded lazy route without permission or requirement metadata',
    async (pathKey, title) => {
      const route = routing.find(
        (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children[pathKey],
      );

      expect(route?.loadComponent).toEqual(expect.any(Function));
      expect(route?.canActivate).toEqual([casesCreateCasefileFlowStateGuard]);
      expect(route?.data).toEqual({ title });
      expect(route?.resolve).toEqual({ title: TitleResolver });

      const component = await (route?.loadComponent?.() as Promise<{ name: string }> | undefined);

      expect(component?.name).toBe(expectedComponents[pathKey].name);
    },
  );
});
