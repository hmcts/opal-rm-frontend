import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileRespondentDetails } from '../../interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../mocks/cases-create-casefile-respondent-details.mock';
import { CasesCreateCasefileRespondentDetailsMapperService } from './cases-create-casefile-respondent-details-mapper.service';

const fullyPopulatedSaved: ICasesCreateCasefileRespondentDetails = {
  title: 'Dr',
  firstNames: 'Test',
  lastName: 'Respondent',
  aliases: [
    { firstNames: 'First alias', lastName: 'Respondent' },
    { firstNames: 'Second alias', lastName: 'Respondent' },
  ],
  dateOfBirth: '1990-01-31',
  nationalInsuranceNumber: 'AB123456C',
  otherPersonalInformation: 'Complete test respondent details',
  contactDetails: {
    mainEmailAddress: 'respondent@example.com',
    otherEmailAddress: 'other.respondent@example.com',
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
  employer: {
    employerName: 'Test Employer',
    employeeReference: 'EMP-123',
    emailAddress: 'employer@example.com',
    telephoneNumber: '020 7946 0002',
    address: {
      addressLine1: '3 Test Avenue',
      addressLine2: 'Employer Area',
      addressLine3: 'Employer Town',
      addressLine4: 'Employer County',
      addressLine5: 'Employer Region',
      postalOrZipCode: 'TE3 3ST',
      countryId: 3,
    },
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Test restriction reason',
  },
};

const fullyPopulatedFormData: ICasesCreateCasefileRespondentDetailsFormData = {
  create_casefile_respondent_details_title: 'Dr',
  create_casefile_respondent_details_first_names: 'Test',
  create_casefile_respondent_details_last_name: 'Respondent',
  create_casefile_respondent_details_add_aliases: true,
  create_casefile_respondent_details_aliases: [
    { firstNames: 'First alias', lastName: 'Respondent' },
    { firstNames: 'Second alias', lastName: 'Respondent' },
  ],
  create_casefile_respondent_details_date_of_birth: '31/01/1990',
  create_casefile_respondent_details_national_insurance_number: 'AB123456C',
  create_casefile_respondent_details_other_personal_information: 'Complete test respondent details',
  create_casefile_respondent_details_main_email_address: 'respondent@example.com',
  create_casefile_respondent_details_other_email_address: 'other.respondent@example.com',
  create_casefile_respondent_details_main_telephone_number: '020 7946 0000',
  create_casefile_respondent_details_other_telephone_number: '020 7946 0001',
  create_casefile_respondent_details_address_line_1: '1 Test Street',
  create_casefile_respondent_details_address_line_2: 'Test Area',
  create_casefile_respondent_details_address_line_3: 'Test Town',
  create_casefile_respondent_details_address_line_4: 'Test County',
  create_casefile_respondent_details_address_line_5: 'Test Region',
  create_casefile_respondent_details_postal_or_zip_code: 'TE1 1ST',
  create_casefile_respondent_details_country_id: 1,
  create_casefile_respondent_details_send_correspondence_to_third_party: true,
  create_casefile_respondent_details_third_party_name_or_organisation: 'Test Representative',
  create_casefile_respondent_details_third_party_relationship: 'Solicitor',
  create_casefile_respondent_details_third_party_reference: 'THIRD-123',
  create_casefile_respondent_details_third_party_address_line_1: '2 Test Road',
  create_casefile_respondent_details_third_party_address_line_2: 'Representative Area',
  create_casefile_respondent_details_third_party_address_line_3: 'Representative Town',
  create_casefile_respondent_details_third_party_address_line_4: 'Representative County',
  create_casefile_respondent_details_third_party_address_line_5: 'Representative Region',
  create_casefile_respondent_details_third_party_postal_or_zip_code: 'TE2 2ST',
  create_casefile_respondent_details_third_party_country_id: 2,
  create_casefile_respondent_details_add_employer_details: true,
  create_casefile_respondent_details_employer_name: 'Test Employer',
  create_casefile_respondent_details_employee_reference: 'EMP-123',
  create_casefile_respondent_details_employer_email_address: 'employer@example.com',
  create_casefile_respondent_details_employer_telephone_number: '020 7946 0002',
  create_casefile_respondent_details_employer_address_line_1: '3 Test Avenue',
  create_casefile_respondent_details_employer_address_line_2: 'Employer Area',
  create_casefile_respondent_details_employer_address_line_3: 'Employer Town',
  create_casefile_respondent_details_employer_address_line_4: 'Employer County',
  create_casefile_respondent_details_employer_address_line_5: 'Employer Region',
  create_casefile_respondent_details_employer_postal_or_zip_code: 'TE3 3ST',
  create_casefile_respondent_details_employer_country_id: 3,
  create_casefile_respondent_details_restricted_information: true,
  create_casefile_respondent_details_restricted_information_reason: 'Test restriction reason',
};

describe('CasesCreateCasefileRespondentDetailsMapperService', () => {
  let mapper: CasesCreateCasefileRespondentDetailsMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileRespondentDetailsMapperService);
  });

  it('maps an empty respondent snapshot to complete empty form data', () => {
    expect(mapper.toFormData(null)).toEqual({
      create_casefile_respondent_details_title: null,
      create_casefile_respondent_details_first_names: null,
      create_casefile_respondent_details_last_name: null,
      create_casefile_respondent_details_add_aliases: false,
      create_casefile_respondent_details_aliases: [],
      create_casefile_respondent_details_date_of_birth: null,
      create_casefile_respondent_details_national_insurance_number: null,
      create_casefile_respondent_details_other_personal_information: null,
      create_casefile_respondent_details_main_email_address: null,
      create_casefile_respondent_details_other_email_address: null,
      create_casefile_respondent_details_main_telephone_number: null,
      create_casefile_respondent_details_other_telephone_number: null,
      create_casefile_respondent_details_address_line_1: null,
      create_casefile_respondent_details_address_line_2: null,
      create_casefile_respondent_details_address_line_3: null,
      create_casefile_respondent_details_address_line_4: null,
      create_casefile_respondent_details_address_line_5: null,
      create_casefile_respondent_details_postal_or_zip_code: null,
      create_casefile_respondent_details_country_id: null,
      create_casefile_respondent_details_send_correspondence_to_third_party: false,
      create_casefile_respondent_details_third_party_name_or_organisation: null,
      create_casefile_respondent_details_third_party_relationship: null,
      create_casefile_respondent_details_third_party_reference: null,
      create_casefile_respondent_details_third_party_address_line_1: null,
      create_casefile_respondent_details_third_party_address_line_2: null,
      create_casefile_respondent_details_third_party_address_line_3: null,
      create_casefile_respondent_details_third_party_address_line_4: null,
      create_casefile_respondent_details_third_party_address_line_5: null,
      create_casefile_respondent_details_third_party_postal_or_zip_code: null,
      create_casefile_respondent_details_third_party_country_id: null,
      create_casefile_respondent_details_add_employer_details: false,
      create_casefile_respondent_details_employer_name: null,
      create_casefile_respondent_details_employee_reference: null,
      create_casefile_respondent_details_employer_email_address: null,
      create_casefile_respondent_details_employer_telephone_number: null,
      create_casefile_respondent_details_employer_address_line_1: null,
      create_casefile_respondent_details_employer_address_line_2: null,
      create_casefile_respondent_details_employer_address_line_3: null,
      create_casefile_respondent_details_employer_address_line_4: null,
      create_casefile_respondent_details_employer_address_line_5: null,
      create_casefile_respondent_details_employer_postal_or_zip_code: null,
      create_casefile_respondent_details_employer_country_id: null,
      create_casefile_respondent_details_restricted_information: false,
      create_casefile_respondent_details_restricted_information_reason: null,
    });
  });

  it('maps canonical saved data to display form data and branch flags', () => {
    expect(mapper.toFormData(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved)).toMatchObject({
      create_casefile_respondent_details_first_names: 'Test',
      create_casefile_respondent_details_add_aliases: true,
      create_casefile_respondent_details_date_of_birth: '31/01/1990',
      create_casefile_respondent_details_country_id: 1,
      create_casefile_respondent_details_send_correspondence_to_third_party: false,
      create_casefile_respondent_details_add_employer_details: false,
      create_casefile_respondent_details_restricted_information: false,
    });
  });

  it('maps a fully populated canonical snapshot to complete display form data', () => {
    expect(mapper.toFormData(fullyPopulatedSaved)).toEqual(fullyPopulatedFormData);
  });

  it('round-trips a fully populated canonical snapshot without losing conditional data', () => {
    expect(mapper.toRespondentDetails(mapper.toFormData(fullyPopulatedSaved))).toEqual(fullyPopulatedSaved);
  });

  it('round-trips a respondent without a date of birth as null', () => {
    const saved = { ...fullyPopulatedSaved, dateOfBirth: null };
    const formData = mapper.toFormData(saved);

    expect(formData.create_casefile_respondent_details_date_of_birth).toBeNull();
    expect(mapper.toRespondentDetails(formData).dateOfBirth).toBeNull();
  });

  it('maps valid display data to one canonical respondent snapshot', () => {
    expect(mapper.toRespondentDetails(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData)).toEqual(
      CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved,
    );
  });

  it('maps selected third-party and employer branches', () => {
    const saved = mapper.toRespondentDetails({
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_third_party_name_or_organisation: '  Test representative  ',
      create_casefile_respondent_details_third_party_relationship: '  Solicitor  ',
      create_casefile_respondent_details_third_party_reference: '  REF-123  ',
      create_casefile_respondent_details_third_party_address_line_1: '  2 Test Road  ',
      create_casefile_respondent_details_third_party_address_line_2: '  Test Area  ',
      create_casefile_respondent_details_third_party_country_id: 2,
      create_casefile_respondent_details_add_employer_details: true,
      create_casefile_respondent_details_employer_name: '  Test Employer  ',
      create_casefile_respondent_details_employee_reference: '  EMP-123  ',
      create_casefile_respondent_details_employer_email_address: '  employer@example.com  ',
      create_casefile_respondent_details_employer_telephone_number: '  020 7946 0000  ',
      create_casefile_respondent_details_employer_address_line_1: '  3 Test Street  ',
      create_casefile_respondent_details_employer_address_line_2: '  Test District  ',
      create_casefile_respondent_details_employer_country_id: 3,
    });

    expect(saved.thirdParty).toEqual({
      nameOrOrganisation: 'Test representative',
      relationship: 'Solicitor',
      reference: 'REF-123',
      address: {
        addressLine1: '2 Test Road',
        addressLine2: 'Test Area',
        addressLine3: null,
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: null,
        countryId: 2,
      },
    });
    expect(saved.employer).toEqual({
      employerName: 'Test Employer',
      employeeReference: 'EMP-123',
      emailAddress: 'employer@example.com',
      telephoneNumber: '020 7946 0000',
      address: {
        addressLine1: '3 Test Street',
        addressLine2: 'Test District',
        addressLine3: null,
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: null,
        countryId: 3,
      },
    });
  });

  it('omits unchecked conditional objects and normalises blank optional values', () => {
    expect(
      mapper.toRespondentDetails({
        ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
        create_casefile_respondent_details_title: '   ',
        create_casefile_respondent_details_other_email_address: '   ',
        create_casefile_respondent_details_add_employer_details: false,
        create_casefile_respondent_details_employer_name: 'Stale employer',
        create_casefile_respondent_details_restricted_information: false,
        create_casefile_respondent_details_restricted_information_reason: 'Stale reason',
      }),
    ).toMatchObject({
      title: null,
      contactDetails: { otherEmailAddress: null },
      employer: null,
      restrictedInformation: { restricted: false, reason: null },
    });
  });

  it('omits unchecked stale aliases', () => {
    const saved = mapper.toRespondentDetails({
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_add_aliases: false,
      create_casefile_respondent_details_aliases: [{ firstNames: 'Stale alias', lastName: 'Stale respondent' }],
    });

    expect(saved.aliases).toEqual([]);
  });

  it('omits unchecked stale third-party data', () => {
    const saved = mapper.toRespondentDetails({
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_send_correspondence_to_third_party: false,
      create_casefile_respondent_details_third_party_name_or_organisation: 'Stale representative',
      create_casefile_respondent_details_third_party_relationship: 'Stale relationship',
      create_casefile_respondent_details_third_party_reference: 'STALE-123',
      create_casefile_respondent_details_third_party_address_line_1: 'Stale address',
      create_casefile_respondent_details_third_party_address_line_2: 'Stale area',
      create_casefile_respondent_details_third_party_address_line_3: 'Stale town',
      create_casefile_respondent_details_third_party_address_line_4: 'Stale county',
      create_casefile_respondent_details_third_party_address_line_5: 'Stale region',
      create_casefile_respondent_details_third_party_postal_or_zip_code: 'ST1 1LE',
      create_casefile_respondent_details_third_party_country_id: 2,
    });

    expect(saved.thirdParty).toBeNull();
  });

  it('throws for impossible missing required respondent values', () => {
    expect(() =>
      mapper.toRespondentDetails({
        ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
        create_casefile_respondent_details_first_names: null,
      }),
    ).toThrowError('Required respondent first names is missing');
  });

  it('rejects an unexpectedly missing required respondent country', () => {
    expect(() =>
      mapper.toRespondentDetails({
        ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
        create_casefile_respondent_details_country_id: null,
      }),
    ).toThrowError('Required respondent country is missing');
  });
});
