// @ts-nocheck — dibujo del avatar portado tal cual del prototipo (prototype/index.html)
export interface AvatarOpts { pelo: string; colorPelo: string; cara: string; lentes: string; acc: string; mascota?: string; color: string }
export const AV_OPTS = {
  pelo:[['melena','Melena'],['rulos','Rulos'],['rulosLargos','Rulos largos'],['corto','Corto'],['rodetes','Rodetes'],['afro','Afro'],['largo','Largo'],['pelado','Pelado']],
  colorPelo:[['ink','Negro'],['castano','Castaño'],['rubio','Rubio'],['linea','Solo línea']],
  cara:[['feliz','Feliz'],['sonrisa','Sonrisa'],['guino','Guiño'],['sorpresa','Sorpresa'],['meh','Meh'],['dormido','Fiaca']],
  lentes:[['no','Sin lentes'],['redondos','Redondos'],['cuadrados','Cuadrados'],['sol','De sol']],
  acc:[['nada','Nada'],['flor','Flor'],['gorrito','Gorrito'],['gorra','Gorra'],['auris','Auris'],['aro','Aro'],['bigote','Bigote'],['mate','Mate'],['camara','Cámara']],
  mascota:[['nada','Ninguna'],['planta','Planta'],['gato','Gato'],['perro','Perro']],
  color:[['sunset','Atardecer'],['mint','Menta'],['berry','Frutilla'],['sky','Cielo'],['citrus','Limón']],
};
export const AV_TABS = [['pelo','Pelo'],['colorPelo','Color de pelo'],['cara','Expresión'],['lentes','Lentes'],['acc','Accesorio'],['mascota','Mascota'],['color','Remera']];
export const TEMPLATES: AvatarOpts[] = [
  {pelo:'melena',colorPelo:'castano',cara:'feliz',lentes:'redondos',acc:'flor',color:'sunset'},
  {pelo:'rulos',colorPelo:'ink',cara:'meh',lentes:'no',acc:'nada',color:'sunset'},
  {pelo:'corto',colorPelo:'linea',cara:'sonrisa',lentes:'no',acc:'gorrito',color:'sky'},
  {pelo:'afro',colorPelo:'ink',cara:'sorpresa',lentes:'no',acc:'aro',color:'berry'},
  {pelo:'rodetes',colorPelo:'ink',cara:'guino',lentes:'cuadrados',acc:'nada',color:'mint'},
  {pelo:'largo',colorPelo:'rubio',cara:'dormido',lentes:'no',acc:'auris',color:'citrus',mascota:'planta'},
  {pelo:'pelado',colorPelo:'ink',cara:'sonrisa',lentes:'sol',acc:'bigote',color:'mint'},
  {pelo:'corto',colorPelo:'ink',cara:'feliz',lentes:'no',acc:'gorra',color:'sky'},
];
const GRADS = { sunset:['#FF8A5B','#F7A8C4','#B79CFF'], mint:['#B6E89C','#FBE38A','#A6CFF0'], berry:['#F26D7D','#F7B7C8','#FFD3A5'], sky:['#94C3F0','#C9B8F5','#F7C5DA'], citrus:['#FFD166','#FFB38A','#C3EC9C'] };
const HAIR = { ink:'#241B19', castano:'#6B3F2A', rubio:'#E2B256', linea:'#FFFDF9' };
let avN = 0;
export function avatar(a, size=48, o={}){
  const id = (o.pfx || 'av') + (++avN), g = GRADS[a.color] || GRADS.sunset, hc = HAIR[a.colorPelo] || HAIR.ink, K = '#2A1F1D';
  const hs = `fill="${hc}" stroke="${K}" stroke-width="2" stroke-linejoin="round"`;
  const L = `fill="none" stroke="${K}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"`;
  const fringe = `<path d="M31 45 C33 31 44 26 52 27 C61 27 69 34 69 45 C62 40 56 35 50 35 C46 39 38 43 31 45Z" ${hs}/>`;
  const short = `<path d="M30 47 C27 30 40 23 51 24 C63 24 73 32 70 47 C67 39 61 34 54 33 C47 36 38 40 30 47Z" ${hs}/>`;
  let back = '', front = '';
  switch (a.pelo){
    case 'melena': back = `<path d="M28 48 C26 30 38 22 50 22 C63 22 74 30 72 48 L73 64 C66 66 62 62 62 58 L38 58 C38 62 34 66 27 64 Z" ${hs}/>`; front = fringe; break;
    case 'largo': back = `<path d="M28 46 C26 28 40 21 50 21 C62 21 75 28 72 46 L76 80 C66 84 34 84 24 80 Z" ${hs}/>`; front = fringe; break;
    case 'corto': front = short; break;
    case 'rodetes': back = `<circle cx="33" cy="27" r="7" ${hs}/><circle cx="67" cy="27" r="7" ${hs}/>`; front = short; break;
    case 'afro': back = `<path d="M25 54 C16 46 19 31 28 28 C28 17 42 12 50 16 C58 11 72 16 72 27 C82 30 85 46 75 54 Z" ${hs}/>`; break;
    case 'rulosLargos':
      back = [[29,42],[26,52],[26,62],[28,72],[33,80],[38,86],[71,42],[74,52],[74,62],[72,72],[67,80],[62,86],[34,31],[66,31],[50,23],[42,25],[58,25]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="7.6" ${hs}/>`).join('')
        + [[27,57],[73,57],[30,76],[70,76]].map(([x,y]) => `<path d="M${x-2} ${y} a2.4 2.4 0 1 1 3.2 1.6" ${L} stroke-width="1.4"/>`).join('');
      front = [[35,35],[41,28],[50,25],[59,28],[65,35],[45,32],[55,32]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6" ${hs}/><path d="M${x-2} ${y} a2.2 2.2 0 1 1 3 1.4" ${L} stroke-width="1.4"/>`).join(''); break;
    case 'rulos': front = [[33,36],[38,28],[46,24],[55,24],[63,28],[68,36],[42,33],[51,31],[59,33]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6.2" ${hs}/><path d="M${x-2} ${y} a2.2 2.2 0 1 1 3 1.4" ${L} stroke-width="1.4"/>`).join(''); break;
    case 'pelado': front = `<path d="M46 29 q2 -4 4 0 M50 28 q2 -4 4 0" ${L} stroke-width="1.7"/>`; break;
  }
  const faces = {
    feliz:`<path d="M40 47 q3.2 3 6.4 0 M53.6 47 q3.2 3 6.4 0" ${L}/><path d="M45 55.5 q5 4.2 10 0" ${L}/>`,
    sonrisa:`<circle cx="43" cy="47" r="1.9" fill="${K}"/><circle cx="57" cy="47" r="1.9" fill="${K}"/><path d="M45 55 q5 4.5 10 0" ${L}/>`,
    guino:`<circle cx="43" cy="47" r="1.9" fill="${K}"/><path d="M54 47.5 q3 -2.6 6 0" ${L}/><path d="M45 55 q5 4.5 10 0" ${L}/>`,
    sorpresa:`<circle cx="43" cy="47" r="1.9" fill="${K}"/><circle cx="57" cy="47" r="1.9" fill="${K}"/><ellipse cx="50" cy="57" rx="2.4" ry="3" ${L}/>`,
    meh:`<circle cx="43" cy="47" r="1.9" fill="${K}"/><circle cx="57" cy="47" r="1.9" fill="${K}"/><path d="M46 57 h8" ${L}/>`,
    dormido:`<path d="M40 47.5 q3.2 2.6 6.4 0 M53.6 47.5 q3.2 2.6 6.4 0 M41 49 l-1.4 1.6 M43.2 50 l-.4 2 M56.8 50 l.4 2 M59 49 l1.4 1.6" ${L} stroke-width="1.6"/><path d="M47 56 q3 2 6 0" ${L}/>`,
  };
  const glasses = {
    no:'',
    redondos:`<circle cx="43" cy="47.5" r="5.6" ${L} stroke-width="1.8"/><circle cx="57" cy="47.5" r="5.6" ${L} stroke-width="1.8"/><path d="M48.6 47 q1.4 -1.2 2.8 0" ${L} stroke-width="1.8"/>`,
    cuadrados:`<rect x="37" y="43" width="11.5" height="9" rx="2.2" ${L} stroke-width="1.8"/><rect x="51.5" y="43" width="11.5" height="9" rx="2.2" ${L} stroke-width="1.8"/><path d="M48.5 46.5 h3" ${L} stroke-width="1.8"/>`,
    sol:`<rect x="36.5" y="43" width="12" height="8.5" rx="3.5" fill="${K}"/><rect x="51.5" y="43" width="12" height="8.5" rx="3.5" fill="${K}"/><path d="M48.5 46 h3" ${L} stroke-width="1.8"/>`,
  };
  const accs = {
    nada:'',
    flor:`<g transform="translate(68 31)">${[0,72,144,216,288].map(r => `<ellipse cx="0" cy="-5" rx="3.6" ry="5" transform="rotate(${r})" fill="#F6B5C6" stroke="${K}" stroke-width="1.5"/>`).join('')}<circle r="2.6" fill="#FFD166" stroke="${K}" stroke-width="1.4"/></g>`,
    gorrito:`<path d="M30 37 C33 21 55 14 71 21 C79 25 84 33 87 43 L71 34 C59 29 43 30 30 37Z" fill="#BCD7EA" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M29 38 C42 31 58 30 71 35" ${L} stroke-width="3.2"/><circle cx="87.5" cy="45" r="4.2" fill="#FFFDF9" stroke="${K}" stroke-width="1.8"/>`,
    gorra:`<path d="M30 41 C30 27 41 22 50 22 C60 22 70 28 70 41 Z" fill="#E8573A" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M64 40 C72 39 81 40 85 44 C78 45 70 44 64 43Z" fill="#E8573A" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`,
    auris:`<path d="M28 49 C27 22 73 22 72 49" ${L} stroke-width="3"/><rect x="23" y="44" width="9" height="13" rx="4" fill="#D3C4F6" stroke="${K}" stroke-width="1.8"/><rect x="68" y="44" width="9" height="13" rx="4" fill="#D3C4F6" stroke="${K}" stroke-width="1.8"/>`,
    aro:`<circle cx="30.5" cy="57" r="2.6" fill="none" stroke="#D99A2B" stroke-width="2"/>`,
    mate:`<g transform="translate(22 88)"><path d="M5 -13 L10 -26" stroke="#9AA3AD" stroke-width="2.4" stroke-linecap="round"/><path d="M-6.5 -12 C-10 -3 -7 7 0 8.5 C7 7 10 -3 6.5 -12 Z" fill="#C98B5B" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="0" cy="-12" rx="6.5" ry="2.2" fill="#8DBE6A" stroke="${K}" stroke-width="1.6"/><circle cx="8.5" cy="1" r="3.8" fill="#FFFDF9" stroke="${K}" stroke-width="1.6"/></g>`,
    camara:`<g><circle cx="31" cy="56" r="4.2" fill="#FFFDF9" stroke="${K}" stroke-width="1.8"/><circle cx="69" cy="56" r="4.2" fill="#FFFDF9" stroke="${K}" stroke-width="1.8"/><rect x="37" y="35.5" width="8" height="5" rx="1.2" fill="#BCD7EA" stroke="${K}" stroke-width="1.8"/><rect x="32" y="39" width="36" height="19" rx="4" fill="#BCD7EA" stroke="${K}" stroke-width="2"/><circle cx="51" cy="48.5" r="7.2" fill="#FFFDF9" stroke="${K}" stroke-width="2"/><circle cx="51" cy="48.5" r="3.8" fill="${K}"/><circle cx="52.4" cy="47.1" r="1.1" fill="#FFFDF9"/><circle cx="62.5" cy="43" r="1.5" fill="#E8573A"/></g>`,
    bigote:`<path d="M42 53.5 C46 50.5 49 52.5 50 53.5 C51 52.5 54 50.5 58 53.5 C54 55.6 52 54.8 50 54.8 C48 54.8 46 55.6 42 53.5Z" fill="${K}"/>`,
  };
  const pets = {
    nada:'',
    gato:`<g transform="translate(81 84)"><path d="M9 13 C17 10 18 1 12 -2" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="0" cy="8" rx="10" ry="8" fill="#F4A261" stroke="${K}" stroke-width="2"/><path d="M-7.5 -5 L-7 -15 L-1.5 -9 Z M7.5 -5 L7 -15 L1.5 -9 Z" fill="#F4A261" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="0" cy="-3" r="8" fill="#F4A261" stroke="${K}" stroke-width="2"/><circle cx="-3" cy="-4" r="1.2" fill="${K}"/><circle cx="3" cy="-4" r="1.2" fill="${K}"/><path d="M-1.5 -1 q1.5 1.5 3 0 M-6 -1 h-6 M6 -1 h6" fill="none" stroke="${K}" stroke-width="1.1" stroke-linecap="round"/></g>`,
    perro:`<g transform="translate(81 84)"><ellipse cx="0" cy="9" rx="10" ry="8" fill="#E8C9A0" stroke="${K}" stroke-width="2"/><circle cx="0" cy="-3" r="8.5" fill="#E8C9A0" stroke="${K}" stroke-width="2"/><ellipse cx="-8" cy="-2" rx="3.2" ry="6.2" transform="rotate(18 -8 -2)" fill="#8B5A3C" stroke="${K}" stroke-width="1.6"/><ellipse cx="8" cy="-2" rx="3.2" ry="6.2" transform="rotate(-18 8 -2)" fill="#8B5A3C" stroke="${K}" stroke-width="1.6"/><circle cx="-3" cy="-5" r="1.2" fill="${K}"/><circle cx="3" cy="-5" r="1.2" fill="${K}"/><ellipse cx="0" cy="0" rx="3.8" ry="2.7" fill="#FFFDF9" stroke="${K}" stroke-width="1.3"/><circle cx="0" cy="-.9" r="1.3" fill="${K}"/><path d="M0 2.4 v2.6" stroke="#E86A7A" stroke-width="2.2" stroke-linecap="round"/></g>`,
    planta:`<g transform="translate(83 86)"><path d="M0 0 C-10 -4 -12 -14 -6 -18 C-4 -10 -2 -6 0 0 C2 -8 4 -16 10 -16 C12 -8 6 -3 0 0 C-2 -7 -1 -13 0 -21 C2 -13 1 -6 0 0" fill="#9FD18B" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-8 0 h16 l-2 13 h-12 Z" fill="#E8573A" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/></g>`,
  };
  const crown = o.crown ? `<path d="M37 27 L39 15 L45 21 L50 12 L55 21 L61 15 L63 27 Z" fill="#FFD166" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>` : '';
  return `<svg class="av" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>
    <filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>
    ${back}
    <path d="M22 101 C22 83 35 74 50 74 C65 74 78 83 78 101 Z" fill="url(#${id})" filter="url(#${id}f)"/>
    <path d="M45 65 L45 75 M55 65 L55 75" ${L}/>
    <circle cx="30.5" cy="50" r="3.6" fill="#FFFDF9" stroke="${K}" stroke-width="2"/><circle cx="69.5" cy="50" r="3.6" fill="#FFFDF9" stroke="${K}" stroke-width="2"/>
    <circle cx="50" cy="48" r="20" fill="#FFFDF9" stroke="${K}" stroke-width="2.2"/>
    <circle cx="38.5" cy="54" r="3.2" fill="#F7A8B8" opacity=".75"/><circle cx="61.5" cy="54" r="3.2" fill="#F7A8B8" opacity=".75"/>
    ${faces[a.cara] || faces.sonrisa}${front}${glasses[a.lentes] || ''}${accs[a.acc] || ''}${crown}${pets[a.mascota] || ''}
  </svg>`;
}
export const defaultAvatar = (): AvatarOpts => ({ ...TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)] });
