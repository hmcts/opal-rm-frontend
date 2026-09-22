import type { ICasesCreateCasefileOrderTermsSummaryRow } from '../cases-create-casefile-order-terms-summary/interfaces/cases-create-casefile-order-terms-summary-row.interface';

export interface ICasesCreateCasefileOrderTermCard {
  termId: number;
  title: string;
  rows: ICasesCreateCasefileOrderTermsSummaryRow[];
  bankRows: ICasesCreateCasefileOrderTermsSummaryRow[];
}
