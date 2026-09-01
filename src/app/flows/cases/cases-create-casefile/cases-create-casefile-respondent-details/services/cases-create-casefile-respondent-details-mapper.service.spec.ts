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
  respondent_title: 'Dr',
  respondent_first_names: 'Test',
  respondent_last_name: 'Respondent',
  respondent_add_aliases: true,
  respondent_aliases: [
    { firstNames: 'First alias', lastName: 'Respondent' },
    { firstNames: 'Second alias', lastName: 'Respondent' },
  ],
  respondent_date_of_birth: '31/01/1990',
  respondent_national_insurance_number: 'AB123456C',
  respondent_other_personal_information: 'Complete test respondent details',
  respondent_main_email_address: 'respondent@example.com',
  respondent_other_email_address: 'other.respondent@example.com',
  respondent_main_telephone_number: '020 7946 0000',
  respondent_other_telephone_number: '020 7946 0001',
  respondent_address_line_1: '1 Test Street',
  respondent_address_line_2: 'Test Area',
  respondent_address_line_3: 'Test Town',
  respondent_address_line_4: 'Test County',
  respondent_address_line_5: 'Test Region',
  respondent_postal_or_zip_code: 'TE1 1ST',
  respondent_country_id: 1,
  respondent_send_correspondence_to_third_party: true,
  respondent_third_party_name_or_organisation: 'Test Representative',
  respondent_third_party_relationship: 'Solicitor',
  respondent_third_party_reference: 'THIRD-123',
  respondent_third_party_address_line_1: '2 Test Road',
  respondent_third_party_address_line_2: 'Representative Area',
  respondent_third_party_address_line_3: 'Representative Town',
  respondent_third_party_address_line_4: 'Representative County',
  respondent_third_party_address_line_5: 'Representative Region',
  respondent_third_party_postal_or_zip_code: 'TE2 2ST',
  respondent_third_party_country_id: 2,
  respondent_add_employer_details: true,
  respondent_employer_name: 'Test Employer',
  respondent_employee_reference: 'EMP-123',
  respondent_employer_email_address: 'employer@example.com',
  respondent_employer_telephone_number: '020 7946 0002',
  respondent_employer_address_line_1: '3 Test Avenue',
  respondent_employer_address_line_2: 'Employer Area',
  respondent_employer_address_line_3: 'Employer Town',
  respondent_employer_address_line_4: 'Employer County',
  respondent_employer_address_line_5: 'Employer Region',
  respondent_employer_postal_or_zip_code: 'TE3 3ST',
  respondent_employer_country_id: 3,
  respondent_restricted_information: true,
  respondent_restricted_information_reason: 'Test restriction reason',
};

describe('CasesCreateCasefileRespondentDetailsMapperService', () => {
  let mapper: CasesCreateCasefileRespondentDetailsMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileRespondentDetailsMapperService);
  });

  it('maps canonical saved data to display form data and branch flags', () => {
    expect(mapper.toFormData(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved)).toMatchObject({
      respondent_first_names: 'Test',
      respondent_add_aliases: true,
      respondent_date_of_birth: '31/01/1990',
      respondent_country_id: 1,
      respondent_send_correspondence_to_third_party: false,
      respondent_add_employer_details: false,
      respondent_restricted_information: false,
    });
  });

  it('maps a fully populated canonical snapshot to complete display form data', () => {
    expect(mapper.toFormData(fullyPopulatedSaved)).toEqual(fullyPopulatedFormData);
  });

  it('round-trips a fully populated canonical snapshot without losing conditional data', () => {
    expect(mapper.toRespondentDetails(mapper.toFormData(fullyPopulatedSaved))).toEqual(fullyPopulatedSaved);
  });

  it('maps valid display data to one canonical respondent snapshot', () => {
    expect(mapper.toRespondentDetails(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData)).toEqual(
      CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved,
    );
  });

  it('maps selected third-party and employer branches', () => {
    const saved = mapper.toRespondentDetails({
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_send_correspondence_to_third_party: true,
      respondent_third_party_name_or_organisation: '  Test representative  ',
      respondent_third_party_relationship: '  Solicitor  ',
      respondent_third_party_reference: '  REF-123  ',
      respondent_third_party_address_line_1: '  2 Test Road  ',
      respondent_third_party_address_line_2: '  Test Area  ',
      respondent_third_party_country_id: 2,
      respondent_add_employer_details: true,
      respondent_employer_name: '  Test Employer  ',
      respondent_employee_reference: '  EMP-123  ',
      respondent_employer_email_address: '  employer@example.com  ',
      respondent_employer_telephone_number: '  020 7946 0000  ',
      respondent_employer_address_line_1: '  3 Test Street  ',
      respondent_employer_address_line_2: '  Test District  ',
      respondent_employer_country_id: 3,
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
        respondent_title: '   ',
        respondent_other_email_address: '   ',
        respondent_add_employer_details: false,
        respondent_employer_name: 'Stale employer',
        respondent_restricted_information: false,
        respondent_restricted_information_reason: 'Stale reason',
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
      respondent_add_aliases: false,
      respondent_aliases: [{ firstNames: 'Stale alias', lastName: 'Stale respondent' }],
    });

    expect(saved.aliases).toEqual([]);
  });

  it('omits unchecked stale third-party data', () => {
    const saved = mapper.toRespondentDetails({
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_send_correspondence_to_third_party: false,
      respondent_third_party_name_or_organisation: 'Stale representative',
      respondent_third_party_relationship: 'Stale relationship',
      respondent_third_party_reference: 'STALE-123',
      respondent_third_party_address_line_1: 'Stale address',
      respondent_third_party_address_line_2: 'Stale area',
      respondent_third_party_address_line_3: 'Stale town',
      respondent_third_party_address_line_4: 'Stale county',
      respondent_third_party_address_line_5: 'Stale region',
      respondent_third_party_postal_or_zip_code: 'ST1 1LE',
      respondent_third_party_country_id: 2,
    });

    expect(saved.thirdParty).toBeNull();
  });

  it('throws for impossible missing required respondent values', () => {
    expect(() =>
      mapper.toRespondentDetails({
        ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
        respondent_first_names: null,
      }),
    ).toThrowError('Required respondent first names is missing');
  });
});
