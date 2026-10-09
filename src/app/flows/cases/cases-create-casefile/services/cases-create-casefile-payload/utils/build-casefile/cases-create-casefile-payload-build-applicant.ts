import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import type { CasesCreateCasefilePayloadBuildState as BuildState } from '../../types/cases-create-casefile-payload-build-state.type';
import { required } from '../shared/cases-create-casefile-payload-values';
import { address, contacts, individual, thirdParty } from '../shared/cases-create-casefile-payload-party';
import { buildBankDetails } from '../shared/cases-create-casefile-payload-bank';

export function buildApplicant(
  applicantDetails: BuildState['applicantDetails'],
  references: References,
): Request['casefile']['applicant'] {
  const organisation = 'organisationName' in applicantDetails;
  return {
    party_details: organisation
      ? {
          organisation: true,
          organisation_details: {
            organisation_name: required(applicantDetails.organisationName),
            foreign_authority_reference: required(applicantDetails.foreignAuthorityReference),
          },
          address: address(applicantDetails.contactDetails.address, references),
          contact_details: contacts(applicantDetails.contactDetails),
        }
      : individual(applicantDetails, references),
    third_party_details: organisation ? undefined : thirdParty(applicantDetails.thirdParty, references),
    bank_account_details: buildBankDetails(applicantDetails.bankDetails),
  };
}
