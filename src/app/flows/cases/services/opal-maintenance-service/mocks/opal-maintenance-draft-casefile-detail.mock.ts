import type { IOpalMaintenanceDraftCasefileDetail } from '../interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { IOpalMaintenanceCountryReferenceDataItem } from '../interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../interfaces/opal-maintenance-application-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceResultDetail } from '../interfaces/opal-maintenance-result-detail.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../../../cases-create-casefile/cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';

export function createPersistedCasefileDetail(): IOpalMaintenanceDraftCasefileDetail {
  return {
    draft_casefile_id: 17,
    business_unit_id: 44,
    created_date: '2026-09-15T09:00:00Z',
    submitted_by: 'BU-SUBMITTER',
    submitted_by_name: 'Synthetic Submitter',
    casefile_type: 'REMO In',
    casefile_status: 'SUBMITTED',
    casefile_status_name: 'Submitted',
    casefile_status_date: '2026-09-15T09:00:00Z',
    validated_date: null,
    validated_by: null,
    validated_by_name: null,
    status_message: null,
    casefile: {
      respondent_account: {
        business_unit_id: 44,
        casefile_type: 'REMO In',
        application_code: 'TEST',
        originator_name: 'Test Court',
        respondent: {
          party_details: {
            organisation: false,
            individual_details: { forenames: 'Synthetic', surname: 'Respondent', restrict_personal_information: false },
            address: { address_line_1: '1 Test Street', cjs_code: 101 },
          },
        },
        order_details: {
          date_ordered: '2026-09-01',
          date_arrears_last_updated: '2026-09-15',
          interest_flag: false,
          indexation: 'None',
          payment_arrangement: 'Court',
          payment_period: 'Monthly',
          order_terms: [
            {
              result_id: 'TEST01',
              creditor_type: 'Applicant',
              result_responses: [{ parameter_name: 'amount', response: '100.00' }],
            },
          ],
        },
      },
      applicant: {
        party_details: {
          organisation: false,
          individual_details: { forenames: 'Synthetic', surname: 'Applicant', restrict_personal_information: false },
          address: { address_line_1: '2 Test Street', cjs_code: 102 },
        },
        bank_account_details: { bank_account_type: 'None or not applicable' },
      },
    },
    casefile_snapshot: {
      respondent_account: { account_id: null, account_number: null, respondent_name: 'Synthetic Respondent' },
      applicant_account: { account_id: null, account_number: null, applicant_name: 'Synthetic Applicant' },
      minor_creditor_accounts: [],
    },
    timeline_data: [{ username: 'Synthetic Submitter', status: 'Submitted', status_date: '2026-09-15T09:00:00Z' }],
  };
}
export const PERSISTED_CASEFILE_REFERENCES: {
  countries: IOpalMaintenanceCountryReferenceDataItem[];
  applications: IOpalMaintenanceApplicationReferenceDataItem[];
  majorCreditors: IOpalMaintenanceMajorCreditorReferenceDataItem[];
} = {
  countries: [
    { country_id: 1, cjs_code: 101, country_name: 'Test Country One', active: true, date_used_from: '2000-01-01' },
    { country_id: 2, cjs_code: 102, country_name: 'Test Country Two', active: true, date_used_from: '2000-01-01' },
  ],
  applications: [
    {
      application_id: 901,
      application_code: 'TEST',
      application_title: 'Test application',
      application_group: 'Create Casefile',
      active: true,
    },
  ],
  majorCreditors: [],
};
export const PERSISTED_CASEFILE_RESULT_PAGE: ICasesCreateCasefileOrderTermPage = {
  resultId: 'TEST01',
  title: 'Test order term',
  fields: [
    {
      name: 'amount',
      id: 'create_casefile_order_terms_input_amount',
      label: 'Amount',
      kind: 'money',
      required: true,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
  ],
};
export const PERSISTED_CASEFILE_RESULT_DETAIL: IOpalMaintenanceResultDetail = {
  result_id: 'TEST01',
  result_title: 'Test order term',
  result_parameters: JSON.stringify([
    { name: 'amount', prompt: 'Amount', type: 'money', mandatory: true, language_dependent: false },
  ]),
};
