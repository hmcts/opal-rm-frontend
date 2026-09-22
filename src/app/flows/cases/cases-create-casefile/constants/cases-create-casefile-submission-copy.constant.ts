/** Provisional local-mock copy; production content and recovery remain unconfirmed. */
export const CASES_CREATE_CASEFILE_SUBMISSION_COPY = {
  notice: 'Local mock: no case will be saved or submitted for review.',
  unavailable: 'Submission is unavailable while the maintenance service integration is being completed.',
  progress: 'Simulating submission. Please wait.',
  rejected: 'The mock submission failed. Your case details have been kept. You can try again.',
  unknown:
    'The mock submission outcome could not be confirmed. Your details have been kept. Return to case details to inspect them; start a new local mock journey to try again.',
  title: 'Mock submission problem',
} as const;
