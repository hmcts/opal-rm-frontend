import type { ICasesCreateCasefileAcceptedOrderTerm } from './cases-create-casefile-accepted-order-term.interface';

export interface ICasesCreateCasefileOrderTermAmendment {
  termId: number;
  term: ICasesCreateCasefileAcceptedOrderTerm;
  inputComplete: boolean;
  ready: boolean;
}
