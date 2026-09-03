import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantIndividual } from '../../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileApplicantOrganisation } from '../../interfaces/cases-create-casefile-applicant-organisation.interface';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../mocks/cases-create-casefile-applicant-individual.mock';
import { CasesCreateCasefileApplicantIndividualMapperService } from './cases-create-casefile-applicant-individual-mapper.service';

const validUkFormData: ICasesCreateCasefileApplicantIndividualFormData = {
  create_casefile_applicant_individual_title: 'Dr',
  create_casefile_applicant_individual_first_names: 'Test',
  create_casefile_applicant_individual_last_name: 'Applicant',
  create_casefile_applicant_individual_add_aliases: true,
  create_casefile_applicant_individual_aliases: [{ firstNames: 'Alternative', lastName: 'Applicant' }],
  create_casefile_applicant_individual_date_of_birth: '31/01/1990',
  create_casefile_applicant_individual_main_email_address: 'applicant@example.com',
  create_casefile_applicant_individual_other_email_address: 'other.applicant@example.com',
  create_casefile_applicant_individual_main_telephone_number: '020 7946 0000',
  create_casefile_applicant_individual_other_telephone_number: '020 7946 0001',
  create_casefile_applicant_individual_address_line_1: '1 Test Street',
  create_casefile_applicant_individual_address_line_2: 'Test Area',
  create_casefile_applicant_individual_address_line_3: 'Test Town',
  create_casefile_applicant_individual_address_line_4: 'Test County',
  create_casefile_applicant_individual_address_line_5: 'Test Region',
  create_casefile_applicant_individual_postal_or_zip_code: 'TE1 1ST',
  create_casefile_applicant_individual_country_id: 1,
  create_casefile_applicant_individual_send_correspondence_to_third_party: true,
  create_casefile_applicant_individual_third_party_name_or_organisation: 'Test Representative',
  create_casefile_applicant_individual_third_party_relationship: 'Solicitor',
  create_casefile_applicant_individual_third_party_reference: 'THIRD-123',
  create_casefile_applicant_individual_third_party_address_line_1: '2 Test Road',
  create_casefile_applicant_individual_third_party_address_line_2: 'Representative Area',
  create_casefile_applicant_individual_third_party_address_line_3: 'Representative Town',
  create_casefile_applicant_individual_third_party_address_line_4: 'Representative County',
  create_casefile_applicant_individual_third_party_address_line_5: 'Representative Region',
  create_casefile_applicant_individual_third_party_postal_or_zip_code: 'TE2 2ST',
  create_casefile_applicant_individual_third_party_country_id: 2,
  create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
  create_casefile_applicant_individual_uk_bank_name_on_account: 'Test Applicant',
  create_casefile_applicant_individual_uk_bank_sort_code: '123456',
  create_casefile_applicant_individual_uk_bank_account_number: '12345678',
  create_casefile_applicant_individual_uk_bank_payment_reference: 'PAY-123',
  create_casefile_applicant_individual_non_uk_bank_name_on_account: null,
  create_casefile_applicant_individual_non_uk_bank_account_number: null,
  create_casefile_applicant_individual_non_uk_bank_payment_reference: null,
  create_casefile_applicant_individual_non_uk_bank_bic_swift_code: null,
  create_casefile_applicant_individual_non_uk_bank_iban: null,
  create_casefile_applicant_individual_non_uk_bank_name: null,
  create_casefile_applicant_individual_non_uk_bank_branch_sort_code: null,
  create_casefile_applicant_individual_restricted_information: true,
  create_casefile_applicant_individual_restricted_information_reason: 'Test restriction reason',
};

