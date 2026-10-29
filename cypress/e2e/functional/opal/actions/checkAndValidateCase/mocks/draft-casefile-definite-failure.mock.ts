export const DRAFT_CASEFILE_DEFINITE_FAILURE = {
  type: 'about:blank',
  title: 'Submission rejected',
  status: 400,
  detail: 'The case was not submitted. Correct the details and try again.',
  retriable: true,
} as const;
