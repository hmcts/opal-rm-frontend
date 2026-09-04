import { Injectable } from '@angular/core';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';
import type { ICasesCreateCasefileCentralAuthorityFormData } from '../interfaces/cases-create-casefile-central-authority-form-data.interface';
import type { ICasesCreateCasefileCentralAuthorityDetails } from '../../interfaces/cases-create-casefile-central-authority-details.interface';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileCentralAuthorityMapperService {
  public toAutocompleteItems(
    records: readonly IOpalMaintenanceMajorCreditorReferenceDataItem[],
  ): IAlphagovAccessibleAutocompleteItem[] {
    return records.map((record) => ({
      value: record.major_creditor_id,
      name: `${record.major_creditor_code} - ${record.name}`,
    }));
  }

  public reconcileSavedDetails(
    saved: ICasesCreateCasefileCentralAuthorityDetails | null,
    records: readonly IOpalMaintenanceMajorCreditorReferenceDataItem[],
  ): ICasesCreateCasefileCentralAuthorityDetails | null {
    if (!saved) {
      return null;
    }

    const majorCreditor = saved.majorCreditor
      ? (records.find((record) => record.major_creditor_id === saved.majorCreditor?.major_creditor_id) ?? null)
      : null;

    return { ...saved, majorCreditor };
  }

  public toFormData(
    details: ICasesCreateCasefileCentralAuthorityDetails | null,
  ): ICasesCreateCasefileCentralAuthorityFormData {
    return {
      [FIELD_NAMES.remoReference]: details?.remoReference ?? null,
      [FIELD_NAMES.centralAuthorityReference]: details?.centralAuthorityReference ?? null,
      [FIELD_NAMES.majorCreditorId]: details?.majorCreditor?.major_creditor_id ?? null,
    };
  }

  public toCentralAuthorityDetails(
    formData: ICasesCreateCasefileCentralAuthorityFormData,
    records: readonly IOpalMaintenanceMajorCreditorReferenceDataItem[],
  ): ICasesCreateCasefileCentralAuthorityDetails {
    const majorCreditorId = formData[FIELD_NAMES.majorCreditorId];

    return {
      remoReference: formData[FIELD_NAMES.remoReference],
      centralAuthorityReference: formData[FIELD_NAMES.centralAuthorityReference],
      majorCreditor:
        majorCreditorId === null
          ? null
          : (records.find((record) => record.major_creditor_id === majorCreditorId) ?? null),
    };
  }
}
