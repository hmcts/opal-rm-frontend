import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../cases-create-casefile-order-details/constants/cases-create-casefile-order-details-payment-frequencies.constant';

export interface ICasesCreateCasefileOrderDetails {
  applicationId: number;
  court: string | null;
  dateOrderMade: string | null;
  paymentFrequency: (typeof CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES)[number];
  dateArrearsLastUpdated: string;
}
