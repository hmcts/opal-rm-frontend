export const DELETE_CASEFILE_EXPECTED_COPY = {
  required: 'Enter reason',
  maxlength: 'Reason must be 250 characters or fewer',
  awaitingReview:
    'At the last check, this case was awaiting review. We could not confirm the earlier deletion request.',
} as const;
