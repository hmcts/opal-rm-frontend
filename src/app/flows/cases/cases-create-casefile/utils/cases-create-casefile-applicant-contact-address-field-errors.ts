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

type CasesCreateCasefileApplicantContactAddressFieldError =
  (typeof CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress)[CasesCreateCasefileApplicantContactAddressErrorKey];

export const createCasesCreateCasefileApplicantContactAddressFieldErrors = <
  TFieldNames extends Record<CasesCreateCasefileApplicantContactAddressErrorKey, string>,
>(
  fieldNames: TFieldNames,
): Record<
  TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey],
  CasesCreateCasefileApplicantContactAddressFieldError
> => {
  const fieldErrors = {} as Record<
    TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey],
    CasesCreateCasefileApplicantContactAddressFieldError
  >;

  for (const fieldName of CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS) {
    const canonicalFieldName = fieldNames[fieldName] as TFieldNames[CasesCreateCasefileApplicantContactAddressErrorKey];
    fieldErrors[canonicalFieldName] = CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress[fieldName];
  }

  return fieldErrors;
};
