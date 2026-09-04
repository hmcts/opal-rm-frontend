import { createCasesCreateCasefileMaxLengthError } from '../../utils/cases-create-casefile-field-errors';
import type { ICasesCreateCasefileCentralAuthorityFieldErrors } from '../interfaces/cases-create-casefile-central-authority-field-errors.interface';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES } from './cases-create-casefile-central-authority-field-names.constant';

export const CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_ERRORS = {
  [CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES.remoReference]: createCasesCreateCasefileMaxLengthError(
    'REMO reference',
    20,
    1,
  ),
  [CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES.centralAuthorityReference]:
    createCasesCreateCasefileMaxLengthError('Central authority reference', 50, 1),
  [CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES.majorCreditorId]: {},
} satisfies ICasesCreateCasefileCentralAuthorityFieldErrors;
