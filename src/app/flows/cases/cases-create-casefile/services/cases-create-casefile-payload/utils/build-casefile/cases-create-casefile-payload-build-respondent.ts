import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import type { CasesCreateCasefilePayloadBuildState as BuildState } from '../../types/cases-create-casefile-payload-build-state.type';
import { text, required } from '../shared/cases-create-casefile-payload-values';
import { address, individual, thirdParty } from '../shared/cases-create-casefile-payload-party';
import { majorCode } from '../shared/cases-create-casefile-payload-major-creditor';
import { buildOrderDetails } from './cases-create-casefile-payload-build-order-details';

export function buildRespondentAccount(
  state: BuildState,
  references: References,
  businessUnitId: number,
): Request['casefile']['respondent_account'] {
  const { respondentDetails, orderDetails, caseTypeSelection } = state;
  const applications = references.applications.filter(
    (application) => application.active && application.application_id === orderDetails.applicationId,
  );
  if (applications.length !== 1) throw new Error('Application cannot be resolved');
  const employer = respondentDetails.employer;
  const central = state.centralAuthorityDetails;
  return {
    business_unit_id: businessUnitId,
    casefile_type: caseTypeSelection.caseType,
    application_code: required(applications[0].application_code),
    originator_name: text(orderDetails.court),
    remo_reference: text(central?.remoReference),
    central_authority_reference: text(central?.centralAuthorityReference),
    central_authority_code: central?.majorCreditor
      ? majorCode(central.majorCreditor.major_creditor_id, references, businessUnitId, true)
      : undefined,
    account_comment: text(state.commentsAndNotes?.comment),
    notes: text(state.commentsAndNotes?.note) ? { note_text: required(state.commentsAndNotes?.note) } : undefined,
    respondent: {
      party_details: individual(respondentDetails, references),
      third_party_details: thirdParty(respondentDetails.thirdParty, references),
      debtor_details: employer
        ? {
            employer_name: required(employer.employerName),
            employee_reference: text(employer.employeeReference),
            employer_email_address: text(employer.emailAddress),
            employer_telephone_number: text(employer.telephoneNumber),
            employer_address: address(employer.address, references),
          }
        : undefined,
    },
    order_details: buildOrderDetails(state, references, businessUnitId),
  };
}
