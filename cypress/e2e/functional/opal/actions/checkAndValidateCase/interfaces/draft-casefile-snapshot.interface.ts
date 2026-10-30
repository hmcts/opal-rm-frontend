import type { IDraftCasefileDetail } from './draft-casefile-detail.interface';

export interface IDraftCasefileSnapshot {
  draft: IDraftCasefileDetail;
  etag: string;
}
