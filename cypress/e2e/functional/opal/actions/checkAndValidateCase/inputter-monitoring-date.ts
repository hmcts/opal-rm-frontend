/** Independent calendar expectations; deliberately does not import the production date-range mapper.
 * @param timestamp Actual persisted lifecycle timestamp, including its server offset.
 * @param days Local calendar days after that lifecycle date.
 * @returns AUT time and independently calculated inclusive query endpoints.
 */
export function monitoringCalendar(timestamp: string, days: number): { now: number; from: string; to: string } {
  const lifecycle = new Date(timestamp);
  if (!Number.isFinite(lifecycle.getTime())) throw new Error('Monitoring needs an actual valid lifecycle timestamp');
  // Local calendar construction preserves days across DST. Only AUT Date is replaced, never ordinary timers.
  const consultation = new Date(lifecycle.getFullYear(), lifecycle.getMonth(), lifecycle.getDate() + days, 12);
  const ordinal = Date.UTC(consultation.getFullYear(), consultation.getMonth(), consultation.getDate());
  const day = (offset: number) => new Date(ordinal + offset * 86_400_000).toISOString().slice(0, 10);
  return { now: consultation.getTime(), from: day(-7), to: day(0) };
}
