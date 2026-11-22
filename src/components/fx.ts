// @ts-nocheck — efectos (zumbidos, confeti, estrellitas) portados del prototipo
import { avatar, type AvatarOpts } from './avatarSvg';
export { };
export const PIG = (sz=96) => `<svg viewBox="0 0 100 100" width="${sz}" height="${sz}" aria-hidden="true"><g fill="#F7A8B8" stroke="#2A1F1D" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M32 82 l-4 12 M45 86 v10 M60 86 v10 M73 82 l4 12" fill="none"/><ellipse cx="54" cy="68" rx="30" ry="20"/><path d="M84 62 c9 -3 9 9 2 7 c-4 -1 -2 -6 2 -5" fill="none"/><path d="M30 30 l-7 -15 l15 7 z M58 30 l7 -15 l-15 7 z"/><circle cx="44" cy="40" r="20"/><ellipse cx="44" cy="47" rx="9" ry="6.5" fill="#F48FA3"/><circle cx="40.5" cy="47" r="1.7" fill="#2A1F1D" stroke="none"/><circle cx="47.5" cy="47" r="1.7" fill="#2A1F1D" stroke="none"/><circle cx="36" cy="35" r="2.2" fill="#2A1F1D" stroke="none"/><circle cx="52" cy="35" r="2.2" fill="#2A1F1D" stroke="none"/><path d="M40 13 L48 2 L54 15 Z" fill="#BCD7EA"/></g></svg>`;
export const WINK = (sz=90) => `<svg viewBox="0 0 100 100" width="${sz}" height="${sz}" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="#FFD166" stroke="#2A1F1D" stroke-width="3"/><circle cx="36" cy="42" r="5" fill="#2A1F1D"/><path d="M56 43 q8 -7 16 0" fill="none" stroke="#2A1F1D" stroke-width="3.5" stroke-linecap="round"/><path d="M30 60 q20 20 40 0" fill="none" stroke="#2A1F1D" stroke-width="3.5" stroke-linecap="round"/><path d="M52 69 q6 10 12 0" fill="#F48FA3" stroke="#2A1F1D" stroke-width="2.4"/></svg>`;
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) { return false; } })();
let AC;
function tone(fn){ try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); fn(AC, AC.currentTime); } catch(e) {} }
export function buzzSound(){ tone((ac, t) => { const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
  o.type = 'square'; o.frequency.value = 140; l.frequency.value = 26; lg.gain.value = 55; l.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .03); g.gain.setValueAtTime(.05, t + .45); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
  o.connect(g); g.connect(ac.destination); o.start(t); l.start(t); o.stop(t + .62); l.stop(t + .62); }); }
export function chime(){ tone((ac, t) => [523, 659, 784, 1047].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t + i*.09); g.gain.exponentialRampToValueAtTime(.06, t + i*.09 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i*.09 + .35);
  o.connect(g); g.connect(ac.destination); o.start(t + i*.09); o.stop(t + i*.09 + .4); })); }
