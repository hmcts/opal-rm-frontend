import { DateTime } from 'luxon';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { ICasesCreateCasefileHydrationContext } from '../../interfaces/cases-create-casefile-hydration-context.interface';
import type { ICasesCreateCasefileState } from '../../../../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefileMinorCreditor } from '../../../../interfaces/cases-create-casefile-minor-creditor.interface';
import type { CasesCreateCasefileCaseTypeSelection } from '../../../../types/cases-create-casefile-case-type-selection.type';
import { CASES_CREATE_CASEFILE_STATE } from '../../../../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../../../../constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../../../../cases-create-casefile-order-details/constants/cases-create-casefile-order-details-payment-frequencies.constant';
import { isCasesCreateCasefileCaseTypeSelectionValid } from '../../../../utils/cases-create-casefile-case-type-selection';
import { isCasesCreateCasefileIndividualApplicantSelection } from '../../../../utils/cases-create-casefile-individual-applicant-selection';
import { isCasesCreateCasefileOrganisationApplicantSelection } from '../../../../utils/cases-create-casefile-organisation-applicant-selection';
import { mapSavedApplicant, mapSavedRespondent } from './cases-create-casefile-payload-map-party';
import { mapSavedOrderTerm } from './cases-create-casefile-payload-map-order-term';

type Account = IOpalMaintenanceDraftCasefileDetail['casefile']['respondent_account'];
type SavedMinor = NonNullable<IOpalMaintenanceDraftCasefileDetail['casefile']['minor_creditors']>[number];
const indexation = { RPI: 'RPI', CPI: 'CPI', Other: 'OTHER', None: 'NONE' } as const;
const payments = { Court: 'court', Direct: 'direct' } as const;
const fail = (): never => {
  throw new Error('Unusable saved casefile');
};
const positiveId = (value: number): boolean => Number.isSafeInteger(value) && value > 0;

function optionalText(value: string | undefined): string | null {
  if (value === undefined) return null;
  if (typeof value !== 'string') return fail();
  return value.trim() ? value : null;
}

function validateOrder(order: Account['order_details']): void {
  if (!order) return fail();
  const dates = [order.date_ordered, order.date_arrears_last_updated];
  if (
    dates.some(
      (value) => typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value).isValid,
    )
  )
    return fail();
  if (!CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.includes(order.payment_period)) return fail();
  if (
    typeof order.interest_flag !== 'boolean' ||
    !Object.hasOwn(indexation, order.indexation) ||
    !Object.hasOwn(payments, order.payment_arrangement)
  )
    return fail();
  if (!Array.isArray(order.order_terms) || !order.order_terms.length) return fail();
}

function caseSelection(draft: IOpalMaintenanceDraftCasefileDetail): CasesCreateCasefileCaseTypeSelection {
  if (
    !positiveId(draft.business_unit_id) ||
    draft.casefile.respondent_account.business_unit_id !== draft.business_unit_id ||
    draft.casefile_type !== draft.casefile.respondent_account.casefile_type
  )
    return fail();
  const selection: CasesCreateCasefileCaseTypeSelection =
    draft.casefile_type === 'REMO In'
      ? {
          caseType: 'REMO In',
          applicantType: draft.casefile.applicant.party_details.organisation ? 'Organisation' : 'Individual',
        }
      : { caseType: draft.casefile_type };
  if (!isCasesCreateCasefileCaseTypeSelectionValid(selection)) return fail();
  return selection;
}

function applicationId(account: Account, context: ICasesCreateCasefileHydrationContext): number {
  const matches = context.applications.filter(
    (item) => item.application_code === account.application_code && item.application_group === 'Create Casefile',
  );
  if (matches.length !== 1 || !positiveId(matches[0].application_id)) return fail();
  return matches[0].application_id;
}

function mapMinor(value: SavedMinor, context: ICasesCreateCasefileHydrationContext): ICasesCreateCasefileMinorCreditor {
  const party = mapSavedApplicant(value, context.countries);
  const address = party.contactDetails.address;
  const bank = party.bankDetails;
  if ('organisationName' in party)
    return {
      sequenceNumber: value.creditor_sequence,
      displayName: party.organisationName,
      details: { identity: { type: 'organisation', organisationName: party.organisationName }, address, bank },
    };
  const identity = {
    type: 'individual' as const,
    title: party.title,
    firstNames: party.firstNames,
    lastName: party.lastName,
  };
  return {
    sequenceNumber: value.creditor_sequence,
    displayName: [identity.title, identity.firstNames, identity.lastName].filter(Boolean).join(' '),
    details: { identity, address, bank },
  };
}

