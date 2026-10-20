export function isUsableDraftCasefileEtag(value: string | null): value is string {
  if (typeof value !== 'string' || !/^"[0-9]+"$/.test(value)) return false;
  const digits = value.slice(1, -1).replace(/^0+(?=\d)/, '');
  return digits.length < 19 || (digits.length === 19 && digits <= '9223372036854775807');
}