const fullyPopulatedUkApplicant: ICasesCreateCasefileApplicantIndividual = {
  title: 'Dr',
  firstNames: 'Test',
  lastName: 'Applicant',
  aliases: [{ firstNames: 'Alternative', lastName: 'Applicant' }],
  dateOfBirth: '1990-01-31',
  contactDetails: {
    mainEmailAddress: 'applicant@example.com',
    otherEmailAddress: 'other.applicant@example.com',
    mainTelephoneNumber: '020 7946 0000',
    otherTelephoneNumber: '020 7946 0001',
    address: {
      addressLine1: '1 Test Street',
      addressLine2: 'Test Area',
      addressLine3: 'Test Town',
      addressLine4: 'Test County',
      addressLine5: 'Test Region',
      postalOrZipCode: 'TE1 1ST',
      countryId: 1,
    },
  },
  thirdParty: {
    nameOrOrganisation: 'Test Representative',
    relationship: 'Solicitor',
    reference: 'THIRD-123',
    address: {
      addressLine1: '2 Test Road',
      addressLine2: 'Representative Area',
      addressLine3: 'Representative Town',
      addressLine4: 'Representative County',
      addressLine5: 'Representative Region',
      postalOrZipCode: 'TE2 2ST',
      countryId: 2,
    },
  },
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Applicant',
    sortCode: '123456',
    accountNumber: '12345678',
    paymentReference: 'PAY-123',
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Test restriction reason',
  },
};

const organisationApplicant: ICasesCreateCasefileApplicantOrganisation = {
  organisationName: 'Test Organisation',
  foreignAuthorityReference: 'FA-9803',
  contactDetails: {
    mainEmailAddress: 'organisation@example.com',
    otherEmailAddress: null,
    mainTelephoneNumber: '+44 (0)20 7946 0000',
    otherTelephoneNumber: null,
    address: {
      addressLine1: '1 Test Street',
      addressLine2: 'Test Town',
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: 'TE1 1ST',
      countryId: 826,
    },
  },
  bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
};

