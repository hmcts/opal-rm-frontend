export const CASES_DRAFT_DELETION_COPY = {
  unresolved:
    'We could not confirm whether this case was deleted. Check its latest status before taking further action.',
  awaitingReview:
    'At the last check, this case was awaiting review. We could not confirm the earlier deletion request.',
  otherStatus: 'At the last check, this case had status: {caseStatusLabel}. Return to Review cases to continue.',
  navigationFailed: 'This case has been deleted, but we could not open Review cases. Try returning to the list again.',
} as const;
