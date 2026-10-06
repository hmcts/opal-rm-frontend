import { OPAL_MAINTENANCE_ORDER_TERM_DATABASE_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-order-term-database.mock';
import { describe, expect, it } from 'vitest';
import { mapOrderTermParameters } from './cases-create-casefile-order-term-metadata';

const amount = {
  name: 'amount',
  prompt: 'Amount',
  type: 'money',
  mandatory: true,
  language_dependent: false,
  min: 0,
  precision: 2,
};
const map = (parameters: unknown[]) => mapOrderTermParameters(JSON.stringify(parameters));

describe('mapOrderTermParameters', () => {
  it('retains metadata order, canonical identifiers and inherited frequency', () => {
    const fields = map([
      amount,
      { name: 'frequency', prompt: 'Payment frequency', type: 'menu', mandatory: true, language_dependent: false },
    ]);
    expect(fields.map((field) => [field.name, field.id, field.kind])).toEqual([
      ['amount', 'create_casefile_order_terms_input_amount', 'money'],
      ['frequency', 'create_casefile_order_terms_input_frequency', 'readonly'],
    ]);
  });

  it.each(
    [
      [],
      [null],
      [[]],
      [17],
      [{ ...amount, type: 'unknown' }],
      [amount, amount],
      [amount, { ...amount, name: 'AMOUNT' }],
      [{ ...amount, prompt: '' }],
      [{ ...amount, mandatory: 'yes' }],
      [{ ...amount, max: 0, min: 1 }],
      [{ ...amount, conditional: true }],
      [{ ...amount, readonly: true }],
      [{ ...amount, language_dependent: true }],
      [{ ...amount, apidata: 'https://untrusted.invalid' }],
      [
        {
          name: 'frequency',
          prompt: 'Payment frequency',
          type: 'menu',
          mandatory: true,
          language_dependent: false,
          min: 0,
        },
      ],
      [
        {
          name: 'confirmed',
          prompt: 'Confirmed',
          type: 'checkbox',
          mandatory: true,
          language_dependent: false,
          min: 0,
        },
      ],
    ].map((parameters) => ({ parameters })),
  )('rejects unsupported metadata without a fallback', ({ parameters }) => {
    expect(() => map(parameters)).toThrow('Unsupported order-term metadata');
  });

  it.each(['', '_field', '1field', 'child-name', 'child name'])(
    'rejects a parameter name that cannot form a canonical identifier: %s',
    (name) => {
      expect(() => map([{ ...amount, name }])).toThrow('Unsupported order-term metadata');
    },
  );

  it('rejects malformed JSON and non-arrays', () => {
    for (const value of [null, '{', '{}', 'null']) expect(() => mapOrderTermParameters(value)).toThrow();
  });

  it('uses one generic error without exposing rejected metadata', () => {
    const sensitiveValue = 'must-not-appear';

    expect(() =>
      map([
        {
          ...amount,
          prompt: sensitiveValue,
          unsupported: sensitiveValue,
        },
      ]),
    ).toThrowError(/^Unsupported order-term metadata$/);
  });

  it('uses ISO date bounds and preserves optional requiredness', () => {
    expect(
      map([
        {
          name: 'expiry_date',
          prompt: 'Expiry date',
          type: 'date',
          mandatory: false,
          language_dependent: false,
          min: '1900-01-01',
          max: '2100-12-31',
        },
      ])[0],
    ).toMatchObject({
      kind: 'date',
      required: false,
      min: '1900-01-01',
      max: '2100-12-31',
    });
  });

  it('does not treat neutral menu bounds as option-ID bounds', () => {
    expect(
      map([
        {
          name: 'choice',
          prompt: 'Choice',
          type: 'menu',
          mandatory: true,
          language_dependent: false,
          min: 0,
          max: 'No Limit',
          options: [{ value: 'Z', label: 'Last option' }],
        },
      ])[0].options,
    ).toEqual([{ value: 'Z', label: 'Last option' }]);
  });

  it.each([
    ['money', 'money'],
    ['decimal', 'money'],
    ['integer', 'integer'],
    ['text', 'text'],
    ['long_text', 'long_text'],
    ['date', 'date'],
    ['radio', 'radio'],
    ['select', 'select'],
    ['menu', 'select'],
    ['autocomplete', 'autocomplete'],
    ['checkbox', 'checkbox'],
  ] as const)('maps the %s metadata type to %s', (type, kind) => {
    const choice = ['radio', 'select', 'menu', 'autocomplete'].includes(type);
    const fields = map([
      {
        name: `field_${type}`,
        prompt: 'Field',
        type,
        mandatory: true,
        language_dependent: false,
        ...(type === 'date' ? { min: '1900-01-01', max: '2100-12-31' } : {}),
        ...(type === 'integer' ? { min: -2147483648, max: 2147483647 } : {}),
        ...(choice ? { options: [{ value: 'A', label: 'First' }] } : {}),
      },
    ]);

    expect(fields[0]).toMatchObject({ kind, required: true });
  });

  it.each([
    { options: [] },
    { options: [{ value: 'A', label: 'First', extra: true }] },
    { options: [{ value: '', label: 'First' }] },
    { options: [{ value: 'A', label: '' }] },
    {
      options: [
        { value: 'A', label: 'First' },
        { value: 'A', label: 'Duplicate' },
      ],
    },
  ])('rejects invalid choice options: $options', (extension) => {
    expect(() =>
      map([
        {
          name: 'choice',
          prompt: 'Choice',
          type: 'select',
          mandatory: true,
          language_dependent: false,
          ...extension,
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });

  it('accepts the supported lookup without inline options', () => {
    expect(
      map([
        {
          name: 'choice',
          prompt: 'Choice',
          type: 'autocomplete',
          mandatory: true,
          language_dependent: false,
          apidata: 'mock:order-term-options',
        },
      ])[0],
    ).toMatchObject({ lookup: 'mock:order-term-options', options: [] });
  });

  it.each([
    { name: 'choice', type: 'select' },
    {
      name: 'choice',
      type: 'autocomplete',
      options: [{ value: 'A', label: 'First' }],
      apidata: 'mock:order-term-options',
    },
    { name: 'choice', type: 'select', options: [{ value: 'A', label: 'First' }], apidata: 'unknown' },
    { name: 'amount', type: 'money', options: [{ value: 'A', label: 'First' }] },
    { name: 'amount', type: 'money', apidata: 'mock:order-term-options' },
    { name: 'choice', type: 'select', options: [{ value: 'A', label: 'First' }], min: 1 },
    { name: 'choice', type: 'select', options: [{ value: 'A', label: 'First' }], max: 2 },
  ])('rejects unsupported choice extensions: $name', (extension) => {
    expect(() =>
      map([
        {
          prompt: 'Field',
          mandatory: true,
          language_dependent: false,
          ...extension,
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });

  it.each([
    { type: 'money', min: '2.01', max: '2.00' },
    { type: 'integer', min: 2, max: 1 },
    { type: 'text', min: 2, max: 1 },
    { type: 'date', min: '2027-01-02', max: '2027-01-01' },
    { type: 'date', min: '2027-02-30', max: '2100-12-31' },
    { type: 'date', min: 1, max: '2100-12-31' },
    { type: 'date', min: 'not-a-date', max: '2100-12-31' },
    { type: 'money', min: false },
    { type: 'money', min: '1.234' },
    { type: 'text', min: 1.5 },
    { type: 'text', min: -1 },
  ])('rejects invalid or inverted bounds: $type $min $max', (bounds) => {
    expect(() =>
      map([
        {
          name: 'field',
          prompt: 'Field',
          mandatory: true,
          language_dependent: false,
          ...bounds,
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });

  it.each([
    { type: 'text', precision: 2 },
    { type: 'money', precision: 3 },
    { type: 'text', date_rule: 'past' },
    { type: 'date', date_rule: 'future' },
    { type: 'text', hint: 12 },
    { type: 'text', readonly: 'yes' },
  ])('rejects an extension on the wrong field type: $type', (extension) => {
    expect(() =>
      map([
        {
          name: 'field',
          prompt: 'Field',
          mandatory: true,
          language_dependent: false,
          ...extension,
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });

  it('rejects an unknown read-only identity', () => {
    expect(() =>
      map([
        {
          name: 'unknown_readonly',
          prompt: 'Unknown',
          type: 'menu',
          mandatory: true,
          language_dependent: false,
          readonly: true,
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });
});

describe('documented generic parameters', () => {
  const parameter = {
    name: 'Details',
    prompt: 'Details',
    type: 'text-60',
    mandatory: true,
    min: 1,
    max: 60,
    language_dependent: false,
  };
  it.each([
    ['text-60', 'text', 60],
    ['text-100', 'text', 100],
    ['text-1000', 'long_text', 1000],
  ])('maps %s with explicit length bounds', (type, kind, max) => {
    expect(map([{ ...parameter, type, max }])[0]).toMatchObject({ name: 'Details', kind, min: 1, max });
  });
  it('accepts signed decimal bounds without losing precision', () => {
    expect(map([{ ...parameter, type: 'decimal-2dp', min: -9999999999.99, max: 9999999999.99 }])[0]).toMatchObject({
      kind: 'money',
      min: '-9999999999.99',
      max: '9999999999.99',
    });
  });
  it.each(['menu-radio', 'menu-checkbox'])('preserves raw labels for %s', (type) => {
    expect(map([{ ...parameter, type, min: 0, max: 1, options: ['A & B', '<literal>'] }])[0].options).toEqual([
      { value: 'A & B', label: 'A & B' },
      { value: '<literal>', label: '<literal>' },
    ]);
  });
  it('inherits Frequency from order details despite menu metadata', () => {
    expect(
      map([{ ...parameter, name: 'Frequency', type: 'menu-radio', max: 1, options: ['Weekly', 'Monthly'] }])[0],
    ).toMatchObject({ name: 'Frequency', kind: 'readonly' });
  });
  it.each(['min', 'max', 'mandatory', 'language_dependent'])('rejects missing %s', (key) => {
    const data: Record<string, unknown> = { ...parameter };
    delete data[key];
    expect(() => map([data])).toThrow('Unsupported order-term metadata');
  });
  it.each([
    { type: 'text-60', max: 61 },
    { type: 'text-60', name: 'Frequency' },
    { type: 'decimal-2dp', min: -10000000000 },
    { type: 'decimal-2dp', min: '0' },
    { type: 'decimal-2dp', min: -0.01, max: -0.02 },
    { type: 'menu-radio', max: 2, options: ['A', 'B'] },
    { type: 'menu-checkbox', max: 3, options: ['A', 'B'] },
    { type: 'menu-checkbox', options: 'A, B' },
    { type: 'menu-checkbox', options: ['A', 'A'] },
    { type: 'menu-radio', options: [{ value: 'A', label: 'A' }] },
  ])('rejects invalid contract metadata: %j', (extension) => {
    expect(() => map([{ ...parameter, ...extension }])).toThrow('Unsupported order-term metadata');
  });
  it.each([
    { type: 'date', min: 0, max: 'No Limit' },
    { type: 'date', min: '1899-12-31', max: '2100-12-31' },
    { type: 'date', min: '1900-01-01', max: '2101-01-01' },
    { type: 'integer', min: -2147483649, max: 2147483647 },
    { type: 'integer', min: 0, max: 2147483648 },
  ])('rejects bounds outside documented limits: %j', (bounds) => {
    expect(() => map([{ ...parameter, ...bounds }])).toThrow('Unsupported order-term metadata');
  });
});

describe('October database metadata', () => {
  it.each(['MAT', 'MCHILD', 'MLUMP'])('accepts all supplied %s fields without changing their names or order', (id) => {
    const detail = OPAL_MAINTENANCE_ORDER_TERM_DATABASE_MOCK[id];
    const fields = mapOrderTermParameters(detail.result_parameters);
    const source = JSON.parse(detail.result_parameters!);
    expect(fields.map((field) => field.name)).toEqual(source.map((field: { name: string }) => field.name));
    expect(fields.map((field) => field.required)).toEqual(
      source.map((field: { mandatory: boolean }) => field.mandatory),
    );
  });

  it('maps explicit Frequency to the existing inherited read-only control', () => {
    const fields = mapOrderTermParameters(OPAL_MAINTENANCE_ORDER_TERM_DATABASE_MOCK['MAT'].result_parameters);
    expect(fields.find((field) => field.name === 'Frequency')).toMatchObject({
      kind: 'readonly',
      options: ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Yearly'].map((value) => ({ value, label: value })),
    });
  });

  it('preserves the supplied date permissions and optional ChildDOB', () => {
    const fields = mapOrderTermParameters(OPAL_MAINTENANCE_ORDER_TERM_DATABASE_MOCK['MCHILD'].result_parameters);
    expect(fields.find((field) => field.name === 'ChildDOB')).toMatchObject({
      required: false,
      datePermissions: { past: true, today: true, future: false },
    });
    expect(fields.find((field) => field.name === 'Expiry')).toMatchObject({
      required: true,
      datePermissions: { past: false, today: true, future: true },
    });
  });

  const date = {
    name: 'Date',
    prompt: 'Date',
    type: 'date',
    mandatory: false,
    min: '1900-01-01',
    max: '2100-12-31',
    language_dependent: false,
    date_in_past: true,
    date_today: true,
    date_in_future: false,
  };
  it.each([
    { date_in_past: 'true' },
    { date_today: null },
    { date_in_future: 1 },
    { date_in_past: undefined },
    { date_today: undefined },
    { date_in_future: undefined },
    { date_in_past: false, date_today: false },
    { date_rule: 'past' },
    { type: 'text-60', min: 0, max: 60 },
  ])('rejects unusable date permissions %j', (change) => {
    expect(() => map([{ ...date, ...change }])).toThrow('Unsupported order-term metadata');
  });

  it('rejects read-only data without a known inherited source', () => {
    expect(() =>
      map([
        {
          name: 'Other',
          prompt: 'Other',
          type: 'read-only',
          mandatory: true,
          language_dependent: false,
          min: 1,
          max: 1,
          options: ['A'],
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });
  it('rejects a lookup on inherited Frequency instead of replacing its store source', () => {
    expect(() =>
      map([
        {
          name: 'Frequency',
          prompt: 'Payment frequency',
          type: 'read-only',
          mandatory: true,
          language_dependent: false,
          min: 1,
          max: 1,
          options: ['Weekly'],
          apidata: 'mock:order-term-options',
        },
      ]),
    ).toThrow('Unsupported order-term metadata');
  });
});
