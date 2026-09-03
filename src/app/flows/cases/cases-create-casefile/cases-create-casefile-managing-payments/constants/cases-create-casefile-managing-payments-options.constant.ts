import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../../constants/cases-create-casefile-payment-arrangements.constant';

export const CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_OPTIONS = [
  {
    key: 'court',
    label: 'Payments via the court',
    value: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    hint: '',
  },
  {
    key: 'direct',
    label: 'Direct payments to creditors',
    value: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
    hint: 'HMCTS will not collect payments for this case',
  },
] as const;
