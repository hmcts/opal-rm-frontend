export type CasesCreateCasefileReviewReturnContext =
  | {
      origin: 'review';
      section:
        | 'respondent'
        | 'applicant'
        | 'centralAuthority'
        | 'orderDetails'
        | 'interestAndIndexation'
        | 'managingPayments'
        | 'commentsAndNotes';
    }
  | { origin: 'review'; section: 'orderTerm'; termId: number }
  | { origin: 'review'; section: 'minorCreditor'; termId: number; sequenceNumber: number };
