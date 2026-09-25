import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES,
  CASES_CREATE_CASEFILE_STATE,
} from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileCommentsNotes } from '../interfaces/cases-create-casefile-comments-notes.interface';
import type { ICasesCreateCasefileInterestIndexation } from '../interfaces/cases-create-casefile-interest-indexation.interface';
import type { ICasesCreateCasefileCentralAuthorityDetails } from '../interfaces/cases-create-casefile-central-authority-details.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileOrderDetails } from '../interfaces/cases-create-casefile-order-details.interface';
import type { ICasesCreateCasefileOrderTerm } from '../interfaces/cases-create-casefile-order-term.interface';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import type { CasesCreateCasefileCreditorAssignment } from '../types/cases-create-casefile-creditor-assignment.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from '../utils/cases-create-casefile-case-type-selection';
import { associatedMinorCreditors } from '../utils/cases-create-casefile-associated-minor-creditors';
import type { ICasesCreateCasefileOrderTermPage } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../cases-create-casefile-order-terms-input/types/cases-create-casefile-order-term-raw-value.type';
import { restoreOrderTermDraft } from '../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-draft';

const normalizeOptionalText = (value: string | null): string | null => (value?.trim() ? value : null);

const areCaseTypeSelectionsEqual = (
  currentSelection: CasesCreateCasefileCaseTypeSelection | null,
  nextSelection: CasesCreateCasefileCaseTypeSelection,
): boolean => {
  if (currentSelection?.caseType !== nextSelection.caseType) {
    return false;
  }

  if (
    currentSelection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN &&
    nextSelection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN
  ) {
    return currentSelection.applicantType === nextSelection.applicantType;
  }

  return true;
};

