/**
 * Maps French notification strings from the API/DB to English for the UI.
 */

const FR_TITLES: Record<string, string> = {
  'Cours ajouté': 'Course added',
  'Cours mis à jour': 'Course updated',
  'Cours supprimé': 'Course removed'
};

export function displayNotificationTitleEn(title: string | null | undefined): string {
  const t = (title ?? '').trim();
  return FR_TITLES[t] ?? t;
}

export function displayNotificationMessageEn(message: string | null | undefined): string {
  const m = (message ?? '').trim();
  if (!m) return '';

  const upd = m.match(/^Le cours (.+?) a été mis à jour\.?$/i);
  if (upd) return `The course ${upd[1]} has been updated.`;

  const add = m.match(/^Le cours (.+?) a été ajouté\.?$/i);
  if (add) return `The course ${add[1]} has been added.`;

  const del = m.match(/^Le cours (.+?) a été supprimé\.?$/i);
  if (del) return `The course ${del[1]} has been removed.`;

  return m;
}
