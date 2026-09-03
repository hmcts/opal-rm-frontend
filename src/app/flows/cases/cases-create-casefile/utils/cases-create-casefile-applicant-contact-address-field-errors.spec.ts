import { describe, expect, expectTypeOf, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES } from '../cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES } from '../cases-create-casefile-applicant-organisation/constants/cases-create-casefile-applicant-organisation-field-names.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-field-errors.constant';
import {
  CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS,
  createCasesCreateCasefileApplicantContactAddressFieldErrors,
  type CasesCreateCasefileApplicantContactAddressErrorKey,
} from './cases-create-casefile-applicant-contact-address-field-errors';

describe('createCasesCreateCasefileApplicantContactAddressFieldErrors', () => {
  type ContactAndAddressFieldError =
    (typeof CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress)[CasesCreateCasefileApplicantContactAddressErrorKey];

  const applicantContactAddressFieldNames = [
    CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES,
    CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES,
  ] as const;

  it('returns the shared contact and address field-error type for canonical Applicant keys', () => {
    expectTypeOf(
      createCasesCreateCasefileApplicantContactAddressFieldErrors(
        CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES,
      ),
    ).toEqualTypeOf<
      Record<
        (typeof CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES)[CasesCreateCasefileApplicantContactAddressErrorKey],
        ContactAndAddressFieldError
      >
    >();
  });

  it.each(applicantContactAddressFieldNames)(
    'projects shared contact and address errors using the supplied canonical field names',
    (fieldNames) => {
      const fieldErrors = createCasesCreateCasefileApplicantContactAddressFieldErrors(fieldNames);

      expect(CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS).toEqual([
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
      ]);
      expect(Object.keys(fieldErrors)).toEqual(
        CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS.map((fieldName) => fieldNames[fieldName]),
      );

      for (const fieldName of CASES_CREATE_CASEFILE_APPLICANT_CONTACT_ADDRESS_ERROR_KEYS) {
        expect(fieldErrors[fieldNames[fieldName]]).toBeDefined();
        expect(fieldErrors[fieldNames[fieldName]]).toBe(
          CASES_CREATE_CASEFILE_APPLICANT_FIELD_ERRORS.contactAndAddress[fieldName],
        );
      }
    },
  );
});
