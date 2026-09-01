import { Validators } from '@angular/forms';
import type { IAbstractFormArrayControlValidation } from '@hmcts/opal-frontend-common/components/abstract/interfaces';

export const CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS: IAbstractFormArrayControlValidation[] = [
  {
    controlName: 'respondent_alias_first_names',
    validators: [Validators.required, Validators.maxLength(40)],
  },
  {
    controlName: 'respondent_alias_last_name',
    validators: [Validators.required, Validators.maxLength(40)],
  },
];
