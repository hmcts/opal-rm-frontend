import { Validators } from '@angular/forms';
import type { IAbstractFormArrayControlValidation } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { casesCreateCasefileRespondentDetailsTrimRequiredValidator } from '../validators/cases-create-casefile-respondent-details-trim-required.validator';

export const CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS: IAbstractFormArrayControlValidation[] = [
  {
    controlName: 'respondent_alias_first_names',
    validators: [casesCreateCasefileRespondentDetailsTrimRequiredValidator, Validators.maxLength(40)],
  },
  {
    controlName: 'respondent_alias_last_name',
    validators: [casesCreateCasefileRespondentDetailsTrimRequiredValidator, Validators.maxLength(40)],
  },
];
