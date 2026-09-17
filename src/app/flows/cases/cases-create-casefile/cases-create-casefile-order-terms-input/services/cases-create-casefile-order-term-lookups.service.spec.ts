import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import { CasesCreateCasefileOrderTermLookupsService } from './cases-create-casefile-order-term-lookups.service';

const field = (overrides: Partial<ICasesCreateCasefileOrderTermField> = {}): ICasesCreateCasefileOrderTermField => ({
  name: 'example',
  id: 'create_casefile_order_terms_input_example',
  label: 'Example',
  kind: 'text',
  required: false,
  hint: '',
  min: null,
  max: null,
  past: false,
  options: [],
  lookup: null,
  ...overrides,
});

describe('CasesCreateCasefileOrderTermLookupsService', () => {
  let service: CasesCreateCasefileOrderTermLookupsService;

  beforeEach(() => {
    service = new CasesCreateCasefileOrderTermLookupsService();
  });

  it('preserves fields that do not request lookup data', async () => {
    const fields = [field()];

    await expect(firstValueFrom(service.resolve(fields))).resolves.toEqual(fields);
  });

  it('resolves the governed mock lookup with fresh option objects', async () => {
    const fields = [field({ kind: 'select', lookup: 'mock:order-term-options' })];

    const first = await firstValueFrom(service.resolve(fields));
    const second = await firstValueFrom(service.resolve(fields));

    expect(first[0].options).toEqual([
      { value: 'example_a', label: 'Example A' },
      { value: 'example_b', label: 'Example B' },
    ]);
    expect(first[0].options).not.toBe(second[0].options);
    expect(first[0].options[0]).not.toBe(second[0].options[0]);
  });

  it('rejects unsupported lookup identifiers when subscribed', async () => {
    const fields = [field({ kind: 'select', lookup: 'other' as ICasesCreateCasefileOrderTermField['lookup'] })];

    expect(() => service.resolve(fields)).not.toThrow();
    await expect(firstValueFrom(service.resolve(fields))).rejects.toThrow('Unsupported order-term lookup');
  });
});
