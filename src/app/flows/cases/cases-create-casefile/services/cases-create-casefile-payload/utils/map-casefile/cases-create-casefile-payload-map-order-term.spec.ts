import { describe, expect, it } from 'vitest';
import {
  PERSISTED_CASEFILE_RESULT_PAGE,
  PERSISTED_CASEFILE_REFERENCES,
} from '../../../../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { ICasesCreateCasefileOrderTermField } from '../../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-field.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { decodeSavedTermParameters, mapSavedOrderTerm } from './cases-create-casefile-payload-map-order-term';

type SavedTerm =
  IOpalMaintenanceDraftCasefileRequest['casefile']['respondent_account']['order_details']['order_terms'][number];
const field = (
  kind: ICasesCreateCasefileOrderTermField['kind'],
  changes: Partial<ICasesCreateCasefileOrderTermField> = {},
): ICasesCreateCasefileOrderTermField => ({
  ...PERSISTED_CASEFILE_RESULT_PAGE.fields[0],
  name: 'value',
  kind,
  ...changes,
});
const page = (...fields: ICasesCreateCasefileOrderTermField[]): ICasesCreateCasefileOrderTermPage => ({
  ...PERSISTED_CASEFILE_RESULT_PAGE,
  fields,
});
const saved = (response?: string): SavedTerm => ({
  result_id: 'TEST01',
  creditor_type: 'Applicant',
  result_responses: response === undefined ? [] : [{ parameter_name: 'value', response }],
});
const options = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Second' },
];
const context = { ...PERSISTED_CASEFILE_REFERENCES, resultPages: { TEST01: PERSISTED_CASEFILE_RESULT_PAGE } };

