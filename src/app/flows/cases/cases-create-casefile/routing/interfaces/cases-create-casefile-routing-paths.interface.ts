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
    orderTermsSelect: string;
    orderTermsInput: string;
    orderTermCreditor: string;
    minorCreditorDetails: string;
    minorCreditorSummary: string;
    interestAndIndexation: string;
    managingPayments: string;
    commentsAndNotes: string;
    checkCaseDetails: string;
    cancel: string;
  };
}
