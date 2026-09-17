import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';

export interface ICasesCreateCasefileOrderTermDraftChange {
  values: Record<string, CasesCreateCasefileOrderTermRawValue>;
  dirty: boolean;
  /** Draft-only confirmation, keyed by parameter name; never part of canonical submission. */
  confirmedAutocomplete?: Record<string, boolean>;
}