describe('decodeSavedTermParameters', () => {
  it.each([
    ['money', '-00012.3', '-12.30'],
    ['money', '-0.00', '0.00'],
    ['money', '99999999999999999999.99', '99999999999999999999.99'],
    ['integer', '0', 0],
    ['integer', '-12', -12],
    ['text', 'false', 'false'],
    ['long_text', ' 0 ', ' 0 '],
    ['date', '2000-02-29', '2000-02-29'],
    ['checkbox', 'false', false],
    ['checkbox', 'true', true],
  ] as const)('restores %s response %s without lossy conversions', (kind, response, expected) => {
    expect(decodeSavedTermParameters(saved(response), page(field(kind)), 'Monthly')).toEqual({ value: expected });
  });
  it.each(['radio', 'select', 'autocomplete'] as const)('matches %s option values rather than labels', (kind) => {
    expect(decodeSavedTermParameters(saved('b'), page(field(kind, { options })), 'Monthly')).toEqual({ value: 'b' });
    expect(() => decodeSavedTermParameters(saved('Second'), page(field(kind, { options })), 'Monthly')).toThrow();
  });
  it('restores checkbox selections in canonical option order', () => {
    expect(decodeSavedTermParameters(saved('b,a'), page(field('checkbox', { options })), 'Monthly')).toEqual({
      value: ['a', 'b'],
    });
  });
  it('defaults omitted optional checkboxes and omits optional text', () => {
    const fields = [
      field('checkbox', { name: 'enabled', required: false }),
      field('checkbox', { name: 'choices', required: false, options }),
      field('text', { required: false }),
    ];
    expect(decodeSavedTermParameters(saved(), page(...fields), 'Monthly')).toEqual({ enabled: false, choices: [] });
  });
  it('inherits readonly Frequency without editable parameters', () => {
    const readonly = field('readonly', { name: 'Frequency' });
    expect(decodeSavedTermParameters(saved(), page(readonly), 'Monthly')).toEqual({});
    expect(
      decodeSavedTermParameters(
        { ...saved(), result_responses: [{ parameter_name: 'Frequency', response: 'Monthly' }] },
        page(readonly),
        'Monthly',
      ),
    ).toEqual({});
    expect(() =>
      decodeSavedTermParameters(
        { ...saved(), result_responses: [{ parameter_name: 'Frequency', response: 'Weekly' }] },
        page(readonly),
        'Monthly',
      ),
    ).toThrow();
  });
  it('does not apply editor-relative date rules to historical accepted dates', () => {
    expect(
      decodeSavedTermParameters(
        saved('2000-01-01'),
        page(field('date', { datePermissions: { past: false, today: true, future: true } })),
        'Monthly',
      ),
    ).toEqual({ value: '2000-01-01' });
  });
  it.each([
    ['integer', '1.1'],
    ['integer', '9007199254740992'],
    ['integer', '1e3'],
    ['money', '1.001'],
    ['money', 'NaN'],
    ['money', '1e3'],
    ['date', '2025-02-29'],
    ['date', '01/01/2000'],
    ['date', '2000-01-01T00:00:00Z'],
    ['checkbox', 'False'],
    ['checkbox', '0'],
    ['text', ''],
  ] as const)('rejects incompatible %s response %s', (kind, response) => {
    expect(() => decodeSavedTermParameters(saved(response), page(field(kind)), 'Monthly')).toThrow();
  });
  it.each(['a,a', 'a,c', '', 'a, b'])('rejects ambiguous or invalid checkbox tokens %s', (response) => {
    expect(() => decodeSavedTermParameters(saved(response), page(field('checkbox', { options })), 'Monthly')).toThrow();
  });
  it('rejects comma-bearing checkbox option definitions even without a response', () => {
    expect(() =>
      decodeSavedTermParameters(
        saved(),
        page(field('checkbox', { required: false, options: [{ value: 'a,b', label: 'Ambiguous' }] })),
        'Monthly',
      ),
    ).toThrow();
  });
  it.each([
    ['money', '9.99', '10.00', '20.00'],
    ['money', '20.01', '10.00', '20.00'],
    ['integer', '2', 3, 4],
    ['integer', '5', 3, 4],
    ['text', 'ab', 3, 4],
    ['long_text', 'abcde', 3, 4],
    ['date', '2000-01-01', '2001-01-01', '2002-01-01'],
    ['date', '2003-01-01', '2001-01-01', '2002-01-01'],
  ] as const)('rejects %s saved values incompatible with current bounds', (kind, response, min, max) => {
    expect(() => decodeSavedTermParameters(saved(response), page(field(kind, { min, max })), 'Monthly')).toThrow();
  });
  it('rejects current checkbox selection-count incompatibility', () => {
    expect(() =>
      decodeSavedTermParameters(saved('a'), page(field('checkbox', { options, min: 2 })), 'Monthly'),
    ).toThrow();
    expect(() =>
      decodeSavedTermParameters(saved('a,b'), page(field('checkbox', { options, max: 1 })), 'Monthly'),
    ).toThrow();
  });
  it.each([
    field('integer', { required: false, min: 'bad' }),
    field('money', { required: false, min: '2.00', max: '1.00' }),
    field('date', { required: false, max: '2025-02-29' }),
    field('text', { required: false, min: -1 }),
    field('text', { required: false, options }),
    field('checkbox', { required: false, min: 1 }),
  ])('rejects incompatible optional definition $kind/$min/$max without a response', (definition) => {
    expect(() => decodeSavedTermParameters(saved(), page(definition), 'Monthly')).toThrow();
  });
  it.each(['money', 'integer', 'date', 'radio', 'select', 'autocomplete'] as const)(
    'rejects explicitly blank optional %s values',
    (kind) => {
      expect(() =>
        decodeSavedTermParameters(
          saved(''),
          page(
            field(kind, {
              required: false,
              options: ['radio', 'select', 'autocomplete'].includes(kind) ? options : [],
            }),
          ),
          'Monthly',
        ),
      ).toThrow();
    },
  );
  it('rejects missing required boolean and option-array checkbox responses', () => {
    expect(() => decodeSavedTermParameters(saved(), page(field('checkbox')), 'Monthly')).toThrow();
    expect(() => decodeSavedTermParameters(saved(), page(field('checkbox', { options })), 'Monthly')).toThrow();
  });
  it('rejects structurally unsupported option lists', () => {
    const malformed = Object.assign(field('checkbox', { required: false }), { options: null });
    expect(() => decodeSavedTermParameters(saved(), page(malformed), 'Monthly')).toThrow();
  });
  it('rejects required response absence', () => {
    expect(() => decodeSavedTermParameters(saved(), page(field('integer')), 'Monthly')).toThrow();
  });
  it('rejects repeated and unknown response names', () => {
    const term = saved('12');
    term.result_responses.push({ parameter_name: 'value', response: '13' });
    expect(() => decodeSavedTermParameters(term, page(field('integer')), 'Monthly')).toThrow();
    expect(() =>
      decodeSavedTermParameters(saved('12'), page(field('integer', { name: 'other' })), 'Monthly'),
    ).toThrow();
  });
  it('rejects mismatched results, repeated field names, unsupported kinds and readonly definitions', () => {
    expect(() =>
      decodeSavedTermParameters({ ...saved('12'), result_id: 'OTHER' }, page(field('integer')), 'Monthly'),
    ).toThrow();
    expect(() => decodeSavedTermParameters(saved('12'), page(field('integer'), field('integer')), 'Monthly')).toThrow();
    expect(() =>
      decodeSavedTermParameters(
        saved('12'),
        page(field('unsupported' as ICasesCreateCasefileOrderTermField['kind'])),
        'Monthly',
      ),
    ).toThrow();
    expect(() => decodeSavedTermParameters(saved(), page(field('readonly')), 'Monthly')).toThrow();
  });
  it.each(['radio', 'select', 'autocomplete', 'checkbox'] as const)(
    'rejects duplicate %s option definitions',
    (kind) => {
      expect(() =>
        decodeSavedTermParameters(saved('a'), page(field(kind, { options: [options[0], options[0]] })), 'Monthly'),
      ).toThrow();
    },
  );
  it.each(['radio', 'select', 'autocomplete'] as const)('rejects missing %s choices', (kind) => {
    expect(() => decodeSavedTermParameters(saved('a'), page(field(kind)), 'Monthly')).toThrow();
  });
});

