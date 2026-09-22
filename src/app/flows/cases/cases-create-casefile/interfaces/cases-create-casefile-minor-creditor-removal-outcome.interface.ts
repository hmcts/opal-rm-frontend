import type { ICasesCreateCasefileAcceptedOrderTerm } from './cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileOrderTermAmendment } from './cases-create-casefile-order-term-amendment.interface';

export interface ICasesCreateCasefileMinorCreditorRemovalOutcome {
  readonly termId: number;
  readonly expectedTerm: ICasesCreateCasefileAcceptedOrderTerm;
  readonly expectedAmendment: ICasesCreateCasefileOrderTermAmendment | null;
}
