import { DateTime } from 'luxon';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import type { ICasesCreateCasefileOrderTermField } from '../../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-field.interface';
import type { ICasesCreateCasefileOrderTerm } from '../../../../interfaces/cases-create-casefile-order-term.interface';
import type { ICasesCreateCasefileHydrationContext } from '../../interfaces/cases-create-casefile-hydration-context.interface';
import type { ICasesCreateCasefileMinorCreditor } from '../../../../interfaces/cases-create-casefile-minor-creditor.interface';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { CasesCreateCasefileCreditorAssignment } from '../../../../types/cases-create-casefile-creditor-assignment.type';
import { orderTermPresentation } from '../../../../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-presentation';

type SavedTerm =
  IOpalMaintenanceDraftCasefileRequest['casefile']['respondent_account']['order_details']['order_terms'][number];
type Field = ICasesCreateCasefileOrderTermField;
type Parameter = ICasesCreateCasefileOrderTerm['parameters'][string];
const supportedKinds = new Set([
  'money',
  'integer',
  'text',
  'long_text',
  'date',
  'radio',
  'select',
  'autocomplete',
  'checkbox',
  'readonly',
]);
const choices = new Set(['radio', 'select', 'autocomplete']);
const fail = (): never => {
  throw new Error('Unusable saved order term');
};
const isoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;

const moneyUnits = (value: string): bigint => {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) return fail();
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return value.startsWith('-') ? -amount : amount;
};

function validateOptions(field: Field): void {
  if (!Array.isArray(field.options)) return fail();
  const values = field.options.map((option) => option.value);
  if (values.some((value) => typeof value !== 'string' || !value.trim()) || new Set(values).size !== values.length)
    return fail();
  if (choices.has(field.kind) && !values.length) return fail();
  if (field.kind === 'checkbox' && values.some((value) => value.includes(','))) return fail();
  if (![...choices, 'checkbox', 'readonly'].includes(field.kind) && values.length) return fail();
}

function validateField(field: Field): void {
  if (
    !field ||
    typeof field.name !== 'string' ||
    !/^[A-Za-z]\w*$/.test(field.name) ||
    !supportedKinds.has(field.kind) ||
    typeof field.required !== 'boolean'
  )
    return fail();
  if (field.kind === 'readonly' && field.name.toLowerCase() !== 'frequency') return fail();
  validateOptions(field);
  validateBounds(field);
}

function checkBounds<T extends number | string | bigint>(value: T, min: T | null, max: T | null): void {
  if ((min !== null && value < min) || (max !== null && value > max)) return fail();
}

function numericBound(value: Field['min']): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return fail();
  return value;
}

function moneyBound(value: Field['min']): bigint | null {
  return value === null ? null : moneyUnits(String(value));
}

function dateBound(value: Field['min']): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !isoDate(value)) return fail();
  return value;
}

function validateRange<T extends number | string | bigint>(min: T | null, max: T | null): void {
  if (min !== null && max !== null && min > max) return fail();
}

function validateBounds(field: Field): void {
  if (field.kind === 'money') return validateRange(moneyBound(field.min), moneyBound(field.max));
  if (field.kind === 'date') return validateRange(dateBound(field.min), dateBound(field.max));
  const min = numericBound(field.min);
  const max = numericBound(field.max);
  validateRange(min, max);
  if (field.kind !== 'integer' && ((min !== null && min < 0) || (max !== null && max < 0))) return fail();
  if (field.kind === 'checkbox' && !field.options.length && (min !== null || max !== null)) return fail();
}

