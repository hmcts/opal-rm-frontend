import { Routes } from '@angular/router';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { CasesCreateCasefileOrderTermLookupsService } from '../cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_TITLES } from './constants/cases-create-casefile-routing-titles.constant';
import { casesCreateCasefileApplicantIndividualGuard } from './guards/cases-create-casefile-applicant-individual.guard';
import { casesCreateCasefileApplicantOrganisationGuard } from './guards/cases-create-casefile-applicant-organisation.guard';
import { casesCreateCasefileChildCanDeactivateGuard } from './guards/cases-create-casefile-child-can-deactivate.guard';
import { casesCreateCasefileFlowStateGuard } from './guards/cases-create-casefile-flow-state.guard';
import { casesCreateCasefileOrderTermSelectionGuard } from './guards/cases-create-casefile-order-term-selection.guard';
import { casesCreateCasefileOrderTermCreditorGuard } from './guards/cases-create-casefile-order-term-creditor.guard';
import { fetchCasesCreateCasefileCentralAuthoritiesResolver } from './resolvers/fetch-cases-create-casefile-central-authorities-resolver/fetch-cases-create-casefile-central-authorities.resolver';
import { fetchCasesCreateCasefileApplicationsResolver } from './resolvers/fetch-cases-create-casefile-applications-resolver/fetch-cases-create-casefile-applications.resolver';
import { fetchCasesCreateCasefileCountriesResolver } from './resolvers/fetch-cases-create-casefile-countries-resolver/fetch-cases-create-casefile-countries.resolver';
import { fetchCasesCreateCasefileOrderTermsResolver } from './resolvers/fetch-cases-create-casefile-order-terms-resolver/fetch-cases-create-casefile-order-terms.resolver';
import { fetchCasesCreateCasefileOrderTermResolver } from './resolvers/fetch-cases-create-casefile-order-term-resolver/fetch-cases-create-casefile-order-term.resolver';

export const routing: Routes = [
  {
    path: '',
    redirectTo: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
    pathMatch: 'full',
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
    loadComponent: () =>
      import('../cases-create-casefile-case-type/cases-create-casefile-case-type.component').then(
        (component) => component.CasesCreateCasefileCaseTypeComponent,
      ),
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.caseType },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
    loadComponent: () =>
      import('../cases-create-casefile-task-list/cases-create-casefile-task-list.component').then(
        (component) => component.CasesCreateCasefileTaskListComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.taskList },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails,
    loadComponent: () =>
      import('../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details.component').then(
        (component) => component.CasesCreateCasefileRespondentDetailsComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.respondentDetails },
    resolve: {
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual,
    loadComponent: () =>
      import('../cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual.component').then(
        (component) => component.CasesCreateCasefileApplicantIndividualComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard, casesCreateCasefileApplicantIndividualGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantIndividual },
    resolve: {
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation,
    loadComponent: () =>
      import('../cases-create-casefile-applicant-organisation/cases-create-casefile-applicant-organisation.component').then(
        (component) => component.CasesCreateCasefileApplicantOrganisationComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard, casesCreateCasefileApplicantOrganisationGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantOrganisation },
    resolve: {
      title: TitleResolver,
      countries: fetchCasesCreateCasefileCountriesResolver,
    },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails,
    loadComponent: () =>
      import('../cases-create-casefile-central-authority/cases-create-casefile-central-authority.component').then(
        (component) => component.CasesCreateCasefileCentralAuthorityComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.centralAuthorityDetails },
    resolve: {
      title: TitleResolver,
      centralAuthorities: fetchCasesCreateCasefileCentralAuthoritiesResolver,
    },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderDetails,
    loadComponent: () =>
      import('../cases-create-casefile-order-details/cases-create-casefile-order-details.component').then(
        (component) => component.CasesCreateCasefileOrderDetailsComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderDetails },
    resolve: { title: TitleResolver, applications: fetchCasesCreateCasefileApplicationsResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary,
    loadComponent: () =>
      import('../cases-create-casefile-order-terms-summary/cases-create-casefile-order-terms-summary.component').then(
        (component) => component.CasesCreateCasefileOrderTermsSummaryComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderTermsSummary },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect,
    loadComponent: () =>
      import('../cases-create-casefile-order-terms-select/cases-create-casefile-order-terms-select.component').then(
        (component) => component.CasesCreateCasefileOrderTermsSelectComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderTermsSelect },
    resolve: { title: TitleResolver, orderTerms: fetchCasesCreateCasefileOrderTermsResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsInput,
    pathMatch: 'full',
    redirectTo: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSelect,
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsInput + '/:resultId',
    loadComponent: () =>
      import('../cases-create-casefile-order-terms-input/cases-create-casefile-order-terms-input.component').then(
        (component) => component.CasesCreateCasefileOrderTermsInputComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard, casesCreateCasefileOrderTermSelectionGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    providers: [CasesCreateCasefileOrderTermLookupsService],
    resolve: { orderTerm: fetchCasesCreateCasefileOrderTermResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermCreditor,
    loadComponent: () =>
      import('../cases-create-casefile-order-term-creditor/cases-create-casefile-order-term-creditor.component').then(
        (component) => component.CasesCreateCasefileOrderTermCreditorComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard, casesCreateCasefileOrderTermCreditorGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderTermCreditor },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation,
    loadComponent: () =>
      import('../cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation.component').then(
        (component) => component.CasesCreateCasefileInterestIndexationComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.interestAndIndexation },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments,
    loadComponent: () =>
      import('../cases-create-casefile-managing-payments/cases-create-casefile-managing-payments.component').then(
        (component) => component.CasesCreateCasefileManagingPaymentsComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.managingPayments },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.commentsAndNotes,
    loadComponent: () =>
      import('../cases-create-casefile-comments-notes/cases-create-casefile-comments-notes.component').then(
        (component) => component.CasesCreateCasefileCommentsNotesComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.commentsAndNotes },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails,
    loadComponent: () =>
      import('../cases-create-casefile-check-details/cases-create-casefile-check-details.component').then(
        (component) => component.CasesCreateCasefileCheckDetailsComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.checkCaseDetails },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.cancel,
    loadComponent: () =>
      import('../cases-create-casefile-cancel/cases-create-casefile-cancel.component').then(
        (component) => component.CasesCreateCasefileCancelComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.cancel },
    resolve: { title: TitleResolver },
  },
];
