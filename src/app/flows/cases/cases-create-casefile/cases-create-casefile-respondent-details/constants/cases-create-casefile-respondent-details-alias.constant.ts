import { Validators } from '@angular/forms';
import type { IAbstractFormArrayControlValidation } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { casesCreateCasefileRespondentDetailsTrimRequiredValidator } from '../validators/cases-create-casefile-respondent-details-trim-required.validator';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES } from './cases-create-casefile-respondent-details-field-names.constant';

export const CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS: IAbstractFormArrayControlValidation[] = [
  {
    controlName: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.aliasFirstNames,
    validators: [casesCreateCasefileRespondentDetailsTrimRequiredValidator, Validators.maxLength(40)],
  },
  {
    controlName: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.aliasLastName,
    validators: [casesCreateCasefileRespondentDetailsTrimRequiredValidator, Validators.maxLength(40)],
  },
];
