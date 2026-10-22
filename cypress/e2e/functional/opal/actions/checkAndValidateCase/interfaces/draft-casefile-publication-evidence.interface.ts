/** Consumer-side evidence shape; the HTTP mapping must match the delivered test-support contract. */
export interface IDraftCasefilePublicationEvidence {
  draft_casefile_id: number;
  test_run_reference: string;
  accepted_publication_requests: number;
  recording_started_before_approval: boolean;
  complete: boolean;
}