function mapMinorCreditors(
  draft: IOpalMaintenanceDraftCasefileDetail,
  context: ICasesCreateCasefileHydrationContext,
): ICasesCreateCasefileMinorCreditor[] {
  const minors = draft.casefile.minor_creditors ?? [];
  if (!Array.isArray(minors)) return fail();
  const sequences = new Set<number>();
  return minors.map((value) => {
    if (
      !value ||
      !positiveId(value.creditor_sequence) ||
      value.creditor_sequence === Number.MAX_SAFE_INTEGER ||
      sequences.has(value.creditor_sequence)
    )
      return fail();
    sequences.add(value.creditor_sequence);
    return mapMinor(value, context);
  });
}

function mapCentralAuthority(
  account: Account,
  context: ICasesCreateCasefileHydrationContext,
): ICasesCreateCasefileState['centralAuthorityDetails'] {
  const remoReference = optionalText(account.remo_reference);
  const centralAuthorityReference = optionalText(account.central_authority_reference);
  const code = optionalText(account.central_authority_code);
  let majorCreditor = null;
  if (code !== null) {
    const matches = context.majorCreditors.filter(
      (item) => item.major_creditor_code === code && item.central_authority === true,
    );
    if (
      matches.length !== 1 ||
      !positiveId(matches[0].major_creditor_id) ||
      typeof matches[0].name !== 'string' ||
      !matches[0].name.trim()
    )
      return fail();
    majorCreditor = structuredClone(matches[0]);
  }
  if (remoReference === null && centralAuthorityReference === null && majorCreditor === null) return null;
  return { remoReference, centralAuthorityReference, majorCreditor };
}

function mapComments(account: Account): ICasesCreateCasefileState['commentsAndNotes'] {
  const comment = optionalText(account.account_comment);
  if (
    account.notes !== undefined &&
    (!account.notes ||
      typeof account.notes !== 'object' ||
      Array.isArray(account.notes) ||
      typeof account.notes.note_text !== 'string')
  )
    return fail();
  const note = optionalText(account.notes?.note_text);
  return comment !== null || note !== null ? { comment, note } : null;
}

function assertApplicantApplicable(
  applicant: NonNullable<ICasesCreateCasefileState['applicantDetails']>,
  selection: CasesCreateCasefileCaseTypeSelection,
): void {
  const applicable =
    'organisationName' in applicant
      ? isCasesCreateCasefileOrganisationApplicantSelection(selection)
      : isCasesCreateCasefileIndividualApplicantSelection(selection);
  if (!applicable) return fail();
}

/** Mark sections Provided after the saved data and creditor references have been validated. */
function deriveTaskStatuses(state: ICasesCreateCasefileState): void {
  const provided = CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED;
  state.taskStatuses.respondent = provided;
  state.taskStatuses.applicant = provided;
  state.taskStatuses.orderDetails = provided;
  state.taskStatuses.orderTerms = provided;
  state.taskStatuses.interestAndIndexation = provided;
  state.taskStatuses.managingPayments = provided;
  if (state.centralAuthorityDetails !== null) state.taskStatuses.centralAuthority = provided;
  if (state.commentsAndNotes !== null) state.taskStatuses.commentsAndNotes = provided;
}

/** Restore a complete accepted state, rejecting incompatible data before any store is changed. */
export function mapPersistedCasefile(
  draft: IOpalMaintenanceDraftCasefileDetail,
  context: ICasesCreateCasefileHydrationContext,
): ICasesCreateCasefileState {
  const state = structuredClone(CASES_CREATE_CASEFILE_STATE);
  state.caseTypeSelection = caseSelection(draft);
  // Individual terms have no BU: resolve references only within the owning draft's unit.
  const scopedContext = {
    ...context,
    majorCreditors: context.majorCreditors.filter((item) => item.business_unit_id === draft.business_unit_id),
  };
  const account = draft.casefile.respondent_account;
  const order = account.order_details;
  validateOrder(order);
  state.respondentDetails = mapSavedRespondent(account.respondent, context.countries);
  state.applicantDetails = mapSavedApplicant(draft.casefile.applicant, context.countries);
  assertApplicantApplicable(state.applicantDetails, state.caseTypeSelection);
  state.orderDetails = {
    applicationId: applicationId(account, context),
    court: optionalText(account.originator_name),
    dateOrderMade: order.date_ordered,
    dateArrearsLastUpdated: order.date_arrears_last_updated,
    paymentFrequency: order.payment_period,
  };
  state.interestAndIndexation = { interestApplies: order.interest_flag, indexationType: indexation[order.indexation] };
  state.paymentArrangement = payments[order.payment_arrangement];
  state.minorCreditors = mapMinorCreditors(draft, context);
  state.orderTerms = order.order_terms.map((term, index) =>
    mapSavedOrderTerm(term, index + 1, scopedContext, state.minorCreditors, order.payment_period),
  );
  state.nextOrderTermId = state.orderTerms.length + 1;
  state.nextMinorCreditorSequence = Math.max(0, ...state.minorCreditors.map((item) => item.sequenceNumber)) + 1;
  state.centralAuthorityDetails = mapCentralAuthority(account, scopedContext);
  state.commentsAndNotes = mapComments(account);
  deriveTaskStatuses(state);
  return state;
}
