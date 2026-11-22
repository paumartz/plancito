// Ilustraciones para los grupos, con el estilo de las referencias: dibujo a línea en tinta
// y un relleno degradé suave (como el cuerpo de los avatares).

export const ART_GRADS: Record<string, [string, string, string]> = {
  sunset: ['#FF8A5B', '#F7A8C4', '#B79CFF'],
  mint: ['#B6E89C', '#FBE38A', '#A6CFF0'],
  berry: ['#F26D7D', '#F7B7C8', '#FFD3A5'],
  sky: ['#94C3F0', '#C9B8F5', '#F7C5DA'],
  citrus: ['#FFD166', '#FFB38A', '#C3EC9C'],
};
export const ART_GRAD_LABELS: Record<string, string> = { sunset: 'Atardecer', mint: 'Menta', berry: 'Frutilla', sky: 'Cielo', citrus: 'Limón' };

const K = '#2A1F1D';
const L = `fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const W = `fill="#FFFDF9" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"`;
const star = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} L${x + r * .28} ${y - r * .28} L${x + r} ${y} L${x + r * .28} ${y + r * .28} L${x} ${y + r} L${x - r * .28} ${y + r * .28} L${x - r} ${y} L${x - r * .28} ${y - r * .28} Z" ${L} stroke-width="1.8"/>`;
const sparks = (x: number, y: number) => `<path d="M${x} ${y} l-4 -5 M${x + 7} ${y - 3} l-1 -6 M${x + 14} ${y - 2} l3 -5" ${L} stroke-width="2"/>`;
const smile = (x: number, y: number, w = 6) => `<path d="M${x - w / 2} ${y} q${w / 2} ${w * .6} ${w} 0" ${L} stroke-width="2"/>`;
const sleepy = (x: number, y: number) => `<path d="M${x - 3} ${y} q3 2.4 6 0" ${L} stroke-width="2"/>`;
const dot = (x: number, y: number, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K}"/>`;

