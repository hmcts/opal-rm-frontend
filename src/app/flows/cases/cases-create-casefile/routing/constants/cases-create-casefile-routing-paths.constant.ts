import { ICasesCreateCasefileRoutingPaths } from '../interfaces/cases-create-casefile-routing-paths.interface';

export const CASES_CREATE_CASEFILE_ROUTING_PATHS: ICasesCreateCasefileRoutingPaths = {
  root: 'cases/create-casefile',
  children: {
    caseType: 'case-type',
    taskList: 'task-list',
  },
};
