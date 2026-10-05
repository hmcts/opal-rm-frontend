import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftSortDirection } from '../types/cases-draft-sort-direction.type';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function compareSequence(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const compared = collator.compare(left[index], right[index]);
    if (compared) return compared;
  }
  return left.length - right.length;
}

function missing(value: string | readonly string[] | null): boolean {
  return value === null || value.length === 0;
}

export function sortCasesDraftRows(
  rows: readonly ICasesDraftRow[],
  column: CasesDraftSortColumn,
  direction: CasesDraftSortDirection,
): ICasesDraftRow[] {
  const multiplier = direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = left[column];
    const b = right[column];
    if (missing(a) !== missing(b)) return missing(a) ? 1 : -1;
    if (missing(a) && missing(b)) return left.id - right.id;
    let compared: number;
    if (column === 'minorCreditorAccounts')
      compared = compareSequence(left.minorCreditorAccounts, right.minorCreditorAccounts);
    else if (column === 'created' || column === 'statusDate' || column === 'approved')
      compared = Date.parse(String(a)) - Date.parse(String(b));
    else compared = collator.compare(String(a), String(b));
    return compared * multiplier || left.id - right.id;
  });
}
