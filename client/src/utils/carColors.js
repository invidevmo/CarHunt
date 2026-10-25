export const COLOR_PRESETS = [
  { name: 'Czarny', hex: '#0f172a' },
  { name: 'Biały', hex: '#f8fafc' },
  { name: 'Srebrny', hex: '#cbd5e1' },
  { name: 'Szary', hex: '#64748b' },
  { name: 'Czerwony', hex: '#ef4444' },
  { name: 'Niebieski', hex: '#3b82f6' },
  { name: 'Granatowy', hex: '#1e3a8a' },
  { name: 'Zielony', hex: '#22c55e' },
  { name: 'Żółty', hex: '#eab308' },
  { name: 'Pomarańczowy', hex: '#f97316' },
];

export function getColorHex(colorName) {
  if (!colorName) return '#94a3b8';
  const c = colorName.toLowerCase().trim();
  const match = COLOR_PRESETS.find((p) => c.includes(p.name.toLowerCase()));
  if (match) return match.hex;
  if (c.includes('czarn')) return '#0f172a';
  if (c.includes('biał') || c.includes('bial')) return '#f8fafc';
  if (c.includes('srebrn')) return '#cbd5e1';
  if (c.includes('szar')) return '#64748b';
  if (c.includes('czerwon')) return '#ef4444';
  if (c.includes('granat')) return '#1e3a8a';
  if (c.includes('niebiesk')) return '#3b82f6';
  if (c.includes('zielon')) return '#22c55e';
  if (c.includes('żółt') || c.includes('zolt')) return '#eab308';
  if (c.includes('pomarańcz') || c.includes('pomarancz')) return '#f97316';
  return '#94a3b8';
}
