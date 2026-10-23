/** Safe fields retained from the Maintenance publisher observation journal. */
export interface IDraftCasefilePublicationEvidence {
  observation_id: string;
  registered_at: string;
  send_attempt_count: number;
  acknowledged_send_count: number;
  uncertain_send_count: number;
  unfinished_send_count: number;
  evidence_complete: boolean;
}
