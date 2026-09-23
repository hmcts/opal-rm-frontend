import { Injectable, signal } from '@angular/core';
import type { IOpalMaintenanceCasefileSubmissionResult } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-casefile-submission-result.interface';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileCompletionService {
  private readonly completion = signal<IOpalMaintenanceCasefileSubmissionResult | null>(null);
  public readonly result = this.completion.asReadonly();

  public record(result: IOpalMaintenanceCasefileSubmissionResult): void {
    this.completion.set({ draft_casefile_id: result.draft_casefile_id });
  }

  public clear(): void {
    this.completion.set(null);
  }
}
