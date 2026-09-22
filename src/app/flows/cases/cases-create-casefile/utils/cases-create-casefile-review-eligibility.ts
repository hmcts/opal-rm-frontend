import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../constants/cases-create-casefile-payment-arrangements.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../cases-create-casefile-order-details/constants/cases-create-casefile-order-details-payment-frequencies.constant';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefilePartyAddress } from '../interfaces/cases-create-casefile-party-address.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '../interfaces/cases-create-casefile-applicant-individual.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';
import type { ICasesCreateCasefileOrderTermPresentation } from '../interfaces/cases-create-casefile-order-term-presentation.interface';
import type { CasesCreateCasefileReviewIssue } from '../types/cases-create-casefile-review-issue.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from './cases-create-casefile-case-type-selection';
import { isCasesCreateCasefileIndividualApplicantSelection } from './cases-create-casefile-individual-applicant-selection';
import { isCasesCreateCasefileOrganisationApplicantSelection } from './cases-create-casefile-organisation-applicant-selection';

const textPresent = (value: string | null | undefined): boolean => typeof value === 'string' && !!value.trim();
const positiveId = (value: number): boolean => Number.isInteger(value) && value > 0;
const realDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const validAddress = (address: ICasesCreateCasefilePartyAddress): boolean =>
  textPresent(address.addressLine1) && positiveId(address.countryId);

function validPerson(person: ICasesCreateCasefileRespondentDetails | ICasesCreateCasefileApplicantIndividual): boolean {
  return (
    textPresent(person.firstNames) &&
    textPresent(person.lastName) &&
    validAddress(person.contactDetails.address) &&
    person.aliases.every((alias) => textPresent(alias.firstNames) && textPresent(alias.lastName)) &&
    (!person.dateOfBirth || realDate(person.dateOfBirth)) &&
    (!person.restrictedInformation.restricted || textPresent(person.restrictedInformation.reason)) &&
    (!person.thirdParty ||
      (textPresent(person.thirdParty.nameOrOrganisation) &&
        textPresent(person.thirdParty.relationship) &&
        validAddress(person.thirdParty.address)))
  );
}

function validBank(bank: CasesCreateCasefileApplicantBankDetails, minorCreditor = false): boolean {
  if (bank.type === 'none') return true;
  if (!textPresent(bank.nameOnAccount)) return false;
  if (bank.type === 'uk')
    return /^\d{6}$/.test(bank.sortCode) && /^\d{6,8}$/.test(bank.accountNumber) && textPresent(bank.paymentReference);
  return (
    bank.type === 'non-uk' &&
    (minorCreditor ? textPresent(bank.paymentReference) : textPresent(bank.bicSwiftCode) || textPresent(bank.iban))
  );
}

function validApplicant(state: ICasesCreateCasefileState): boolean {
  const applicant = state.applicantDetails;
  if (!applicant || !validBank(applicant.bankDetails)) return false;
  if ('organisationName' in applicant)
    return (
      isCasesCreateCasefileOrganisationApplicantSelection(state.caseTypeSelection) &&
      textPresent(applicant.organisationName) &&
      textPresent(applicant.foreignAuthorityReference) &&
      validAddress(applicant.contactDetails.address)
    );
  return isCasesCreateCasefileIndividualApplicantSelection(state.caseTypeSelection) && validPerson(applicant);
}

function validOrderDetails(state: ICasesCreateCasefileState): boolean {
  const details = state.orderDetails;
  return (
    !!details &&
    positiveId(details.applicationId) &&
    CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.includes(details.paymentFrequency) &&
    realDate(details.dateArrearsLastUpdated) &&
    (!details.dateOrderMade || realDate(details.dateOrderMade))
  );
}

