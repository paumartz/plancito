// Ícono del grupo: dibujo de línea sobre una mancha pastel (estilo del prototipo)
export const GROUP_ICONS: Record<string, string> = {
  taza:`<path d="M12 16 h20 v14 a6 6 0 0 1 -6 6 h-8 a6 6 0 0 1 -6 -6z M32 19 h3 a4 4 0 0 1 0 9 h-3 M17 19 v14 M22 19 v15 M27 19 v14"/>`,
  pizza:`<path d="M12 14 C20 10 28 10 36 14 L24 38 Z M14 18 C21 15 27 15 34 18"/><circle cx="22" cy="22" r="1.6"/><circle cx="27" cy="25" r="1.6"/><circle cx="24" cy="30" r="1.4"/>`,
  corazon:`<path d="M24 36 C14 29 10 23 12 18 C14 13 21 13 24 19 C27 13 34 13 36 18 C38 23 34 29 24 36z"/>`,
  frutilla:`<path d="M24 14 c-8 0 -12 5 -11 11 c1 7 7 12 11 14 c4 -2 10 -7 11 -14 c1 -6 -3 -11 -11 -11z M19 12 l5 3 l5 -3 M24 15 v-5"/><circle cx="20" cy="23" r=".9"/><circle cx="27" cy="22" r=".9"/><circle cx="23" cy="28" r=".9"/><circle cx="29" cy="28" r=".9"/>`,
  copa:`<path d="M16 11 h16 c0 9 -3 13 -8 13 c-5 0 -8 -4 -8 -13z M24 24 v11 M18 36 h12 M17 16 h14"/>`,
  estrella:`<path d="M24 11 l3.6 8 8.4 .8 -6.4 5.6 2 8.4 -7.6 -4.6 -7.6 4.6 2 -8.4 -6.4 -5.6 8.4 -.8z"/>`,
  sol:`<circle cx="24" cy="24" r="7"/><path d="M24 9 v4 M24 35 v4 M9 24 h4 M35 24 h4 M13.5 13.5 l3 3 M31.5 31.5 l3 3 M13.5 34.5 l3 -3 M31.5 16.5 l3 -3"/>`,
  flor:`<path d="M24 22 c-2 -8 6 -10 6 -4 c6 -4 10 4 4 6 c6 2 2 10 -3 6 c0 7 -9 7 -8 1 c-6 4 -10 -4 -4 -6 c-6 -3 -2 -10 5 -3z"/>`,
  vela:`<path d="M14 20 h20 v16 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2z M24 20 v-5 M24 9 c2 2 2 4 0 6 c-2 -2 -2 -4 0 -6z"/>`,
  pelota:`<circle cx="24" cy="24" r="12"/><path d="M24 17 l6 4 -2 7 h-8 l-2 -7z M24 12 v5 M30 21 l5 -2 M28 28 l3 5 M20 28 l-3 5 M18 21 l-5 -2"/>`,
};
export const GROUP_COLORS: Record<string, string> = { tomato:'#E8573A', peach:'#F5BE92', pink:'#F6B5C6', sky:'#BCD7EA', lime:'#D7EEA4', lilac:'#D3C4F6' };
export function groupIconSvg(icon: { icon: string; color: string }, size = 46) {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" style="flex:none"><path d="M8 10 C14 3 34 2 41 9 C47 16 46 34 40 40 C33 47 14 46 8 40 C2 33 2 17 8 10Z" fill="${GROUP_COLORS[icon.color] || GROUP_COLORS.tomato}"/><g fill="none" stroke="#5B1E1E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${GROUP_ICONS[icon.icon] || GROUP_ICONS.taza}</g></svg>`;
}
export const lineIconSvg = (icon: string, size = 30) =>
  `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GROUP_ICONS[icon] || GROUP_ICONS.taza}</g></svg>`;
