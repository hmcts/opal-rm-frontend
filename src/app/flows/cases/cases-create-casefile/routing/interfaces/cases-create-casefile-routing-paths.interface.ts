export interface ICasesCreateCasefileRoutingPaths {
  root: string;
  children: {
    caseType: string;
    taskList: string;
    respondentDetails: string;
    applicantIndividual: string;
    applicantOrganisation: string;
    centralAuthorityDetails: string;
    orderDetails: string;
    orderTermsSummary: string;
    interestAndIndexation: string;
    managingPayments: string;
    commentsAndNotes: string;
    checkCaseDetails: string;
    cancel: string;
  };
}
