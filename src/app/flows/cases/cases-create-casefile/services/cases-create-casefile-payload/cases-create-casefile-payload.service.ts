import type { IOpalMaintenanceDraftCasefileReplaceRequest } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-replace-request.interface';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { isCasesCreateCasefileSubmissionEligible } from '../../utils/cases-create-casefile-submission-eligible';
import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { Injectable } from '@angular/core';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefilePayloadReferences } from './interfaces/cases-create-casefile-payload-references.interface';
import { buildRespondentAccount } from './utils/build-casefile/cases-create-casefile-payload-build-respondent';
import { buildApplicant } from './utils/build-casefile/cases-create-casefile-payload-build-applicant';
import { buildMinorCreditors } from './utils/build-casefile/cases-create-casefile-payload-build-minor-creditors';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefilePayloadService {
  /** Preserves omission of optional fields in the mapped request, including nested objects. */
  private removeUnprovidedFields(value: object): void {
    for (const [key, field] of Object.entries(value)) {
      if (field === undefined) {
        Reflect.deleteProperty(value, key);
      } else if (field && typeof field === 'object') {
        this.removeUnprovidedFields(field);
      }
    }
  }

  /** Rebuilds the complete supported aggregate without creation metadata or mutation of accepted edits. */
  public buildReplaceCasefilePayload(
    state: ICasesCreateCasefileState,
    references: ICasesCreateCasefilePayloadReferences,
    businessUnitId: number,
    casefileType: IOpalMaintenanceDraftCasefileDetail['casefile_type'],
  ): IOpalMaintenanceDraftCasefileReplaceRequest {
    if (!isCasesCreateCasefileSubmissionEligible(state)) throw new Error('Casefile is incomplete');
    if (state.caseTypeSelection?.caseType !== casefileType) throw new Error('Casefile type has changed');
    const { business_unit_id, casefile } = this.buildAddCasefilePayload(state, references, businessUnitId);
    return { business_unit_id, casefile };
  }

  /** Builds the POST payload without mutating state. Throws for incomplete data or unresolved references. */
  public buildAddCasefilePayload(
    state: ICasesCreateCasefileState,
    references: ICasesCreateCasefilePayloadReferences,
    businessUnitId: number,
  ): Request {
    const {
      caseTypeSelection,
      respondentDetails,
      applicantDetails,
      orderDetails,
      interestAndIndexation,
      paymentArrangement,
    } = state;
    if (
      !caseTypeSelection ||
      !respondentDetails ||
      !applicantDetails ||
      !orderDetails ||
      !interestAndIndexation ||
      !paymentArrangement ||
      !state.orderTerms.length
    )
      throw new Error('Casefile is incomplete');
    const buildState = {
      ...state,
      caseTypeSelection,
      respondentDetails,
      applicantDetails,
      orderDetails,
      interestAndIndexation,
      paymentArrangement,
    };
    const payload: Request = {
      business_unit_id: businessUnitId,
      casefile_type: caseTypeSelection.caseType,
      casefile: {
        respondent_account: buildRespondentAccount(buildState, references, businessUnitId),
        applicant: buildApplicant(applicantDetails, references),
        minor_creditors: buildMinorCreditors(state.minorCreditors, references),
      },
    };
    const request = structuredClone(payload);
    this.removeUnprovidedFields(request);
    return request;
  }
}
