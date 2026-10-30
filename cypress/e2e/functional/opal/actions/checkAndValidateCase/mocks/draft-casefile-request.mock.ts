import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';

export const DRAFT_CASEFILE_RECOVERY_REQUEST: IOpalMaintenanceDraftCasefileRequest = {
  business_unit_id: 44,
  casefile_type: 'REMO In',
  casefile: {
    respondent_account: {
      business_unit_id: 44,
      application_code: 'TEST01',
      casefile_type: 'REMO In',
      originator_name: 'Synthetic Court',
      account_comment: 'Synthetic review comment',
      notes: { note_text: 'Synthetic review note' },
      respondent: {
        party_details: {
          organisation: false,
          individual_details: { forenames: 'Synthetic', surname: 'Respondent', restrict_personal_information: false },
          address: { address_line_1: '1 Test Street', cjs_code: 1 },
        },
      },
      order_details: {
        date_ordered: '2026-01-01',
        date_arrears_last_updated: '2026-01-01',
        interest_flag: false,
        indexation: 'None',
        payment_arrangement: 'Court',
        payment_period: 'Monthly',
        order_terms: [
          {
            result_id: 'MAT',
            creditor_type: 'Applicant',
            result_responses: [
              { parameter_name: 'Amount', response: '10.00' },
              { parameter_name: 'Frequency', response: 'Monthly' },
              { parameter_name: 'Creditor', response: 'Synthetic Creditor' },
              { parameter_name: 'Respondent', response: 'Synthetic Respondent' },
              { parameter_name: 'Payment', response: 'Payable through the Court' },
              { parameter_name: 'Commencement', response: '2026-01-01' },
            ],
          },
        ],
      },
    },
    applicant: {
      party_details: {
        organisation: false,
        individual_details: { forenames: 'Synthetic', surname: 'Applicant', restrict_personal_information: false },
        address: { address_line_1: '2 Test Street', cjs_code: 1 },
      },
      bank_account_details: { bank_account_type: 'None or not applicable' },
    },
  },
};
