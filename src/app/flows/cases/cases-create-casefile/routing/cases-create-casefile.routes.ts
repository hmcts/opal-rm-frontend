import { Routes } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_TITLES } from './constants/cases-create-casefile-routing-titles.constant';

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
    data: { title: CASES_CREATE_CASEFILE_ROUTING_TITLES.taskList },
    resolve: { title: TitleResolver },
  },
];
