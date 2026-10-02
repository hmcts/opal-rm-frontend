import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import type { CasesCreateCasefilePayloadBuildState as BuildState } from '../../types/cases-create-casefile-payload-build-state.type';
import { required } from '../shared/cases-create-casefile-payload-values';
import { majorCode } from '../shared/cases-create-casefile-payload-major-creditor';

export function buildOrderDetails(
  state: BuildState,
  references: References,
  businessUnitId: number,
): Request['casefile']['respondent_account']['order_details'] {
  const { orderDetails, interestAndIndexation, paymentArrangement } = state;
  return {
    date_ordered: required(orderDetails.dateOrderMade),
    date_arrears_last_updated: required(orderDetails.dateArrearsLastUpdated),
    interest_flag: interestAndIndexation.interestApplies,
    indexation: ({ RPI: 'RPI', CPI: 'CPI', OTHER: 'Other', NONE: 'None' } as const)[
      interestAndIndexation.indexationType
    ],
    payment_arrangement: paymentArrangement === 'court' ? 'Court' : 'Direct',
    payment_period: orderDetails.paymentFrequency,
    order_terms: state.orderTerms.map((term) => {
      const creditor = term.creditor;
      if (
        creditor?.type === 'minor' &&
        !state.minorCreditors.some((item) => item.sequenceNumber === creditor.sequenceNumber)
      )
        throw new Error('Minor creditor cannot be resolved');
      return {
        result_id: term.resultId,
        creditor_type: creditor
          ? ({ applicant: 'Applicant', minor: 'Minor Creditor', major: 'Major Creditor' } as const)[creditor.type]
          : undefined,
        minor_creditor_sequence: creditor?.type === 'minor' ? creditor.sequenceNumber : undefined,
        major_creditor_code:
          creditor?.type === 'major' ? majorCode(creditor.majorCreditorId, references, businessUnitId) : undefined,
        result_responses: term.presentation.fields.flatMap((field) => {
          const value =
            field.kind === 'readonly' && field.name.toLowerCase() === 'frequency'
              ? orderDetails.paymentFrequency
              : term.parameters[field.name];
          if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return [];
          return [
            {
              parameter_name: field.name,
              response: Array.isArray(value) ? value.join(',') : String(value),
            },
          ];
        }),
      };
    }),
  };
}
