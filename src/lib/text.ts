/** Text helpers shared by the filters of both sections. */

/** Lower case without diacritics, so "Piñol" and "pinol" match. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
