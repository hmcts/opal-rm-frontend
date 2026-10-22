export interface IDraftCasefileMonitor {
  attempts: number;
  upstreamSuccesses: number;
  droppedResponses: number;
  interceptedFailures: number;
  requestVersions: (string | undefined)[];
  lastStatus?: number;
  upstreamEtag?: string;
}
