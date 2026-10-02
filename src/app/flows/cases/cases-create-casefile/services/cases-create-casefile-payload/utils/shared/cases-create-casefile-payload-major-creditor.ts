import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import { required } from './cases-create-casefile-payload-values';
export function majorCode(
  id: number,
  references: References,
  businessUnitId: number,
  centralAuthority = false,
): string {
  const matches = references.majorCreditors.filter(
    (creditor) =>
      creditor.active &&
      creditor.major_creditor_id === id &&
      creditor.business_unit_id === businessUnitId &&
      (!centralAuthority || creditor.central_authority),
  );
  if (matches.length !== 1) throw new Error('Major creditor cannot be resolved for the business unit');
  return required(matches[0].major_creditor_code);
}
