import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import type { IAbstractFormBaseFieldError } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-field-errors.constant';

export const CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS = [
  'mainEmailAddress',
  'otherEmailAddress',
  'mainTelephoneNumber',
  'otherTelephoneNumber',
  'addressLine1',
  'addressLine2',
  'addressLine3',
  'addressLine4',
  'addressLine5',
  'postalOrZipCode',
  'countryId',
] as const;

export type CasesCreateCasefileApplicantContactAddressErrorKey =
  (typeof CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS)[number];

export const createCasesCreateCasefileApplicantContactAddressFieldErrors = <
  TFieldNames extends Record<CasesCreateCasefileApplicantContactAddressErrorKey, string>,
>(
  fieldNames: TFieldNames,
): Record<
  TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey],
  IAbstractFormControlErrorMessage & IAbstractFormBaseFieldError
> => {
  const fieldErrors = {} as Record<
    TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey],
    IAbstractFormControlErrorMessage & IAbstractFormBaseFieldError
  >;

  for (const fieldName of CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS) {
    const canonicalFieldName = fieldNames[fieldName] as TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey];
    fieldErrors[canonicalFieldName] = CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress[
      fieldName
    ] as unknown as IAbstractFormControlErrorMessage & IAbstractFormBaseFieldError;
  }

  return fieldErrors;
};