function decodeNumber(response: string, field: Field): Parameter {
  if (field.kind === 'integer') {
    if (!/^-?\d+$/.test(response) || !Number.isSafeInteger(Number(response))) return fail();
    const value = Number(response);
    checkBounds(value, numericBound(field.min), numericBound(field.max));
    return value;
  }
  const amount = moneyUnits(response);
  checkBounds(amount, moneyBound(field.min), moneyBound(field.max));
  const absolute = amount < 0n ? -amount : amount;
  const sign = amount < 0n ? '-' : '';
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

function decodeCheckbox(response: string | undefined, field: Field): Parameter {
  if (!field.options.length) {
    if (response === undefined && !field.required) return false;
    if (response !== 'true' && response !== 'false') return fail();
    return response === 'true';
  }
  if (response === undefined && !field.required) return [];
  if (response === undefined) return fail();
  const tokens = response.split(',');
  if (
    new Set(tokens).size !== tokens.length ||
    tokens.some((token) => !field.options.some((option) => option.value === token))
  )
    return fail();
  checkBounds(tokens.length, numericBound(field.min), numericBound(field.max));
  return field.options.filter((option) => tokens.includes(option.value)).map((option) => option.value);
}

function decodeValue(response: string, field: Field): Parameter {
  if (field.kind === 'money' || field.kind === 'integer') return decodeNumber(response, field);
  if (choices.has(field.kind)) {
    if (!field.options.some((option) => option.value === response)) return fail();
    return response;
  }
  if (field.kind === 'date') {
    if (!isoDate(response)) return fail();
    checkBounds(response, dateBound(field.min), dateBound(field.max));
    return response;
  }
  checkBounds(response.length, numericBound(field.min), numericBound(field.max));
  return response;
}

function decodeField(response: string | undefined, field: Field, frequency: string): Parameter | undefined {
  if (field.kind === 'readonly') {
    if (response !== undefined && response !== frequency) return fail();
    return undefined;
  }
  if (field.kind === 'checkbox') return decodeCheckbox(response, field);
  if (response === undefined) {
    if (field.required) return fail();
    return undefined;
  }
  if (field.required && !response.trim()) return fail();
  return decodeValue(response, field);
}

/** Decode accepted domain values against current metadata, without editor-relative date rules. */
export function decodeSavedTermParameters(
  term: SavedTerm,
  page: ICasesCreateCasefileOrderTermPage,
  frequency: string,
): ICasesCreateCasefileOrderTerm['parameters'] {
  if (
    term.result_id !== page.resultId ||
    !Array.isArray(page.fields) ||
    !page.fields.length ||
    !Array.isArray(term.result_responses)
  )
    return fail();
  const fields = new Map<string, Field>();
  for (const field of page.fields) {
    validateField(field);
    if (fields.has(field.name)) return fail();
    fields.set(field.name, field);
  }
  const responses = new Map<string, string>();
  for (const response of term.result_responses) {
    if (
      !response ||
      !fields.has(response.parameter_name) ||
      responses.has(response.parameter_name) ||
      typeof response.response !== 'string'
    )
      return fail();
    responses.set(response.parameter_name, response.response);
  }
  const parameters: ICasesCreateCasefileOrderTerm['parameters'] = {};
  for (const [name, field] of fields) {
    const value = decodeField(responses.get(name), field, frequency);
    if (value !== undefined) parameters[name] = value;
  }
  return parameters;
}

function mapCreditor(
  term: SavedTerm,
  context: ICasesCreateCasefileHydrationContext,
  minorCreditors: readonly ICasesCreateCasefileMinorCreditor[],
): CasesCreateCasefileCreditorAssignment {
  if (term.creditor_type === 'Applicant') {
    if (term.minor_creditor_sequence !== undefined || term.major_creditor_code !== undefined) return fail();
    return { type: 'applicant' };
  }
  if (term.creditor_type === 'Minor Creditor') {
    const matches = minorCreditors.filter((item) => item.sequenceNumber === term.minor_creditor_sequence);
    if (term.major_creditor_code !== undefined || matches.length !== 1) return fail();
    return { type: 'minor', sequenceNumber: matches[0].sequenceNumber };
  }
  if (
    term.creditor_type !== 'Major Creditor' ||
    term.minor_creditor_sequence !== undefined ||
    !term.major_creditor_code
  )
    return fail();
  const matches = context.majorCreditors.filter(
    (item) => item.major_creditor_code === term.major_creditor_code && item.central_authority === false,
  );
  if (
    matches.length !== 1 ||
    !Number.isSafeInteger(matches[0].major_creditor_id) ||
    matches[0].major_creditor_id < 1 ||
    !Number.isSafeInteger(matches[0].business_unit_id) ||
    matches[0].business_unit_id < 1 ||
    typeof matches[0].name !== 'string' ||
    !matches[0].name.trim()
  )
    return fail();
  return { type: 'major', majorCreditorId: matches[0].major_creditor_id, displayName: matches[0].name };
}

/** The supplied creditor references must already be scoped to the saved owning business unit. */
export function mapSavedOrderTerm(
  term: SavedTerm,
  termId: number,
  context: ICasesCreateCasefileHydrationContext,
  minorCreditors: readonly ICasesCreateCasefileMinorCreditor[],
  frequency: string,
): ICasesCreateCasefileAcceptedOrderTerm {
  const page = context.resultPages[term.result_id];
  if (!page || !Number.isSafeInteger(termId) || termId < 1) return fail();
  return {
    termId,
    resultId: term.result_id,
    parameters: decodeSavedTermParameters(term, page, frequency),
    creditor: mapCreditor(term, context, minorCreditors),
    presentation: orderTermPresentation(page),
  };
}
