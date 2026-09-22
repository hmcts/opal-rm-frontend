import { computed } from '@angular/core';
import { getState, patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
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
import type { ICasesCreateCasefileMinorCreditor } from '../interfaces/cases-create-casefile-minor-creditor.interface';
import type { ICasesCreateCasefileMinorCreditorDetails } from '../interfaces/cases-create-casefile-minor-creditor-details.interface';
import type { ICasesCreateCasefileCreditorDraft } from '../interfaces/cases-create-casefile-creditor-draft.interface';
import type { ICasesCreateCasefileOrderTermAmendment } from '../interfaces/cases-create-casefile-order-term-amendment.interface';
import type { ICasesCreateCasefileOrderTermRemoval } from '../interfaces/cases-create-casefile-order-term-removal.interface';
import type { ICasesCreateCasefileOrderTermPresentation } from '../interfaces/cases-create-casefile-order-term-presentation.interface';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import type { CasesCreateCasefileCreditorAssignment } from '../types/cases-create-casefile-creditor-assignment.type';
import type { CasesCreateCasefileMinorCreditorIdentity } from '../types/cases-create-casefile-minor-creditor-identity.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from '../utils/cases-create-casefile-case-type-selection';
import { associatedMinorCreditors } from '../utils/cases-create-casefile-associated-minor-creditors';
import type { ICasesCreateCasefileOrderTermPage } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../cases-create-casefile-order-terms-input/types/cases-create-casefile-order-term-raw-value.type';
import { restoreOrderTermDraft } from '../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-draft';
import { orderTermPresentation } from '../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-presentation';
import { buildOrderTermCard } from '../utils/cases-create-casefile-order-term-card';

const normalizeOptionalText = (value: string | null): string | null => (value?.trim() ? value : null);

const minorCreditorDisplayName = (identity: CasesCreateCasefileMinorCreditorIdentity): string =>
  identity.type === 'organisation'
    ? identity.organisationName
    : [identity.title, identity.firstNames, identity.lastName].filter(Boolean).join(' ');

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
        orderTermAmendment: selectionUnchanged ? store.orderTermAmendment() : null,
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
      if (store.orderTermAmendment()) return false;
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
        orderTerms: [
          ...store.orderTerms(),
          { resultId: term.resultId, parameters, termId, creditor: null, presentation: draft.presentation },
        ],
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
    replaceAcceptedOrderTerm: (
      termId: number,
      term: ICasesCreateCasefileOrderTerm,
      presentation?: ICasesCreateCasefileOrderTermPresentation,
    ): boolean => {
      if (store.orderTermAmendment() || store.currentOrderTermId() !== termId) return false;
      const accepted = store.orderTerms().find((existing) => existing.termId === termId);
      if (!accepted || accepted.resultId !== term.resultId) return false;

      const orderTerms = store.orderTerms().map((existing) =>
        existing.termId === termId
          ? {
              ...existing,
              resultId: term.resultId,
              parameters: { ...term.parameters },
              presentation: presentation ?? existing.presentation,
            }
          : existing,
      );
      patchState(store, { orderTerms, currentOrderTermId: termId, unsavedChanges: false, stateChanges: true });
      return true;
    },
    assignCurrentOrderTermCreditor: (termId: number, creditor: CasesCreateCasefileCreditorAssignment): boolean => {
      if (
        store.orderTermAmendment() ||
        store.currentOrderTermId() !== termId ||
        !store.orderTerms().some((term) => term.termId === termId)
      ) {
        return false;
      }
      if (
        creditor.type === 'major' &&
        (!Number.isInteger(creditor.majorCreditorId) || creditor.majorCreditorId <= 0 || !creditor.displayName.trim())
      ) {
        return false;
      }
      if (creditor.type === 'minor') {
        if (!Number.isInteger(creditor.sequenceNumber) || creditor.sequenceNumber <= 0) return false;
        const creditorExists = store
          .minorCreditors()
          .some((existing) => existing.sequenceNumber === creditor.sequenceNumber);
        if (!creditorExists) return false;
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
      if (store.orderTermAmendment()) return false;
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
      const amendment = store.orderTermAmendment();
      if (amendment) {
        if (!amendment.inputComplete || amendment.termId !== termId) return false;
        const draft = store.creditorDraft();
        patchState(store, {
          orderTermAmendment: { ...amendment, ready: false },
          creditorDraft:
            draft?.termId === termId && draft.branch === 'add-new' && draft.existingSequenceNumber === undefined
              ? draft
              : { termId, branch: 'add-new' },
        });
        return true;
      }
      patchState(store, { creditorDraft: { termId, branch: 'add-new' } });
      return true;
    },
    savePendingMinorCreditorDetails: (
      termId: number,
      details: ICasesCreateCasefileMinorCreditorDetails,
      countryName: string,
    ): boolean => {
      const draft = store.creditorDraft();
      const term = store.orderTerms().find((item) => item.termId === termId);
      if (store.currentOrderTermId() !== termId || !term || !countryName) return false;
      if (draft && draft.termId !== termId) return false;

      const amendment = store.orderTermAmendment();
      if (amendment) {
        if (
          amendment.termId !== termId ||
          !amendment.inputComplete ||
          draft?.branch !== 'add-new' ||
          draft.existingSequenceNumber !== undefined
        )
          return false;
        patchState(store, {
          orderTermAmendment: { ...amendment, ready: false },
          creditorDraft: { ...draft, details: structuredClone(details), countryName },
          unsavedChanges: false,
        });
        return true;
      }

      const assignedSequence = term.creditor?.type === 'minor' ? term.creditor.sequenceNumber : undefined;
      if (
        !draft &&
        (assignedSequence === undefined ||
          !store.minorCreditors().some((item) => item.sequenceNumber === assignedSequence))
      )
        return false;
      if (draft?.existingSequenceNumber !== undefined && draft.existingSequenceNumber !== assignedSequence)
        return false;

      patchState(store, {
        creditorDraft: {
          ...(draft ?? { termId, branch: 'add-new' as const, existingSequenceNumber: assignedSequence }),
          details: structuredClone(details),
          countryName,
        },
        unsavedChanges: false,
      });
      return true;
    },
    acceptNewMinorCreditor: (termId: number, details: ICasesCreateCasefileMinorCreditorDetails): number | null => {
      if (
        store.orderTermAmendment() ||
        store.currentOrderTermId() !== termId ||
        !store.orderTerms().some((term) => term.termId === termId) ||
        store.creditorDraft()?.termId !== termId ||
        store.creditorDraft()?.branch !== 'add-new'
      ) {
        return null;
      }

      const sequenceNumber = store.nextMinorCreditorSequence();
      const creditor: ICasesCreateCasefileMinorCreditor = {
        sequenceNumber,
        displayName: minorCreditorDisplayName(details.identity),
        details: structuredClone(details),
      };
      const orderTerms = store
        .orderTerms()
        .map((term) =>
          term.termId === termId ? { ...term, creditor: { type: 'minor' as const, sequenceNumber } } : term,
        );
      patchState(store, {
        orderTerms,
        minorCreditors: associatedMinorCreditors(orderTerms, [...store.minorCreditors(), creditor]),
        nextMinorCreditorSequence: sequenceNumber + 1,
        creditorDraft: null,
        stateChanges: true,
        unsavedChanges: false,
      });
      return sequenceNumber;
    },
    updateAssignedMinorCreditor: (
      termId: number,
      sequenceNumber: number,
      details: ICasesCreateCasefileMinorCreditorDetails,
    ): boolean => {
      const term = store.orderTerms().find((candidate) => candidate.termId === termId);
      if (
        store.orderTermAmendment() ||
        store.currentOrderTermId() !== termId ||
        store.creditorDraft() !== null ||
        term?.creditor?.type !== 'minor' ||
        term.creditor.sequenceNumber !== sequenceNumber ||
        !store.minorCreditors().some((creditor) => creditor.sequenceNumber === sequenceNumber)
      ) {
        return false;
      }

      patchState(store, {
        minorCreditors: store.minorCreditors().map((creditor) =>
          creditor.sequenceNumber === sequenceNumber
            ? {
                ...creditor,
                displayName: minorCreditorDisplayName(details.identity),
                details: structuredClone(details),
              }
            : creditor,
        ),
        stateChanges: true,
        unsavedChanges: false,
      });
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
  withMethods((store) => ({
    beginOrderTermRemoval: (termId: number): ICasesCreateCasefileOrderTermRemoval | null => {
      if (store.orderTermAmendment()) return null;
      const index = store.orderTerms().findIndex((term) => term.termId === termId);
      if (index < 0) return null;
      const expectedTerm = store.orderTerms()[index];
      const selection = {
        index,
        termId,
        expectedTerm,
        presentationSignature: JSON.stringify(buildOrderTermCard(expectedTerm, getState(store))),
      };
      patchState(store, {
        orderTermRemoval: selection,
        orderTermRemovalOutcome: null,
        orderTermRemovalReturnFocusId: null,
      });
      return selection;
    },
    clearOrderTermRemoval: (expected: ICasesCreateCasefileOrderTermRemoval): void => {
      if (store.orderTermRemoval() === expected) patchState(store, { orderTermRemoval: null });
    },
    clearOrderTermRemovalOutcome: (): void => {
      patchState(store, { orderTermRemovalOutcome: null });
    },
    setOrderTermRemovalReturnFocusId: (termId: number | null): void => {
      patchState(store, { orderTermRemovalReturnFocusId: termId });
    },
  })),
  withMethods((store) => ({
    isOrderTermRemovalCurrent: (expected: ICasesCreateCasefileOrderTermRemoval): boolean => {
      const current = store.orderTerms().find((term) => term.termId === expected.termId);
      return (
        store.orderTermRemoval() === expected &&
        !store.orderTermAmendment() &&
        current === expected.expectedTerm &&
        JSON.stringify(buildOrderTermCard(current, getState(store))) === expected.presentationSignature
      );
    },
    markOrderTermRemovalUnavailable: (): void => {
      if (store.orderTermRemovalOutcome() === 'removed') return;
      patchState(store, {
        orderTermRemoval: null,
        orderTermRemovalOutcome: 'unavailable',
        orderTermRemovalReturnFocusId: null,
      });
    },
  })),
  withMethods((store) => ({
    confirmOrderTermRemoval: (expected: ICasesCreateCasefileOrderTermRemoval): boolean => {
      if (store.orderTermRemovalOutcome() === 'removed') return false;
      if (store.orderTermRemoval() !== expected) return false;
      if (!store.isOrderTermRemovalCurrent(expected)) {
        store.markOrderTermRemovalUnavailable();
        return false;
      }
      if (!store.removeAcceptedOrderTerm(expected.termId)) {
        store.markOrderTermRemovalUnavailable();
        return false;
      }
      patchState(store, {
        orderTermRemoval: null,
        orderTermRemovalOutcome: 'removed',
        orderTermRemovalReturnFocusId: null,
      });
      return true;
    },
  })),
  withMethods((store) => ({
    beginOrderTermAmendment: (termId: number): boolean => {
      const existing = store.orderTermAmendment();
      if (existing) return existing.termId === termId;
      const term = store.orderTerms().find((candidate) => candidate.termId === termId);
      if (!term) return false;
      patchState(store, {
        orderTermAmendment: { termId, term: structuredClone(term), inputComplete: false, ready: false },
        currentOrderTermId: termId,
        pendingOrderTermResultId: term.resultId,
        orderTermDraft: null,
        creditorDraft: null,
      });
      return true;
    },
    stageOrderTermAmendment: (
      term: ICasesCreateCasefileOrderTerm,
      page: ICasesCreateCasefileOrderTermPage,
    ): boolean => {
      const pending = store.orderTermAmendment();
      if (
        !pending ||
        pending.termId !== store.currentOrderTermId() ||
        term.resultId !== pending.term.resultId ||
        page.resultId !== term.resultId
      )
        return false;
      const names = new Set(page.fields.filter((field) => field.kind !== 'readonly').map((field) => field.name));
      const parameters = Object.fromEntries(Object.entries(term.parameters).filter(([name]) => names.has(name)));
      patchState(store, {
        orderTermAmendment: {
          ...pending,
          term: { ...pending.term, parameters, presentation: orderTermPresentation(page) },
          inputComplete: true,
          ready: false,
        },
        unsavedChanges: false,
      });
      return true;
    },
    stageAmendmentCreditor: (creditor: CasesCreateCasefileCreditorAssignment): boolean => {
      const pending = store.orderTermAmendment();
      if (!pending?.inputComplete || pending.termId !== store.currentOrderTermId()) return false;
      if (
        creditor.type === 'minor' &&
        !store.minorCreditors().some((item) => item.sequenceNumber === creditor.sequenceNumber)
      )
        return false;
      if (
        creditor.type === 'major' &&
        (!Number.isInteger(creditor.majorCreditorId) || creditor.majorCreditorId <= 0 || !creditor.displayName.trim())
      )
        return false;
      patchState(store, {
        orderTermAmendment: { ...pending, term: { ...pending.term, creditor: { ...creditor } }, ready: true },
        creditorDraft: null,
        unsavedChanges: false,
      });
      return true;
    },
    prepareAmendmentCompletion: (termId: number): boolean => {
      const pending = store.orderTermAmendment();
      const draft = store.creditorDraft();
      if (
        !pending?.inputComplete ||
        pending.termId !== termId ||
        store.currentOrderTermId() !== termId ||
        draft?.termId !== termId ||
        !draft.details ||
        !draft.countryName ||
        draft.existingSequenceNumber !== undefined
      )
        return false;
      patchState(store, { orderTermAmendment: { ...pending, ready: true }, unsavedChanges: false });
      return true;
    },
    completeOrderTermAmendment: (
      expected: ICasesCreateCasefileOrderTermAmendment,
      expectedCreditorDraft: ICasesCreateCasefileCreditorDraft | null,
    ): boolean => {
      if (
        store.orderTermAmendment() !== expected ||
        !expected.ready ||
        store.currentOrderTermId() !== expected.termId ||
        store.creditorDraft() !== expectedCreditorDraft ||
        !store.orderTerms().some((term) => term.termId === expected.termId)
      )
        return false;
      let term = structuredClone(expected.term);
      let minorCreditors = store.minorCreditors();
      let nextMinorCreditorSequence = store.nextMinorCreditorSequence();
      if (expectedCreditorDraft) {
        if (
          expectedCreditorDraft.termId !== expected.termId ||
          !expectedCreditorDraft.details ||
          !expectedCreditorDraft.countryName ||
          expectedCreditorDraft.existingSequenceNumber !== undefined
        )
          return false;
        const details = structuredClone(expectedCreditorDraft.details);
        const sequenceNumber = nextMinorCreditorSequence;
        minorCreditors = [
          ...minorCreditors,
          { sequenceNumber, displayName: minorCreditorDisplayName(details.identity), details },
        ];
        term = { ...term, creditor: { type: 'minor', sequenceNumber } };
        nextMinorCreditorSequence += 1;
      } else {
        const assignment = term.creditor;
        if (
          !assignment ||
          (assignment.type === 'minor' &&
            !minorCreditors.some((item) => item.sequenceNumber === assignment.sequenceNumber))
        )
          return false;
      }
      patchState(store, {
        orderTerms: store.orderTerms().map((item) => (item.termId === expected.termId ? term : item)),
        minorCreditors,
        nextMinorCreditorSequence,
        orderTermAmendment: null,
        creditorDraft: null,
        orderTermDraft: null,
        currentOrderTermId: null,
        pendingOrderTermResultId: null,
        stateChanges: true,
        unsavedChanges: false,
      });
      return true;
    },
    cancelOrderTermAmendment: (termId: number): boolean => {
      if (store.orderTermAmendment()?.termId !== termId) return false;
      patchState(store, {
        orderTermAmendment: null,
        creditorDraft: null,
        orderTermDraft: null,
        currentOrderTermId: null,
        pendingOrderTermResultId: null,
        unsavedChanges: false,
      });
      return true;
    },
  })),
  withMethods((store) => ({
    acceptPendingMinorCreditor: (termId: number): number | null => {
      if (store.orderTermAmendment()) return null;
      const draft = store.creditorDraft();
      const term = store.orderTerms().find((item) => item.termId === termId);
      if (
        store.currentOrderTermId() !== termId ||
        !term ||
        draft?.termId !== termId ||
        !draft.details ||
        !draft.countryName
      )
        return null;
      if (draft.existingSequenceNumber === undefined) return store.acceptNewMinorCreditor(termId, draft.details);

      const sequence = draft.existingSequenceNumber;
      if (
        term.creditor?.type !== 'minor' ||
        term.creditor.sequenceNumber !== sequence ||
        !store.minorCreditors().some((item) => item.sequenceNumber === sequence)
      )
        return null;

      store.clearCreditorDraft();
      if (store.updateAssignedMinorCreditor(termId, sequence, draft.details)) return sequence;
      patchState(store, { creditorDraft: draft });
      return null;
    },
  })),
);
