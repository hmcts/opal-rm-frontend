import {
  creditorBankRows,
  orderTermRows,
} from '../cases-create-casefile-order-terms-summary/utils/cases-create-casefile-order-terms-summary-rows';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileOrderTermCard } from '../interfaces/cases-create-casefile-order-term-card.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';

type OrderTermCardContext = Pick<ICasesCreateCasefileState, 'applicantDetails' | 'minorCreditors' | 'orderDetails'>;

export function buildOrderTermCard(
  term: ICasesCreateCasefileAcceptedOrderTerm,
  context: OrderTermCardContext,
): ICasesCreateCasefileOrderTermCard {
  const applicant = context.applicantDetails;
  const assignment = term.creditor;
  const minor =
    assignment?.type === 'minor'
      ? context.minorCreditors.find((item) => item.sequenceNumber === assignment.sequenceNumber)
      : undefined;
  const applicantName =
    applicant === null
      ? ''
      : 'organisationName' in applicant
        ? applicant.organisationName
        : [applicant.title, applicant.firstNames, applicant.lastName].filter(Boolean).join(' ');
  const creditorName =
    assignment?.type === 'applicant'
      ? applicantName
      : assignment?.type === 'major'
        ? assignment.displayName
        : minor?.displayName;
  const bank = assignment?.type === 'applicant' ? (applicant?.bankDetails ?? null) : (minor?.details.bank ?? null);
  const rows = orderTermRows(term, context.orderDetails?.paymentFrequency ?? '');
  if (creditorName) rows.push({ id: 'assigned-creditor', label: 'Creditor', value: creditorName });
  return { termId: term.termId, title: term.presentation.title, rows, bankRows: creditorBankRows(bank) };
}
