import { DateTime } from 'luxon';
import type { IOpalMaintenanceCountryReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_OPTIONS } from '../cases-create-casefile-interest-indexation/constants/cases-create-casefile-interest-indexation-options.constant';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_OPTIONS } from '../cases-create-casefile-managing-payments/constants/cases-create-casefile-managing-payments-options.constant';
import type { CasesCreateCasefileAcceptedSnapshot } from '../types/cases-create-casefile-accepted-snapshot.type';
import type { ReviewSection } from '../interfaces/cases-create-casefile-review-section.interface';
import type { ReviewRow } from '../interfaces/cases-create-casefile-review-row.interface';

const row = (id: string, label: string, value: string | null): ReviewRow => ({
  id,
  label,
  values: [value ?? 'Not provided'],
});
const date = (value: string | null): string | null =>
  value ? DateTime.fromISO(value).setLocale('en-GB').toFormat('d LLLL yyyy') : null;
const section = (id: string, title: string, rows: ReviewRow[]): ReviewSection => ({
  id,
  title,
  rows,
  bankRows: [],
  warning: null,
});

export function reviewCaseSections(
  snapshot: CasesCreateCasefileAcceptedSnapshot,
  _countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
  applications: readonly IOpalMaintenanceApplicationReferenceDataItem[],
): readonly ReviewSection[] {
  const sections: ReviewSection[] = [];
  const selection = snapshot.caseTypeSelection;
  if (selection)
    sections.push(
      section('caseType', 'Case type', [
        row('caseType', 'Case type', selection.caseType),
        ...('applicantType' in selection ? [row('applicantType', 'Applicant type', selection.applicantType)] : []),
      ]),
    );
  const central = snapshot.centralAuthorityDetails;
  if (central)
    sections.push(
      section('centralAuthority', 'Central authority details', [
        row('remoReference', 'REMO reference', central.remoReference),
        row('centralAuthorityReference', 'Central authority’s reference', central.centralAuthorityReference),
        row('centralAuthorityName', 'Central authority name', central.majorCreditor?.name ?? null),
      ]),
    );
  const order = snapshot.orderDetails;
  if (order) {
    const application = applications.find((item) => item.application_id === order.applicationId);
    sections.push(
      section('orderDetails', 'Order details', [
        row(
          'application',
          'Application code',
          application ? `${application.application_code} ${application.application_title}` : '',
        ),
        row('court', 'Court that made the order', order.court),
        row('dateOrderMade', 'Date order made', date(order.dateOrderMade)),
        row('paymentFrequency', 'Payment frequency', order.paymentFrequency),
        row('dateArrearsLastUpdated', 'Date arrears last updated', date(order.dateArrearsLastUpdated)),
      ]),
    );
  }
  const interest = snapshot.interestAndIndexation;
  if (interest)
    sections.push(
      section('interestAndIndexation', 'Interest and indexation', [
        row('interest', 'Interest', interest.interestApplies ? 'Yes' : 'No'),
        row(
          'indexation',
          'Indexation',
          CASES_CREATE_CASEFILE_INTEREST_INDEXATION_OPTIONS.indexation.find(
            (item) => item.value === interest.indexationType,
          )?.label ?? '',
        ),
      ]),
    );
  if (snapshot.paymentArrangement)
    sections.push(
      section('managingPayments', 'Managing payments', [
        row(
          'paymentArrangement',
          'Payment arrangement',
          CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_OPTIONS.find((item) => item.value === snapshot.paymentArrangement)
            ?.label ?? '',
        ),
      ]),
    );
  const notes = snapshot.commentsAndNotes;
  if (notes)
    sections.push(
      section('commentsAndNotes', 'Comments and notes', [
        row('comment', 'Comment', notes.comment),
        row('note', 'Notes', notes.note),
      ]),
    );
  return sections;
}
