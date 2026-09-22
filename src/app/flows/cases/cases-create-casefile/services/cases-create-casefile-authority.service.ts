import { Injectable, inject } from '@angular/core';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../tokens/cases-create-casefile-mock-enabled.token';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileAuthorityService {
  private readonly mockEnabled = inject(CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN);

  /** Synthetic authority is confined to the local mock; no production permission is inferred. */
  public authorised(): boolean {
    return this.mockEnabled;
  }
}
