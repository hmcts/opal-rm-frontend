import {
  createCasesCreateCasefileError,
  createCasesCreateCasefileMaxLengthError,
} from '../../utils/cases-create-casefile-field-errors';
import type { ICasesCreateCasefileOrderDetailsFieldErrors } from '../interfaces/cases-create-casefile-order-details-field-errors.interface';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES as F } from './cases-create-casefile-order-details-field-names.constant';

const dateErrors = {
  invalidDate: createCasesCreateCasefileError('Enter a real date in the format DD/MM/YYYY', 2),
  invalidFutureDate: createCasesCreateCasefileError('Date cannot be in the future', 3),
};

export const CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_ERRORS = {
  [F.applicationId]: {
    required: createCasesCreateCasefileError('Select an application code', 1),
    invalidSelection: createCasesCreateCasefileError('Select an application code from the list', 2),
  },
  [F.court]: createCasesCreateCasefileMaxLengthError('Court that made the order', 40, 1),
  [F.dateOrderMade]: { ...dateErrors },
  [F.paymentFrequency]: { required: createCasesCreateCasefileError('Select a payment frequency', 1) },
  [F.dateArrearsLastUpdated]: {
    required: createCasesCreateCasefileError('Enter the date arrears last updated', 1),
    ...dateErrors,
  },
} satisfies ICasesCreateCasefileOrderDetailsFieldErrors;
