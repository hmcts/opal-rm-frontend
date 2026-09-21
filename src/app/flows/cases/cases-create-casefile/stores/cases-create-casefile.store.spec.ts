import { TestBed } from '@angular/core/testing';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../constants/cases-create-casefile-payment-arrangements.constant';
import { CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from '../interfaces/cases-create-casefile-applicant-organisation.interface';
import type { ICasesCreateCasefileCommentsNotes } from '../interfaces/cases-create-casefile-comments-notes.interface';
import type { ICasesCreateCasefileInterestIndexation } from '../interfaces/cases-create-casefile-interest-indexation.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileOrderDetails } from '../interfaces/cases-create-casefile-order-details.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import type { ICasesCreateCasefileOrderTermPage } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import { mapOrderTermParameters } from '../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileMinorCreditor } from '../interfaces/cases-create-casefile-minor-creditor.interface';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('CasesCreateCasefileStore', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let stateSource: WritableStateSource<ICasesCreateCasefileState>;

  const page: ICasesCreateCasefileOrderTermPage = {
    resultId: 'MAT',
    title: 'Maintenance',
    fields: mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'].result_parameters),
  };

  const respondentDetails: ICasesCreateCasefileRespondentDetails = {
    title: 'Mx',
    firstNames: 'Test',
    lastName: 'Respondent',
    aliases: [{ firstNames: 'Example', lastName: 'Alias' }],
    dateOfBirth: '1990-01-31',
    nationalInsuranceNumber: 'QQ123456C',
    otherPersonalInformation: 'Synthetic test information',
    contactDetails: {
      mainEmailAddress: 'test@example.com',
      otherEmailAddress: null,
      mainTelephoneNumber: '01234567890',
      otherTelephoneNumber: null,
      address: {
        addressLine1: '1 Test Street',
        addressLine2: null,
        addressLine3: null,
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: 'TE1 1ST',
        countryId: 1,
      },
    },
    thirdParty: null,
    employer: null,
    restrictedInformation: { restricted: false, reason: null },
  };

  const applicant: ICasesCreateCasefileApplicantIndividual = {
    title: 'Dr',
    firstNames: 'Test',
    lastName: 'Applicant',
    aliases: [{ firstNames: 'Example', lastName: 'Alias' }],
    dateOfBirth: '1990-01-31',
    contactDetails: {
      mainEmailAddress: 'test@example.com',
      otherEmailAddress: null,
      mainTelephoneNumber: '01234567890',
      otherTelephoneNumber: null,
      address: {
        addressLine1: '1 Test Street',
        addressLine2: null,
        addressLine3: null,
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: 'TE1 1ST',
        countryId: 826,
      },
    },
    thirdParty: null,
    bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
    restrictedInformation: { restricted: false, reason: null },
  };

  const organisationApplicant: ICasesCreateCasefileApplicantOrganisation = {
    organisationName: 'Test Organisation',
    foreignAuthorityReference: 'FA-9803',
    contactDetails: {
      mainEmailAddress: 'organisation@example.com',
      otherEmailAddress: null,
      mainTelephoneNumber: '+44 (0)20 7946 0000',
      otherTelephoneNumber: null,
      address: {
        addressLine1: '1 Test Street',
        addressLine2: 'Test Town',
        addressLine3: null,
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: 'TE1 1ST',
        countryId: 826,
      },
    },
    bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
  };

  const orderDetails: ICasesCreateCasefileOrderDetails = {
    applicationId: 901,
    court: null,
    dateOrderMade: null,
    paymentFrequency: 'Weekly',
    dateArrearsLastUpdated: '2026-09-15',
  };

  const majorCreditor: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    major_creditor_id: 901,
    business_unit_id: 44,
    major_creditor_code: '0123',
    name: 'Central Authority One',
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
    active: true,
    central_authority: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CasesCreateCasefileStore);
    stateSource = store as unknown as WritableStateSource<ICasesCreateCasefileState>;
    store.resetStore();
  });

  const provide = (...tasks: CasesCreateCasefileTask[]): void => {
    tasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
  };

  const acceptMat = (amount = '12.30'): number => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount } })).toBe(true);
    return store.currentOrderTermId()!;
  };

  const minorCreditor = (
    sequenceNumber: number,
    displayName = 'Synthetic creditor',
  ): ICasesCreateCasefileMinorCreditor => ({
    sequenceNumber,
    displayName,
    details: {
      ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
      identity: { type: 'organisation', organisationName: displayName },
    },
  });

  it('starts without default business values', () => {
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.interestAndIndexation()).toBeNull();
    expect(store.paymentArrangement()).toBeNull();
    expect(store.commentsAndNotes()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
  });

  it('starts without respondent details', () => {
    expect(store.respondentDetails()).toBeNull();
  });

  it('starts without applicant details', () => {
    expect(store.applicantDetails()).toBeNull();
  });

  it('saves Order Details atomically and preserves other sections', () => {
    store.setRespondentDetails(respondentDetails);
    store.setApplicantDetails(applicant);
    store.setUnsavedChanges(true);
    store.setOrderDetails(orderDetails);

    expect(store.orderDetails()).toEqual(orderDetails);
    expect(store.respondentDetails()).toEqual(respondentDetails);
    expect(store.applicantDetails()).toEqual(applicant);
    expect(store.taskStatuses().orderDetails).toBe('Provided');
    expect(store.remainingOrderTasksAvailable()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);

    store.resetStore();

    expect(store.orderDetails()).toBeNull();
  });

  it('starts mandatory tasks as Required and optional tasks as Optional', () => {
    expect(store.taskStatuses()).toEqual({
      respondent: 'Required',
      applicant: 'Required',
      centralAuthority: 'Optional',
      orderDetails: 'Required',
      orderTerms: 'Required',
      interestAndIndexation: 'Required',
      managingPayments: 'Required',
      commentsAndNotes: 'Optional',
    });
    expect(store.partyDetailsComplete()).toBe(false);
    expect(store.orderDetailsAvailable()).toBe(false);
    expect(store.remainingOrderTasksAvailable()).toBe(false);
    expect(store.checkCaseAvailable()).toBe(false);
  });

  it('unlocks Order details only after Respondent and Applicant are Provided', () => {
    provide('respondent');
    expect(store.orderDetailsAvailable()).toBe(false);

    provide('applicant');
    expect(store.partyDetailsComplete()).toBe(true);
    expect(store.orderDetailsAvailable()).toBe(true);
    expect(store.remainingOrderTasksAvailable()).toBe(false);
  });

  it('unlocks the remaining Order tasks after Order details is Provided', () => {
    provide('respondent', 'applicant', 'orderDetails');

    expect(store.remainingOrderTasksAvailable()).toBe(true);
  });

  it('makes Check case available after all mandatory tasks are Provided', () => {
    provide('respondent', 'applicant', 'orderDetails', 'orderTerms', 'interestAndIndexation', 'managingPayments');

    expect(store.checkCaseAvailable()).toBe(true);
    expect(store.taskStatuses().centralAuthority).toBe('Optional');
    expect(store.taskStatuses().commentsAndNotes).toBe('Optional');
  });

  it('updates task statuses immutably', () => {
    const initialTaskStatuses = store.taskStatuses();

    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);

    expect(store.taskStatuses()).not.toBe(initialTaskStatuses);
    expect(initialTaskStatuses.respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('allows optional tasks to become Provided without gating Check case', () => {
    provide(
      'respondent',
      'applicant',
      'orderDetails',
      'orderTerms',
      'interestAndIndexation',
      'managingPayments',
      'centralAuthority',
      'commentsAndNotes',
    );

    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.checkCaseAvailable()).toBe(true);
  });

  it('saves a valid REMO In selection and clears unsaved state', () => {
    store.setUnsavedChanges(true);
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });

    expect(store.caseTypeSelection()).toEqual({
      caseType: 'REMO In',
      applicantType: 'Individual',
    });
    expect(store.caseTypeComplete()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('saves an outbound selection without an applicant type', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.caseTypeSelection()).toEqual({ caseType: 'REMO Out (CMS)' });
    expect(store.caseTypeSelection()).not.toHaveProperty('applicantType');
  });

  it('saves respondent details and marks the task Provided atomically', () => {
    store.setUnsavedChanges(true);
    store.setRespondentDetails(respondentDetails);

    expect(store.respondentDetails()).toEqual(respondentDetails);
    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('saves applicant details and marks the task Provided atomically', () => {
    store.setUnsavedChanges(true);

    store.setApplicantDetails(applicant);

    expect(store.applicantDetails()).toEqual(applicant);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('stores an Organisation applicant and marks Applicant Provided atomically', () => {
    store.setUnsavedChanges(true);
    store.setApplicantDetails(organisationApplicant);

    expect(store.applicantDetails()).toEqual(organisationApplicant);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it.each([
    { interestApplies: true, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI },
    { interestApplies: false, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI },
    { interestApplies: true, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER },
    { interestApplies: false, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE },
  ] satisfies ICasesCreateCasefileInterestIndexation[])(
    'saves Interest and indexation %o and marks the task Provided atomically',
    (interestAndIndexation) => {
      store.setUnsavedChanges(true);

      store.setInterestAndIndexation(interestAndIndexation);

      expect(store.interestAndIndexation()).toEqual(interestAndIndexation);
      expect(store.taskStatuses().interestAndIndexation).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).toBe(false);
      expect(store.stateChanges()).toBe(true);
    },
  );

  it.each([
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] satisfies CasesCreateCasefilePaymentArrangement[])(
    'saves payment arrangement %s and marks Managing payments Provided atomically',
    (paymentArrangement) => {
      store.setUnsavedChanges(true);

      store.setPaymentArrangement(paymentArrangement);

      expect(store.paymentArrangement()).toBe(paymentArrangement);
      expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).toBe(false);
      expect(store.stateChanges()).toBe(true);
    },
  );

  it('normalizes whitespace-only Central Authority references and keeps the optional task Optional', () => {
    store.setUnsavedChanges(true);

    store.setCentralAuthorityDetails({ remoReference: '   ', centralAuthorityReference: '\t', majorCreditor: null });

    expect(store.centralAuthorityDetails()).toEqual({
      remoReference: null,
      centralAuthorityReference: null,
      majorCreditor: null,
    });
    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it.each([
    { remoReference: ' REMO-1 ', centralAuthorityReference: null, majorCreditor: null },
    { remoReference: null, centralAuthorityReference: ' CA-1 ', majorCreditor: null },
    { remoReference: null, centralAuthorityReference: null, majorCreditor },
  ])('marks Central Authority Provided when any value is present', (details) => {
    store.setUnsavedChanges(true);

    store.setCentralAuthorityDetails(details);

    expect(store.centralAuthorityDetails()).toEqual(details);
    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('clears Central Authority details when Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setCentralAuthorityDetails({ remoReference: 'REMO-1', centralAuthorityReference: null, majorCreditor });

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.centralAuthorityDetails()).toBeNull();
    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
  });

  it('preserves Central Authority details when Case Type is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    const details = { remoReference: 'REMO-1', centralAuthorityReference: 'CA-1', majorCreditor };
    store.setCaseTypeSelection(selection);
    store.setCentralAuthorityDetails(details);

    store.setCaseTypeSelection(selection);

    expect(store.centralAuthorityDetails()).toEqual(details);
  });

  it.each(['resetForCaseTypeEdit', 'resetStore'] as const)('clears Central Authority details on %s', (method) => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setCentralAuthorityDetails({ remoReference: null, centralAuthorityReference: null, majorCreditor });

    store[method]();

    expect(store.centralAuthorityDetails()).toBeNull();
  });

  it.each([
    [{ comment: 'Important account comment', note: null }, 'comment only'],
    [{ comment: null, note: 'Internal account note' }, 'note only'],
    [{ comment: 'Important account comment', note: 'Internal account note' }, 'both values'],
  ] satisfies [ICasesCreateCasefileCommentsNotes, string][])(
    'saves %s and marks Comments and notes Provided atomically',
    (commentsAndNotes, _description) => {
      void _description;
      store.setUnsavedChanges(true);

      store.setCommentsAndNotes(commentsAndNotes);

      expect(store.commentsAndNotes()).toEqual(commentsAndNotes);
      expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).toBe(false);
      expect(store.stateChanges()).toBe(true);
    },
  );

  it('normalizes blank values to null and restores the Optional task status', () => {
    store.setCommentsAndNotes({ comment: 'Previously saved', note: 'Previously saved' });
    store.setUnsavedChanges(true);

    store.setCommentsAndNotes({ comment: '', note: '   ' });

    expect(store.commentsAndNotes()).toEqual({ comment: null, note: null });
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('retains entered whitespace around a non-empty value and replaces both saved fields', () => {
    store.setCommentsAndNotes({ comment: 'Old comment', note: 'Old note' });

    store.setCommentsAndNotes({ comment: '  New comment  ', note: '  New note  ' });

    expect(store.commentsAndNotes()).toEqual({ comment: '  New comment  ', note: '  New note  ' });
  });

  it('clears Comments and notes when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.commentsAndNotes()).toBeNull();
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
  });

  it('preserves Comments and notes when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    const commentsAndNotes = { comment: 'Saved comment', note: 'Saved note' };
    store.setCaseTypeSelection(selection);
    store.setCommentsAndNotes(commentsAndNotes);

    store.setCaseTypeSelection(selection);

    expect(store.commentsAndNotes()).toEqual(commentsAndNotes);
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('clears Comments and notes when resetting for Case Type edit', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });

    store.resetForCaseTypeEdit();

    expect(store.commentsAndNotes()).toBeNull();
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
  });

  it('clears Comments and notes when resetting the store', () => {
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });

    store.resetStore();

    expect(store.commentsAndNotes()).toBeNull();
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
  });

  it('clears the payment arrangement when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.paymentArrangement()).toBeNull();
    expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
  });

  it('preserves the payment arrangement when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);

    store.setCaseTypeSelection(selection);

    expect(store.paymentArrangement()).toBe(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);
    expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('clears the payment arrangement when resetting for Case Type edit', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

    store.resetForCaseTypeEdit();

    expect(store.paymentArrangement()).toBeNull();
  });

  it('clears the payment arrangement when resetting the store', () => {
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);

    store.resetStore();

    expect(store.paymentArrangement()).toBeNull();
    expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
  });

  it('clears Interest and indexation when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setInterestAndIndexation({
      interestApplies: true,
      indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI,
    });

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.interestAndIndexation()).toBeNull();
    expect(store.taskStatuses().interestAndIndexation).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
  });

  it('preserves Interest and indexation when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    const interestAndIndexation: ICasesCreateCasefileInterestIndexation = {
      interestApplies: false,
      indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE,
    };
    store.setCaseTypeSelection(selection);
    store.setInterestAndIndexation(interestAndIndexation);

    store.setCaseTypeSelection(selection);

    expect(store.interestAndIndexation()).toEqual(interestAndIndexation);
  });

  it('clears Interest and indexation when resetting for Case Type edit', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setInterestAndIndexation({
      interestApplies: false,
      indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
    });

    store.resetForCaseTypeEdit();

    expect(store.interestAndIndexation()).toBeNull();
  });

  it('clears Interest and indexation when resetting the store', () => {
    store.setInterestAndIndexation({
      interestApplies: true,
      indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER,
    });

    store.resetStore();

    expect(store.interestAndIndexation()).toBeNull();
  });

  it('clears respondent data when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setRespondentDetails(respondentDetails);

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.respondentDetails()).toBeNull();
    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
  });

  it('preserves respondent data when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    store.setRespondentDetails(respondentDetails);

    store.setCaseTypeSelection(selection);

    expect(store.respondentDetails()).toEqual(respondentDetails);
  });

  it('preserves applicant data when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    store.setApplicantDetails(applicant);

    store.setCaseTypeSelection(selection);

    expect(store.applicantDetails()).toEqual(applicant);
  });

  it('preserves Order Details when the Case Type selection is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    store.setOrderDetails(orderDetails);

    store.setCaseTypeSelection(selection);

    expect(store.orderDetails()).toEqual(orderDetails);
  });

  it('clears Order Details when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setOrderDetails(orderDetails);

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.orderDetails()).toBeNull();
  });

  it('clears Order Details when the REMO In Applicant Type changes', () => {
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });
    store.setOrderDetails(orderDetails);

    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    });

    expect(store.orderDetails()).toBeNull();
  });

  it('clears applicant data when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setApplicantDetails(applicant);

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.applicantDetails()).toBeNull();
  });

  it('resets task progress when the submitted Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });

  it('resets task progress when the submitted REMO In Applicant Type changes', () => {
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });
    store.setApplicantDetails(applicant);
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    });

    expect(store.applicantDetails()).toBeNull();
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });

  it('preserves task progress when the submitted Case Type selection is unchanged', () => {
    const selection = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection(selection);

    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().orderDetails).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('preserves task progress when the submitted outbound Case Type is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection(selection);

    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().orderDetails).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it.each([
    [
      'REMO In with Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      true,
    ],
    [
      'REMO In with Organisation',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      true,
    ],
    ['REMO Out without Applicant Type', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }, true],
    ['REMO Out (CMS) without Applicant Type', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }, true],
    [
      'REMO In without Applicant Type',
      { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO In with an unsupported Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: 'Unsupported',
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO Out carrying Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO Out (CMS) carrying Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    ['an unsupported Case Type', { caseType: 'Unsupported' } as unknown as CasesCreateCasefileCaseTypeSelection, false],
  ])('marks %s selection complete: %s', (_description, selection, expectedComplete) => {
    store.setCaseTypeSelection(selection);

    expect(store.caseTypeComplete()).toBe(expectedComplete);
  });

  it('preserves only Case Type as unsaved screen data when returning to Case Type', () => {
    const selection = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'centralAuthority', 'orderDetails');

    store.resetForCaseTypeEdit();

    expect(store.caseTypeSelection()).toEqual(selection);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
    expect(store.stateChanges()).toBe(false);
    expect(store.unsavedChanges()).toBe(true);
  });

  it('discards an invalid saved Case Type selection when returning to Case Type', () => {
    const invalidSelection = { caseType: 'Unsupported' } as unknown as CasesCreateCasefileCaseTypeSelection;
    store.setCaseTypeSelection(invalidSelection);

    store.resetForCaseTypeEdit();

    expect(store.caseTypeSelection()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
    expect(store.stateChanges()).toBe(false);
  });

  it('clears applicant data when resetting for Case Type edit', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setApplicantDetails(applicant);

    store.resetForCaseTypeEdit();

    expect(store.applicantDetails()).toBeNull();
  });

  it('clears Order Details when resetting for Case Type edit', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setOrderDetails(orderDetails);

    store.resetForCaseTypeEdit();

    expect(store.orderDetails()).toBeNull();
  });

  it('resets the complete journey state', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    provide('respondent', 'centralAuthority');
    store.setUnsavedChanges(true);

    store.resetStore();

    expect(store.caseTypeSelection()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });

  it('clears applicant data when resetting the store', () => {
    store.setApplicantDetails(applicant);

    store.resetStore();

    expect(store.applicantDetails()).toBeNull();
  });

  it('keeps a pending Result separate from completion and clears it on journey reset', () => {
    const statuses = { ...store.taskStatuses() };
    store.setPendingOrderTermResultId('MOCK01');
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
    expect(store.taskStatuses()).toEqual(statuses);
    store.resetStore();
    expect(store.pendingOrderTermResultId()).toBeNull();
  });

  it('preserves the pending ID for the same case type and clears it for another', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setPendingOrderTermResultId('MOCK01');
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });
    expect(store.pendingOrderTermResultId()).toBeNull();
  });

  it('clears pending selection when returning to edit case type', () => {
    store.setPendingOrderTermResultId('MOCK01');
    store.resetForCaseTypeEdit();
    expect(store.pendingOrderTermResultId()).toBeNull();
  });

  it('accepts once, clears draft and keeps frequency out of both states', () => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '12.30', frequency: 'Weekly', removed: 'stale' }, true);

    expect(store.orderTermDraft()?.values).toEqual({ amount: '12.30' });

    const term = { resultId: 'MAT', parameters: { amount: '12.30', frequency: 'Weekly', removed: 'stale' } };
    expect(store.acceptOrderTerm(term)).toBe(true);
    expect(store.acceptOrderTerm(term)).toBe(false);
    expect(store.orderTerms()).toEqual([
      { termId: 1, resultId: 'MAT', parameters: { amount: '12.30' }, creditor: null },
    ]);
    expect(store.currentOrderTermId()).toBe(1);
    expect(store.nextOrderTermId()).toBe(2);
    expect(store.orderTermDraft()).toBeNull();
    expect(store.taskStatuses().orderTerms).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
  });

  it('preserves compatible autocomplete option values in the in-memory draft', () => {
    const autocompletePage = {
      ...page,
      fields: [
        ...page.fields,
        {
          name: 'creditor',
          id: 'create_casefile_order_terms_input_creditor',
          label: 'Creditor',
          kind: 'autocomplete' as const,
          required: false,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [{ value: 'C1', label: 'Creditor one' }],
          lookup: null,
        },
      ],
    };
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(autocompletePage);
    store.updateOrderTermDraft({ amount: '12.30', creditor: 'C1' }, true);

    store.prepareOrderTermDraft(autocompletePage);

    expect(store.orderTermDraft()).toMatchObject({
      values: { amount: '12.30', creditor: 'C1' },
    });
  });

  it('accepts intentional additions of the same Result as distinct terms', () => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);

    expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '2.00' } })).toBe(true);
    expect(store.orderTerms()).toEqual([
      { termId: 1, resultId: 'MAT', parameters: { amount: '1.00' }, creditor: null },
      { termId: 2, resultId: 'MAT', parameters: { amount: '2.00' }, creditor: null },
    ]);
  });

  it('assigns only the current instance of a repeated result', () => {
    const first = acceptMat();
    const second = acceptMat();

    expect(second).not.toBe(first);
    expect(store.assignCurrentOrderTermCreditor(second, { type: 'applicant' })).toBe(true);
    expect(store.orderTerms().map((term) => term.creditor)).toEqual([null, { type: 'applicant' }]);
    expect(store.assignCurrentOrderTermCreditor(first, { type: 'applicant' })).toBe(false);
    expect(store.replaceAcceptedOrderTerm(second, { resultId: 'MAT', parameters: { amount: '24.60' } })).toBe(true);
    expect(store.orderTerms()[1]).toEqual({
      ...store.orderTerms()[1],
      termId: second,
      creditor: { type: 'applicant' },
      parameters: { amount: '24.60' },
    });
  });

  it('removes minor details only when their final reference disappears', () => {
    patchState(stateSource, {
      currentOrderTermId: 2,
      nextOrderTermId: 3,
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
      orderTerms: [1, 2].map((termId) => ({
        termId,
        resultId: 'MAT',
        parameters: { amount: '12.30' },
        creditor: { type: 'minor' as const, sequenceNumber: 1 },
      })),
    });

    expect(store.assignCurrentOrderTermCreditor(2, { type: 'applicant' })).toBe(true);
    expect(store.minorCreditors()).toHaveLength(1);
    expect(store.removeAcceptedOrderTerm(1)).toBe(true);
    expect(store.minorCreditors()).toEqual([]);
    expect(store.nextMinorCreditorSequence()).toBe(2);
  });

  it('keeps minor details when deleting one of two references and removes them with the last reference', () => {
    patchState(stateSource, {
      currentOrderTermId: 2,
      nextOrderTermId: 3,
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
      orderTerms: [1, 2].map((termId) => ({
        termId,
        resultId: 'MAT',
        parameters: { amount: '12.30' },
        creditor: { type: 'minor' as const, sequenceNumber: 1 },
      })),
    });

    expect(store.removeAcceptedOrderTerm(1)).toBe(true);
    expect(store.minorCreditors()).toEqual([minorCreditor(1)]);
    expect(store.removeAcceptedOrderTerm(2)).toBe(true);
    expect(store.minorCreditors()).toEqual([]);
    expect(store.currentOrderTermId()).toBeNull();
  });

  it.each([
    ['unknown term', 999, { type: 'applicant' } as const],
    ['non-positive major ID', 1, { type: 'major', majorCreditorId: 0 } as const],
    ['fractional major ID', 1, { type: 'major', majorCreditorId: 1.5 } as const],
    ['zero minor sequence', 1, { type: 'minor', sequenceNumber: 0 } as const],
    ['negative minor sequence', 1, { type: 'minor', sequenceNumber: -1 } as const],
    ['fractional minor sequence', 1, { type: 'minor', sequenceNumber: 1.5 } as const],
    ['unknown minor sequence', 1, { type: 'minor', sequenceNumber: 99 } as const],
  ])('rejects a %s creditor assignment', (_description, termId, creditor) => {
    const acceptedId = acceptMat();

    expect(store.assignCurrentOrderTermCreditor(termId === 1 ? acceptedId : termId, creditor)).toBe(false);
    expect(store.orderTerms()[0].creditor).toBeNull();
  });

  it('preserves distinct minor creditors with duplicate display names in creation order', () => {
    patchState(stateSource, {
      currentOrderTermId: 5,
      nextOrderTermId: 6,
      nextMinorCreditorSequence: 6,
      minorCreditors: [1, 2, 3, 4, 5].map((sequenceNumber) => minorCreditor(sequenceNumber)),
      orderTerms: [1, 2, 3, 4, 5].map((termId) => ({
        termId,
        resultId: 'MAT',
        parameters: { amount: `${termId}.00` },
        creditor: { type: 'minor' as const, sequenceNumber: termId },
      })),
    });

    expect(store.assignCurrentOrderTermCreditor(5, { type: 'minor', sequenceNumber: 5 })).toBe(true);
    expect(store.minorCreditors().map((creditor) => creditor.sequenceNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(store.minorCreditors().map((creditor) => creditor.displayName)).toEqual(Array(5).fill('Synthetic creditor'));
  });

  it('rejects an existing minor creditor that is not associated with an accepted term', () => {
    const termId = acceptMat();
    patchState(stateSource, {
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
    });

    expect(store.assignCurrentOrderTermCreditor(termId, { type: 'minor', sequenceNumber: 1 })).toBe(false);
  });

  it('sets and clears add-new creditor intent only for the current accepted term', () => {
    const termId = acceptMat();

    expect(store.setPendingNewMinorCreditor(termId)).toBe(true);
    expect(store.creditorDraft()).toEqual({ termId, branch: 'add-new' });
    expect(store.setPendingNewMinorCreditor(termId + 1)).toBe(false);
    store.clearCreditorDraft();
    expect(store.creditorDraft()).toBeNull();
  });

  it('creates and assigns a minor creditor in one accepted state', () => {
    patchState(stateSource, {
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      currentOrderTermId: 1,
      creditorDraft: { termId: 1, branch: 'add-new' },
      nextMinorCreditorSequence: 4,
      unsavedChanges: true,
    });

    expect(store.acceptNewMinorCreditor(1, MINOR_CREDITOR_DETAILS_MOCK)).toBe(4);
    expect(store.minorCreditors()).toEqual([
      { sequenceNumber: 4, displayName: 'Example creditor', details: MINOR_CREDITOR_DETAILS_MOCK },
    ]);
    expect(store.minorCreditors()[0].details).not.toBe(MINOR_CREDITOR_DETAILS_MOCK);
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 4 });
    expect(store.nextMinorCreditorSequence()).toBe(5);
    expect(store.creditorDraft()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);

    expect(store.acceptNewMinorCreditor(1, MINOR_CREDITOR_DETAILS_MOCK)).toBeNull();
    expect(store.nextMinorCreditorSequence()).toBe(5);
  });

  it('stages a replacement without changing the prior assignment or sequence', () => {
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'applicant' } }],
      creditorDraft: { termId: 1, branch: 'add-new' },
      nextMinorCreditorSequence: 1,
    });

    expect(store.savePendingMinorCreditorDetails(1, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom')).toBe(true);
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' });
    expect(store.minorCreditors()).toEqual([]);
    expect(store.nextMinorCreditorSequence()).toBe(1);
    expect(store.creditorDraft()).toMatchObject({
      termId: 1,
      details: MINOR_CREDITOR_DETAILS_MOCK,
      countryName: 'United Kingdom',
    });

    expect(store.acceptPendingMinorCreditor(1)).toBe(1);
    expect(store.minorCreditors()[0].details).toEqual(MINOR_CREDITOR_DETAILS_MOCK);
    expect(store.minorCreditors()[0].details).not.toHaveProperty('countryName');
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 1 });
    expect(store.creditorDraft()).toBeNull();
    expect(store.acceptPendingMinorCreditor(1)).toBeNull();
    expect(store.nextMinorCreditorSequence()).toBe(2);
  });

  it.each([
    ['absent current term', { currentOrderTermId: null }],
    ['nonexistent term', { orderTerms: [] }],
    ['mismatched draft', { creditorDraft: { termId: 2, branch: 'add-new' as const } }],
    ['absent country label', {}, ''],
  ])(
    'rejects pending minor creditor staging for %s without mutation',
    (_description, override, countryName = 'United Kingdom') => {
      patchState(stateSource, {
        currentOrderTermId: 1,
        orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
        creditorDraft: { termId: 1, branch: 'add-new' },
        unsavedChanges: true,
        stateChanges: false,
        ...override,
      });
      const before = structuredClone({
        orderTerms: store.orderTerms(),
        minorCreditors: store.minorCreditors(),
        nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
        creditorDraft: store.creditorDraft(),
        unsavedChanges: store.unsavedChanges(),
        stateChanges: store.stateChanges(),
      });

      expect(store.savePendingMinorCreditorDetails(1, MINOR_CREDITOR_DETAILS_MOCK, countryName)).toBe(false);
      expect({
        orderTerms: store.orderTerms(),
        minorCreditors: store.minorCreditors(),
        nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
        creditorDraft: store.creditorDraft(),
        unsavedChanges: store.unsavedChanges(),
        stateChanges: store.stateChanges(),
      }).toEqual(before);
    },
  );

  it('clones staged details and keeps accepted details isolated from later input mutation', () => {
    const details = structuredClone(MINOR_CREDITOR_DETAILS_MOCK);
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      creditorDraft: { termId: 1, branch: 'add-new' },
    });

    expect(store.savePendingMinorCreditorDetails(1, details, 'United Kingdom')).toBe(true);
    if (details.identity.type === 'organisation') details.identity.organisationName = 'Mutated input';
    expect(store.creditorDraft()?.details).toEqual(MINOR_CREDITOR_DETAILS_MOCK);

    expect(store.acceptPendingMinorCreditor(1)).toBe(1);
    if (details.identity.type === 'organisation') details.identity.organisationName = 'Mutated again';
    expect(store.minorCreditors()[0].details).toEqual(MINOR_CREDITOR_DETAILS_MOCK);
  });

  it('stages an accepted edit and updates its sequence only on acceptance', () => {
    const existing = minorCreditor(3, 'Previous name');
    const details = {
      ...MINOR_CREDITOR_DETAILS_MOCK,
      identity: { type: 'organisation' as const, organisationName: 'Updated name' },
    };
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 3 } }],
      minorCreditors: [existing],
      nextMinorCreditorSequence: 4,
      creditorDraft: null,
    });

    expect(store.savePendingMinorCreditorDetails(1, details, 'United Kingdom')).toBe(true);
    expect(store.creditorDraft()).toMatchObject({ existingSequenceNumber: 3, details, countryName: 'United Kingdom' });
    expect(store.minorCreditors()).toEqual([existing]);
    expect(store.nextMinorCreditorSequence()).toBe(4);

    expect(store.acceptPendingMinorCreditor(1)).toBe(3);
    expect(store.minorCreditors()[0]).toMatchObject({ sequenceNumber: 3, displayName: 'Updated name', details });
    expect(store.nextMinorCreditorSequence()).toBe(4);
    expect(store.creditorDraft()).toBeNull();
  });

  it('rejects pending accepted edits when their assignment disappears', () => {
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 3 } }],
      minorCreditors: [minorCreditor(3, 'Previous name')],
      nextMinorCreditorSequence: 4,
      creditorDraft: null,
    });
    expect(store.savePendingMinorCreditorDetails(1, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom')).toBe(true);
    patchState(stateSource, { orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }] });
    const before = structuredClone(store.creditorDraft());

    expect(store.acceptPendingMinorCreditor(1)).toBeNull();
    expect(store.creditorDraft()).toEqual(before);
    expect(store.minorCreditors()[0].displayName).toBe('Previous name');
    expect(store.nextMinorCreditorSequence()).toBe(4);
  });

  it.each([
    ['absent current term', { currentOrderTermId: null }],
    ['nonexistent term', { orderTerms: [] }],
    [
      'mismatched draft',
      {
        creditorDraft: {
          termId: 2,
          branch: 'add-new' as const,
          details: MINOR_CREDITOR_DETAILS_MOCK,
          countryName: 'United Kingdom',
        },
      },
    ],
    ['absent details', { creditorDraft: { termId: 1, branch: 'add-new' as const, countryName: 'United Kingdom' } }],
    [
      'absent country label',
      { creditorDraft: { termId: 1, branch: 'add-new' as const, details: MINOR_CREDITOR_DETAILS_MOCK } },
    ],
  ])('rejects pending minor creditor acceptance for %s without mutation', (_description, override) => {
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      nextMinorCreditorSequence: 4,
      creditorDraft: {
        termId: 1,
        branch: 'add-new',
        details: MINOR_CREDITOR_DETAILS_MOCK,
        countryName: 'United Kingdom',
      },
      unsavedChanges: false,
      stateChanges: false,
      ...override,
    });
    const before = structuredClone({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    });

    expect(store.acceptPendingMinorCreditor(1)).toBeNull();
    expect({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });

  it('keeps a shared prior creditor and prunes only an orphan when accepting a pending replacement', () => {
    const shared = minorCreditor(1, 'Shared creditor');
    const orphan = minorCreditor(2, 'Replaced creditor');
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [
        { termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 2 } },
        { termId: 2, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 1 } },
        { termId: 3, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 1 } },
      ],
      minorCreditors: [shared, orphan],
      nextMinorCreditorSequence: 3,
      creditorDraft: {
        termId: 1,
        branch: 'add-new',
        details: MINOR_CREDITOR_DETAILS_MOCK,
        countryName: 'United Kingdom',
      },
    });

    expect(store.acceptPendingMinorCreditor(1)).toBe(3);
    expect(store.minorCreditors().map((creditor) => creditor.sequenceNumber)).toEqual([1, 3]);
    expect(store.orderTerms().map((term) => term.creditor)).toEqual([
      { type: 'minor', sequenceNumber: 3 },
      { type: 'minor', sequenceNumber: 1 },
      { type: 'minor', sequenceNumber: 1 },
    ]);
  });

  it('builds an Individual display name from nonblank identity parts', () => {
    const details = {
      ...MINOR_CREDITOR_DETAILS_MOCK,
      identity: { type: 'individual' as const, title: null, firstNames: 'Synthetic', lastName: 'Person' },
    };
    patchState(stateSource, {
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      currentOrderTermId: 1,
      creditorDraft: { termId: 1, branch: 'add-new' },
    });

    expect(store.acceptNewMinorCreditor(1, details)).toBe(1);
    expect(store.minorCreditors()[0].displayName).toBe('Synthetic Person');
  });

  it('allocates sequential creditors and removes only the replaced orphan', () => {
    const retained = minorCreditor(1, 'Retained creditor');
    const replaced = minorCreditor(2, 'Replaced creditor');
    patchState(stateSource, {
      orderTerms: [
        { termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 1 } },
        { termId: 2, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 2 } },
        { termId: 3, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 1 } },
      ],
      currentOrderTermId: 2,
      minorCreditors: [retained, replaced],
      creditorDraft: { termId: 2, branch: 'add-new' },
      nextMinorCreditorSequence: 3,
    });

    expect(store.acceptNewMinorCreditor(2, MINOR_CREDITOR_DETAILS_MOCK)).toBe(3);
    expect(store.minorCreditors()).toEqual([
      retained,
      { sequenceNumber: 3, displayName: 'Example creditor', details: MINOR_CREDITOR_DETAILS_MOCK },
    ]);

    patchState(stateSource, { currentOrderTermId: 3 });
    expect(store.setPendingNewMinorCreditor(3)).toBe(true);
    expect(store.acceptNewMinorCreditor(3, MINOR_CREDITOR_DETAILS_MOCK)).toBe(4);
    expect(store.nextMinorCreditorSequence()).toBe(5);
  });

  it.each([
    ['different current term', { currentOrderTermId: 2 }],
    ['absent term', { orderTerms: [] }],
    ['absent pending draft', { creditorDraft: null }],
    ['mismatched pending draft', { creditorDraft: { termId: 2, branch: 'add-new' as const } }],
  ])('rejects new minor creditor acceptance for %s without mutation', (_description, override) => {
    patchState(stateSource, {
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: null }],
      currentOrderTermId: 1,
      creditorDraft: { termId: 1, branch: 'add-new' },
      nextMinorCreditorSequence: 4,
      unsavedChanges: true,
      stateChanges: false,
      ...override,
    });
    const before = structuredClone({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    });

    expect(store.acceptNewMinorCreditor(1, MINOR_CREDITOR_DETAILS_MOCK)).toBeNull();
    expect({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });

  it('updates the exact assigned creditor without changing its sequence or other references', () => {
    const existing = minorCreditor(3, 'Previous name');
    const other = minorCreditor(4, 'Other creditor');
    const details = {
      ...MINOR_CREDITOR_DETAILS_MOCK,
      identity: { type: 'individual' as const, title: 'Dr', firstNames: 'Synthetic', lastName: 'Person' },
    };
    patchState(stateSource, {
      orderTerms: [
        { termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 3 } },
        { termId: 2, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 3 } },
        { termId: 3, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 4 } },
      ],
      currentOrderTermId: 1,
      minorCreditors: [existing, other],
      nextMinorCreditorSequence: 5,
      unsavedChanges: true,
    });

    expect(store.updateAssignedMinorCreditor(1, 3, details)).toBe(true);
    expect(store.minorCreditors()).toEqual([{ sequenceNumber: 3, displayName: 'Dr Synthetic Person', details }, other]);
    expect(store.minorCreditors()[0].details).not.toBe(details);
    expect(store.orderTerms().map((term) => term.creditor)).toEqual([
      { type: 'minor', sequenceNumber: 3 },
      { type: 'minor', sequenceNumber: 3 },
      { type: 'minor', sequenceNumber: 4 },
    ]);
    expect(store.nextMinorCreditorSequence()).toBe(5);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it.each([
    ['different current term', { currentOrderTermId: 2 }],
    ['absent term', { orderTerms: [] }],
    ['pending add-new draft', { creditorDraft: { termId: 1, branch: 'add-new' as const } }],
    [
      'different assignment',
      {
        orderTerms: [
          { termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor' as const, sequenceNumber: 4 } },
        ],
      },
    ],
    ['missing creditor', { minorCreditors: [] }],
  ])('rejects assigned minor creditor update for %s without mutation', (_description, override) => {
    patchState(stateSource, {
      orderTerms: [{ termId: 1, resultId: 'MAT', parameters: {}, creditor: { type: 'minor', sequenceNumber: 3 } }],
      currentOrderTermId: 1,
      minorCreditors: [minorCreditor(3, 'Previous name')],
      nextMinorCreditorSequence: 4,
      creditorDraft: null,
      unsavedChanges: true,
      stateChanges: false,
      ...override,
    });
    const before = structuredClone({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    });

    expect(store.updateAssignedMinorCreditor(1, 3, MINOR_CREDITOR_DETAILS_MOCK)).toBe(false);
    expect({
      orderTerms: store.orderTerms(),
      minorCreditors: store.minorCreditors(),
      nextMinorCreditorSequence: store.nextMinorCreditorSequence(),
      creditorDraft: store.creditorDraft(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });

  it('rejects replacement for stale identity or a different result', () => {
    const first = acceptMat();
    const second = acceptMat();

    expect(store.replaceAcceptedOrderTerm(first, { resultId: 'MAT', parameters: { amount: '2.00' } })).toBe(false);
    expect(store.replaceAcceptedOrderTerm(second, { resultId: 'MCHILD', parameters: { amount: '2.00' } })).toBe(false);
  });

  it('removes an accepted term and clears its current context and draft while preserving counters', () => {
    const termId = acceptMat();
    expect(store.setPendingNewMinorCreditor(termId)).toBe(true);

    expect(store.removeAcceptedOrderTerm(termId)).toBe(true);
    expect(store.removeAcceptedOrderTerm(termId)).toBe(false);
    expect(store.orderTerms()).toEqual([]);
    expect(store.currentOrderTermId()).toBeNull();
    expect(store.creditorDraft()).toBeNull();
    expect(store.nextOrderTermId()).toBe(2);
    expect(store.nextMinorCreditorSequence()).toBe(1);
  });

  it('replaces one accepted term after a failed navigation without appending another', () => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });

    expect(store.replaceAcceptedOrderTerm(1, { resultId: 'MAT', parameters: { amount: '2.00' } })).toBe(true);
    expect(store.replaceAcceptedOrderTerm(2, { resultId: 'MAT', parameters: { amount: '3.00' } })).toBe(false);
    expect(store.orderTerms()).toEqual([
      { termId: 1, resultId: 'MAT', parameters: { amount: '2.00' }, creditor: null },
    ]);
  });

  it('discards a later draft without losing accepted terms', () => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '2' }, true);

    store.discardOrderTermDraft();

    expect(store.orderTerms()).toEqual([
      { termId: 1, resultId: 'MAT', parameters: { amount: '1.00' }, creditor: null },
    ]);
    expect(store.orderTermDraft()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
  });

  it('rejects terms without a compatible active draft', () => {
    expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } })).toBe(false);

    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);

    expect(store.acceptOrderTerm({ resultId: 'MCHILD', parameters: { amount: '1.00' } })).toBe(false);
    expect(store.orderTerms()).toEqual([]);
    expect(store.orderTermDraft()?.resultId).toBe('MAT');
  });

  it('clears only the draft when the pending Result is cleared', () => {
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);

    store.setPendingOrderTermResultId(null);

    expect(store.pendingOrderTermResultId()).toBeNull();
    expect(store.orderTermDraft()).toBeNull();
    expect(store.orderTerms()).toEqual([
      { termId: 1, resultId: 'MAT', parameters: { amount: '1.00' }, creditor: null },
    ]);
    expect(store.currentOrderTermId()).toBeNull();
  });

  it('preserves accepted terms and drafts for the same Case Type', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '1.00' }, true);
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ ...store.orderTerms()[0], creditor: { type: 'minor', sequenceNumber: 1 } }],
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
      creditorDraft: { termId: 1, branch: 'add-new' },
    });

    store.setCaseTypeSelection(selection);

    expect(store.orderTerms()).toEqual([
      {
        termId: 1,
        resultId: 'MAT',
        parameters: { amount: '1.00' },
        creditor: { type: 'minor', sequenceNumber: 1 },
      },
    ]);
    expect(store.orderTermDraft()?.values).toEqual({ amount: '1.00' });
    expect(store.pendingOrderTermResultId()).toBe('MAT');
    expect(store.currentOrderTermId()).toBe(1);
    expect(store.nextOrderTermId()).toBe(2);
    expect(store.minorCreditors()).toEqual([minorCreditor(1)]);
    expect(store.nextMinorCreditorSequence()).toBe(2);
    expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
  });

  it('clears accepted terms and drafts when the Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ ...store.orderTerms()[0], creditor: { type: 'minor', sequenceNumber: 1 } }],
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
      creditorDraft: { termId: 1, branch: 'add-new' },
    });

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.orderTerms()).toEqual([]);
    expect(store.orderTermDraft()).toBeNull();
    expect(store.currentOrderTermId()).toBeNull();
    expect(store.nextOrderTermId()).toBe(1);
    expect(store.minorCreditors()).toEqual([]);
    expect(store.nextMinorCreditorSequence()).toBe(1);
    expect(store.creditorDraft()).toBeNull();
  });

  it.each(['resetForCaseTypeEdit', 'resetStore'] as const)('clears accepted terms and drafts on %s', (method) => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft(page);
    patchState(stateSource, {
      currentOrderTermId: 1,
      orderTerms: [{ ...store.orderTerms()[0], creditor: { type: 'minor', sequenceNumber: 1 } }],
      minorCreditors: [minorCreditor(1)],
      nextMinorCreditorSequence: 2,
      creditorDraft: { termId: 1, branch: 'add-new' },
    });

    store[method]();

    expect(store.orderTerms()).toEqual([]);
    expect(store.orderTermDraft()).toBeNull();
    expect(store.currentOrderTermId()).toBeNull();
    expect(store.nextOrderTermId()).toBe(1);
    expect(store.minorCreditors()).toEqual([]);
    expect(store.nextMinorCreditorSequence()).toBe(1);
    expect(store.creditorDraft()).toBeNull();
  });
});
