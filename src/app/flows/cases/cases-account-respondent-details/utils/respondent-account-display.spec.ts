import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import { accountDate, applicantRows, headerRows, respondentRows } from './respondent-account-display';

describe('Respondent account display', () => {
  it('uses supplied age including zero and preserves a leap-day date', () => {
    const rows = respondentRows({
      ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
      respondent: { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent, dateOfBirth: '2000-02-29', age: 0 },
    });
    expect(rows).toContainEqual({ label: 'Date of birth', value: '29 February 2000' });
    expect(rows).toContainEqual({ label: 'Age', value: '0' });
  });

  it('keeps optional rows when account data is absent', () => {
    const rows = respondentRows({
      ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
      respondent: {
        ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent,
        dateOfBirth: null,
        age: undefined,
        address: null,
        mainEmail: null,
      },
    });
    expect(rows.filter((row) => row.value === null).map((row) => row.label)).toEqual([
      'Date of birth',
      'Age',
      'Address',
      'Main email address',
    ]);
    expect(applicantRows({ ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, applicant: null }).map((row) => row.value)).toEqual([
      null,
      null,
    ]);
  });

  it('displays an organisation and retains a stored zero amount', () => {
    expect(
      applicantRows({
        ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
        applicant: { kind: 'organisation', accountId: 71, organisationName: 'Example Authority' },
      }),
    ).toContainEqual({ label: 'Name', value: 'Example Authority' });
    expect(headerRows({ ...RESPONDENT_ACCOUNT_HEADER_MOCK, arrears: 0, caseType: null })).toEqual(
      expect.arrayContaining([
        { label: 'Arrears', value: '£0.00' },
        { label: 'Case type', value: 'Unknown' },
      ]),
    );
  });

  it.each(['REMO In', 'REMO Out', 'REMO Out (CMS)'] as const)('displays the stored case type %s', (caseType) => {
    expect(headerRows({ ...RESPONDENT_ACCOUNT_HEADER_MOCK, caseType })).toContainEqual({
      label: 'Case type',
      value: caseType,
    });
  });

  it('preserves the account date without a time or timezone', () => {
    expect(accountDate('2026-10-12')).toBe('12 October 2026');
  });

  it('displays a timestamp around midnight in the local timezone', () => {
    const timestamp = '2026-10-12T00:30:00Z';
    const localDay = new Date(timestamp).getDate();
    expect(accountDate(timestamp)).toBe(`${String(localDay).padStart(2, '0')} October 2026`);
  });

  it('formats names, address lines and contact details as supplied', () => {
    expect(respondentRows(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK)).toEqual(
      expect.arrayContaining([
        { label: 'Name', value: 'Ms Alex TEST' },
        { label: 'Address', value: '1 Example Road\nExample Town\nAB1 2CD\nUnited Kingdom' },
        { label: 'Main email address', value: 'respondent@example.test' },
      ]),
    );
    expect(applicantRows(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK)).toEqual([
      { label: 'Name', value: 'Mr Sam EXAMPLE' },
      { label: 'Applicant account number', value: 'RA0011748' },
    ]);
  });

  it.each([
    {
      description: 'leaves a whitespace-only address empty',
      address: { lines: [' ', '\t'], postcode: '\n', country: '  ' },
      expected: null,
    },
    {
      description: 'preserves nonblank address text and removes blank lines',
      address: {
        lines: ['  1 Example Road ', '\t', 'Example Town  '],
        postcode: ' AB1 2CD ',
        country: 'United Kingdom',
      },
      expected: '  1 Example Road \nExample Town  \n AB1 2CD \nUnited Kingdom',
    },
  ])('$description', ({ address, expected }) => {
    expect(
      respondentRows({
        ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
        respondent: { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent, address },
      }),
    ).toContainEqual({ label: 'Address', value: expected });
  });

  it('omits an age when the date of birth is missing', () => {
    expect(
      respondentRows({
        ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
        respondent: { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent, dateOfBirth: null },
      }),
    ).toContainEqual({ label: 'Age', value: null });
  });

  it('omits an age the service does not supply', () => {
    expect(
      respondentRows({
        ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
        respondent: { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent, age: undefined },
      }),
    ).toContainEqual({ label: 'Age', value: null });
  });
});
