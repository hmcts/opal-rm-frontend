import { TestBed } from '@angular/core/testing';
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
import type { ICasesCreateCasefileApplicantIndividual } from '../interfaces/cases-create-casefile-applicant-individual.interface';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('CasesCreateCasefileStore', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;

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

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  const provide = (...tasks: CasesCreateCasefileTask[]): void => {
    tasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
  };

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
});
