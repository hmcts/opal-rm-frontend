import { buildOrderTermCard } from 'src/app/flows/cases/cases-create-casefile/utils/cases-create-casefile-order-term-card';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from '../../orderTermsSummary/mocks/order-terms-summary.mock';

const context = { applicantDetails: null, orderDetails: null, minorCreditors: SUMMARY_CREDITORS };
export const UK_CARD = buildOrderTermCard(SUMMARY_TERMS[1], context);
export const NON_UK_CARD = buildOrderTermCard(
  { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 2 } },
  context,
);
export const NO_BANK_CARD = buildOrderTermCard(
  { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 3 } },
  context,
);
export const TEXT_ONLY_CARD = {
  ...UK_CARD,
  title: '<img src=x onerror=alert(1)> Maintenance',
  rows: [{ id: 'amount', label: '<b>Amount</b>', value: '<img src=x onerror=alert(1)>' }],
  bankRows: [{ id: 'account', label: 'Name on account', value: '<b>Synthetic creditor</b>' }],
};
