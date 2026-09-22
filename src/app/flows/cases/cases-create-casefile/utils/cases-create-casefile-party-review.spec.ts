import type { ICasesCreateCasefileMinorCreditor } from '../interfaces/cases-create-casefile-minor-creditor.interface';
import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../cases-create-casefile-respondent-details/mocks/cases-create-casefile-respondent-details.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import {
  reviewAddressLines,
  reviewApplicant,
  reviewRespondent,
  reviewMinorCreditor,
} from './cases-create-casefile-party-review';

describe('party review', () => {
  it('preserves address order and omits absent lines without inventing a country', () => {
    const address = CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved.contactDetails.address;
    expect(reviewAddressLines(address, 'Test country')).toEqual([
      '1 Test Street',
      'Test Town',
      'TE1 1ST',
      'Test country',
    ]);
    expect(reviewAddressLines(address, '')).toEqual(['1 Test Street', 'Test Town', 'TE1 1ST']);
  });
  it('includes respondent identity, aliases, date, optional absence and restrictions without mutation', () => {
    const person = structuredClone(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    person.restrictedInformation = { restricted: true, reason: '<script>private</script>' };
    const before = structuredClone(person);
    const section = reviewRespondent(person, []);
    expect(section.rows).toEqual(
      expect.arrayContaining([
        { id: 'aliases', label: 'Aliases', values: ['Alternative Respondent'] },
        { id: 'dateOfBirth', label: 'Date of birth', values: ['31 January 1990'] },
        { id: 'otherEmailAddress', label: 'Other email address', values: ['Not provided'] },
        { id: 'nationalInsuranceNumber', label: 'UK National Insurance number', values: ['AB123456C'] },
        { id: 'restrictionReason', label: 'Reason for restriction', values: ['<script>private</script>'] },
      ]),
    );
    expect(section.warning).toContain('should not be shared');
    expect(person).toEqual(before);
  });
  it('renders third party and employer only when accepted', () => {
    const person = structuredClone(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    person.thirdParty = {
      nameOrOrganisation: 'Test representative',
      relationship: 'Solicitor',
      reference: null,
      address: person.contactDetails.address,
    };
    person.employer = {
      employerName: 'Test employer',
      employeeReference: 'TEST',
      emailAddress: null,
      telephoneNumber: null,
      address: person.contactDetails.address,
    };
    const ids = reviewRespondent(person, []).rows.map((row) => row.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'thirdPartyName',
        'thirdPartyRelationship',
        'thirdPartyReference',
        'thirdPartyAddress',
        'employerName',
        'employeeReference',
        'employerEmail',
        'employerTelephone',
        'employerAddress',
      ]),
    );
    expect(
      reviewRespondent(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved, []).rows.some(
        (row) => row.id === 'employerName',
      ),
    ).toBe(false);
  });
  it('handles absent individual values and inactive restriction reason', () => {
    const applicant = structuredClone(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved);
    applicant.title = null;
    applicant.dateOfBirth = null;
    applicant.aliases = [];
    applicant.restrictedInformation.reason = 'Inactive reason';
    const section = reviewApplicant(applicant, []);
    expect(section.warning).toBeNull();
    expect(section.rows.find((row) => row.id === 'dateOfBirth')?.values).toEqual(['Not provided']);
    expect(section.rows.find((row) => row.id === 'aliases')?.values).toEqual(['Not provided']);
    expect(section.rows.some((row) => row.id === 'restrictionReason')).toBe(false);
    expect(section.bankRows.map((row) => row.id)).toEqual([
      'bankType',
      'nameOnAccount',
      'sortCode',
      'accountNumber',
      'paymentReference',
    ]);
  });
  it('shows organisation identity without individual fields and all accepted non-UK bank fields', () => {
    const section = reviewApplicant(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNonUk, []);
    expect(section.rows.find((row) => row.id === 'organisationName')?.values).toEqual(['Example Organisation']);
    expect(section.rows.some((row) => row.id === 'dateOfBirth')).toBe(false);
    expect(section.bankRows.map((row) => row.id)).toEqual([
      'bankType',
      'nameOnAccount',
      'bicSwiftCode',
      'iban',
      'paymentReference',
      'bankName',
      'branchSortCode',
      'accountNumber',
    ]);
  });
  it('shows explicit no bank selection', () => {
    expect(reviewApplicant(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNone, []).bankRows).toEqual([
      { id: 'bankType', label: 'Type of bank account', values: ['None or not applicable'] },
    ]);
  });
  it('retains applicant third-party details and a visible restriction warning', () => {
    const applicant = structuredClone(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved);
    applicant.restrictedInformation = { restricted: true, reason: 'Test restriction' };
    applicant.thirdParty = {
      nameOrOrganisation: 'Test representative',
      relationship: 'Solicitor',
      reference: 'REF',
      address: applicant.contactDetails.address,
    };
    const section = reviewApplicant(applicant, []);
    expect(section.warning).toBe('Applicant’s personal information should not be shared.');
    expect(section.rows.find((row) => row.id === 'restrictionReason')?.values).toEqual(['Test restriction']);
    expect(section.rows.find((row) => row.id === 'thirdPartyReference')?.values).toEqual(['REF']);
  });
});

describe('minor creditor review', () => {
  it('shows individual identity, country and non-UK bank fallback fields without mutation', () => {
    const creditor: ICasesCreateCasefileMinorCreditor = {
      sequenceNumber: 3,
      displayName: 'Test Creditor',
      details: {
        identity: { type: 'individual', title: null, firstNames: 'Test', lastName: 'Creditor' },
        address: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved.contactDetails.address,
        bank: {
          type: 'non-uk',
          nameOnAccount: 'Test Creditor',
          paymentReference: 'TEST',
          accountNumber: '12345678',
          bicSwiftCode: null,
          iban: null,
          bankName: 'Test bank',
          branchSortCode: 'TEST',
        },
      },
    };
    const before = structuredClone(creditor);
    const section = reviewMinorCreditor(creditor, [
      { country_id: 1, cjs_code: 1, country_name: 'Test country', date_used_from: '2020-01-01', active: true },
    ]);
    expect(section.id).toBe('minor-creditor-3');
    expect(section.rows.find((row) => row.id === 'firstNames')?.values).toEqual(['Test']);
    expect(section.rows.find((row) => row.id === 'address')?.values.at(-1)).toBe('Test country');
    expect(section.bankRows.find((row) => row.id === 'bankName')?.values).toEqual(['Test bank']);
    expect(section.bankRows.find((row) => row.id === 'iban')?.values).toEqual(['Not provided']);
    expect(creditor).toEqual(before);
  });
  it('shows organisation identity and explicit absence of bank details', () => {
    const section = reviewMinorCreditor(
      {
        sequenceNumber: 4,
        displayName: 'Test Organisation',
        details: {
          identity: { type: 'organisation', organisationName: 'Test Organisation' },
          address: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved.contactDetails.address,
          bank: { type: 'none' },
        },
      },
      [],
    );
    expect(section.rows.map((row) => row.id)).toEqual(['organisationName', 'address']);
    expect(section.bankRows[0].values).toEqual(['None or not applicable']);
  });
});
