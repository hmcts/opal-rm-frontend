import type { ReviewRow } from './cases-create-casefile-review-row.interface';

export interface ReviewSection {
  id: string;
  title: string;
  rows: readonly ReviewRow[];
  warning: string | null;
  bankRows: readonly ReviewRow[];
}
