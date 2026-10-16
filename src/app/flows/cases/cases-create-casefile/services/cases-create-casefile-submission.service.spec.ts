import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileSubmissionService } from './cases-create-casefile-submission.service';

describe('CasesCreateCasefileSubmissionService', () => {
  it('starts without a receipt and exposes only a read-only signal', () => {
    const submission = TestBed.inject(CasesCreateCasefileSubmissionService);
    expect(submission.receipt()).toBeNull();
    expect(submission.receipt).not.toHaveProperty('set');
  });

  it('accepts the exact receipt, replaces it and clears it when the journey ends', () => {
    const submission = TestBed.inject(CasesCreateCasefileSubmissionService);
    const receipt = { draft_casefile_id: 123, casefile_status: 'SUBMITTED' as const };
    submission.accept(receipt);
    expect(submission.receipt()).toBe(receipt);
    const replacement = { ...receipt, draft_casefile_id: 456 };
    submission.accept(replacement);
    expect(submission.receipt()).toBe(replacement);
    submission.clear();
    expect(submission.receipt()).toBeNull();
    submission.clear();
    expect(submission.receipt()).toBeNull();
  });
});
