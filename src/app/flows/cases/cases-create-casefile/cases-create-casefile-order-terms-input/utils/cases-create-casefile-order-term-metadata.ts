import { DateTime } from 'luxon';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';

const fail = (): never => {
  throw new Error('Unsupported order-term metadata');
};

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : fail();

const text = (value: unknown): string => (typeof value === 'string' && value.trim() ? value.trim() : fail());

const aliases: Record<string, ICasesCreateCasefileOrderTermField['kind']> = {
  money: 'money',
  decimal: 'money',
  'decimal-2dp': 'money',
  'text-60': 'text',
  'text-100': 'text',
  'text-1000': 'long_text',
  'menu-radio': 'radio',
  'menu-checkbox': 'checkbox',
  integer: 'integer',
  text: 'text',
  long_text: 'long_text',
  date: 'date',
  radio: 'radio',
  select: 'select',
  menu: 'select',
  autocomplete: 'autocomplete',
  checkbox: 'checkbox',
};

const keys = new Set([
  'name',
  'prompt',
  'type',
  'mandatory',
  'language_dependent',
  'min',
  'max',
  'hint',
  'options',
  'apidata',
  'readonly',
  'precision',
  'date_rule',
]);

const decimalUnits = (value: string): bigint => {
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  const units = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return value.startsWith('-') ? -units : units;
};

const bound = (
  value: unknown,
  kind: ICasesCreateCasefileOrderTermField['kind'],
  upper: boolean,
): string | number | null => {
  if (value === undefined || (upper && value === 'No Limit')) return null;
  if (kind === 'date') {
    if (!upper && value === 0) return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value).isValid) {
      return fail();
    }
    return value;
  }
  if (kind === 'money') {
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^-?\d+(\.\d{1,2})?$/.test(String(value))) {
      return fail();
    }
    return String(value);
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return fail();
  if (kind !== 'integer' && value < 0) return fail();
  return value;
};

const parseOptions = (value: unknown, strings = false): { value: string; label: string }[] => {
  if (!Array.isArray(value) || !value.length) return fail();
  const seen = new Set<string>();
  return value.map((item) => {
    const source = strings ? { value: text(item), label: text(item) } : record(item);
    if (Object.keys(source).some((key) => !['value', 'label'].includes(key))) return fail();
    const option = { value: text(source['value']), label: text(source['label']) };
    if (seen.has(option.value)) return fail();
    seen.add(option.value);
    return option;
  });
};

const parseField = (value: unknown): ICasesCreateCasefileOrderTermField => {
  const source = record(value);
  if (Object.keys(source).some((key) => !keys.has(key))) return fail();
  const name = text(source['name']);
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) return fail();
  const type = text(source['type']);
  if (!Object.hasOwn(aliases, type)) return fail();
  let kind = aliases[type];
  const documented = /^(text-(60|100|1000)|decimal-2dp|menu-(radio|checkbox)|date|integer)$/.test(type);
  if (documented && (source['min'] === undefined || source['max'] === undefined)) return fail();
  if (type === 'decimal-2dp' && (typeof source['min'] !== 'number' || typeof source['max'] !== 'number')) return fail();
  if (typeof source['mandatory'] !== 'boolean' || source['language_dependent'] !== false) return fail();
  if (source['readonly'] !== undefined && typeof source['readonly'] !== 'boolean') return fail();
  if (source['hint'] !== undefined && typeof source['hint'] !== 'string') return fail();
  if (source['precision'] !== undefined && (kind !== 'money' || source['precision'] !== 2)) return fail();
  if (source['date_rule'] !== undefined && (kind !== 'date' || source['date_rule'] !== 'past')) return fail();
  if (name.toLowerCase() === 'frequency' && !documented) {
    if (
      kind !== 'select' ||
      ['min', 'max', 'options', 'apidata', 'precision', 'date_rule'].some((key) => source[key] !== undefined)
    ) {
      return fail();
    }
    kind = 'readonly';
  } else if (source['readonly'] === true) return fail();
  const choice = ['select', 'radio', 'autocomplete'].includes(kind) || type === 'menu-checkbox';
  if (!choice && (source['options'] !== undefined || source['apidata'] !== undefined)) return fail();
  const lookup =
    source['apidata'] === undefined
      ? null
      : source['apidata'] === 'mock:order-term-options'
        ? 'mock:order-term-options'
        : fail();
  const options = source['options'] === undefined ? [] : parseOptions(source['options'], documented);
  if (choice && (lookup ? options.length > 0 : options.length === 0)) return fail();
  if (
    choice &&
    !documented &&
    ((source['min'] !== undefined && source['min'] !== 0) ||
      (source['max'] !== undefined && source['max'] !== 'No Limit'))
  ) {
    return fail();
  }
  if (
    !documented &&
    ['checkbox', 'readonly'].includes(kind) &&
    (source['min'] !== undefined || source['max'] !== undefined)
  ) {
    return fail();
  }
  const min = choice && !documented ? null : bound(source['min'], kind, false);
  const max = choice && !documented ? null : bound(source['max'], kind, true);
  if (min !== null && max !== null) {
    const reversed =
      kind === 'money'
        ? decimalUnits(String(min)) > decimalUnits(String(max))
        : typeof min === 'number' && typeof max === 'number'
          ? min > max
          : String(min) > String(max);
    if (reversed) return fail();
  }
  if (documented) {
    if (min === null || max === null) return fail();
    if (kind === 'date' && (String(min) < '1900-01-01' || String(max) > '2100-12-31')) return fail();
    if (kind === 'integer' && (Number(min) < -2147483648 || Number(max) > 2147483647)) return fail();
    if (
      type === 'decimal-2dp' &&
      (decimalUnits(String(min)) < -999999999999n || decimalUnits(String(max)) > 999999999999n)
    )
      return fail();
    if (type.startsWith('text-') && Number(max) > Number(type.slice(5))) return fail();
    if (type === 'menu-radio' && (Number(min) > 1 || Number(max) !== 1)) return fail();
    if (type === 'menu-checkbox' && (Number(max) < 1 || Number(max) > options.length)) return fail();
    if (name.toLowerCase() === 'frequency') {
      if (type !== 'menu-radio') return fail();
      kind = 'readonly';
    }
  }
  return {
    name,
    id: `create_casefile_order_terms_input_${name.toLowerCase()}`,
    label: text(source['prompt']),
    kind,
    required: source['mandatory'],
    hint: (source['hint'] as string | undefined) ?? '',
    min,
    max,
    past: source['date_rule'] === 'past',
    options,
    lookup,
  };
};

export function mapOrderTermParameters(json: string | null): ICasesCreateCasefileOrderTermField[] {
  if (typeof json !== 'string') return fail();
  let parameters: unknown;
  try {
    parameters = JSON.parse(json);
  } catch {
    return fail();
  }
  if (!Array.isArray(parameters) || parameters.length === 0) return fail();
  const fields = parameters.map(parseField);
  if (
    new Set(fields.map((field) => field.name)).size !== fields.length ||
    new Set(fields.map((field) => field.id)).size !== fields.length
  ) {
    return fail();
  }
  return fields;
}
