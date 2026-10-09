import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import type { CasesCreateCasefilePayloadBuildState as BuildState } from '../../types/cases-create-casefile-payload-build-state.type';
import { text, required } from '../shared/cases-create-casefile-payload-values';
import { address } from '../shared/cases-create-casefile-payload-party';
import { buildBankDetails } from '../shared/cases-create-casefile-payload-bank';

export function buildMinorCreditors(
  minorCreditors: BuildState['minorCreditors'],
  references: References,
): Request['casefile']['minor_creditors'] {
  return minorCreditors.length
    ? minorCreditors.map((creditor) => ({
        creditor_sequence: creditor.sequenceNumber,
        party_details: {
          organisation: creditor.details.identity.type === 'organisation',
          ...(creditor.details.identity.type === 'organisation'
            ? { organisation_details: { organisation_name: required(creditor.details.identity.organisationName) } }
            : {
                individual_details: {
                  title: text(creditor.details.identity.title),
                  forenames: text(creditor.details.identity.firstNames),
                  surname: required(creditor.details.identity.lastName),
                },
              }),
          address: address(creditor.details.address, references),
        },
        bank_account_details: buildBankDetails(creditor.details.bank),
      }))
    : undefined;
}
