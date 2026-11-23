/** Date du jour au format AAAA-MM-JJ, à l'heure du téléphone (et non en heure de Londres). */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