describe('CasesCreateCasefileApplicantIndividualMapperService', () => {
  let mapper: CasesCreateCasefileApplicantIndividualMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileApplicantIndividualMapperService);
  });

  it('maps an empty applicant snapshot to complete empty form data', () => {
    expect(mapper.toFormData(null)).toEqual({
      create_casefile_applicant_individual_title: null,
      create_casefile_applicant_individual_first_names: null,
      create_casefile_applicant_individual_last_name: null,
      create_casefile_applicant_individual_add_aliases: false,
      create_casefile_applicant_individual_aliases: [],
      create_casefile_applicant_individual_date_of_birth: null,
      create_casefile_applicant_individual_main_email_address: null,
      create_casefile_applicant_individual_other_email_address: null,
      create_casefile_applicant_individual_main_telephone_number: null,
      create_casefile_applicant_individual_other_telephone_number: null,
      create_casefile_applicant_individual_address_line_1: null,
      create_casefile_applicant_individual_address_line_2: null,
      create_casefile_applicant_individual_address_line_3: null,
      create_casefile_applicant_individual_address_line_4: null,
      create_casefile_applicant_individual_address_line_5: null,
      create_casefile_applicant_individual_postal_or_zip_code: null,
      create_casefile_applicant_individual_country_id: null,
      create_casefile_applicant_individual_send_correspondence_to_third_party: false,
      create_casefile_applicant_individual_third_party_name_or_organisation: null,
      create_casefile_applicant_individual_third_party_relationship: null,
      create_casefile_applicant_individual_third_party_reference: null,
      create_casefile_applicant_individual_third_party_address_line_1: null,
      create_casefile_applicant_individual_third_party_address_line_2: null,
      create_casefile_applicant_individual_third_party_address_line_3: null,
      create_casefile_applicant_individual_third_party_address_line_4: null,
      create_casefile_applicant_individual_third_party_address_line_5: null,
      create_casefile_applicant_individual_third_party_postal_or_zip_code: null,
      create_casefile_applicant_individual_third_party_country_id: null,
      create_casefile_applicant_individual_bank_type: null,
      create_casefile_applicant_individual_uk_bank_name_on_account: null,
      create_casefile_applicant_individual_uk_bank_sort_code: null,
      create_casefile_applicant_individual_uk_bank_account_number: null,
      create_casefile_applicant_individual_uk_bank_payment_reference: null,
      create_casefile_applicant_individual_non_uk_bank_name_on_account: null,
      create_casefile_applicant_individual_non_uk_bank_account_number: null,
      create_casefile_applicant_individual_non_uk_bank_payment_reference: null,
      create_casefile_applicant_individual_non_uk_bank_bic_swift_code: null,
      create_casefile_applicant_individual_non_uk_bank_iban: null,
      create_casefile_applicant_individual_non_uk_bank_name: null,
      create_casefile_applicant_individual_non_uk_bank_branch_sort_code: null,
      create_casefile_applicant_individual_restricted_information: false,
      create_casefile_applicant_individual_restricted_information_reason: null,
    });
  });

  it('maps an Organisation snapshot to the empty Individual form data', () => {
    expect(mapper.toFormData(organisationApplicant)).toEqual(mapper.toFormData(null));
  });

  it('round-trips a fully populated UK applicant and converts ISO dates for display', () => {
    expect(mapper.toFormData(fullyPopulatedUkApplicant)).toEqual(validUkFormData);
    expect(mapper.toApplicantDetails(mapper.toFormData(fullyPopulatedUkApplicant))).toEqual(fullyPopulatedUkApplicant);
  });

  it('round-trips a fully populated non-UK applicant', () => {
    const formData: ICasesCreateCasefileApplicantIndividualFormData = {
      ...validUkFormData,
      create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
      create_casefile_applicant_individual_uk_bank_name_on_account: 'Stale UK account name',
      create_casefile_applicant_individual_uk_bank_sort_code: '11-22-33',
      create_casefile_applicant_individual_uk_bank_account_number: '11112222',
      create_casefile_applicant_individual_uk_bank_payment_reference: 'STALE-UK',
      create_casefile_applicant_individual_non_uk_bank_name_on_account: 'Non-UK Applicant',
      create_casefile_applicant_individual_non_uk_bank_account_number: '87654321',
      create_casefile_applicant_individual_non_uk_bank_payment_reference: 'PAY-456',
      create_casefile_applicant_individual_non_uk_bank_bic_swift_code: 'BICCODE',
      create_casefile_applicant_individual_non_uk_bank_iban: 'GB29NWBK60161331926819',
      create_casefile_applicant_individual_non_uk_bank_name: 'Test International Bank',
      create_casefile_applicant_individual_non_uk_bank_branch_sort_code: 'BRANCH-123',
    };
    const saved = mapper.toApplicantDetails(formData);

    expect(saved.bankDetails).toEqual({
      type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
      nameOnAccount: 'Non-UK Applicant',
      accountNumber: '87654321',
      paymentReference: 'PAY-456',
      bicSwiftCode: 'BICCODE',
      iban: 'GB29NWBK60161331926819',
      bankName: 'Test International Bank',
      branchSortCode: 'BRANCH-123',
    });
    expect(mapper.toApplicantDetails(mapper.toFormData(saved))).toEqual(saved);
  });

  it('maps an explicit no-bank choice to the none bank union', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
      }).bankDetails,
    ).toEqual({ type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE });
  });

  it('omits inactive alias, third-party, bank and restriction values', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_add_aliases: false,
        create_casefile_applicant_individual_aliases: [{ firstNames: 'Stale', lastName: 'Alias' }],
        create_casefile_applicant_individual_send_correspondence_to_third_party: false,
        create_casefile_applicant_individual_third_party_name_or_organisation: 'Stale representative',
        create_casefile_applicant_individual_third_party_relationship: 'Stale relationship',
        create_casefile_applicant_individual_third_party_address_line_1: 'Stale address',
        create_casefile_applicant_individual_third_party_country_id: 2,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
        create_casefile_applicant_individual_restricted_information: false,
        create_casefile_applicant_individual_restricted_information_reason: 'Stale reason',
      }),
    ).toMatchObject({
      aliases: [],
      thirdParty: null,
      bankDetails: { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
      restrictedInformation: { restricted: false, reason: null },
    });
  });

  it('normalises whitespace to null and removes dashes from UK sort codes', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_title: '   ',
        create_casefile_applicant_individual_other_email_address: '   ',
        create_casefile_applicant_individual_uk_bank_sort_code: '12-34-56',
      }),
    ).toMatchObject({
      title: null,
      contactDetails: { otherEmailAddress: null },
      bankDetails: { sortCode: '123456' },
    });
  });

  it('normalises a whitespace-only date of birth to null', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_date_of_birth: '   ',
      }).dateOfBirth,
    ).toBeNull();
  });

  it.each([
    ['applicant first names', { create_casefile_applicant_individual_first_names: null }],
    ['applicant last name', { create_casefile_applicant_individual_last_name: '   ' }],
    ['applicant address line 1', { create_casefile_applicant_individual_address_line_1: null }],
    ['applicant country', { create_casefile_applicant_individual_country_id: null }],
    [
      'alias 1 first names',
      { create_casefile_applicant_individual_aliases: [{ firstNames: '', lastName: 'Applicant' }] },
    ],
    [
      'alias 1 last name',
      { create_casefile_applicant_individual_aliases: [{ firstNames: 'Alternative', lastName: '' }] },
    ],
    [
      'third-party name or organisation',
      { create_casefile_applicant_individual_third_party_name_or_organisation: null },
    ],
    ['third-party relationship', { create_casefile_applicant_individual_third_party_relationship: null }],
    ['third-party address line 1', { create_casefile_applicant_individual_third_party_address_line_1: null }],
    ['third-party country', { create_casefile_applicant_individual_third_party_country_id: null }],
    ['UK bank name on account', { create_casefile_applicant_individual_uk_bank_name_on_account: null }],
    ['UK bank sort code', { create_casefile_applicant_individual_uk_bank_sort_code: null }],
    ['UK bank account number', { create_casefile_applicant_individual_uk_bank_account_number: null }],
    ['UK bank payment reference', { create_casefile_applicant_individual_uk_bank_payment_reference: null }],
    ['restricted information reason', { create_casefile_applicant_individual_restricted_information_reason: null }],
  ])('throws when required %s is missing', (description, changes) => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        ...changes,
      }),
    ).toThrowError(`Required ${description} is missing`);
  });

  it('maps non-UK bank details when only a BIC/SWIFT code is supplied', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        create_casefile_applicant_individual_non_uk_bank_name_on_account: 'Non-UK Applicant',
        create_casefile_applicant_individual_non_uk_bank_account_number: null,
        create_casefile_applicant_individual_non_uk_bank_bic_swift_code: 'BICCODE',
        create_casefile_applicant_individual_non_uk_bank_iban: null,
      }).bankDetails,
    ).toMatchObject({
      type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
      accountNumber: null,
      bicSwiftCode: 'BICCODE',
      iban: null,
    });
  });

  it('maps non-UK bank details when only an IBAN is supplied', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        create_casefile_applicant_individual_non_uk_bank_name_on_account: 'Non-UK Applicant',
        create_casefile_applicant_individual_non_uk_bank_account_number: null,
        create_casefile_applicant_individual_non_uk_bank_bic_swift_code: '   ',
        create_casefile_applicant_individual_non_uk_bank_iban: 'GB29NWBK60161331926819',
      }).bankDetails,
    ).toMatchObject({
      type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
      accountNumber: null,
      bicSwiftCode: null,
      iban: 'GB29NWBK60161331926819',
    });
  });

  it('throws when neither a non-UK BIC/SWIFT code nor IBAN is supplied', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        create_casefile_applicant_individual_non_uk_bank_name_on_account: 'Non-UK Applicant',
        create_casefile_applicant_individual_non_uk_bank_account_number: '87654321',
        create_casefile_applicant_individual_non_uk_bank_bic_swift_code: '   ',
        create_casefile_applicant_individual_non_uk_bank_iban: '   ',
      }),
    ).toThrowError('Required non-UK bank BIC/SWIFT code or IBAN is missing');
  });

  it('throws when the non-UK name on account is missing', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        create_casefile_applicant_individual_non_uk_bank_name_on_account: null,
        create_casefile_applicant_individual_non_uk_bank_account_number: '87654321',
        create_casefile_applicant_individual_non_uk_bank_bic_swift_code: 'BICCODE',
      }),
    ).toThrowError('Required non-UK bank name on account is missing');
  });

  it('throws when no bank type is selected', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        create_casefile_applicant_individual_bank_type: null,
      }),
    ).toThrowError('Required applicant bank type is missing');
  });

  it('rejects an invalid runtime applicant bank discriminator', () => {
    const formData = { ...validUkFormData, create_casefile_applicant_individual_bank_type: 'INVALID' } as never;

    expect(() => mapper.toApplicantDetails(formData)).toThrowError('Unsupported applicant bank type: INVALID');
  });

  it('maps the shared applicant fixture to its canonical saved state', () => {
    expect(mapper.toApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData)).toEqual(
      CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
    );
  });
});