describe('mapSavedOrderTerm', () => {
  it('assigns the occurrence ID, applicant and a cloned presentation', () => {
    const term = { ...saved(), result_responses: [{ parameter_name: 'amount', response: '100.00' }] };
    const before = structuredClone(context);
    const mapped = mapSavedOrderTerm(term, 2, context, [], 'Monthly');
    expect(mapped).toEqual({
      termId: 2,
      resultId: 'TEST01',
      parameters: { amount: '100.00' },
      creditor: { type: 'applicant' },
      presentation: {
        title: 'Test order term',
        fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
      },
    });
    mapped.presentation.fields[0].label = 'changed';
    expect(context).toEqual(before);
  });
  it('rejects unavailable result metadata and unresolved or contradictory creditor relationships', () => {
    const term = { ...saved(), result_responses: [{ parameter_name: 'amount', response: '100' }] };
    expect(() => mapSavedOrderTerm(term, 1, { ...context, resultPages: {} }, [], 'Monthly')).toThrow();
    for (const changes of [
      { creditor_type: undefined },
      { creditor_type: 'Minor Creditor' as const, minor_creditor_sequence: 12 },
      { creditor_type: 'Major Creditor' as const, major_creditor_code: 'MISSING' },
      { minor_creditor_sequence: 12 },
      { major_creditor_code: 'MAJOR' },
    ]) {
      expect(() => mapSavedOrderTerm({ ...term, ...changes }, 1, context, [], 'Monthly')).toThrow();
    }
  });
});
