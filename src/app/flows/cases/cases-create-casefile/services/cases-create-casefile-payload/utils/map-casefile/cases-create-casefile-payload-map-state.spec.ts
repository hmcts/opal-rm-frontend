import { describe, expect, it } from 'vitest';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_PAGE,
} from '../../../../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import { CASES_CREATE_CASEFILE_STATE } from '../../../../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../../../../constants/cases-create-casefile-task-statuses.constant';
import { acceptedOrderTermsComplete } from '../../../../utils/cases-create-casefile-order-terms-complete';
import { mapPersistedCasefile } from './cases-create-casefile-payload-map-state';

const context = () =>
  structuredClone({ ...PERSISTED_CASEFILE_REFERENCES, resultPages: { TEST01: PERSISTED_CASEFILE_RESULT_PAGE } });
const major = (
  changes: Partial<IOpalMaintenanceMajorCreditorReferenceDataItem> = {},
): IOpalMaintenanceMajorCreditorReferenceDataItem => ({
  major_creditor_id: 51,
  business_unit_id: 44,
  major_creditor_code: 'MAJOR',
  name: 'Synthetic authority',
  address_line_1: '1 Test Street',
  address_line_2: null,
  address_line_3: null,
  address_line_4: null,
  address_line_5: null,
  postcode: null,
  country_id: null,
  country_name: null,
  contact_name: null,
  contact_email: null,
  active: false,
  central_authority: false,
  ...changes,
});
const minor = (draft: IOpalMaintenanceDraftCasefileDetail, sequence: number) => ({
  creditor_sequence: sequence,
  party_details: structuredClone(draft.casefile.applicant.party_details),
  bank_account_details: structuredClone(draft.casefile.applicant.bank_account_details),
});

// Freeze inputs recursively so accidental changes fail during the mapping itself.
function freeze(value: unknown): void {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
}

