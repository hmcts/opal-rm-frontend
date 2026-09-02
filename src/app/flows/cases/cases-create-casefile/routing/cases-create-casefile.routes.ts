import { Routes } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_TITLES } from './constants/cases-create-casefile-routing-titles.constant';
import { casesCreateCasefileFlowStateGuard } from './guards/cases-create-casefile-flow-state.guard';

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
    canDeactivate: [canDeactivateGuard],
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
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.respondentDetails },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual,
    loadComponent: () =>
      import('../cases-create-casefile-applicant-individual/cases-create-casefile-applicant-individual.component').then(
        (component) => component.CasesCreateCasefileApplicantIndividualComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantIndividual },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation,
    loadComponent: () =>
      import('../cases-create-casefile-applicant-organisation/cases-create-casefile-applicant-organisation.component').then(
        (component) => component.CasesCreateCasefileApplicantOrganisationComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.applicantOrganisation },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails,
    loadComponent: () =>
      import('../cases-create-casefile-central-authority/cases-create-casefile-central-authority.component').then(
        (component) => component.CasesCreateCasefileCentralAuthorityComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.centralAuthorityDetails },
    resolve: { title: TitleResolver },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderDetails,
    loadComponent: () =>
      import('../cases-create-casefile-order-details/cases-create-casefile-order-details.component').then(
        (component) => component.CasesCreateCasefileOrderDetailsComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.orderDetails },
    resolve: { title: TitleResolver },
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
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation,
    loadComponent: () =>
      import('../cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation.component').then(
        (component) => component.CasesCreateCasefileInterestIndexationComponent,
      ),
    canActivate: [casesCreateCasefileFlowStateGuard],
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
