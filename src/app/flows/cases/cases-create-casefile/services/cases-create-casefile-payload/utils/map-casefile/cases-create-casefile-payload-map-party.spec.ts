import {
  mapSavedAddress,
  mapSavedContacts,
  mapSavedIndividual,
  mapSavedThirdParty,
  mapSavedRespondent,
  mapSavedApplicant,
} from './cases-create-casefile-payload-map-party';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
} from '../../../../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
type Party = IOpalMaintenanceDraftCasefileRequest['casefile']['applicant']['party_details'];
const countries = PERSISTED_CASEFILE_REFERENCES.countries;
const expectedAddress = {
  addressLine1: '1 Test Street',
  addressLine2: null,
  addressLine3: null,
  addressLine4: null,
  addressLine5: null,
  postalOrZipCode: null,
  countryId: 1,
};
const expectedIndividual = {
  title: null,
  firstNames: 'Synthetic',
  lastName: 'Respondent',
  aliases: [],
  dateOfBirth: null,
  restrictedInformation: { restricted: false, reason: null },
  contactDetails: {
    mainEmailAddress: null,
    otherEmailAddress: null,
    mainTelephoneNumber: null,
    otherTelephoneNumber: null,
    address: expectedAddress,
  },
};
function party(): Party {
  return createPersistedCasefileDetail().casefile.respondent_account.respondent.party_details;
}
describe('saved party mapping', () => {
  it('restores an inactive country by unique CJS code and defaults absent address fields', () => {
    expect(
      mapSavedAddress(
        { address_line_1: '1 Test Street', cjs_code: 101 },
        countries.map((c) => ({ ...c, active: false })),
      ),
    ).toEqual(expectedAddress);
  });
  it.each([NaN, 101.5, undefined])('rejects malformed CJS code %s even when a reference matches it', (code) => {
    expect(() =>
      mapSavedAddress({ address_line_1: 'Test', cjs_code: code } as Party['address'], [
        { ...countries[0], cjs_code: code } as (typeof countries)[number],
      ]),
    ).toThrow('Unusable saved country');
  });
  it.each([null, { address_line_1: ' ' }, { address_line_1: 'Test', address_line_2: 1 }])(
    'rejects malformed addresses safely %#',
    (value) => {
      expect(() => mapSavedAddress(value as Party['address'], countries)).toThrow('Unusable saved party');
    },
  );
  it.each([null, [], { primary_email_address: 1 }])('rejects malformed contacts safely %#', (value) => {
    expect(() => mapSavedContacts({ ...party(), contact_details: value } as Party, countries)).toThrow(
      'Unusable saved party',
    );
  });
  it.each([null, { name: 'Test', relationship: ' ' }, { name: 'Test', relationship: 'Test', reference: 1 }])(
    'rejects malformed third parties safely %#',
    (value) => {
      expect(() =>
        mapSavedThirdParty(
          value as IOpalMaintenanceDraftCasefileRequest['casefile']['applicant']['third_party_details'],
          countries,
        ),
      ).toThrow('Unusable saved party');
    },
  );
  it.each([null, { employer_name: ' ' }, { employer_name: 'Test', employee_reference: 1 }])(
    'rejects malformed employers safely %#',
    (debtor) => {
      const value = createPersistedCasefileDetail().casefile.respondent_account.respondent;
      expect(() => mapSavedRespondent({ ...value, debtor_details: debtor } as typeof value, countries)).toThrow(
        'Unusable saved party',
      );
    },
  );
  it('rejects missing employer and third-party countries rather than defaulting them', () => {
    const value = createPersistedCasefileDetail().casefile.respondent_account.respondent;
    value.debtor_details = { employer_name: 'Test', employer_address: { address_line_1: 'Test', cjs_code: 999 } };
    expect(() => mapSavedRespondent(value, countries)).toThrow('Unusable saved country');
    delete value.debtor_details;
    value.third_party_details = {
      name: 'Test',
      relationship: 'Test',
      address: { address_line_1: 'Test', cjs_code: 998 },
    };
    expect(() => mapSavedRespondent(value, countries)).toThrow('Unusable saved country');
  });
  it('omits respondent-only fields and restores an individual applicant UK bank and absent third party', () => {
    const value = createPersistedCasefileDetail().casefile.applicant;
    value.party_details.individual_details = {
      surname: 'Applicant',
      national_insurance_number: 'TEST',
      other_personal_information: 'Other',
    };
    value.bank_account_details = {
      bank_account_type: 'UK Bank',
      uk_bank_details: {
        account_name: 'Test',
        sort_code: '001122',
        account_number: '00123456',
        payment_reference: 'REF',
      },
    };
    expect(mapSavedApplicant(value, countries)).toEqual({
      ...expectedIndividual,
      firstNames: '',
      lastName: 'Applicant',
      contactDetails: {
        ...expectedIndividual.contactDetails,
        address: { ...expectedAddress, addressLine1: '2 Test Street', countryId: 2 },
      },
      thirdParty: null,
      bankDetails: {
        type: 'uk',
        nameOnAccount: 'Test',
        sortCode: '001122',
        accountNumber: '00123456',
        paymentReference: 'REF',
      },
    });
  });
  it('preserves references when the result address is changed', () => {
    const before = structuredClone(countries);
    const result = mapSavedAddress(party().address, countries);
    result.countryId = 999;
    expect(countries).toEqual(before);
  });
  it('preserves every address field', () => {
    expect(
      mapSavedAddress(
        {
          address_line_1: 'One',
          address_line_2: 'Two',
          address_line_3: 'Three',
          address_line_4: 'Four',
          address_line_5: 'Five',
          postcode: 'TEST',
          cjs_code: 102,
        },
        countries,
      ),
    ).toEqual({
      addressLine1: 'One',
      addressLine2: 'Two',
      addressLine3: 'Three',
      addressLine4: 'Four',
      addressLine5: 'Five',
      postalOrZipCode: 'TEST',
      countryId: 2,
    });
  });
  it('rejects ambiguous countries without mutating references', () => {
    const refs = structuredClone(countries);
    refs.push({ ...refs[0], country_id: 999 });
    const before = structuredClone(refs);
    expect(() => mapSavedAddress(party().address, refs)).toThrow('Unusable saved country');
    expect(refs).toEqual(before);
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects unusable country id %s', (id) => {
    expect(() => mapSavedAddress(party().address, [{ ...countries[0], country_id: id }])).toThrow(
      'Unusable saved country',
    );
  });
  it('rejects a country missing from references', () => {
    expect(() => mapSavedAddress(party().address, [])).toThrow('Unusable saved country');
  });
  it('restores absent contacts and unrestricted individual fields', () => {
    expect(mapSavedContacts(party(), countries)).toEqual(expectedIndividual.contactDetails);
    expect(mapSavedIndividual(party(), countries)).toEqual(expectedIndividual);
  });
  it('preserves restricted individual, ISO date, contacts and aliases in sequence order without mutation', () => {
    const value = party();
    value.individual_details = {
      title: 'Ms',
      forenames: 'Test',
      surname: 'Person',
      date_of_birth: '1980-01-02',
      restrict_personal_information: true,
      restriction_reason: 'Test reason',
    };
    value.aliases = [
      { sequence_number: 2, forenames: 'Second', surname: 'Alias' },
      { sequence_number: 1, forenames: 'First', surname: 'Alias' },
    ];
    value.contact_details = {
      primary_email_address: 'main@example.invalid',
      secondary_email_address: 'other@example.invalid',
      main_telephone_number: '0000',
      other_telephone_number: '1111',
    };
    const before = structuredClone(value);
    const result = mapSavedIndividual(value, countries);
    expect(result).toEqual({
      title: 'Ms',
      firstNames: 'Test',
      lastName: 'Person',
      aliases: [
        { firstNames: 'First', lastName: 'Alias' },
        { firstNames: 'Second', lastName: 'Alias' },
      ],
      dateOfBirth: '1980-01-02',
      restrictedInformation: { restricted: true, reason: 'Test reason' },
      contactDetails: {
        mainEmailAddress: 'main@example.invalid',
        otherEmailAddress: 'other@example.invalid',
        mainTelephoneNumber: '0000',
        otherTelephoneNumber: '1111',
        address: expectedAddress,
      },
    });
    result.aliases[0].lastName = 'Changed';
    result.contactDetails.address.addressLine1 = 'Changed';
    expect(value).toEqual(before);
  });
  it('defaults absent forenames and ignores unrestricted reason', () => {
    const value = party();
    value.individual_details = { surname: 'Test', restriction_reason: 'Unused' };
    expect(mapSavedIndividual(value, countries)).toEqual({ ...expectedIndividual, firstNames: '', lastName: 'Test' });
  });
  it('maps both third parties and employer with independently resolved countries', () => {
    const saved = createPersistedCasefileDetail().casefile;
    const refs = [
      ...countries,
      { ...countries[0], country_id: 3, cjs_code: 103 },
      { ...countries[0], country_id: 4, cjs_code: 104 },
      { ...countries[0], country_id: 5, cjs_code: 105 },
    ];
    saved.respondent_account.respondent.third_party_details = {
      name: 'Respondent representative',
      relationship: 'Test',
      address: { address_line_1: 'Third', cjs_code: 103 },
    };
    saved.respondent_account.respondent.debtor_details = {
      employer_name: 'Test employer',
      employee_reference: 'EMP',
      employer_email_address: 'employer@example.invalid',
      employer_telephone_number: '0000',
      employer_address: { address_line_1: 'Employer', cjs_code: 104 },
    };
    saved.respondent_account.respondent.party_details.individual_details = {
      surname: 'Respondent',
      national_insurance_number: 'TEST',
      other_personal_information: 'Other',
    };
    saved.applicant.third_party_details = {
      name: 'Applicant representative',
      relationship: 'Agent',
      reference: 'REF',
      address: { address_line_1: 'Applicant third', cjs_code: 105 },
    };
    const before = structuredClone(saved);
    expect(mapSavedRespondent(saved.respondent_account.respondent, refs)).toEqual({
      ...expectedIndividual,
      firstNames: '',
      nationalInsuranceNumber: 'TEST',
      otherPersonalInformation: 'Other',
      thirdParty: {
        nameOrOrganisation: 'Respondent representative',
        relationship: 'Test',
        reference: null,
        address: { ...expectedAddress, addressLine1: 'Third', countryId: 3 },
      },
      employer: {
        employerName: 'Test employer',
        employeeReference: 'EMP',
        emailAddress: 'employer@example.invalid',
        telephoneNumber: '0000',
        address: { ...expectedAddress, addressLine1: 'Employer', countryId: 4 },
      },
    });
    expect(mapSavedApplicant(saved.applicant, refs)).toEqual({
      ...expectedIndividual,
      lastName: 'Applicant',
      contactDetails: {
        ...expectedIndividual.contactDetails,
        address: { ...expectedAddress, addressLine1: '2 Test Street', countryId: 2 },
      },
      thirdParty: {
        nameOrOrganisation: 'Applicant representative',
        relationship: 'Agent',
        reference: 'REF',
        address: { ...expectedAddress, addressLine1: 'Applicant third', countryId: 5 },
      },
      bankDetails: { type: 'none' },
    });
    expect(saved).toEqual(before);
  });
  it('restores absent respondent NI, other information, third party and employer', () => {
    expect(
      mapSavedRespondent(createPersistedCasefileDetail().casefile.respondent_account.respondent, countries),
    ).toEqual({
      ...expectedIndividual,
      nationalInsuranceNumber: null,
      otherPersonalInformation: null,
      thirdParty: null,
      employer: null,
    });
    expect(mapSavedThirdParty(undefined, countries)).toBeNull();
  });
  it('defaults optional employer fields', () => {
    const value = createPersistedCasefileDetail().casefile.respondent_account.respondent;
    value.debtor_details = { employer_name: 'Employer', employer_address: value.party_details.address };
    expect(mapSavedRespondent(value, countries).employer).toEqual({
      employerName: 'Employer',
      employeeReference: null,
      emailAddress: null,
      telephoneNumber: null,
      address: expectedAddress,
    });
  });
  it('restores organisation applicant and bank without individual-only fields', () => {
    const value = createPersistedCasefileDetail().casefile.applicant;
    value.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Test Organisation', foreign_authority_reference: 'REF' },
      address: party().address,
    };
    expect(mapSavedApplicant(value, countries)).toEqual({
      organisationName: 'Test Organisation',
      foreignAuthorityReference: 'REF',
      contactDetails: expectedIndividual.contactDetails,
      bankDetails: { type: 'none' },
    });
    value.party_details.organisation_details = { organisation_name: 'Test Organisation' };
    expect(mapSavedApplicant(value, countries)).toEqual({
      organisationName: 'Test Organisation',
      foreignAuthorityReference: '',
      contactDetails: expectedIndividual.contactDetails,
      bankDetails: { type: 'none' },
    });
  });
  it.each([
    { organisation: true, individual_details: { surname: 'Test' } },
    { organisation: false, individual_details: undefined },
    { organisation: 'false' },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      organisation_details: { organisation_name: 'Test' },
    },
    { organisation: false, individual_details: { surname: 'Test', restrict_personal_information: true } },
    {
      organisation: false,
      individual_details: { surname: 'Test', restrict_personal_information: true, restriction_reason: ' ' },
    },
    { organisation: false, individual_details: { surname: 12 } },
    { organisation: false, individual_details: { surname: 'Test', restrict_personal_information: 'true' } },
    { organisation: false, individual_details: { surname: 'Test', title: 1 } },
    { organisation: false, individual_details: { surname: 'Test' }, aliases: null },
    { organisation: false, individual_details: { surname: 'Test' }, aliases: [null] },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      aliases: [{ sequence_number: 1.5, forenames: 'A', surname: 'B' }],
    },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      aliases: [{ sequence_number: 1, forenames: 1, surname: 'B' }],
    },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      aliases: [{ sequence_number: 1, forenames: 'A', surname: ' ' }],
    },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      aliases: [
        { sequence_number: 1, forenames: 'A', surname: 'B' },
        { sequence_number: 1, forenames: 'C', surname: 'D' },
      ],
    },
    {
      organisation: false,
      individual_details: { surname: 'Test' },
      aliases: [{ sequence_number: 0, forenames: 'A', surname: 'B' }],
    },
  ])('rejects malformed individual branches %# safely', (fields) => {
    expect(() => mapSavedIndividual({ ...party(), ...fields } as Party, countries)).toThrow('Unusable saved party');
  });
  it.each([
    { organisation: true },
    { organisation: true, organisation_details: { organisation_name: ' ' } },
    { organisation: true, organisation_details: { organisation_name: 'Test', foreign_authority_reference: 1 } },
    {
      organisation: true,
      organisation_details: { organisation_name: 'Test' },
      individual_details: { surname: 'Test' },
    },
  ])('rejects malformed organisation branches %#', (fields) => {
    const value = createPersistedCasefileDetail().casefile.applicant;
    expect(() =>
      mapSavedApplicant(
        { ...value, party_details: { address: value.party_details.address, ...fields } } as typeof value,
        countries,
      ),
    ).toThrow('Unusable saved party');
  });
  it('rejects organisation third party conflicts', () => {
    const value = createPersistedCasefileDetail().casefile.applicant;
    value.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Test' },
      address: party().address,
    };
    value.third_party_details = { name: 'Test', relationship: 'Test', address: party().address };
    expect(() => mapSavedApplicant(value, countries)).toThrow('Unusable saved party');
  });
  it('rejects organisation field conflicts and organisation respondents', () => {
    const value = createPersistedCasefileDetail().casefile.applicant;
    value.party_details = {
      organisation: true,
      organisation_details: { organisation_name: 'Test' },
      aliases: [],
      address: party().address,
    };
    expect(() => mapSavedApplicant(value, countries)).toThrow('Unusable saved party');
    expect(() =>
      mapSavedRespondent(
        {
          party_details: {
            organisation: true,
            organisation_details: { organisation_name: 'Test' },
            address: party().address,
          },
        },
        countries,
      ),
    ).toThrow('Unusable saved party');
  });
});
