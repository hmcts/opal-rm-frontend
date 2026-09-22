import type { ICasesCreateCasefileAcceptedOrderTerm } from './cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileCreditorDraft } from './cases-create-casefile-creditor-draft.interface';
import type { ICasesCreateCasefileMinorCreditor } from './cases-create-casefile-minor-creditor.interface';
import type { ICasesCreateCasefileOrderTermAmendment } from './cases-create-casefile-order-term-amendment.interface';

export interface ICasesCreateCasefileMinorCreditorRemoval {
  readonly termId: number;
  readonly expectedTerm: ICasesCreateCasefileAcceptedOrderTerm;
  readonly expectedDraft: ICasesCreateCasefileCreditorDraft;
  readonly expectedAmendment: ICasesCreateCasefileOrderTermAmendment | null;
  readonly expectedCreditor: ICasesCreateCasefileMinorCreditor | null;
}
