import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileCompletionService } from './cases-create-casefile-completion.service';

describe('CasesCreateCasefileCompletionService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not generate an identifier when constructed', () => {
    const generate = vi.spyOn(globalThis.crypto, 'randomUUID');

    TestBed.inject(CasesCreateCasefileCompletionService);

    expect(generate).not.toHaveBeenCalled();
  });

  it('records and clears only completion state without generating an identifier', () => {
    const generate = vi.spyOn(globalThis.crypto, 'randomUUID');
    const completion = TestBed.inject(CasesCreateCasefileCompletionService);
    expect(completion.result()).toBeNull();
    const result = { draft_casefile_id: 'synthetic-completion' };
    completion.record(result);
    expect(completion.result()).toEqual(result);
    completion.clear();
    expect(completion.result()).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });
});
