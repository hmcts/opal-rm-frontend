import { of } from 'rxjs';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import {
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

/** Shared historical reference responses; selected-record requests remain with the owning setup.
 * @param prefix Feature alias prefix.
 * @returns Fresh reference stubs for one mount. */
export function persistedReferenceStubs(
  prefix: string,
): Pick<OpalMaintenanceService, 'getCountries' | 'getMaintenanceApplications' | 'getMajorCreditors' | 'getResult'> {
  return {
    getCountries: cy
      .stub()
      .as(prefix + 'CountriesRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.countries.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries),
        }),
      ),
    getMaintenanceApplications: cy
      .stub()
      .as(prefix + 'ApplicationsRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.applications.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications),
        }),
      ),
    getMajorCreditors: cy
      .stub()
      .as(prefix + 'MajorCreditorsRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.majorCreditors.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.majorCreditors),
        }),
      ),
    getResult: cy
      .stub()
      .as(prefix + 'ResultRequest')
      .returns(of(structuredClone(PERSISTED_CASEFILE_RESULT_DETAIL))),
  };
}
