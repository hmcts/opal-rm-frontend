import type { ICasesCreateCasefileMinorCreditor } from '../../interfaces/cases-create-casefile-minor-creditor.interface';
import type { CasesCreateCasefileCreditorAssignment } from '../../types/cases-create-casefile-creditor-assignment.type';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { ICasesCreateCasefileOrderTermCreditorFormData } from '../interfaces/cases-create-casefile-order-term-creditor-form-data.interface';

export function creditorFormValue(
  assignment: CasesCreateCasefileCreditorAssignment | null,
  pendingNew: boolean,
): ICasesCreateCasefileOrderTermCreditorFormData {
  let choice: string | null;
  if (pendingNew) {
    choice = 'add-new';
  } else if (assignment?.type === 'minor') {
    choice = `minor:${assignment.sequenceNumber}`;
  } else {
    choice = assignment?.type ?? null;
  }

  return {
    create_casefile_order_term_creditor_choice: choice,
    create_casefile_order_term_creditor_major_creditor_id:
      !pendingNew && assignment?.type === 'major' ? assignment.majorCreditorId : null,
  };
}

export function creditorAssignment(
  formData: ICasesCreateCasefileOrderTermCreditorFormData,
  minorCreditors: readonly ICasesCreateCasefileMinorCreditor[],
  majorCreditors: readonly IOpalMaintenanceMajorCreditorReferenceDataItem[],
): CasesCreateCasefileCreditorAssignment | null {
  const choice = formData.create_casefile_order_term_creditor_choice;
  if (choice === 'applicant') return { type: 'applicant' };
  if (choice === 'major') {
    const selected = majorCreditors.find(
      (record) =>
        String(record.major_creditor_id) === String(formData.create_casefile_order_term_creditor_major_creditor_id),
    );
    return selected ? { type: 'major', majorCreditorId: selected.major_creditor_id, displayName: selected.name } : null;
  }
  const selectedMinor = minorCreditors.find((record) => choice === `minor:${record.sequenceNumber}`);
  return selectedMinor ? { type: 'minor', sequenceNumber: selectedMinor.sequenceNumber } : null;
}
