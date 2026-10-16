import { Injectable, signal } from '@angular/core';
import type { IOpalMaintenanceDraftCasefileResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-response.interface';

/** Keeps the accepted server receipt outside the cleared draft until the journey ends. */
@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileSubmissionService {
  private readonly acceptedReceipt = signal<IOpalMaintenanceDraftCasefileResponse | null>(null);
  public readonly receipt = this.acceptedReceipt.asReadonly();

  public accept(receipt: IOpalMaintenanceDraftCasefileResponse): void {
    this.acceptedReceipt.set(receipt);
  }

  public clear(): void {
    this.acceptedReceipt.set(null);
  }
}
