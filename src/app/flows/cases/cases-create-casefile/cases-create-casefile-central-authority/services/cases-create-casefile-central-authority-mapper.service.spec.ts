import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';
import type { ICasesCreateCasefileCentralAuthorityDetails } from '../../interfaces/cases-create-casefile-central-authority-details.interface';
import type { ICasesCreateCasefileCentralAuthorityFormData } from '../interfaces/cases-create-casefile-central-authority-form-data.interface';
import { CasesCreateCasefileCentralAuthorityMapperService } from './cases-create-casefile-central-authority-mapper.service';

describe('CasesCreateCasefileCentralAuthorityMapperService', () => {
  let mapper: CasesCreateCasefileCentralAuthorityMapperService;

  const first: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    major_creditor_id: 901,
    business_unit_id: 77,
    major_creditor_code: '0123',
    name: 'Central Authority One',
    address_line_1: '1 Test Street',
    address_line_2: null,
    address_line_3: null,
    address_line_4: null,
    address_line_5: null,
    postcode: null,
    country_id: null,
    country_name: null,
    contact_name: null,
    contact_email: null,
    active: true,
    central_authority: true,
  };

  const second: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    ...first,
    major_creditor_id: 902,
    major_creditor_code: '0456',
    name: 'Central Authority Two',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(CasesCreateCasefileCentralAuthorityMapperService);
  });

  it('maps records to code-name autocomplete items without reordering', () => {
    expect(mapper.toAutocompleteItems([second, first])).toEqual([
      { value: second.major_creditor_id, name: `${second.major_creditor_code} - ${second.name}` },
      { value: first.major_creditor_id, name: `${first.major_creditor_code} - ${first.name}` },
    ] satisfies IAlphagovAccessibleAutocompleteItem[]);
  });

  it('replaces a saved record with the current resolved record', () => {
    const staleCopy = { ...first, name: 'Old name' };
    expect(
      mapper.reconcileSavedDetails({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: staleCopy }, [
        first,
      ]),
    ).toEqual({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: first });
  });

  it('clears a missing selection while retaining both references', () => {
    expect(
      mapper.reconcileSavedDetails({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: first }, [
        second,
      ]),
    ).toEqual({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: null });
  });

  it('preserves references and null selection when no saved record is selected', () => {
    expect(
      mapper.reconcileSavedDetails({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: null }, [
        first,
      ]),
    ).toEqual({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: null });
  });

  it('returns null when there is no saved state to reconcile', () => {
    expect(mapper.reconcileSavedDetails(null, [first])).toBeNull();
  });

  it('maps reconciled state to editable form values', () => {
    const details: ICasesCreateCasefileCentralAuthorityDetails = {
      remoReference: 'R',
      centralAuthorityReference: 'C',
      majorCreditor: first,
    };
    expect(mapper.toFormData(details)).toEqual({
      [FIELD_NAMES.remoReference]: 'R',
      [FIELD_NAMES.centralAuthorityReference]: 'C',
      [FIELD_NAMES.majorCreditorId]: first.major_creditor_id,
    });
  });

  it('maps absent saved state to empty nullable form values', () => {
    expect(mapper.toFormData(null)).toEqual({
      [FIELD_NAMES.remoReference]: null,
      [FIELD_NAMES.centralAuthorityReference]: null,
      [FIELD_NAMES.majorCreditorId]: null,
    });
  });

  it('treats an unmatched form identifier as no optional selection', () => {
    const formData: ICasesCreateCasefileCentralAuthorityFormData = {
      [FIELD_NAMES.remoReference]: 'R',
      [FIELD_NAMES.centralAuthorityReference]: 'C',
      [FIELD_NAMES.majorCreditorId]: 999,
    };
    expect(mapper.toCentralAuthorityDetails(formData, [first])).toEqual({
      remoReference: 'R',
      centralAuthorityReference: 'C',
      majorCreditor: null,
    });
  });

  it('resolves a submitted identifier to the exact current record while preserving references', () => {
    const details = mapper.toCentralAuthorityDetails(
      {
        [FIELD_NAMES.remoReference]: 'R',
        [FIELD_NAMES.centralAuthorityReference]: 'C',
        [FIELD_NAMES.majorCreditorId]: first.major_creditor_id,
      },
      [first],
    );

    expect(details).toEqual({ remoReference: 'R', centralAuthorityReference: 'C', majorCreditor: first });
    expect(details.majorCreditor).toBe(first);
  });

  it('maps a null form identifier to no optional selection', () => {
    expect(
      mapper.toCentralAuthorityDetails(
        {
          [FIELD_NAMES.remoReference]: null,
          [FIELD_NAMES.centralAuthorityReference]: null,
          [FIELD_NAMES.majorCreditorId]: null,
        },
        [first],
      ),
    ).toEqual({ remoReference: null, centralAuthorityReference: null, majorCreditor: null });
  });
});
