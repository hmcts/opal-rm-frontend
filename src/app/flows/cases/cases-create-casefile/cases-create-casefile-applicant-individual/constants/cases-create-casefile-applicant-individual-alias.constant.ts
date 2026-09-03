import { Validators } from '@angular/forms';
import type { IAbstractFormArrayControlValidation } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { casesCreateCasefileApplicantIndividualTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-individual-trim-required.validator';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES as FIELD_NAMES } from './cases-create-casefile-applicant-individual-field-names.constant';

export const CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS: IAbstractFormArrayControlValidation[] = [
  {
    controlName: FIELD_NAMES.aliasFirstNames,
    validators: [casesCreateCasefileApplicantIndividualTrimRequiredValidator, Validators.maxLength(40)],
  },
  {
    controlName: FIELD_NAMES.aliasLastName,
    validators: [casesCreateCasefileApplicantIndividualTrimRequiredValidator, Validators.maxLength(40)],
  },
];
