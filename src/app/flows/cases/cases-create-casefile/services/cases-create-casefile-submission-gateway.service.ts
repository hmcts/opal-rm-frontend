import { Injectable, inject } from '@angular/core';
import { defer, map, Observable, throwError, timer } from 'rxjs';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../tokens/cases-create-casefile-mock-enabled.token';
import type { CasesCreateCasefileAcceptedSnapshot } from '../types/cases-create-casefile-accepted-snapshot.type';
import type { CasesCreateCasefileSubmissionOutcome } from '../types/cases-create-casefile-submission-outcome.type';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileSubmissionGateway {
  private nextReceipt = 1;
  public readonly available = inject(CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN);

  /**
   * Simulates submission only in the explicit local mock configuration. The input
   * is a frontend snapshot, never a production payload. No HTTP or storage is used.
   */
  public submit(snapshot: CasesCreateCasefileAcceptedSnapshot): Observable<CasesCreateCasefileSubmissionOutcome> {
    return defer(() => {
      if (!this.available) return throwError(() => new Error('Casefile submission is unavailable'));
      if (!snapshot.caseTypeSelection) return throwError(() => new Error('A case type is required'));
      const receipt = `MOCK-9817-${this.nextReceipt++}`;
      return timer(400).pipe(map(() => ({ status: 'success' as const, receipt })));
    });
  }
}