// Cada dibujo recibe "G" = relleno degradé (url) y devuelve el contenido en un lienzo de 100×100.
export const GROUP_ARTS: Record<string, { label: string; draw: (G: string) => string }> = {
  manzanas: { label: 'Manzanitas', draw: (G) => `
    ${sparks(16, 30)}
    <path d="M34 44 C23 38 14 48 16 60 C18 73 27 79 34 76 C41 79 50 73 52 60 C54 48 45 38 34 44Z" fill="${G}" filter="url(#soft)"/>
    <path d="M34 44 C23 38 14 48 16 60 C18 73 27 79 34 76 C41 79 50 73 52 60 C54 48 45 38 34 44Z" ${L} stroke-opacity=".25"/>
    <path d="M34 44 q1 -6 4 -9 M38 37 q6 -5 10 -1 q-5 4 -10 1" ${L}/>
    ${sleepy(29, 58)}${sleepy(39, 58)}${smile(34, 65, 5)}
    <path d="M30 76 v6 M38 76 v6 M27 82 h6 M35 82 h6" ${L} stroke-width="2"/>
    <path d="M68 40 C56 33 46 44 48 57 C50 71 59 78 68 75 C77 78 86 71 88 57 C90 44 80 33 68 40Z" ${W}/>
    <path d="M68 40 q0 -6 3 -8" ${L}/>
    ${sleepy(62, 55)}${sleepy(74, 55)}${smile(68, 63, 7)}` },
  luna: { label: 'Luna con gorrito', draw: (G) => `
    ${star(22, 32, 9)}${star(20, 70, 4)}
    <path d="M60 22 C41 26 32 46 38 64 C44 80 63 86 78 79 C61 77 49 63 51 47 C52 35 56 27 60 22Z" fill="${G}" filter="url(#soft)"/>
    <path d="M60 22 C41 26 32 46 38 64 C44 80 63 86 78 79" ${L} stroke-opacity=".25"/>
    <path d="M47 34 C51 22 63 15 76 19 C72 25 63 31 53 38 Z" ${W}/>
    <circle cx="78" cy="18" r="3.4" ${W}/>
    <path d="M42 54 q3 2.4 6 0 M43 57 l-1.4 1.6 M47 57 l1.2 1.6" ${L} stroke-width="1.8"/>
    ${smile(47, 64, 6)}
    <circle cx="16" cy="48" r="1.6" fill="${K}"/>` },
  globo: { label: 'Globo aerostático', draw: (G) => `
    <path d="M14 26 q2 -6 8 -4 q3 -5 9 -1 q6 0 5 5 Z" ${L} stroke-width="2"/>
    <path d="M52 16 C36 16 27 28 29 41 C31 54 43 62 47 67 L57 67 C61 62 73 54 75 41 C77 28 68 16 52 16Z" fill="${G}" filter="url(#soft)"/>
    <ellipse cx="58" cy="38" rx="5" ry="3.4" ${W} stroke-width="2"/><circle cx="59.5" cy="38" r="1.8" fill="${K}"/>
    <ellipse cx="69" cy="38" rx="5" ry="3.4" ${W} stroke-width="2"/><circle cx="70.5" cy="38" r="1.8" fill="${K}"/>
    <path d="M47 67 L46 76 M57 67 L58 76" ${L} stroke-width="2"/>
    <path d="M44 76 h16 l-2 12 h-12 Z M47 76 l1 12 M52 76 v12 M57 76 l-1 12 M45 82 h14" ${L} stroke-width="2"/>
    <path d="M8 56 h14 M6 62 h18 M10 68 h12" ${L} stroke-width="2"/>` },
  cometa: { label: 'Estrella fugaz', draw: (G) => `
    ${star(78, 16, 6)}${star(84, 84, 5)}${star(16, 28, 4)}
    <path d="M62 32 C46 38 28 54 16 76 C30 68 48 60 74 46 Z" fill="${G}" filter="url(#soft)"/>
    <path d="M60 36 C46 44 32 56 20 72 M64 42 C52 50 40 60 28 74 M62 30 C50 34 38 42 28 52" ${L} stroke-width="1.8"/>
    <path d="M60 30 C66 26 76 30 76 40 C76 48 68 50 62 46 C58 42 56 34 60 30Z" fill="${K}"/>
    <circle cx="30" cy="84" r="1.6" fill="${K}"/><circle cx="12" cy="56" r="1.4" fill="${K}"/>` },
  diente: { label: 'Diente de león', draw: (G) => `
    <circle cx="44" cy="40" r="17" fill="${G}" filter="url(#soft)"/>
    <path d="M38 92 C40 74 42 60 44 46" ${L}/>
    <path d="M44 40 l0 -14 M44 40 l10 -10 M44 40 l14 0 M44 40 l10 10 M44 40 l-10 -10 M44 40 l-14 0 M44 40 l-10 10 M44 40 l0 14" ${L} stroke-width="1.8"/>
    <path d="M44 26 l-2 -3 m2 3 l2 -3 M54 30 l1 -4 m-1 4 l4 -1 M58 40 l3 -2 m-3 2 l3 2 M30 40 l-3 -2 m3 2 l-3 2 M34 30 l-4 -1 m4 1 l-1 -4" ${L} stroke-width="1.5"/>
    <path d="M66 28 l4 -3 m-4 3 l3 1 M74 36 l5 -2 m-5 2 l3 2 M82 26 l4 -3 m-4 3 l3 1 M70 46 l5 -1" ${L} stroke-width="1.6"/>
    <path d="M38 70 q-8 -4 -12 2 q6 4 12 -2" ${L} stroke-width="2"/>` },
  frutilla: { label: 'Frutilla', draw: (G) => `
    ${sparks(14, 26)}
    <path d="M50 30 C34 30 24 40 26 54 C28 70 42 82 50 86 C58 82 72 70 74 54 C76 40 66 30 50 30Z" fill="${G}" filter="url(#soft)"/>
    <path d="M50 30 C34 30 24 40 26 54 C28 70 42 82 50 86 C58 82 72 70 74 54 C76 40 66 30 50 30Z" ${L} stroke-opacity=".3"/>
    <path d="M38 30 l12 6 l12 -6 l-6 -2 l-6 -6 l-6 6 Z M50 22 v-8" ${L}/>
    ${dot(43, 52)}${dot(57, 52)}${smile(50, 60, 7)}
    <circle cx="36" cy="66" r="1" fill="${K}"/><circle cx="64" cy="66" r="1" fill="${K}"/><circle cx="50" cy="74" r="1" fill="${K}"/><circle cx="40" cy="44" r="1" fill="${K}"/><circle cx="62" cy="42" r="1" fill="${K}"/>` },
  sol: { label: 'Sol', draw: (G) => `
    <circle cx="50" cy="50" r="20" fill="${G}" filter="url(#soft)"/>
    <circle cx="50" cy="50" r="20" ${L} stroke-opacity=".25"/>
    <path d="M50 14 v8 M50 78 v8 M14 50 h8 M78 50 h8 M24 24 l6 6 M70 70 l6 6 M24 76 l6 -6 M70 30 l6 -6" ${L}/>
    <rect x="37" y="43" width="11" height="7" rx="3" fill="${K}"/><rect x="52" y="43" width="11" height="7" rx="3" fill="${K}"/><path d="M48 46 h4" ${L} stroke-width="1.8"/>
    ${smile(50, 58, 9)}` },
  corazon: { label: 'Corazón', draw: (G) => `
    ${star(18, 22, 5)}${star(84, 78, 5)}
    <path d="M50 82 C30 68 18 56 20 42 C22 30 38 26 50 40 C62 26 78 30 80 42 C82 56 70 68 50 82Z" fill="${G}" filter="url(#soft)"/>
    <path d="M50 82 C30 68 18 56 20 42 C22 30 38 26 50 40 C62 26 78 30 80 42 C82 56 70 68 50 82Z" ${L} stroke-opacity=".3"/>
    ${dot(41, 50)}<path d="M55 50 q4 -3 8 0" ${L} stroke-width="2"/>${smile(50, 58, 8)}
    <circle cx="36" cy="56" r="3" fill="#F7A8B8" opacity=".8"/><circle cx="64" cy="56" r="3" fill="#F7A8B8" opacity=".8"/>` },
  flor: { label: 'Flor', draw: (G) => `
    <path d="M50 64 C48 76 46 84 44 92 M47 80 q-10 -8 -16 -2 q8 6 16 2" ${L}/>
    <g fill="${G}" filter="url(#soft)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="50" cy="26" rx="11" ry="15" transform="rotate(${r} 50 44)"/>`).join('')}</g>
    <g ${L} stroke-opacity=".3">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="50" cy="26" rx="11" ry="15" transform="rotate(${r} 50 44)"/>`).join('')}</g>
    <circle cx="50" cy="44" r="11" ${W}/>
    ${sleepy(46, 43)}${sleepy(54, 43)}${smile(50, 49, 5)}` },
  torta: { label: 'Torta', draw: (G) => `
    ${sparks(16, 22)}${star(84, 20, 5)}
    <path d="M22 54 h56 v30 h-56 Z" fill="${G}" filter="url(#soft)"/>
    <path d="M22 54 h56 v30 h-56 Z M22 64 q7 6 14 0 q7 6 14 0 q7 6 14 0 q7 6 14 0" ${L}/>
    <path d="M48 54 v-14 h4 v14" ${W}/>
    <path d="M50 36 c-4 -4 -2 -8 0 -12 c2 4 4 8 0 12z" fill="#FFD166" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
    ${sleepy(42, 74)}${sleepy(58, 74)}${smile(50, 79, 5)}` },
};

let artN = 0;
export function groupArtSvg(icon: { icon: string; color: string }, size = 46) {
  const key = GROUP_ARTS[icon.icon] ? icon.icon : 'globo';
  const g = ART_GRADS[icon.color] || ART_GRADS.sunset;
  const id = 'ga' + (++artN);
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" style="flex:none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
    ${GROUP_ARTS[key].draw(`url(#${id})`)}
  </svg>`;
}
export const ART_KEYS = Object.keys(GROUP_ARTS);
export const ART_COLORS = Object.keys(ART_GRADS);
