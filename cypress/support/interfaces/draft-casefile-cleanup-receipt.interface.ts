export interface IDraftCasefileCleanupReceipt {
  id: number;
  testRunReference: string;
  cleanupPolicy?: 'required' | 'deferred';
  cleanupActor?: string;
}