function shape(x, k, s, c){
  const K = '#2A1F1D'; x.fillStyle = c; x.strokeStyle = K; x.lineWidth = 1.5; x.lineJoin = 'round';
  const dot = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
  switch (k){
    case 'rect': x.fillRect(-s/2, -s/4, s, s/2); break;
    case 'circle': dot(0, 0, s/2.4); break;
    case 'squig': x.beginPath(); x.moveTo(-s, 0); x.quadraticCurveTo(-s/2, -s/1.4, 0, 0); x.quadraticCurveTo(s/2, s/1.4, s, 0); x.strokeStyle = c; x.lineWidth = 3; x.lineCap = 'round'; x.stroke(); break;
    case 'star': x.beginPath(); for (let i = 0; i < 10; i++){ const r = i % 2 ? s*.42 : s, a = -Math.PI/2 + i*Math.PI/5; x.lineTo(Math.cos(a)*r, Math.sin(a)*r); } x.closePath(); x.fillStyle = '#FFD166'; x.fill(); x.stroke(); break;
    case 'heart': x.beginPath(); x.moveTo(0, s*.4); x.bezierCurveTo(-s*1.1, -s*.25, -s*.5, -s*1.05, 0, -s*.4); x.bezierCurveTo(s*.5, -s*1.05, s*1.1, -s*.25, 0, s*.4); x.fillStyle = c === '#BCD7EA' || c === '#D7EEA4' ? '#F6B5C6' : c; x.fill(); x.stroke(); break;
    case 'cat': { x.fillStyle = (Math.round(s) % 2) ? '#F4A261' : '#CFC7C0';
      [[-1],[1]].forEach(([d]) => { x.beginPath(); x.moveTo(d*s*.8, -s*.15); x.lineTo(d*s*.6, -s*1.05); x.lineTo(d*s*.12, -s*.62); x.closePath(); x.fill(); x.stroke(); });
      x.beginPath(); x.arc(0, 0, s*.8, 0, 7); x.fill(); x.stroke(); x.fillStyle = K; dot(-s*.3, -s*.08, s*.1); dot(s*.3, -s*.08, s*.1); dot(0, s*.18, s*.07); break; }
    case 'wink': x.fillStyle = '#FFD166'; x.beginPath(); x.arc(0, 0, s*.85, 0, 7); x.fill(); x.stroke(); x.fillStyle = K; dot(-s*.3, -s*.15, s*.11);
      x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(s*.12, -s*.15); x.quadraticCurveTo(s*.3, -s*.32, s*.48, -s*.15); x.stroke();
      x.beginPath(); x.moveTo(-s*.4, s*.2); x.quadraticCurveTo(0, s*.62, s*.4, s*.2); x.stroke(); break;
    case 'pig': x.fillStyle = '#F7A8B8';
      [[-1],[1]].forEach(([d]) => { x.beginPath(); x.moveTo(d*s*.7, -s*.35); x.lineTo(d*s*.85, -s*1.05); x.lineTo(d*s*.2, -s*.75); x.closePath(); x.fill(); x.stroke(); });
      x.beginPath(); x.arc(0, 0, s*.85, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#F48FA3'; x.beginPath(); x.ellipse(0, s*.2, s*.38, s*.27, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = K; dot(-s*.13, s*.2, s*.07); dot(s*.13, s*.2, s*.07); dot(-s*.33, -s*.22, s*.09); dot(s*.33, -s*.22, s*.09); break;
    case 'drop': x.fillStyle = '#7CC4F2'; x.beginPath(); x.moveTo(0, -s); x.bezierCurveTo(s*.7, -s*.1, s*.7, s*.7, 0, s*.7); x.bezierCurveTo(-s*.7, s*.7, -s*.7, -s*.1, 0, -s); x.fill(); x.lineWidth = 1.2; x.stroke(); break;
    case 'dart': x.fillStyle = '#FF8A3D'; x.fillRect(-s, -s*.22, s*1.5, s*.44); x.strokeRect(-s, -s*.22, s*1.5, s*.44); x.fillStyle = '#2A6FDB'; x.beginPath(); x.ellipse(s*.6, 0, s*.32, s*.38, 0, 0, 7); x.fill(); x.stroke(); break;
    case 'ghost': x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(-s*.7, s*.8); x.lineTo(-s*.7, -s*.1); x.bezierCurveTo(-s*.7, -s*1.1, s*.7, -s*1.1, s*.7, -s*.1); x.lineTo(s*.7, s*.8); x.lineTo(s*.35, s*.55); x.lineTo(0, s*.8); x.lineTo(-s*.35, s*.55); x.closePath(); x.fill(); x.stroke(); x.fillStyle = K; dot(-s*.25, -s*.2, s*.1); dot(s*.25, -s*.2, s*.1); break;
    case 'mate': x.fillStyle = '#C98B5B'; x.beginPath(); x.moveTo(-s*.55, -s*.45); x.bezierCurveTo(-s*.95, s*.35, -s*.4, s*.9, 0, s*.9); x.bezierCurveTo(s*.4, s*.9, s*.95, s*.35, s*.55, -s*.45); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#8DBE6A'; x.beginPath(); x.ellipse(0, -s*.45, s*.55, s*.16, 0, 0, 7); x.fill(); x.stroke();
      x.strokeStyle = '#9AA3AD'; x.lineWidth = 2.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(s*.15, -s*.5); x.lineTo(s*.5, -s*1.35); x.stroke(); break;
  }
}
export function particles(kind, o={}){
  if (REDUCE || !kind || kind === 'none') return;
  const c = document.createElement('canvas'); Object.assign(c.style, {position:'fixed', inset:'0', width:'100%', height:'100%', zIndex:'58', pointerEvents:'none'});
  document.body.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; c.width = W*dpr; c.height = H*dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const COLS = ['#E8573A','#F6B5C6','#BCD7EA','#F5BE92','#D7EEA4','#D3C4F6','#FFD166'];
  const burst = kind === 'confeti', shoot = kind === 'violencia', N = o.n || (burst ? 130 : shoot ? 60 : 44);
  const kinds = burst ? ['rect','circle','squig','star','rect','heart'] : shoot ? ['drop','drop','dart'] : kind === 'mix' ? ['star','heart','circle'] : [({corazones:'heart', estrellas:'star', gatos:'cat', guinos:'wink', chancho:'pig', fantasma:'ghost'})[kind] || 'star'];
  const ps = Array.from({length:N}, (_, i) => { const k = kinds[i % kinds.length], col = COLS[i % COLS.length];
    if (shoot) { const left = i % 2 === 0; return {k, x: left ? -20 : W + 20, y: H*.32 + Math.random()*H*.36, vx: (left ? 1 : -1) * (7 + Math.random()*7), vy: -1.5 + Math.random()*3, s: 7 + Math.random()*5, r: left ? 0 : Math.PI, vr: 0, c: col, g: .12, delay: Math.random()*1400}; }
    return burst ? {k, x:W/2 + (Math.random()-.5)*60, y:H*.42, vx:(Math.random()-.5)*15, vy:-Math.random()*15 - 4, s:6 + Math.random()*7, r:Math.random()*6, vr:(Math.random()-.5)*.3, c:col}
                 : {k, x:Math.random()*W, y:-30 - Math.random()*H*.7, vx:(Math.random()-.5)*1.2, vy:2.2 + Math.random()*3, s:(k === 'cat' || k === 'pig' || k === 'wink' || k === 'ghost' ? 15 : 9) + Math.random()*8, r:(Math.random()-.5)*.6, vr:(Math.random()-.5)*.05, c:col, ph:Math.random()*6}; });
  const t0 = performance.now(), dur = o.dur || 2600;
  (function frame(t){ const el = t - t0; x.clearRect(0, 0, W, H);
    ps.forEach(p => { if (p.delay && el < p.delay) return; if (shoot) p.vy += p.g; else if (burst){ p.vy += .38; p.vx *= .985; } else p.x += Math.sin(el/380 + p.ph) * .7;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.globalAlpha = el > dur - 500 ? Math.max(0, (dur - el)/500) : 1; x.translate(p.x, p.y); x.rotate(p.r); shape(x, p.k, p.s, p.c); x.restore(); });
    if (el < dur) requestAnimationFrame(frame); else c.remove(); })(t0);
}
function overlay(html, autoMs){
  document.querySelectorAll('.fx-ov').forEach(o => o.remove());
  const ov = document.createElement('div'); ov.className = 'fx-ov'; ov.setAttribute('data-fx-close',''); ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
  ov.innerHTML = `<div class="fx-card">${html}</div>`; document.body.appendChild(ov);
  const b = ov.querySelector('button'); if (b) b.focus({preventScroll:true});
  if (autoMs) setTimeout(() => ov.remove(), autoMs);
  return ov;
}
const ZIG = flip => `<svg width="22" height="60" viewBox="0 0 22 60" aria-hidden="true" style="transform:scaleX(${flip?-1:1})"><path d="M18 6 L6 14 L18 22 L6 30 L18 38 L6 46 L18 54" fill="none" stroke="var(--tomato)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ZPART = { clasico:'none', confeti:'confeti', corazones:'corazones', estrellas:'estrellas', gatos:'gatos', guinos:'guinos', chancho:'chancho', terremoto:'estrellas',
  violencia:'violencia', ojotazo:'none', grillos:'none', fantasma:'fantasma', bocinazo:'confeti', paloma:'none' };

const INK = '#2A1F1D';
// Pistola de agua de juguete (mirando a la derecha).
export const WATERGUN = (sz = 110, flip = false) => `<svg viewBox="0 0 120 80" width="${sz}" height="${sz * 2 / 3}" aria-hidden="true" style="transform:scaleX(${flip ? -1 : 1})"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
  <path d="M14 34 h70 a10 10 0 0 1 10 10 v2 h12 v8 h-12 v2 a8 8 0 0 1 -8 8 h-30 l-6 12 h-16 l6 -14 h-6 a20 20 0 0 1 -20 -20 z" fill="#7BD389"/>
  <rect x="30" y="14" width="34" height="20" rx="8" fill="#FF8A3D"/><path d="M38 20 h18" stroke="#FFFDF9" stroke-width="2.4"/>
  <path d="M52 62 q2 8 8 10" fill="none"/><circle cx="26" cy="46" r="3.5" fill="#FFD166"/></g>
  <path d="M108 50 q8 -2 12 0" stroke="#7CC4F2" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`;
export const OJOTA = (sz = 90) => `<svg viewBox="0 0 60 100" width="${sz * .6}" height="${sz}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
  <path d="M30 4 C46 4 54 18 52 40 C50 60 54 80 46 92 C40 98 20 98 14 92 C6 80 10 60 8 40 C6 18 14 4 30 4Z" fill="#6EC1E4"/>
  <path d="M12 46 C18 34 24 28 30 24 C36 28 42 34 48 46" fill="none" stroke="#FF5C7A" stroke-width="6"/><circle cx="30" cy="24" r="3" fill="${INK}"/></g></svg>`;
export const GRILLO = (sz = 100) => `<svg viewBox="0 0 100 70" width="${sz}" height="${sz * .7}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
  <path d="M30 22 C22 8 12 6 4 8 M36 20 C34 6 26 2 18 2"/><path d="M40 48 l-10 16 M54 50 l-4 16 M70 46 l14 18 l8 -2"/>
  <ellipse cx="58" cy="38" rx="30" ry="13" fill="#9FD18B"/><circle cx="32" cy="32" r="11" fill="#9FD18B"/><path d="M56 26 C70 22 86 28 90 38" />
  <circle cx="29" cy="30" r="2.2" fill="${INK}"/><path d="M26 37 q3 2 6 0"/></g></svg>`;
export const FANTASMA = (sz = 110) => `<svg viewBox="0 0 100 110" width="${sz}" height="${sz * 1.1}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
  <path d="M18 104 V50 C18 22 34 8 50 8 C66 8 82 22 82 50 V104 L70 94 L60 104 L50 94 L40 104 L30 94 Z" fill="#FFFFFF"/>
  <ellipse cx="40" cy="48" rx="5" ry="7" fill="${INK}"/><ellipse cx="60" cy="48" rx="5" ry="7" fill="${INK}"/><ellipse cx="50" cy="66" rx="6" ry="8" fill="${INK}"/>
  <circle cx="32" cy="58" r="4" fill="#F7A8B8" stroke="none"/><circle cx="68" cy="58" r="4" fill="#F7A8B8" stroke="none"/></g></svg>`;
export const BOCINA = (sz = 110) => `<svg viewBox="0 0 120 80" width="${sz}" height="${sz * 2 / 3}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
  <rect x="6" y="22" width="34" height="50" rx="8" fill="#E8573A"/><rect x="12" y="12" width="22" height="12" rx="3" fill="#FFFDF9"/>
  <path d="M40 40 L60 36 L112 10 V74 L60 52 L40 50 Z" fill="#FFFDF9"/><path d="M60 36 V52"/><path d="M14 40 h18 M14 50 h18" stroke="#FFFDF9" stroke-width="2.4"/></g></svg>`;
export const PALOMA = (sz = 120) => `<svg viewBox="0 0 120 80" width="${sz}" height="${sz * 2 / 3}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
  <path d="M20 46 C30 30 54 26 74 34 L96 30 C92 40 86 46 76 50 C62 60 38 62 20 46Z" fill="#C9CED6"/>
  <path d="M44 38 C50 14 70 6 84 12 C72 22 64 32 60 40" fill="#E3E6EA"/>
  <circle cx="96" cy="30" r="9" fill="#C9CED6"/><path d="M104 30 l8 2 l-8 3" fill="#FFB347"/><circle cx="98" cy="28" r="1.8" fill="${INK}"/>
  <path d="M90 36 C88 40 86 44 88 46" fill="none" stroke="#7DBE8E" stroke-width="3"/>
  <rect x="100" y="38" width="18" height="12" rx="2" fill="#FFFDF9" transform="rotate(12 109 44)"/><path d="M101 40 l8 6 l8 -4" fill="none" transform="rotate(12 109 44)"/></g></svg>`;

// Sonidos: un ruido corto para el "plaf".
function noise(ac, t, dur, from, to, vol){
  const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t); src.stop(t + dur);
}
function beep(ac, t, type, f0, f1, dur, vol){
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .02);
}
const SOUNDS = {
  violencia: () => tone((ac, t) => [0, .22, .44, .7].forEach((d) => beep(ac, t + d, 'square', 1400, 260, .18, .05))),
  ojotazo: () => tone((ac, t) => { noise(ac, t, .5, 400, 2400, .08); noise(ac, t + .55, .18, 900, 200, .35); }),
  grillos: () => tone((ac, t) => [0, .5].forEach((b) => [0, .07, .14, .21].forEach((d) => beep(ac, t + b + d, 'sine', 4300, 4200, .05, .05)))),
  fantasma: () => tone((ac, t) => { const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(520, t + .6); o.frequency.linearRampToValueAtTime(280, t + 1.3);
    l.frequency.value = 6; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .15); g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    o.connect(g); g.connect(ac.destination); o.start(t); l.start(t); o.stop(t + 1.45); l.stop(t + 1.45); }),
  bocinazo: () => tone((ac, t) => { beep(ac, t, 'sawtooth', 233, 228, .9, .06); beep(ac, t, 'sawtooth', 311, 305, .9, .05); }),
  paloma: () => tone((ac, t) => [0, .45].forEach((d) => beep(ac, t + d, 'sine', 330, 240, .35, .09))),
};
const ZEXTRA = {
  chancho: () => `<div class="pigdance">${PIG(110)}</div>`,
  guinos: () => `<div class="winkpop">${WINK(96)}</div>`,
  violencia: () => `<div class="guns"><span class="gun l">${WATERGUN(110)}</span><span class="gun r">${WATERGUN(110, true)}</span></div>`,
  ojotazo: () => `<div class="ojota-lane"><span class="ojota">${OJOTA(80)}</span></div>`,
  grillos: () => `<div class="grillo">${GRILLO(110)}</div>`,
  fantasma: () => `<div class="ghostfloat">${FANTASMA(100)}</div>`,
  bocinazo: () => `<div class="hornpulse">${BOCINA(120)}</div>`,
  paloma: () => `<div class="paloma-lane"><span class="paloma">${PALOMA(120)}</span></div>`,
};
const ZTITLE = { violencia: '¡Recurrimos a la violencia!', ojotazo: '¡OJOTAZO!', grillos: 'cri cri… ¿hola?', fantasma: '¿Me están ghosteando?', bocinazo: '¡MOOOC!', paloma: '¡Llegó una paloma mensajera!' };

/** Ícono chiquito de cada zumbido (para elegirlo en el perfil). */
export function zIcon(k: string, sz = 26){
  const svgs = { chancho: () => PIG(sz), guinos: () => WINK(sz), violencia: () => WATERGUN(sz * 1.3), ojotazo: () => OJOTA(sz), grillos: () => GRILLO(sz * 1.2), fantasma: () => FANTASMA(sz), bocinazo: () => BOCINA(sz * 1.3), paloma: () => PALOMA(sz * 1.3) };
  if (svgs[k]) return svgs[k]();
  const txt = { clasico: 'BZZ', corazones: '♥', estrellas: '★', confeti: '✦', gatos: '=^.^=', terremoto: '!!!' }[k] || '?';
  return `<span class="ico">${txt}</span>`;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fxAv = (av: AvatarOpts, size) => `<span class="avb" style="width:${size}px;height:${size}px">${avatar(av, size, {pfx:'fx' + Math.random().toString(36).slice(2,7)})}</span>`;
document.addEventListener('click', (e) => { const t = e.target.closest?.('[data-fx-close]'); if (t) document.querySelectorAll('.fx-ov').forEach((o) => o.remove()); });

/** Muestra un zumbido: sacude la pantalla, suena y muestra el avatar de quien lo mandó. */
export function playBuzz(o: { av: AvatarOpts; text: string; style: string; msg?: string; sound?: boolean }){
  const hard = o.style === 'terremoto' || o.style === 'bocinazo';
  if (o.sound !== false) (SOUNDS[o.style] || buzzSound)();
  try { navigator.vibrate?.([220, 90, 220, 90, 420]); } catch { /* sin vibración */ }
  const sh = document.querySelector('.shell');
  if (sh && !REDUCE){ sh.classList.remove('shaking','hard'); void sh.offsetWidth; sh.classList.add('shaking'); if (hard) sh.classList.add('hard'); setTimeout(() => sh.classList.remove('shaking','hard'), hard ? 1700 : 1100); }
  particles(ZPART[o.style], {dur:3000});
  const extra = ZEXTRA[o.style] ? ZEXTRA[o.style]() : '';
  const title = ZTITLE[o.style] ? `<div class="bzz small-bzz">${ZTITLE[o.style]}</div>` : '<div class="bzz">¡BZZZ!</div>';
  const ov = overlay(`${title}${extra}<div class="buzz-av">${ZIG(false)}${fxAv(o.av, 116)}${ZIG(true)}</div><p>${o.text}</p>${o.msg ? `<div class="bubble">${esc(o.msg)}</div>` : ''}
    <button class="btn" data-fx-close>Listo</button>`);
  ov.setAttribute('data-fx-close', '');
}

/** Celebración cuando queda definido un plancito. */
export function celebrate(o: { title: string; when: string; sentence: string; avatars: AvatarOpts[]; gcal: string }){
  chime(); particles('confeti', {dur:3400}); setTimeout(() => particles('mix', {n:36, dur:2600}), 500);
  overlay(`<div class="stamp">¡QUEDÓ!</div><span class="eyebrow">${esc(o.title)}</span>
    <div class="big">${esc(o.when)}</div><p>${esc(o.sentence)}</p>
    <div class="row" style="justify-content:center;gap:4px;padding-top:6px">${o.avatars.map((a, i) => `<span class="bounce" style="animation-delay:${i*.13}s">${fxAv(a, 48)}</span>`).join('')}</div>
    <div class="grid2" style="width:100%"><a class="btn ghost" href="${o.gcal}" target="_blank" rel="noopener">Agendar</a><button class="btn tomato" data-fx-close>¡Vamos!</button></div>`);
}

export function starBurst(n: number, label: string){
  const el = document.createElement('div'); el.className = 'starpop'; el.setAttribute('role','status');
  el.innerHTML = `<b>+${n} ★</b><span>${esc(label)}</span>`; document.body.appendChild(el); setTimeout(() => el.remove(), 1900);
  particles('estrellas', {n:16, dur:1600});
}
