export interface IOpalMaintenanceMajorCreditorReferenceDataItem {
  major_creditor_id: number;
  business_unit_id: number;
  major_creditor_code: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  address_line_3: string | null;
  address_line_4: string | null;
  address_line_5: string | null;
  postcode: string | null;
  country_id: number | null;
  country_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  active: boolean;
  central_authority: boolean;
}
