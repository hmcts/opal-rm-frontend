import {
  creditorBankRows,
  orderTermRows,
} from '../cases-create-casefile-order-terms-summary/utils/cases-create-casefile-order-terms-summary-rows';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileOrderTermCard } from '../interfaces/cases-create-casefile-order-term-card.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefileCreditorAssignment } from '../types/cases-create-casefile-creditor-assignment.type';

type OrderTermCardContext = Pick<ICasesCreateCasefileState, 'applicantDetails' | 'minorCreditors' | 'orderDetails'>;

function applicantName(details: CasesCreateCasefileApplicantDetails | null): string {
  if (!details) return '';
  if ('organisationName' in details) return details.organisationName;
  return [details.title, details.firstNames, details.lastName].filter(Boolean).join(' ');
}

function assignedCreditorName(
  assignment: CasesCreateCasefileCreditorAssignment | null,
  applicant: string,
  minorName: string | undefined,
): string | undefined {
  if (assignment?.type === 'applicant') return applicant;
  if (assignment?.type === 'major') return assignment.displayName;
  return minorName;
}

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
  const creditorName = assignedCreditorName(assignment, applicantName(applicant), minor?.displayName);
  const bank = assignment?.type === 'applicant' ? (applicant?.bankDetails ?? null) : (minor?.details.bank ?? null);
  const rows = orderTermRows(term, context.orderDetails?.paymentFrequency ?? '');
  if (creditorName) rows.push({ id: 'assigned-creditor', label: 'Creditor', value: creditorName });
  return { termId: term.termId, title: term.presentation.title, rows, bankRows: creditorBankRows(bank) };
}
