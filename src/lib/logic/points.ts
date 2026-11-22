export const POINTS: Record<string, [number, string]> = {
  iniciativa: [20, 'Tuvo la iniciativa'],
  host: [30, 'Puso la casa'],
  cocina: [25, 'Cocinó'],
  tarjeta: [15, 'Puso la tarjeta'],
  picada: [15, 'Armó la picada'],
  regalo: [25, 'Se encargó del regalito'],
  pago: [5, 'Pagó a tiempo'],
  zumbido: [2, 'Despertó al grupo'],
};

export const LEVELS: [number, string][] = [[0, 'Newbie'], [50, 'Wannabe'], [120, 'Master of the sopas'], [220, 'Rockstar'], [350, 'GOAT']];
export const levelOf = (pts: number) => LEVELS.reduce((i, l, j) => (pts >= l[0] ? j : i), 0);

export const ZSTYLES: [id: string, label: string, icon: string][] = [
  ['clasico', 'Clásico', 'BZZ'], ['corazones', 'Corazones', '♥'], ['estrellas', 'Estrellitas', '★'], ['grillos', 'Grillos', 'cri'],
  ['guinos', 'Guiños', ';)'], ['violencia', 'Recurrir a la violencia', 'pew'],
  ['confeti', 'Confeti', '✦'], ['gatos', 'Lluvia de gatos', '=^.^='], ['ojotazo', 'Ojotazo', 'plaf'],
  ['chancho', 'Chancho bailarín', 'pig'], ['fantasma', '¿Me ghostean?', 'buu'], ['paloma', 'Paloma mensajera', 'cu'],
  ['terremoto', 'Terremoto', '!!!'], ['bocinazo', 'Bocinazo', 'mooc'],
];
/** Estrellitas necesarias para cada zumbido (cada nivel desbloquea algunos). */
export const ZUNLOCK: Record<string, number> = { guinos: 50, violencia: 50, confeti: 120, gatos: 120, ojotazo: 120, chancho: 220, fantasma: 220, paloma: 220, terremoto: 350, bocinazo: 350 };
