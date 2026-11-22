// Ítems de la lista de deseos: texto y, opcional, un link ("Auriculares||https://...").
export const wishJoin = (title: string, url: string) => (url ? `${title}||${/^https?:\/\//i.test(url) ? url : 'https://' + url}` : title);
export const wishTitle = (w: string) => w.split('||')[0];
export const wishUrl = (w: string) => w.split('||')[1] || null;
