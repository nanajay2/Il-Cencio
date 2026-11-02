// Aiuti per i colori delle stanze: sono scelti dall'utente, quindi possono
// essere chiari o scuri e il testo sopra va deciso caso per caso.
const INK = '#17241F';
const WHITE = '#FFFFFF';

function parse(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  const n = parseInt(m ? m[1] : '56645E', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Versione molto chiara del colore, per gli sfondi.
export function tint(hex, amount = 0.2) {
  const mixed = parse(hex).map(v => Math.round(255 + (v - 255) * amount));
  return `rgb(${mixed.join(', ')})`;
}

// Testo leggibile sopra il colore pieno.
export function readableOn(hex) {
  const rgb = parse(hex);
  return contrast(rgb, [255, 255, 255]) >= 4.5 ? WHITE : INK;
}

// Testo sopra la tinta: il colore stesso se si legge, altrimenti inchiostro.
export function textOnTint(hex, amount = 0.2) {
  const rgb = parse(hex);
  const bg = rgb.map(v => Math.round(255 + (v - 255) * amount));
  return contrast(rgb, bg) >= 4.5 ? `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}` : INK;
}
