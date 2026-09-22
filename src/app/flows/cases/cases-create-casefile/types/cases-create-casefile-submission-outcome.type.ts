/** Frontend simulation outcomes, not an API response contract. */
export type CasesCreateCasefileSubmissionOutcome =
  { status: 'success'; receipt: string } | { status: 'definiteFailure' } | { status: 'outcomeUnknown' };
