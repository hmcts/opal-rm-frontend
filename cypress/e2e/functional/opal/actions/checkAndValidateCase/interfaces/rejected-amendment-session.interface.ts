import type {
  IRejectedCasefileContext,
  IRejectedCasefileActor,
  RejectedAmendmentKind,
} from './rejected-casefile-context.interface';
import type { IDraftCasefileMonitor } from './draft-casefile-monitor.interface';
import type { IDraftCasefileSnapshot } from './draft-casefile-snapshot.interface';

/** Evidence shared only by one rejected amendment Flow and its page/network Actions. */
export interface IRejectedAmendmentSession {
  context?: IRejectedCasefileContext;
  foreign?: IRejectedCasefileActor;
  kind: RejectedAmendmentKind;
  monitor?: IDraftCasefileMonitor;
  receipt?: IDraftCasefileSnapshot;
  saved?: IDraftCasefileSnapshot;
  keyboard: boolean;
  collections: { query: Record<string, unknown>; statusCode: number; body: unknown }[];
  writes: { method: string; body: unknown; version: unknown }[];
  observation: number;
}
