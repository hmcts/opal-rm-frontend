import { ICasesCreateCasefileRoutingPaths } from '../interfaces/cases-create-casefile-routing-paths.interface';

export const CASES_CREATE_CASEFILE_ROUTING_PATHS: ICasesCreateCasefileRoutingPaths = {
  root: 'cases/create-casefile',
  children: {
    caseType: 'case-type',
    taskList: 'task-list',
    respondentDetails: 'respondent-details',
    applicantIndividual: 'applicant-details/individual',
    applicantOrganisation: 'applicant-details/organisation',
    centralAuthorityDetails: 'central-authority-details',
    orderDetails: 'order-details',
    orderTermsSummary: 'order-terms/summary',
    orderTermsSelect: 'order-terms/select',
    orderTermsInput: 'order-terms/add',
    orderTermsRemove: 'order-terms/remove',
    orderTermCreditor: 'order-terms/creditor',
    minorCreditorDetails: 'order-terms/creditor/minor-creditor-details',
    minorCreditorSummary: 'order-terms/creditor/minor-creditor-summary',
    minorCreditorRemove: 'order-terms/creditor/minor-creditor-remove',
    interestAndIndexation: 'interest-and-indexation',
    managingPayments: 'managing-payments',
    commentsAndNotes: 'comments-and-notes',
    checkCaseDetails: 'check-case-details',
    cancel: 'cancel',
  },
};
