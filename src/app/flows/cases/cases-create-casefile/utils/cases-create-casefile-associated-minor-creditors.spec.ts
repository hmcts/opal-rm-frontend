import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import { associatedMinorCreditors } from './cases-create-casefile-associated-minor-creditors';

describe('associatedMinorCreditors', () => {
  const term = (termId: number, sequenceNumber: number): ICasesCreateCasefileAcceptedOrderTerm => ({
    termId,
    resultId: 'MAT',
    parameters: { amount: `${termId}.00` },
    creditor: { type: 'minor', sequenceNumber },
  });

  it('keeps referenced creditors in creation order including duplicate display names', () => {
    const creditors = [1, 2, 3, 4, 5].map((sequenceNumber) => ({
      sequenceNumber,
      displayName: 'Synthetic creditor',
    }));

    expect(associatedMinorCreditors([term(1, 5), term(2, 1), term(3, 3)], creditors)).toEqual([
      creditors[0],
      creditors[2],
      creditors[4],
    ]);
  });

  it('removes details only after their final term reference disappears', () => {
    const creditor = { sequenceNumber: 1, displayName: 'Synthetic creditor' };

    expect(associatedMinorCreditors([term(2, 1)], [creditor])).toEqual([creditor]);
    expect(associatedMinorCreditors([], [creditor])).toEqual([]);
  });
});
