import type { ICasesCreateCasefileOrderTermDatePermissions } from '../interfaces/cases-create-casefile-order-term-date-permissions.interface';

export function parseOrderTermDatePermissions(
  source: Record<string, unknown>,
): ICasesCreateCasefileOrderTermDatePermissions | undefined {
  const keys = ['date_in_past', 'date_today', 'date_in_future'];
  if (!keys.some((key) => Object.hasOwn(source, key))) return undefined;
  if (
    source['type'] !== 'date' ||
    source['date_rule'] !== undefined ||
    keys.some((key) => typeof source[key] !== 'boolean') ||
    !keys.some((key) => source[key] === true)
  ) {
    throw new Error('Unsupported order-term metadata');
  }
  return {
    past: source['date_in_past'] as boolean,
    today: source['date_today'] as boolean,
    future: source['date_in_future'] as boolean,
  };
}
