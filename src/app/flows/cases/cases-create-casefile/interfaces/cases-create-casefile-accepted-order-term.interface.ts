import type { CasesCreateCasefileCreditorAssignment } from '../types/cases-create-casefile-creditor-assignment.type';
import type { ICasesCreateCasefileOrderTerm } from './cases-create-casefile-order-term.interface';

export interface ICasesCreateCasefileAcceptedOrderTerm extends ICasesCreateCasefileOrderTerm {
  termId: number;
  creditor: CasesCreateCasefileCreditorAssignment | null;
}
