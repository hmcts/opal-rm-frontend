import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefilePayloadService } from './cases-create-casefile-payload.service';

const service = new CasesCreateCasefilePayloadService();

const references = {
  countries: [1, 2, 3, 4, 5, 826].map((id) => ({ country_id: id, cjs_code: id + 100, active: true })),
  applications: [{ application_id: 901, application_code: 'TEST', active: true }],
  majorCreditors: [],
};
function state() {
  const value = createCasesCreateCasefileReviewState();
  value.orderDetails!.dateOrderMade = '2026-09-01';
  value.respondentDetails!.contactDetails.address.countryId = 1;
  value.applicantDetails!.contactDetails.address.countryId = 2;
  value.respondentDetails!.employer = null;
  value.respondentDetails!.thirdParty = null;
  if ('thirdParty' in value.applicantDetails!) value.applicantDetails.thirdParty = null;
  return value;
}

describe('CasesCreateCasefilePayloadService', () => {
  it('maps accepted case values into a typed allowlist without mutating state', () => {
    const snapshot = state();
    const before = structuredClone(snapshot);
    const payload = service.buildAddCasefilePayload(snapshot, references, 44);
    expect(payload.business_unit_id).toBe(44);
    expect(payload.casefile_type).toBe('REMO In');
    expect(payload.casefile.respondent_account.order_details).toEqual({
      date_ordered: '2026-09-01',
      date_arrears_last_updated: '2026-09-15',
      interest_flag: false,
      indexation: 'None',
      payment_arrangement: 'Court',
      payment_period: 'Monthly',
      order_terms: [
        {
          result_id: 'TEST01',
          creditor_type: 'Applicant',
          result_responses: [{ parameter_name: 'amount', response: '100.00' }],
        },
      ],
    });
    expect(payload.casefile.respondent_account.respondent.party_details.address.cjs_code).toBe(101);
    expect(payload.casefile.applicant.party_details.address.cjs_code).toBe(102);
    expect(JSON.stringify(payload)).not.toMatch(/taskStatuses|termId|presentation|countryId|applicationId/);
    expect(snapshot).toEqual(before);
  });
  it('rejects missing reference data instead of sending UI IDs', () => {
    expect(() => service.buildAddCasefilePayload(state(), { ...references, countries: [] }, 44)).toThrow();
    expect(() => service.buildAddCasefilePayload(state(), { ...references, applications: [] }, 44)).toThrow();
  });
  it('rejects incomplete accepted state', () => {
    const snapshot = state();
    snapshot.orderDetails!.dateOrderMade = null;
    expect(() => service.buildAddCasefilePayload(snapshot, references, 44)).toThrow();
  });
  it('joins checkbox selections, omits empty selections, converts scalars and supplies inherited Frequency', () => {
    const snapshot = state();
    const term = snapshot.orderTerms[0];
    term.parameters = {
      selected: ['Option 1', 'Option 2', 'Option 3'],
      single: ['Option 1'],
      empty: [],
      count: 0,
      enabled: false,
      omitted: '',
    };
    term.presentation.fields = [
      { name: 'selected', label: '', kind: 'checkbox', options: [] },
      { name: 'single', label: '', kind: 'checkbox', options: [] },
      { name: 'empty', label: '', kind: 'checkbox', options: [] },
      { name: 'count', label: '', kind: 'integer', options: [] },
      { name: 'enabled', label: '', kind: 'checkbox', options: [] },
      { name: 'omitted', label: '', kind: 'text', options: [] },
      { name: 'Frequency', label: '', kind: 'readonly', options: [] },
    ];
    const responses = service.buildAddCasefilePayload(snapshot, references, 44).casefile.respondent_account
      .order_details.order_terms[0].result_responses;
    expect(responses).toEqual([
      { parameter_name: 'selected', response: 'Option 1,Option 2,Option 3' },
      { parameter_name: 'single', response: 'Option 1' },
      { parameter_name: 'count', response: '0' },
      { parameter_name: 'enabled', response: 'false' },
      { parameter_name: 'Frequency', response: 'Monthly' },
    ]);
  });
  it('maps individual aliases, restrictions, employer and third-party addresses exactly', () => {
    const snapshot = state();
    const person = snapshot.respondentDetails!;
    person.restrictedInformation = { restricted: true, reason: 'Synthetic restriction' };
    person.employer = {
      employerName: 'Test Employer',
      employeeReference: 'EMP1',
      emailAddress: 'employer@example.com',
      telephoneNumber: '01234',
      address: { ...person.contactDetails.address, countryId: 3 },
    };
    person.thirdParty = {
      nameOrOrganisation: 'Test Representative',
      relationship: 'Representative',
      reference: 'TH1',
      address: { ...person.contactDetails.address, countryId: 4 },
    };
    const applicant = snapshot.applicantDetails!;
    if ('thirdParty' in applicant) applicant.thirdParty = structuredClone(person.thirdParty);
    const result = service.buildAddCasefilePayload(snapshot, references, 44).casefile;
    expect(result.respondent_account.respondent.party_details).toEqual({
      organisation: false,
      individual_details: {
        title: 'Mr',
        forenames: 'Test',
        surname: 'Respondent',
        date_of_birth: '1990-01-31',
        national_insurance_number: 'AB123456C',
        other_personal_information: 'Test respondent details',
        restrict_personal_information: true,
        restriction_reason: 'Synthetic restriction',
      },
      address: { address_line_1: '1 Test Street', address_line_2: 'Test Town', postcode: 'TE1 1ST', cjs_code: 101 },
      contact_details: { primary_email_address: 'respondent@example.com', main_telephone_number: '020 7946 0000' },
      aliases: [{ sequence_number: 1, forenames: 'Alternative', surname: 'Respondent' }],
    });
    expect(result.respondent_account.respondent.debtor_details).toEqual({
      employer_name: 'Test Employer',
      employee_reference: 'EMP1',
      employer_email_address: 'employer@example.com',
      employer_telephone_number: '01234',
      employer_address: {
        address_line_1: '1 Test Street',
        address_line_2: 'Test Town',
        postcode: 'TE1 1ST',
        cjs_code: 103,
      },
    });
    expect(result.applicant.third_party_details).toEqual(result.respondent_account.respondent.third_party_details);
    expect(result.applicant.third_party_details?.address.cjs_code).toBe(104);
    expect(result.applicant.bank_account_details).toEqual({
      bank_account_type: 'UK Bank',
      uk_bank_details: {
        account_name: 'Test Applicant',
        sort_code: '123456',
        account_number: '12345678',
        payment_reference: 'PAY-123',
      },
    });
  });
  it('maps organisation, non-UK bank and none branches and preserves minor creditor sequences', () => {
    const snapshot = state();
    snapshot.caseTypeSelection = { caseType: 'REMO Out (CMS)' };
    snapshot.applicantDetails = {
      organisationName: 'Test Authority',
      foreignAuthorityReference: 'FA123',
      contactDetails: { ...snapshot.applicantDetails!.contactDetails, mainEmailAddress: '', mainTelephoneNumber: null },
      bankDetails: {
        type: 'non-uk',
        nameOnAccount: 'Test Authority',
        paymentReference: 'PAY1',
        accountNumber: '123',
        bicSwiftCode: 'TESTGB12',
        iban: 'TEST123',
        bankName: 'Test Bank',
        branchSortCode: '12345',
      },
    };
    snapshot.minorCreditors = [
      {
        sequenceNumber: 7,
        displayName: 'UI label',
        details: {
          identity: { type: 'organisation', organisationName: 'Test Creditor' },
          address: snapshot.applicantDetails.contactDetails.address,
          bank: { type: 'none' },
        },
      },
      {
        sequenceNumber: 12,
        displayName: 'UI label',
        details: {
          identity: { type: 'individual', title: null, firstNames: 'Test', lastName: 'Creditor' },
          address: snapshot.applicantDetails.contactDetails.address,
          bank: { type: 'none' },
        },
      },
    ];
    snapshot.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 12 };
    snapshot.interestAndIndexation = { interestApplies: true, indexationType: 'OTHER' };
    snapshot.paymentArrangement = 'direct';
    snapshot.commentsAndNotes = { comment: 'Synthetic comment', note: 'Synthetic note' };
    const result = service.buildAddCasefilePayload(snapshot, references, 44);
    expect(result.casefile.applicant).toEqual({
      party_details: {
        organisation: true,
        organisation_details: { organisation_name: 'Test Authority', foreign_authority_reference: 'FA123' },
        address: { address_line_1: '1 Test Street', address_line_2: 'Test Town', postcode: 'TE1 1ST', cjs_code: 102 },
      },
      bank_account_details: {
        bank_account_type: 'Non-UK Bank',
        non_uk_bank_details: {
          account_name: 'Test Authority',
          payment_reference: 'PAY1',
          account_number: '123',
          bic_or_swift_code: 'TESTGB12',
          iban: 'TEST123',
          bank_name: 'Test Bank',
          branch_code_or_sort_code: '12345',
        },
      },
    });
    expect(result.casefile.minor_creditors?.map((item) => item.creditor_sequence)).toEqual([7, 12]);
    expect(result.casefile.minor_creditors?.[1].party_details.individual_details).toEqual({
      forenames: 'Test',
      surname: 'Creditor',
    });
    expect(result.casefile.minor_creditors?.[0].bank_account_details).toEqual({
      bank_account_type: 'None or not applicable',
    });
    expect(result.casefile.respondent_account).toMatchObject({
      account_comment: 'Synthetic comment',
      notes: { note_text: 'Synthetic note' },
      order_details: {
        indexation: 'Other',
        payment_arrangement: 'Direct',
        order_terms: [{ creditor_type: 'Minor Creditor', minor_creditor_sequence: 12 }],
      },
    });
  });
  it('resolves major creditor codes in the owning business unit and fails unresolved assignments', () => {
    const snapshot = state();
    const major = {
      major_creditor_id: 501,
      major_creditor_code: 'CA01',
      business_unit_id: 44,
      active: true,
      central_authority: true,
    };
    const refs = { ...references, majorCreditors: [major] };
    snapshot.orderTerms[0].creditor = { type: 'major', majorCreditorId: 501, displayName: 'Synthetic authority' };
    expect(
      service.buildAddCasefilePayload(snapshot, refs, 44).casefile.respondent_account.order_details.order_terms[0],
    ).toMatchObject({ creditor_type: 'Major Creditor', major_creditor_code: 'CA01' });
    expect(() => service.buildAddCasefilePayload(snapshot, refs, 45)).toThrow('Major creditor');
    snapshot.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 99 };
    expect(() => service.buildAddCasefilePayload(snapshot, refs, 44)).toThrow('Minor creditor');
    snapshot.orderTerms[0].creditor = null;
    expect(
      service.buildAddCasefilePayload(snapshot, refs, 44).casefile.respondent_account.order_details.order_terms[0],
    ).not.toHaveProperty('creditor_type');
  });
  it('omits empty optional values and rejects duplicate, inactive or missing country codes', () => {
    const snapshot = state();
    snapshot.respondentDetails!.aliases = [];
    snapshot.commentsAndNotes = { comment: '  ', note: '' };
    const payload = service.buildAddCasefilePayload(snapshot, references, 44);
    expect(payload.casefile.respondent_account).not.toHaveProperty('notes');
    expect(payload.casefile.respondent_account).not.toHaveProperty('account_comment');
    expect(payload.casefile.respondent_account.respondent.party_details).not.toHaveProperty('aliases');
    expect(() =>
      service.buildAddCasefilePayload(
        snapshot,
        { ...references, countries: [...references.countries, references.countries[0]] },
        44,
      ),
    ).toThrow('Country');
    expect(() =>
      service.buildAddCasefilePayload(
        snapshot,
        { ...references, countries: references.countries.map((country) => ({ ...country, active: false })) },
        44,
      ),
    ).toThrow('Country');
    expect(() =>
      service.buildAddCasefilePayload(
        snapshot,
        { ...references, countries: references.countries.map((country) => ({ ...country, cjs_code: Number.NaN })) },
        44,
      ),
    ).toThrow('Country');
    snapshot.respondentDetails = null;
    expect(() => service.buildAddCasefilePayload(snapshot, references, 44)).toThrow('incomplete');
  });
  it('resolves a central authority only from active authority records in its business unit', () => {
    const snapshot = state();
    const authority = {
      major_creditor_id: 501,
      major_creditor_code: 'CA01',
      business_unit_id: 44,
      active: true,
      central_authority: true,
      name: 'Test Authority',
      address_line_1: 'Test Street',
      address_line_2: null,
      address_line_3: null,
      address_line_4: null,
      address_line_5: null,
      postcode: null,
      country_id: null,
      country_name: null,
      contact_name: null,
      contact_email: null,
    };
    snapshot.centralAuthorityDetails = {
      remoReference: 'REMO1',
      centralAuthorityReference: 'REF1',
      majorCreditor: authority,
    };
    const refs = { ...references, majorCreditors: [authority] };
    expect(service.buildAddCasefilePayload(snapshot, refs, 44).casefile.respondent_account).toMatchObject({
      remo_reference: 'REMO1',
      central_authority_reference: 'REF1',
      central_authority_code: 'CA01',
    });
    expect(() =>
      service.buildAddCasefilePayload(
        snapshot,
        { ...refs, majorCreditors: [{ ...authority, central_authority: false }] },
        44,
      ),
    ).toThrow('Major creditor');
  });
  it('inherits frequency for metadata spelling accepted by the order-term parser', () => {
    const snapshot = state();
    snapshot.orderTerms[0].presentation.fields = [{ name: 'frequency', label: '', kind: 'readonly', options: [] }];
    expect(
      service.buildAddCasefilePayload(snapshot, references, 44).casefile.respondent_account.order_details.order_terms[0]
        .result_responses,
    ).toEqual([{ parameter_name: 'frequency', response: 'Monthly' }]);
  });
});
