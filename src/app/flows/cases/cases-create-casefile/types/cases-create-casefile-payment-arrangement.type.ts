import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../constants/cases-create-casefile-payment-arrangements.constant';

export type CasesCreateCasefilePaymentArrangement =
  (typeof CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS)[keyof typeof CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS];
