import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../mocks/cases-create-casefile-applicant-organisation.mock';
import { CasesCreateCasefileApplicantOrganisationMapperService } from './cases-create-casefile-applicant-organisation-mapper.service';

describe('CasesCreateCasefileApplicantOrganisationMapperService', () => {
  let mapper: CasesCreateCasefileApplicantOrganisationMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileApplicantOrganisationMapperService);
  });

  it('returns complete empty form data when no applicant is saved', () => {
    expect(mapper.toFormData(null)).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.emptyFormData);
  });

  it('returns a fresh empty form data object when no applicant is saved', () => {
    expect(mapper.toFormData(null)).not.toBe(mapper.toFormData(null));
  });

  it('does not project an Individual applicant into Organisation form data', () => {
    expect(mapper.toFormData(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved)).toEqual(
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.emptyFormData,
    );
  });

  it.each([
    CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk,
    CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNonUk,
    CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNone,
  ])('restores every field for bank variant $bankDetails.type', (saved) => {
    expect(mapper.toApplicantDetails(mapper.toFormData(saved))).toEqual(saved);
  });

  it('trims strings, maps empty optionals to null and removes UK sort-code hyphens', () => {
    const result = mapper.toApplicantDetails({
      ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
      applicant_organisation_name: '  Test Organisation  ',
      applicant_foreign_authority_reference: '  FA-9803  ',
      applicant_other_email_address: '   ',
      applicant_address_line_2: '   ',
      applicant_uk_bank_name_on_account: '  Test Organisation  ',
      applicant_uk_bank_sort_code: '11-22-33',
      applicant_uk_bank_payment_reference: '  PAY-9803  ',
    });

    expect(result.organisationName).toBe('Test Organisation');
    expect(result.foreignAuthorityReference).toBe('FA-9803');
    expect(result.contactDetails.otherEmailAddress).toBeNull();
    expect(result.contactDetails.address.addressLine2).toBeNull();
    expect(result.bankDetails).toEqual({
      type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
      nameOnAccount: 'Test Organisation',
      sortCode: '112233',
      accountNumber: '12345678',
      paymentReference: 'PAY-9803',
    });
  });

  it('excludes inactive bank form values from a no-bank applicant', () => {
    expect(
      mapper.toApplicantDetails({
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNoneFormData,
        applicant_uk_bank_name_on_account: 'Stale UK account',
        applicant_uk_bank_sort_code: '11-22-33',
        applicant_uk_bank_account_number: '87654321',
        applicant_uk_bank_payment_reference: 'STALE-UK',
        applicant_non_uk_bank_name_on_account: 'Stale non-UK account',
        applicant_non_uk_bank_bic_swift_code: 'STALEBIC',
        applicant_non_uk_bank_iban: 'STALEIBAN',
      }).bankDetails,
    ).toEqual({ type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE });
  });

  it.each<{
    description: string;
    formData: ICasesCreateCasefileApplicantOrganisationFormData;
  }>([
    {
      description: 'organisation name',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_organisation_name: ' ',
      },
    },
    {
      description: 'foreign authority reference',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_foreign_authority_reference: null,
      },
    },
    {
      description: 'applicant address line 1',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_address_line_1: null,
      },
    },
    {
      description: 'applicant country',
      formData: { ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData, applicant_country_id: null },
    },
    {
      description: 'applicant bank type',
      formData: { ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData, applicant_bank_type: null },
    },
    {
      description: 'UK bank name on account',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_uk_bank_name_on_account: null,
      },
    },
    {
      description: 'UK bank sort code',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_uk_bank_sort_code: ' ',
      },
    },
    {
      description: 'UK bank account number',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_uk_bank_account_number: null,
      },
    },
    {
      description: 'UK bank payment reference',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_uk_bank_payment_reference: null,
      },
    },
    {
      description: 'non-UK bank name on account',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData,
        applicant_non_uk_bank_name_on_account: null,
      },
    },
    {
      description: 'non-UK bank BIC/SWIFT code or IBAN',
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData,
        applicant_non_uk_bank_bic_swift_code: ' ',
        applicant_non_uk_bank_iban: null,
      },
    },
  ])('throws when required $description is missing', ({ description, formData }) => {
    expect(() => mapper.toApplicantDetails(formData)).toThrowError(`Required ${description} is missing`);
  });
});
