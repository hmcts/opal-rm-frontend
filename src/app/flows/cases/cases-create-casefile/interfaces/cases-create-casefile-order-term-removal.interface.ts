import type { ICasesCreateCasefileAcceptedOrderTerm } from './cases-create-casefile-accepted-order-term.interface';

export interface ICasesCreateCasefileOrderTermRemoval {
  index: number;
  termId: number;
  expectedTerm: ICasesCreateCasefileAcceptedOrderTerm;
  presentationSignature: string;
}
