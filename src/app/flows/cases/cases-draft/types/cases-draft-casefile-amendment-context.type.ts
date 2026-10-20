import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';

export type CasesDraftCasefileAmendmentContext = Pick<ICasesDraftCasefileResolved, 'draft' | 'etag' | 'identity'>;