describe('mapPersistedCasefile', () => {
  it('restores every required section, preserves repeated results and clears all transients', () => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.respondent_account.order_details.order_terms.push(
      structuredClone(draft.casefile.respondent_account.order_details.order_terms[0]),
    );
    const before = structuredClone(draft);
    const initial = structuredClone(CASES_CREATE_CASEFILE_STATE);
    const references = context();
    freeze(draft);
    freeze(references);
    const state = mapPersistedCasefile(draft, references);
    expect(state.caseTypeSelection).toEqual({ caseType: 'REMO In', applicantType: 'Individual' });
    expect(state.respondentDetails?.contactDetails.address.countryId).toBe(1);
    expect(state.applicantDetails?.contactDetails.address.countryId).toBe(2);
    expect(state.orderDetails).toEqual({
      applicationId: 901,
      court: 'Test Court',
      dateOrderMade: '2026-09-01',
      dateArrearsLastUpdated: '2026-09-15',
      paymentFrequency: 'Monthly',
    });
    expect(state.interestAndIndexation).toEqual({ interestApplies: false, indexationType: 'NONE' });
    expect(state.paymentArrangement).toBe('court');
    expect(state.orderTerms.map((term) => term.termId)).toEqual([1, 2]);
    expect(state.orderTerms[0].parameters).toEqual({ amount: '100.00' });
    expect(state.nextOrderTermId).toBe(3);
    expect(state.nextMinorCreditorSequence).toBe(1);
    for (const name of [
      'currentOrderTermId',
      'creditorDraft',
      'minorCreditorRemoval',
      'minorCreditorRemovalOutcome',
      'orderTermDraft',
      'orderTermAmendment',
      'orderTermRemoval',
      'orderTermRemovalOutcome',
      'orderTermRemovalReturnFocusId',
      'pendingOrderTermResultId',
    ] as const)
      expect(state[name]).toBeNull();
    expect(state.submissionSucceeded).toBe(false);
    expect(state.unsavedChanges).toBe(false);
    expect(state.stateChanges).toBe(false);
    expect(state.centralAuthorityDetails).toBeNull();
    expect(state.commentsAndNotes).toBeNull();
    expect(state.taskStatuses).toEqual({
      respondent: 'Provided',
      applicant: 'Provided',
      centralAuthority: 'Optional',
      orderDetails: 'Provided',
      orderTerms: 'Provided',
      interestAndIndexation: 'Provided',
      managingPayments: 'Provided',
      commentsAndNotes: 'Optional',
    });
    expect(state.taskStatuses.orderTerms).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(draft).toEqual(before);
    expect(CASES_CREATE_CASEFILE_STATE).toEqual(initial);
    state.respondentDetails!.contactDetails.address.addressLine1 = 'changed';
    expect(draft).toEqual(before);
  });
  it.each([
    [12, 7],
    [7, 12],
  ])('preserves sparse minor sequences %j and their term relationships', (first, second) => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.minor_creditors = [minor(draft, first), minor(draft, second)];
    Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], {
      creditor_type: 'Minor Creditor',
      minor_creditor_sequence: 12,
    });
    const state = mapPersistedCasefile(draft, context());
    expect(state.nextMinorCreditorSequence).toBe(13);
    expect(state.minorCreditors.map((item) => item.sequenceNumber)).toEqual([first, second]);
    expect(state.minorCreditors[0].displayName).toBe('Synthetic Applicant');
    expect(state.minorCreditors[0].details.identity).toEqual({
      type: 'individual',
      title: null,
      firstNames: 'Synthetic',
      lastName: 'Applicant',
    });
    expect(state.orderTerms[0].creditor).toEqual({ type: 'minor', sequenceNumber: 12 });
  });
  it.each(['REMO In', 'REMO Out', 'REMO Out (CMS)'] as const)('restores individual applicants for %s', (caseType) => {
    const draft = createPersistedCasefileDetail();
    draft.casefile_type = caseType;
    draft.casefile.respondent_account.casefile_type = caseType;
    expect(mapPersistedCasefile(draft, context()).caseTypeSelection).toEqual(
      caseType === 'REMO In' ? { caseType, applicantType: 'Individual' } : { caseType },
    );
  });
  it('restores REMO In organisations and organisation minor creditors', () => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.applicant.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Synthetic organisation', foreign_authority_reference: 'REF' },
      address: { address_line_1: '3 Test Street', cjs_code: 101 },
    };
    draft.casefile.minor_creditors = [minor(draft, 4)];
    const state = mapPersistedCasefile(draft, context());
    expect(state.caseTypeSelection).toEqual({ caseType: 'REMO In', applicantType: 'Organisation' });
    expect(state.applicantDetails).toMatchObject({
      organisationName: 'Synthetic organisation',
      foreignAuthorityReference: 'REF',
    });
    expect(state.minorCreditors[0].details.identity).toEqual({
      type: 'organisation',
      organisationName: 'Synthetic organisation',
    });
    expect(state.minorCreditors[0].displayName).toBe('Synthetic organisation');
  });
  it.each(['UK Bank', 'Non-UK Bank', 'None or not applicable'] as const)(
    'restores %s for applicants and minor creditors',
    (bankType) => {
      const draft = createPersistedCasefileDetail();
      const bank = {
        bank_account_type: bankType,
        ...(bankType === 'UK Bank'
          ? {
              uk_bank_details: {
                account_name: 'Synthetic',
                sort_code: '000000',
                account_number: '00000000',
                payment_reference: 'TEST',
              },
            }
          : {}),
        ...(bankType === 'Non-UK Bank'
          ? { non_uk_bank_details: { account_name: 'Synthetic', payment_reference: 'TEST', iban: 'SYNTHETIC' } }
          : {}),
      };
      draft.casefile.applicant.bank_account_details = bank;
      draft.casefile.minor_creditors = [minor(draft, 5)];
      const state = mapPersistedCasefile(draft, context());
      expect(state.minorCreditors[0].details.bank).toEqual(state.applicantDetails?.bankDetails);
      expect(state.minorCreditors[0].details.bank.type).toBe(
        ({ 'UK Bank': 'uk', 'Non-UK Bank': 'non-uk', 'None or not applicable': 'none' } as const)[bankType],
      );
    },
  );
  it.each([undefined, null, '', ' ', 42])(
    'rejects an unusable non-UK minor-creditor payment reference %j at the bank boundary',
    (paymentReference) => {
      const draft = createPersistedCasefileDetail();
      const creditor = minor(draft, 5);
      creditor.bank_account_details = {
        bank_account_type: 'Non-UK Bank',
        non_uk_bank_details: { account_name: 'Synthetic', payment_reference: 'REF' },
      };
      Object.assign(creditor.bank_account_details.non_uk_bank_details!, { payment_reference: paymentReference });
      draft.casefile.minor_creditors = [creditor];
      const before = structuredClone(draft);

      expect(() => mapPersistedCasefile(draft, context())).toThrow('Unusable saved bank');
      expect(draft).toEqual(before);
    },
  );
  it.each(['Applicant', 'Minor Creditor', 'Major Creditor'] as const)(
    'marks validated %s terms Provided only with an applicable creditor',
    (creditorType) => {
      const draft = createPersistedCasefileDetail();
      const references = context();
      const term = draft.casefile.respondent_account.order_details.order_terms[0];
      term.creditor_type = creditorType;
      if (creditorType === 'Minor Creditor') {
        const creditor = minor(draft, 5);
        creditor.bank_account_details = {
          bank_account_type: 'Non-UK Bank',
          non_uk_bank_details: { account_name: 'Synthetic', payment_reference: 'REF' },
        };
        draft.casefile.minor_creditors = [creditor];
        term.minor_creditor_sequence = 5;
      }
      if (creditorType === 'Major Creditor') {
        references.majorCreditors = [major()];
        term.major_creditor_code = 'MAJOR';
      }
      const before = structuredClone(draft);

      const state = mapPersistedCasefile(draft, references);

      expect(acceptedOrderTermsComplete(state)).toBe(true);
      expect(state.taskStatuses.orderTerms).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(state.orderTerms[0].creditor?.type).toBe(
        ({ Applicant: 'applicant', 'Minor Creditor': 'minor', 'Major Creditor': 'major' } as const)[creditorType],
      );
      if (creditorType === 'Minor Creditor') {
        expect(state.minorCreditors[0].details.bank).toMatchObject({ type: 'non-uk', paymentReference: 'REF' });
      }
      expect(draft).toEqual(before);
    },
  );
  it.each([
    { creditor_type: 'Minor Creditor', minor_creditor_sequence: 99 },
    { creditor_type: 'Minor Creditor' },
    { creditor_type: 'Major Creditor', major_creditor_code: 'MISSING' },
    { creditor_type: 'Major Creditor' },
    { creditor_type: 'Unsupported' },
  ])('rejects unresolved saved creditor assignment %j before deriving Provided statuses', (creditor) => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], creditor);
    const before = structuredClone(draft);

    expect(() => mapPersistedCasefile(draft, context())).toThrow('Unusable saved order term');
    expect(draft).toEqual(before);
  });
  it('resolves inactive references without filtering them out and clones central data', () => {
    const draft = createPersistedCasefileDetail();
    const refs = context();
    refs.countries.forEach((item) => (item.active = false));
    refs.applications[0].active = false;
    refs.majorCreditors = [
      major(),
      major({ major_creditor_id: 52, major_creditor_code: 'CENTRAL', central_authority: true }),
    ];
    Object.assign(draft.casefile.respondent_account, {
      remo_reference: 'REMO',
      central_authority_reference: 'AUTHORITY',
      central_authority_code: 'CENTRAL',
      account_comment: 'Comment',
      notes: { note_text: 'Note' },
    });
    Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], {
      creditor_type: 'Major Creditor',
      major_creditor_code: 'MAJOR',
    });
    const before = structuredClone(refs);
    freeze(refs);
    const state = mapPersistedCasefile(draft, refs);
    expect(state.centralAuthorityDetails).toEqual({
      remoReference: 'REMO',
      centralAuthorityReference: 'AUTHORITY',
      majorCreditor: before.majorCreditors[1],
    });
    expect(state.orderTerms[0].creditor).toEqual({
      type: 'major',
      majorCreditorId: 51,
      displayName: 'Synthetic authority',
    });
    expect(state.commentsAndNotes).toEqual({ comment: 'Comment', note: 'Note' });
    expect(state.taskStatuses.centralAuthority).toBe('Provided');
    expect(state.taskStatuses.commentsAndNotes).toBe('Provided');
    state.centralAuthorityDetails!.majorCreditor!.name = 'changed';
    expect(refs).toEqual(before);
  });
  it.each(['remo_reference', 'central_authority_reference', 'account_comment', 'notes'] as const)(
    'provides meaningful optional %s alone',
    (key) => {
      const draft = createPersistedCasefileDetail();
      const account = draft.casefile.respondent_account;
      if (key === 'notes') account.notes = { note_text: 'Note' };
      else account[key] = 'Reference';
      const state = mapPersistedCasefile(draft, context());
      expect(
        key === 'notes' || key === 'account_comment'
          ? state.taskStatuses.commentsAndNotes
          : state.taskStatuses.centralAuthority,
      ).toBe('Provided');
    },
  );
  it('normalises empty optional sections and absent originator name', () => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account, {
      originator_name: undefined,
      remo_reference: ' ',
      central_authority_reference: '',
      account_comment: ' ',
      notes: { note_text: '' },
    });
    const state = mapPersistedCasefile(draft, context());
    expect(state.orderDetails?.court).toBeNull();
    expect(state.centralAuthorityDetails).toBeNull();
    expect(state.commentsAndNotes).toBeNull();
  });
  it.each([
    ['RPI', 'RPI'],
    ['CPI', 'CPI'],
    ['Other', 'OTHER'],
    ['None', 'NONE'],
  ] as const)('restores explicit indexation %s', (saved, expected) => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account.order_details, {
      indexation: saved,
      interest_flag: true,
      payment_arrangement: 'Direct',
    });
    const state = mapPersistedCasefile(draft, context());
    expect(state.interestAndIndexation).toEqual({ interestApplies: true, indexationType: expected });
    expect(state.paymentArrangement).toBe('direct');
  });
  it('ignores matching codes in foreign business units when an owning-unit match exists', () => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], {
      creditor_type: 'Major Creditor',
      major_creditor_code: 'MAJOR',
    });
    draft.casefile.respondent_account.central_authority_code = 'CENTRAL';
    const refs = {
      ...context(),
      majorCreditors: [
        major(),
        major({ business_unit_id: 45 }),
        major({ major_creditor_id: 52, major_creditor_code: 'CENTRAL', central_authority: true }),
        major({ business_unit_id: 45, major_creditor_code: 'CENTRAL', central_authority: true }),
      ],
    };
    const state = mapPersistedCasefile(draft, refs);
    expect(state.orderTerms[0].creditor).toEqual({
      type: 'major',
      majorCreditorId: 51,
      displayName: 'Synthetic authority',
    });
    expect(state.centralAuthorityDetails?.majorCreditor?.business_unit_id).toBe(44);
  });
  it.each([false, true])('rejects unusable selected creditor names for central role %s', (central) => {
    const draft = createPersistedCasefileDetail();
    if (central) draft.casefile.respondent_account.central_authority_code = 'MAJOR';
    else
      Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], {
        creditor_type: 'Major Creditor',
        major_creditor_code: 'MAJOR',
      });
    expect(() =>
      mapPersistedCasefile(draft, { ...context(), majorCreditors: [major({ name: ' ', central_authority: central })] }),
    ).toThrow();
  });
  it('rejects missing, ambiguous and wrong-group application codes', () => {
    const draft = createPersistedCasefileDetail();
    const refs = context();
    for (const applications of [
      [],
      [refs.applications[0], refs.applications[0]],
      [{ ...refs.applications[0], application_group: 'Other' }],
    ])
      expect(() => mapPersistedCasefile(draft, { ...refs, applications })).toThrow();
  });
  it('rejects foreign-BU, wrong-role, missing and ambiguous selected major/central creditors', () => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account.order_details.order_terms[0], {
      creditor_type: 'Major Creditor',
      major_creditor_code: 'MAJOR',
    });
    for (const majorCreditors of [
      [],
      [major({ business_unit_id: 45 })],
      [major({ central_authority: true })],
      [major(), major()],
    ])
      expect(() => mapPersistedCasefile(draft, { ...context(), majorCreditors })).toThrow();
    draft.casefile.respondent_account.order_details.order_terms[0].creditor_type = 'Applicant';
    delete draft.casefile.respondent_account.order_details.order_terms[0].major_creditor_code;
    draft.casefile.respondent_account.central_authority_code = 'MAJOR';
    for (const majorCreditors of [
      [],
      [major({ business_unit_id: 45, central_authority: true })],
      [major()],
      [major({ central_authority: true }), major({ central_authority: true })],
    ])
      expect(() => mapPersistedCasefile(draft, { ...context(), majorCreditors })).toThrow();
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, 12])(
    'rejects invalid/duplicate minor sequence %s',
    (sequence) => {
      const draft = createPersistedCasefileDetail();
      draft.casefile.minor_creditors = [minor(draft, 12), minor(draft, sequence)];
      expect(() => mapPersistedCasefile(draft, context())).toThrow();
    },
  );
  it('rejects contradictory saved type, owning BU and applicant shape', () => {
    const draft = createPersistedCasefileDetail();
    draft.casefile.respondent_account.casefile_type = 'REMO Out';
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
    draft.casefile.respondent_account.casefile_type = 'REMO In';
    draft.casefile.respondent_account.business_unit_id = 45;
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
    draft.casefile.respondent_account.business_unit_id = 44;
    draft.casefile_type = 'REMO Out';
    draft.casefile.respondent_account.casefile_type = 'REMO Out';
    draft.casefile.applicant.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Synthetic' },
      address: { address_line_1: '1 Test Street', cjs_code: 101 },
    };
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
  });
  it.each([null, [], {}, 1])('rejects unsupported saved notes %j', (notes) => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account, { notes });
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
  });
  it('rejects malformed optional text, order structure, minor collection, type and application ID', () => {
    const draft = createPersistedCasefileDetail();
    Object.assign(draft.casefile.respondent_account, { originator_name: 12 });
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
    delete draft.casefile.respondent_account.originator_name;
    const order = draft.casefile.respondent_account.order_details;
    Object.assign(draft.casefile.respondent_account, { order_details: undefined });
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
    draft.casefile.respondent_account.order_details = order;
    Object.assign(draft.casefile, { minor_creditors: {} });
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
    delete draft.casefile.minor_creditors;
    expect(() =>
      mapPersistedCasefile(draft, {
        ...context(),
        applications: [{ ...context().applications[0], application_id: 0 }],
      }),
    ).toThrow();
    Object.assign(draft, { casefile_type: 'Unknown' });
    Object.assign(draft.casefile.respondent_account, { casefile_type: 'Unknown' });
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
  });
  it('rejects unsupported minor party shapes', () => {
    const draft = createPersistedCasefileDetail();
    const creditor = minor(draft, 1);
    creditor.party_details.organisation = true;
    draft.casefile.minor_creditors = [creditor];
    expect(() => mapPersistedCasefile(draft, context())).toThrow();
  });
  it('rejects incomplete or invalid accepted order data', () => {
    for (const changes of [
      { date_ordered: '2025-02-29' },
      { date_arrears_last_updated: '' },
      { payment_period: 'Unknown' },
      { indexation: 'Unknown' },
      { payment_arrangement: 'Unknown' },
      { interest_flag: 'false' },
      { order_terms: [] },
    ]) {
      const draft = createPersistedCasefileDetail();
      Object.assign(draft.casefile.respondent_account.order_details, changes);
      expect(() => mapPersistedCasefile(draft, context())).toThrow();
    }
  });
});
