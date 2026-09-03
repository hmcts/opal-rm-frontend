import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileApplicantIndividualComponent } from '../cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual.component';
import { CasesCreateCasefileApplicantOrganisationComponent } from '../cases-create-casefile-applicant-organisation/cases-create-casefile-applicant-organisation.component';
import { CasesCreateCasefileCancelComponent } from '../cases-create-casefile-cancel/cases-create-casefile-cancel.component';
import { CasesCreateCasefileCentralAuthorityComponent } from '../cases-create-casefile-central-authority/cases-create-casefile-central-authority.component';
import { CasesCreateCasefileCheckDetailsComponent } from '../cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { CasesCreateCasefileCommentsNotesComponent } from '../cases-create-casefile-comments-notes/cases-create-casefile-comments-notes.component';
import { CasesCreateCasefileInterestIndexationComponent } from '../cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation.component';
import { CasesCreateCasefileManagingPaymentsComponent } from '../cases-create-casefile-managing-payments/cases-create-casefile-managing-payments.component';
import { CasesCreateCasefileOrderDetailsComponent } from '../cases-create-casefile-order-details/cases-create-casefile-order-details.component';
import { CasesCreateCasefileOrderTermsSummaryComponent } from '../cases-create-casefile-order-terms-summary/cases-create-casefile-order-terms-summary.component';
import { CasesCreateCasefileRespondentDetailsComponent } from '../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details.component';
import { CasesCreateCasefileTaskListComponent } from '../cases-create-casefile-task-list/cases-create-casefile-task-list.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_TITLES } from './constants/cases-create-casefile-routing-titles.constant';
import { routing } from './cases-create-casefile.routes';
import { casesCreateCasefileApplicantIndividualGuard } from './guards/cases-create-casefile-applicant-individual.guard';
import { casesCreateCasefileApplicantOrganisationGuard } from './guards/cases-create-casefile-applicant-organisation.guard';
import { casesCreateCasefileChildCanDeactivateGuard } from './guards/cases-create-casefile-child-can-deactivate.guard';
import { casesCreateCasefileFlowStateGuard } from './guards/cases-create-casefile-flow-state.guard';
import { fetchCasesCreateCasefileCountriesResolver } from './resolvers/fetch-cases-create-casefile-countries-resolver/fetch-cases-create-casefile-countries.resolver';

const guardedRouteCases = [
  ['taskList', 'Case details'],
  ['centralAuthorityDetails', 'Central authority details'],
  ['orderDetails', 'Order details'],
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
