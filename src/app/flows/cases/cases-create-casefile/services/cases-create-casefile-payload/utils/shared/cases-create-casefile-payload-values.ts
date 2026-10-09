export const text = (value: string | null | undefined): string | undefined => value?.trim() || undefined;
export function required(value: string | null | undefined): string {
  const result = text(value);
  if (!result) throw new Error('Required casefile value is missing');
  return result;
}
