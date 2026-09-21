export type CasesCreateCasefileCreditorAssignment =
  | { type: 'applicant' }
  | { type: 'major'; majorCreditorId: number; displayName: string }
  | { type: 'minor'; sequenceNumber: number };
