export type CasesCreateCasefileCreditorAssignment =
  { type: 'applicant' } | { type: 'major'; majorCreditorId: number } | { type: 'minor'; sequenceNumber: number };
