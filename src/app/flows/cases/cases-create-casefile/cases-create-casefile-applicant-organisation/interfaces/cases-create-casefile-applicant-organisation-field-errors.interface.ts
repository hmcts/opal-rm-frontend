import type { IAbstractFormBaseFieldError } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import type { ICasesCreateCasefileApplicantFieldErrors } from '../../interfaces/cases-create-casefile-applicant-field-errors.interface';

export interface ICasesCreateCasefileApplicantOrganisationFieldErrors extends ICasesCreateCasefileApplicantFieldErrors {
  applicant_organisation_name: IAbstractFormBaseFieldError;
  applicant_foreign_authority_reference: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_payment_reference: IAbstractFormBaseFieldError;
  applicant_non_uk_bank_name: IAbstractFormBaseFieldError;
}
