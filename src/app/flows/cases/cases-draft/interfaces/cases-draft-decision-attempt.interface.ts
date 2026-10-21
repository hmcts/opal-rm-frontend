import type { ICasesDraftCasefileResolved } from './cases-draft-casefile-resolved.interface';
import type { ICasesDraftNavigation } from './cases-draft-navigation.interface';

/** Tracks one checker PATCH so late responses cannot affect another review entry or user scope. */
export interface ICasesDraftDecisionAttempt extends Pick<ICasesDraftCasefileResolved, 'draft' | 'etag' | 'identity'> {
  result: ICasesDraftCasefileResolved;
  entry: number;
  revision: number;
  selection: ICasesDraftNavigation;
  invalidated: boolean;
}
