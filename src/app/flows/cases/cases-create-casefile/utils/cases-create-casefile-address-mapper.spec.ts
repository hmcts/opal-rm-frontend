import { describe, expect, it } from 'vitest';
import {
  mapCasesCreateCasefileAddress,
  type ICasesCreateCasefileAddressSource,
} from './cases-create-casefile-address-mapper';

const ADDRESS_SOURCE: ICasesCreateCasefileAddressSource = {
  addressLine1: '  1 Test Street  ',
  addressLine2: '  Test Area  ',
  addressLine3: '  Test Town  ',
  addressLine4: '  Test County  ',
  addressLine5: '  Test Region  ',
  postalOrZipCode: '  TE1 1ST  ',
  countryId: 826,
};

describe('mapCasesCreateCasefileAddress', () => {
  it('maps and trims every address property', () => {
    expect(mapCasesCreateCasefileAddress(ADDRESS_SOURCE, 'applicant')).toEqual({
      addressLine1: '1 Test Street',
      addressLine2: 'Test Area',
      addressLine3: 'Test Town',
      addressLine4: 'Test County',
      addressLine5: 'Test Region',
      postalOrZipCode: 'TE1 1ST',
      countryId: 826,
    });
  });

  it('converts blank optional address values to null', () => {
    expect(
      mapCasesCreateCasefileAddress(
        {
          ...ADDRESS_SOURCE,
          addressLine2: '   ',
          addressLine3: null,
          addressLine4: ' ',
          addressLine5: null,
          postalOrZipCode: '  ',
        },
        'applicant',
      ),
    ).toMatchObject({
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
    });
  });

  it('rejects a missing first address line with the supplied description', () => {
    expect(() => mapCasesCreateCasefileAddress({ ...ADDRESS_SOURCE, addressLine1: '   ' }, 'third-party')).toThrowError(
      'Required third-party address line 1 is missing',
    );
  });

  it('rejects a missing country with the supplied description', () => {
    expect(() => mapCasesCreateCasefileAddress({ ...ADDRESS_SOURCE, countryId: null }, 'employer')).toThrowError(
      'Required employer country is missing',
    );
  });
});
