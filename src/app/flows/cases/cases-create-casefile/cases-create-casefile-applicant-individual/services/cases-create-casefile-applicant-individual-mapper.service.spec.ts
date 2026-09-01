import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantIndividual } from '../../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../mocks/cases-create-casefile-applicant-individual.mock';
import { CasesCreateCasefileApplicantIndividualMapperService } from './cases-create-casefile-applicant-individual-mapper.service';

const validUkFormData: ICasesCreateCasefileApplicantIndividualFormData = {
  applicant_title: 'Dr',
  applicant_first_names: 'Test',
  applicant_last_name: 'Applicant',
  applicant_add_aliases: true,
  applicant_aliases: [{ firstNames: 'Alternative', lastName: 'Applicant' }],
  applicant_date_of_birth: '31/01/1990',
  applicant_main_email_address: 'applicant@example.com',
  applicant_other_email_address: 'other.applicant@example.com',
  applicant_main_telephone_number: '020 7946 0000',
  applicant_other_telephone_number: '020 7946 0001',
  applicant_address_line_1: '1 Test Street',
  applicant_address_line_2: 'Test Area',
  applicant_address_line_3: 'Test Town',
  applicant_address_line_4: 'Test County',
  applicant_address_line_5: 'Test Region',
  applicant_postal_or_zip_code: 'TE1 1ST',
  applicant_country_id: 1,
  applicant_send_correspondence_to_third_party: true,
  applicant_third_party_name_or_organisation: 'Test Representative',
  applicant_third_party_relationship: 'Solicitor',
  applicant_third_party_reference: 'THIRD-123',
  applicant_third_party_address_line_1: '2 Test Road',
  applicant_third_party_address_line_2: 'Representative Area',
  applicant_third_party_address_line_3: 'Representative Town',
  applicant_third_party_address_line_4: 'Representative County',
  applicant_third_party_address_line_5: 'Representative Region',
  applicant_third_party_postal_or_zip_code: 'TE2 2ST',
  applicant_third_party_country_id: 2,
  applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
  applicant_uk_bank_name_on_account: 'Test Applicant',
  applicant_uk_bank_sort_code: '123456',
  applicant_uk_bank_account_number: '12345678',
  applicant_uk_bank_payment_reference: 'PAY-123',
  applicant_non_uk_bank_name_on_account: null,
  applicant_non_uk_bank_account_number: null,
  applicant_non_uk_bank_payment_reference: null,
  applicant_non_uk_bank_bic_swift_code: null,
  applicant_non_uk_bank_iban: null,
  applicant_non_uk_bank_name: null,
  applicant_non_uk_bank_branch_sort_code: null,
  applicant_restricted_information: true,
  applicant_restricted_information_reason: 'Test restriction reason',
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

describe('CasesCreateCasefileApplicantIndividualMapperService', () => {
  let mapper: CasesCreateCasefileApplicantIndividualMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileApplicantIndividualMapperService);
  });

  it('maps an empty applicant snapshot to complete empty form data', () => {
    expect(mapper.toFormData(null)).toEqual({
      applicant_title: null,
      applicant_first_names: null,
      applicant_last_name: null,
      applicant_add_aliases: false,
      applicant_aliases: [],
      applicant_date_of_birth: null,
      applicant_main_email_address: null,
      applicant_other_email_address: null,
      applicant_main_telephone_number: null,
      applicant_other_telephone_number: null,
      applicant_address_line_1: null,
      applicant_address_line_2: null,
      applicant_address_line_3: null,
      applicant_address_line_4: null,
      applicant_address_line_5: null,
      applicant_postal_or_zip_code: null,
      applicant_country_id: null,
      applicant_send_correspondence_to_third_party: false,
      applicant_third_party_name_or_organisation: null,
      applicant_third_party_relationship: null,
      applicant_third_party_reference: null,
      applicant_third_party_address_line_1: null,
      applicant_third_party_address_line_2: null,
      applicant_third_party_address_line_3: null,
      applicant_third_party_address_line_4: null,
      applicant_third_party_address_line_5: null,
      applicant_third_party_postal_or_zip_code: null,
      applicant_third_party_country_id: null,
      applicant_bank_type: null,
      applicant_uk_bank_name_on_account: null,
      applicant_uk_bank_sort_code: null,
      applicant_uk_bank_account_number: null,
      applicant_uk_bank_payment_reference: null,
      applicant_non_uk_bank_name_on_account: null,
      applicant_non_uk_bank_account_number: null,
      applicant_non_uk_bank_payment_reference: null,
      applicant_non_uk_bank_bic_swift_code: null,
      applicant_non_uk_bank_iban: null,
      applicant_non_uk_bank_name: null,
      applicant_non_uk_bank_branch_sort_code: null,
      applicant_restricted_information: false,
      applicant_restricted_information_reason: null,
    });
  });

  it('round-trips a fully populated UK applicant and converts ISO dates for display', () => {
    expect(mapper.toFormData(fullyPopulatedUkApplicant)).toEqual(validUkFormData);
    expect(mapper.toApplicantDetails(mapper.toFormData(fullyPopulatedUkApplicant))).toEqual(fullyPopulatedUkApplicant);
  });

  it('round-trips a fully populated non-UK applicant', () => {
    const formData: ICasesCreateCasefileApplicantIndividualFormData = {
      ...validUkFormData,
      applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
      applicant_uk_bank_name_on_account: 'Stale UK account name',
      applicant_uk_bank_sort_code: '11-22-33',
      applicant_uk_bank_account_number: '11112222',
      applicant_uk_bank_payment_reference: 'STALE-UK',
      applicant_non_uk_bank_name_on_account: 'Non-UK Applicant',
      applicant_non_uk_bank_account_number: '87654321',
      applicant_non_uk_bank_payment_reference: 'PAY-456',
      applicant_non_uk_bank_bic_swift_code: 'BICCODE',
      applicant_non_uk_bank_iban: 'GB29NWBK60161331926819',
      applicant_non_uk_bank_name: 'Test International Bank',
      applicant_non_uk_bank_branch_sort_code: 'BRANCH-123',
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
        applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
      }).bankDetails,
    ).toEqual({ type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE });
  });

  it('omits inactive alias, third-party, bank and restriction values', () => {
    expect(
      mapper.toApplicantDetails({
        ...validUkFormData,
        applicant_add_aliases: false,
        applicant_aliases: [{ firstNames: 'Stale', lastName: 'Alias' }],
        applicant_send_correspondence_to_third_party: false,
        applicant_third_party_name_or_organisation: 'Stale representative',
        applicant_third_party_relationship: 'Stale relationship',
        applicant_third_party_address_line_1: 'Stale address',
        applicant_third_party_country_id: 2,
        applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
        applicant_restricted_information: false,
        applicant_restricted_information_reason: 'Stale reason',
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
        applicant_title: '   ',
        applicant_other_email_address: '   ',
        applicant_uk_bank_sort_code: '12-34-56',
      }),
    ).toMatchObject({
      title: null,
      contactDetails: { otherEmailAddress: null },
      bankDetails: { sortCode: '123456' },
    });
  });

  it.each([
    ['applicant first names', { applicant_first_names: null }],
    ['applicant last name', { applicant_last_name: '   ' }],
    ['applicant address line 1', { applicant_address_line_1: null }],
    ['applicant country', { applicant_country_id: null }],
    ['alias 1 first names', { applicant_aliases: [{ firstNames: '', lastName: 'Applicant' }] }],
    ['alias 1 last name', { applicant_aliases: [{ firstNames: 'Alternative', lastName: '' }] }],
    ['third-party name or organisation', { applicant_third_party_name_or_organisation: null }],
    ['third-party relationship', { applicant_third_party_relationship: null }],
    ['third-party address line 1', { applicant_third_party_address_line_1: null }],
    ['third-party country', { applicant_third_party_country_id: null }],
    ['UK bank name on account', { applicant_uk_bank_name_on_account: null }],
    ['UK bank sort code', { applicant_uk_bank_sort_code: null }],
    ['UK bank account number', { applicant_uk_bank_account_number: null }],
    ['UK bank payment reference', { applicant_uk_bank_payment_reference: null }],
    ['restricted information reason', { applicant_restricted_information_reason: null }],
  ])('throws when required %s is missing', (description, changes) => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        ...changes,
      }),
    ).toThrowError(`Required ${description} is missing`);
  });

  it('throws when neither non-UK account identifier is supplied', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        applicant_non_uk_bank_name_on_account: 'Non-UK Applicant',
        applicant_non_uk_bank_account_number: '   ',
        applicant_non_uk_bank_iban: null,
      }),
    ).toThrowError('Required non-UK bank account number or IBAN is missing');
  });

  it('throws when the non-UK name on account is missing', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        applicant_bank_type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        applicant_non_uk_bank_name_on_account: null,
        applicant_non_uk_bank_account_number: '87654321',
      }),
    ).toThrowError('Required non-UK bank name on account is missing');
  });

  it('throws when no bank type is selected', () => {
    expect(() =>
      mapper.toApplicantDetails({
        ...validUkFormData,
        applicant_bank_type: null,
      }),
    ).toThrowError('Required applicant bank type is missing');
  });

  it('maps the shared applicant fixture to its canonical saved state', () => {
    expect(mapper.toApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData)).toEqual(
      CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
    );
  });
});
