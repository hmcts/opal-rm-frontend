import { Validators } from '@angular/forms';
import type { IAbstractFormArrayControlValidation } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { casesCreateCasefileApplicantIndividualTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-individual-trim-required.validator';

export const CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS: IAbstractFormArrayControlValidation[] = [
  {
    controlName: 'applicant_alias_first_names',
    validators: [casesCreateCasefileApplicantIndividualTrimRequiredValidator, Validators.maxLength(40)],
  },
  {
    controlName: 'applicant_alias_last_name',
    validators: [casesCreateCasefileApplicantIndividualTrimRequiredValidator, Validators.maxLength(40)],
  },
];
