// Une "journée ouverte" va de 07h00 du jour en cours à 04h00 du jour suivant.
export const BUSINESS_DAY_START_HOUR = 7;
export const BUSINESS_DAY_END_HOUR = 4;

/** Retourne la date (jour calendaire) de la journée commerciale en cours. */
export function currentBusinessDate(now: Date = new Date()): Date {
  const d = new Date(now);
  if (d.getHours() < BUSINESS_DAY_END_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Bornes [start, end) d'une journée commerciale : 07h00 -> 04h00 du lendemain. */
export function businessDayRange(day: Date = currentBusinessDate()) {
  const start = new Date(day);
  start.setHours(BUSINESS_DAY_START_HOUR, 0, 0, 0);
  const end = new Date(day);
  end.setDate(end.getDate() + 1);
  end.setHours(BUSINESS_DAY_END_HOUR, 0, 0, 0);
  return { start, end };
}

/** Clé jour (YYYY-MM-DD) de la journée commerciale à laquelle appartient une date. */
export function businessDayKey(date: string | Date): string {
  const d = currentBusinessDate(new Date(date));
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatBusinessDayLabel(day: Date = currentBusinessDate()): string {
  const { start, end } = businessDayRange(day);
  const f = (d: Date) => d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `${f(start)} → ${f(end)}`;
}
