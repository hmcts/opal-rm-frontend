interface Address {
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
  address_line_5?: string;
  postcode?: string;
  cjs_code: number;
}
interface Party {
  organisation: boolean;
  individual_details?: {
    title?: string;
    forenames?: string;
    surname: string;
    date_of_birth?: string;
    national_insurance_number?: string;
    other_personal_information?: string;
    restrict_personal_information?: boolean;
    restriction_reason?: string;
  };
  organisation_details?: { organisation_name: string; foreign_authority_reference?: string };
  address: Address;
  contact_details?: {
    primary_email_address?: string;
    secondary_email_address?: string;
    main_telephone_number?: string;
    other_telephone_number?: string;
  };
  aliases?: { sequence_number: number; forenames: string; surname: string }[];
}
interface ThirdParty {
  name: string;
  relationship: string;
  reference?: string;
  address: Address;
}
interface BankAccount {
  bank_account_type: 'UK Bank' | 'Non-UK Bank' | 'None or not applicable';
  uk_bank_details?: { account_name: string; sort_code: string; account_number: string; payment_reference: string };
  non_uk_bank_details?: {
    account_name: string;
    payment_reference: string;
    bic_or_swift_code?: string;
    iban?: string;
    bank_name?: string;
    branch_code_or_sort_code?: string;
    account_number?: string;
  };
}
export interface IOpalMaintenanceDraftCasefileRequest {
  business_unit_id: number;
  casefile_type: 'REMO In' | 'REMO Out' | 'REMO Out (CMS)';
  casefile: {
    respondent_account: {
      business_unit_id: number;
      application_code: string;
      casefile_type: IOpalMaintenanceDraftCasefileRequest['casefile_type'];
      originator_name?: string;
      remo_reference?: string;
      central_authority_code?: string;
      central_authority_reference?: string;
      account_comment?: string;
      notes?: { note_text: string };
      respondent: {
        party_details: Party;
        third_party_details?: ThirdParty;
        debtor_details?: {
          employer_name: string;
          employee_reference?: string;
          employer_email_address?: string;
          employer_telephone_number?: string;
          employer_address: Address;
        };
      };
      order_details: {
        date_ordered: string;
        date_arrears_last_updated: string;
        interest_flag: boolean;
        indexation: 'RPI' | 'CPI' | 'Other' | 'None';
        payment_arrangement: 'Court' | 'Direct';
        payment_period: 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Yearly';
        order_terms: {
          result_id: string;
          creditor_type?: 'Applicant' | 'Minor Creditor' | 'Major Creditor';
          minor_creditor_sequence?: number;
          major_creditor_code?: string;
          result_responses: { parameter_name: string; response: string }[];
        }[];
      };
    };
    applicant: { party_details: Party; third_party_details?: ThirdParty; bank_account_details: BankAccount };
    minor_creditors?: { creditor_sequence: number; party_details: Party; bank_account_details: BankAccount }[];
  };
}
