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
      [{ ...amount, min: -1 }],
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
    for (const value of ['{', '{}', 'null']) expect(() => mapOrderTermParameters(value)).toThrow();
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

  it('uses date sentinels as unbounded and preserves optional requiredness', () => {
    expect(
      map([
        {
          name: 'expiry_date',
          prompt: 'Expiry date',
          type: 'date',
          mandatory: false,
          language_dependent: false,
          min: 0,
          max: 'No Limit',
        },
      ])[0],
    ).toMatchObject({
      kind: 'date',
      required: false,
      min: null,
      max: null,
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
    { type: 'date', min: '2027-02-30' },
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
