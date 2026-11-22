/** Petits outils de couleur, pour teinter les cartes avec les couleurs des vêtements. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Mélange deux couleurs (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** Luminance relative (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Couleur du trait/icône lisible sur un fond donné. */
export function onColor(bg: string): string {
  return luminance(bg) > 0.35 ? mix(bg, '#000000', 0.5) : mix(bg, '#FFFFFF', 0.7);
}

/**
 * Teinte douce de la carte d'un look : on prend la pièce la plus « colorée »
 * (la plus éloignée du gris) et on la mélange fortement avec le fond papier.
 */
export function outfitTint(hexes: string[], paper: string, strength = 0.28): string {
  const saturation = (hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    return Math.max(r, g, b) - Math.min(r, g, b);
  };
  const best = [...hexes].sort((a, b) => saturation(b) - saturation(a))[0] ?? paper;
  return mix(paper, best, strength);
}
