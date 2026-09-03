export interface IOpalMaintenanceCountryReferenceDataItem {
  country_id: number;
  cjs_code: number;
  international_code?: string;
  gov_code?: string;
  country_name: string;
  demonym?: string;
  date_used_from: string;
  date_used_to?: string;
  active: boolean;
}
