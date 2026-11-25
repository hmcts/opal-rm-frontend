import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
  RespondentAccountName,
} from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';

export interface AccountDisplayRow {
  label: string;
  value: string | null;
}

export function accountDisplayName(name: RespondentAccountName): string {
  return [name.title, name.forenames, name.surname.toLocaleUpperCase('en-GB')].filter(Boolean).join(' ');
}

const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const dateParts = { day: '2-digit', month: 'long', year: 'numeric' } as const;
const calendarDate = new Intl.DateTimeFormat('en-GB', { ...dateParts, timeZone: 'UTC' });
const localDate = new Intl.DateTimeFormat('en-GB', dateParts);

export function accountDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? calendarDate.format(new Date(value + 'T00:00:00Z'))
    : localDate.format(new Date(value));
}

export function headerRows(header: RespondentAccountHeaderSummary): AccountDisplayRow[] {
  return [
    { label: 'Arrears', value: currency.format(header.arrears) },
    { label: 'Balance', value: currency.format(header.balance) },
    { label: 'Date arrears updated', value: accountDate(header.arrearsUpdatedDate) },
    { label: 'Case type', value: header.caseType ?? 'Unknown' },
  ];
}

export function respondentRows(summary: RespondentAccountAtAGlance): AccountDisplayRow[] {
  const { name, dateOfBirth, age, address, mainEmail } = summary.respondent;
  const addressText = address
    ? [...address.lines, address.postcode, address.country].filter((line) => line?.trim()).join('\n')
    : null;
  return [
    { label: 'Name', value: accountDisplayName(name) },
    { label: 'Date of birth', value: accountDate(dateOfBirth) },
    { label: 'Age', value: dateOfBirth && age !== undefined ? String(age) : null },
    { label: 'Address', value: addressText || null },
    { label: 'Main email address', value: mainEmail?.trim() || null },
  ];
}

export function applicantRows(summary: RespondentAccountAtAGlance): AccountDisplayRow[] {
  const applicant = summary.applicant;
  const name = applicant?.kind === 'individual' ? accountDisplayName(applicant.name) : applicant?.organisationName;
  return [
    { label: 'Applicant account', value: applicant?.accountNumber?.trim() || null },
    { label: 'Applicant name', value: name ?? null },
  ];
}