export const CasesCreateCasefileStore = signalStore(
  { providedIn: 'root' },
  withState({ ...CASES_CREATE_CASEFILE_STATE, taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } }),
  withComputed((store) => {
    const partyDetailsComplete = computed(
      () =>
        store.taskStatuses().respondent === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED &&
        store.taskStatuses().applicant === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
    );
    const orderDetailsAvailable = computed(() => partyDetailsComplete());
    const remainingOrderTasksAvailable = computed(
      () =>
        partyDetailsComplete() && store.taskStatuses().orderDetails === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
    );
    const checkCaseAvailable = computed(() =>
      [
        store.taskStatuses().respondent,
        store.taskStatuses().applicant,
        store.taskStatuses().orderDetails,
        store.taskStatuses().orderTerms,
        store.taskStatuses().interestAndIndexation,
        store.taskStatuses().managingPayments,
      ].every((status) => status === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED),
    );

    return {
      caseTypeComplete: computed(() => isCasesCreateCasefileCaseTypeSelectionValid(store.caseTypeSelection())),
      partyDetailsComplete,
      orderDetailsAvailable,
      remainingOrderTasksAvailable,
      checkCaseAvailable,
    };
  }),
  withMethods((store) => ({
    setCaseTypeSelection: (caseTypeSelection: CasesCreateCasefileCaseTypeSelection): void => {
      const selectionUnchanged = areCaseTypeSelectionsEqual(store.caseTypeSelection(), caseTypeSelection);
      const taskStatuses = selectionUnchanged
        ? store.taskStatuses()
        : { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES };

      patchState(store, {
        caseTypeSelection,
        applicantDetails: selectionUnchanged ? store.applicantDetails() : null,
        respondentDetails: selectionUnchanged ? store.respondentDetails() : null,
        orderDetails: selectionUnchanged ? store.orderDetails() : null,
        interestAndIndexation: selectionUnchanged ? store.interestAndIndexation() : null,
        centralAuthorityDetails: selectionUnchanged ? store.centralAuthorityDetails() : null,
        paymentArrangement: selectionUnchanged ? store.paymentArrangement() : null,
        orderTerms: selectionUnchanged ? store.orderTerms() : [],
        currentOrderTermId: selectionUnchanged ? store.currentOrderTermId() : null,
        nextOrderTermId: selectionUnchanged ? store.nextOrderTermId() : 1,
        minorCreditors: selectionUnchanged ? store.minorCreditors() : [],
        nextMinorCreditorSequence: selectionUnchanged ? store.nextMinorCreditorSequence() : 1,
        creditorDraft: selectionUnchanged ? store.creditorDraft() : null,
        orderTermDraft: selectionUnchanged ? store.orderTermDraft() : null,
        commentsAndNotes: selectionUnchanged ? store.commentsAndNotes() : null,
        pendingOrderTermResultId: selectionUnchanged ? store.pendingOrderTermResultId() : null,
        taskStatuses,
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setRespondentDetails: (respondentDetails: ICasesCreateCasefileRespondentDetails): void => {
      patchState(store, {
        respondentDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          respondent: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setApplicantDetails: (applicantDetails: CasesCreateCasefileApplicantDetails): void => {
      patchState(store, {
        applicantDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          applicant: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setOrderDetails: (orderDetails: ICasesCreateCasefileOrderDetails): void => {
      patchState(store, {
        orderDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          orderDetails: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setInterestAndIndexation: (interestAndIndexation: ICasesCreateCasefileInterestIndexation): void => {
      patchState(store, {
        interestAndIndexation,
        taskStatuses: {
          ...store.taskStatuses(),
          interestAndIndexation: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setCentralAuthorityDetails: (details: ICasesCreateCasefileCentralAuthorityDetails): void => {
      const centralAuthorityDetails: ICasesCreateCasefileCentralAuthorityDetails = {
        remoReference: normalizeOptionalText(details.remoReference),
        centralAuthorityReference: normalizeOptionalText(details.centralAuthorityReference),
        majorCreditor: details.majorCreditor,
      };
      const provided =
        centralAuthorityDetails.remoReference !== null ||
        centralAuthorityDetails.centralAuthorityReference !== null ||
        centralAuthorityDetails.majorCreditor !== null;

      patchState(store, {
        centralAuthorityDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          centralAuthority: provided
            ? CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED
            : CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setPaymentArrangement: (paymentArrangement: CasesCreateCasefilePaymentArrangement): void => {
      patchState(store, {
        paymentArrangement,
        taskStatuses: {
          ...store.taskStatuses(),
          managingPayments: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setCommentsAndNotes: (commentsAndNotes: ICasesCreateCasefileCommentsNotes): void => {
      const normalizedCommentsAndNotes: ICasesCreateCasefileCommentsNotes = {
        comment: normalizeOptionalText(commentsAndNotes.comment),
        note: normalizeOptionalText(commentsAndNotes.note),
      };
      const hasProvidedValue = Object.values(normalizedCommentsAndNotes).some((value) => value !== null);

      patchState(store, {
        commentsAndNotes: normalizedCommentsAndNotes,
        taskStatuses: {
          ...store.taskStatuses(),
          commentsAndNotes: hasProvidedValue
            ? CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED
            : CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setTaskStatus: (task: CasesCreateCasefileTask, status: CasesCreateCasefileTaskStatus): void => {
      patchState(store, {
        taskStatuses: { ...store.taskStatuses(), [task]: status },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setUnsavedChanges: (unsavedChanges: boolean): void => {
      patchState(store, { unsavedChanges });
    },
    setPendingOrderTermResultId: (pendingOrderTermResultId: string | null): void => {
      patchState(store, {
        pendingOrderTermResultId,
        orderTermDraft: pendingOrderTermResultId === store.orderTermDraft()?.resultId ? store.orderTermDraft() : null,
        currentOrderTermId: null,
        creditorDraft: null,
      });
    },
    prepareOrderTermDraft: (page: ICasesCreateCasefileOrderTermPage): void => {
      if (store.pendingOrderTermResultId() !== page.resultId) return;

      patchState(store, { orderTermDraft: restoreOrderTermDraft(page, store.orderTermDraft()) });
    },
    updateOrderTermDraft: (values: Record<string, CasesCreateCasefileOrderTermRawValue>, dirty: boolean): void => {
      const draft = store.orderTermDraft();
      if (!draft) return;

      const safeValues = Object.fromEntries(
        Object.entries(values).filter(([name]) => name !== 'frequency' && Object.hasOwn(draft.fieldTypes, name)),
      );
      patchState(store, {
        orderTermDraft: { ...draft, values: safeValues, dirty },
        unsavedChanges: dirty,
      });
    },
    acceptOrderTerm: (term: ICasesCreateCasefileOrderTerm): boolean => {
      const draft = store.orderTermDraft();
      if (!draft || term.resultId !== draft.resultId || term.resultId !== store.pendingOrderTermResultId())
        return false;

      const parameters = Object.fromEntries(
        Object.entries(term.parameters).filter(
          ([name]) => name !== 'frequency' && Object.hasOwn(draft.fieldTypes, name),
        ),
      );
      const termId = store.nextOrderTermId();
      patchState(store, {
        orderTerms: [...store.orderTerms(), { resultId: term.resultId, parameters, termId, creditor: null }],
        currentOrderTermId: termId,
        nextOrderTermId: termId + 1,
        creditorDraft: null,
        orderTermDraft: null,
        pendingOrderTermResultId: null,
        unsavedChanges: false,
        stateChanges: true,
      });
      return true;
    },
    replaceAcceptedOrderTerm: (termId: number, term: ICasesCreateCasefileOrderTerm): boolean => {
      if (store.currentOrderTermId() !== termId) return false;
      const accepted = store.orderTerms().find((existing) => existing.termId === termId);
      if (!accepted || accepted.resultId !== term.resultId) return false;

      const orderTerms = store
        .orderTerms()
        .map((existing) =>
          existing.termId === termId
            ? { ...existing, resultId: term.resultId, parameters: { ...term.parameters } }
            : existing,
        );
      patchState(store, { orderTerms, currentOrderTermId: termId, unsavedChanges: false, stateChanges: true });
      return true;
    },
    assignCurrentOrderTermCreditor: (termId: number, creditor: CasesCreateCasefileCreditorAssignment): boolean => {
      if (store.currentOrderTermId() !== termId || !store.orderTerms().some((term) => term.termId === termId)) {
        return false;
      }
      if (creditor.type === 'major' && (!Number.isInteger(creditor.majorCreditorId) || creditor.majorCreditorId <= 0)) {
        return false;
      }
      if (creditor.type === 'minor') {
        if (!Number.isInteger(creditor.sequenceNumber) || creditor.sequenceNumber <= 0) return false;
        const creditorExists = store
          .minorCreditors()
          .some((existing) => existing.sequenceNumber === creditor.sequenceNumber);
        const creditorIsAssociated = store
          .orderTerms()
          .some((term) => term.creditor?.type === 'minor' && term.creditor.sequenceNumber === creditor.sequenceNumber);
        if (!creditorExists || !creditorIsAssociated) return false;
      }

      const orderTerms = store
        .orderTerms()
        .map((term) => (term.termId === termId ? { ...term, creditor: { ...creditor } } : term));
      patchState(store, {
        orderTerms,
        minorCreditors: associatedMinorCreditors(orderTerms, store.minorCreditors()),
        creditorDraft: null,
        stateChanges: true,
        unsavedChanges: false,
      });
      return true;
    },
    removeAcceptedOrderTerm: (termId: number): boolean => {
      if (!store.orderTerms().some((term) => term.termId === termId)) return false;

      const orderTerms = store.orderTerms().filter((term) => term.termId !== termId);
      const removedCurrentTerm = store.currentOrderTermId() === termId;
      patchState(store, {
        orderTerms,
        minorCreditors: associatedMinorCreditors(orderTerms, store.minorCreditors()),
        currentOrderTermId: removedCurrentTerm ? null : store.currentOrderTermId(),
        creditorDraft: store.creditorDraft()?.termId === termId ? null : store.creditorDraft(),
        stateChanges: true,
        unsavedChanges: false,
      });
      return true;
    },
    setPendingNewMinorCreditor: (termId: number): boolean => {
      if (store.currentOrderTermId() !== termId || !store.orderTerms().some((term) => term.termId === termId)) {
        return false;
      }
      // PO-9809 owns allocating the next sequence, creating details and assigning the term atomically.
      patchState(store, { creditorDraft: { termId, branch: 'add-new' } });
      return true;
    },
    clearCreditorDraft: (): void => {
      patchState(store, { creditorDraft: null });
    },
    discardOrderTermDraft: (): void => {
      patchState(store, { orderTermDraft: null, unsavedChanges: false });
    },
    resetForCaseTypeEdit: (): void => {
      const caseTypeSelection = store.caseTypeSelection();
      const validSelection = isCasesCreateCasefileCaseTypeSelectionValid(caseTypeSelection) ? caseTypeSelection : null;

      patchState(store, {
        ...CASES_CREATE_CASEFILE_STATE,
        taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES },
        caseTypeSelection: validSelection,
        unsavedChanges: validSelection !== null,
        stateChanges: false,
      });
    },
    resetStore: (): void => {
      patchState(store, {
        ...CASES_CREATE_CASEFILE_STATE,
        taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES },
      });
    },
  })),
);
