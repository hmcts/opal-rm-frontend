import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileMinorCreditor } from '../interfaces/cases-create-casefile-minor-creditor.interface';

export function associatedMinorCreditors(
  terms: readonly ICasesCreateCasefileAcceptedOrderTerm[],
  creditors: readonly ICasesCreateCasefileMinorCreditor[],
): ICasesCreateCasefileMinorCreditor[] {
  const referenced = new Set(
    terms.flatMap((term) => (term.creditor?.type === 'minor' ? [term.creditor.sequenceNumber] : [])),
  );
  return creditors.filter((creditor) => referenced.has(creditor.sequenceNumber));
}
