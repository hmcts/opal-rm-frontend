import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../mocks/cases-create-casefile-respondent-details.mock';
import { CasesCreateCasefileRespondentDetailsMapperService } from './cases-create-casefile-respondent-details-mapper.service';

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

  it('throws for impossible missing required respondent values', () => {
    expect(() =>
      mapper.toRespondentDetails({
        ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
        respondent_first_names: null,
      }),
    ).toThrowError('Required respondent first names is missing');
  });
});