function validParameter(
  field: ICasesCreateCasefileOrderTermPresentation['fields'][number],
  value: string | number | boolean,
): boolean {
  switch (field.kind) {
    case 'money':
      return typeof value === 'string' && /^-?\d+\.\d{2}$/.test(value);
    case 'date':
      return typeof value === 'string' && realDate(value);
    case 'integer':
      return typeof value === 'number' && Number.isSafeInteger(value);
    case 'checkbox':
      return typeof value === 'boolean';
    case 'readonly':
      return false;
    case 'select':
    case 'radio':
    case 'autocomplete':
      return typeof value === 'string' && field.options.some((option) => option.value === value);
    default:
      return typeof value === 'string' && textPresent(value);
  }
}

function validOrderTerms(state: ICasesCreateCasefileState, applicantValid: boolean): boolean {
  if (!state.orderTerms.length || new Set(state.orderTerms.map((term) => term.termId)).size !== state.orderTerms.length)
    return false;
  if (new Set(state.minorCreditors.map((creditor) => creditor.sequenceNumber)).size !== state.minorCreditors.length)
    return false;
  if (
    !state.minorCreditors.every(
      (creditor) =>
        positiveId(creditor.sequenceNumber) &&
        textPresent(creditor.displayName) &&
        validAddress(creditor.details.address) &&
        validBank(creditor.details.bank, true) &&
        (creditor.details.identity.type === 'individual'
          ? textPresent(creditor.details.identity.firstNames) && textPresent(creditor.details.identity.lastName)
          : textPresent(creditor.details.identity.organisationName)),
    )
  )
    return false;
  return state.orderTerms.every((term) => {
    if (
      !positiveId(term.termId) ||
      !textPresent(term.resultId) ||
      !textPresent(term.presentation.title) ||
      !term.creditor
    )
      return false;
    if (
      !Object.entries(term.parameters).every(([name, value]) =>
        term.presentation.fields.some((field) => field.name === name && validParameter(field, value)),
      )
    )
      return false;
    switch (term.creditor.type) {
      case 'applicant':
        return applicantValid;
      case 'major':
        return positiveId(term.creditor.majorCreditorId) && textPresent(term.creditor.displayName);
      case 'minor': {
        const sequence = term.creditor.sequenceNumber;
        return positiveId(sequence) && state.minorCreditors.some((creditor) => creditor.sequenceNumber === sequence);
      }
    }
  });
}

/** Determines accepted order-term completion independently of task labels or active editor state. */
export function acceptedOrderTermsComplete(state: ICasesCreateCasefileState): boolean {
  return validOrderTerms(state, validApplicant(state));
}

/** Checks accepted-domain integrity and active edits; reference-data freshness remains with page validation. */
export function reviewEligibility(
  state: ICasesCreateCasefileState,
  authorised: boolean,
): readonly CasesCreateCasefileReviewIssue[] {
  const issues: CasesCreateCasefileReviewIssue[] = [];
  if (!isCasesCreateCasefileCaseTypeSelectionValid(state.caseTypeSelection)) issues.push('caseType');
  if (!authorised) issues.push('authority');
  const applicantValid = validApplicant(state);
  const respondent = state.respondentDetails;
  const complete = {
    respondent:
      !!respondent &&
      validPerson(respondent) &&
      (!respondent.employer ||
        (textPresent(respondent.employer.employerName) && validAddress(respondent.employer.address))),
    applicant: applicantValid,
    orderDetails: validOrderDetails(state),
    orderTerms: acceptedOrderTermsComplete(state),
    interestAndIndexation:
      !!state.interestAndIndexation &&
      typeof state.interestAndIndexation.interestApplies === 'boolean' &&
      Object.values(CASES_CREATE_CASEFILE_INDEXATION_TYPES).includes(state.interestAndIndexation.indexationType),
    managingPayments:
      !!state.paymentArrangement &&
      Object.values(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS).includes(state.paymentArrangement),
  };
  for (const task of Object.keys(complete) as (keyof typeof complete)[]) {
    if (!complete[task] || state.taskStatuses[task] !== CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED) issues.push(task);
  }
  if (
    state.unsavedChanges ||
    state.orderTermDraft ||
    state.pendingOrderTermResultId ||
    state.creditorDraft ||
    state.orderTermAmendment ||
    state.orderTermRemoval ||
    state.minorCreditorRemoval
  )
    issues.push('editing');
  return issues;
}
