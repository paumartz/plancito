import { describe, expect, it } from 'vitest';
import { settle } from './split';
import { closeCuando, closeDonde, planSentence, slotId, upcomingDaysFixed } from './testutils';

describe('settle', () => {
  it('solo pagan los involucrados y simplifica deudas', () => {
    const debts = settle([
      { id: '1', description: 'Súper', amount: 42000, paidBy: 'juli', involved: ['lola', 'juli', 'sofi'] },
      { id: '2', description: 'Vino', amount: 18000, paidBy: 'sofi', involved: ['lola', 'juli', 'sofi'] },
      { id: '3', description: 'Helado', amount: 9000, paidBy: 'lola', involved: ['lola', 'juli', 'sofi'] },
    ]);
    expect(debts).toEqual([
      { from: 'lola', to: 'juli', amount: 14000 },
      { from: 'sofi', to: 'juli', amount: 5000 },
    ]);
  });
  it('quien no está involucrado no debe nada', () => {
    const debts = settle([{ id: '1', description: 'Vino', amount: 10000, paidBy: 'a', involved: ['a', 'b'] }]);
    expect(debts).toEqual([{ from: 'b', to: 'a', amount: 5000 }]);
  });
});

describe('votación', () => {
  const days = upcomingDaysFixed;
  it('gana el horario donde pueden más', () => {
    const r = closeCuando({
      a: { slots: [slotId(days[0].id, 'noche'), slotId(days[1].id, 'noche')] },
      b: { slots: [slotId(days[1].id, 'noche')] },
      c: { slots: [slotId(days[1].id, 'noche'), slotId(days[2].id, 'tarde')] },
    }, days);
    expect(r.dia!.id).toBe(days[1].id);
    expect(r.momento!.id).toBe('noche');
  });
  it('si nadie elige menú, se improvisa; casa necesita alguien que se ofrezca', () => {
    const base = closeCuando({ a: { slots: [slotId(days[0].id, 'noche')] } }, days);
    const a = closeDonde({
      likes: ['cena'], spots: [], answers: base, nick: (id) => id.toUpperCase(),
      ballots: { a: { plan: ['cena'], lugar: ['casa'], host: false, menu: [], cocina: [], hora: ['21:00'] }, b: { plan: ['cena'], lugar: ['afuera'], menu: [], hora: ['21:00'] } },
    });
    expect(a.lugar!.id).toBe('afuera');
    expect(a.menu!.id).toBe('impro');
    expect(planSentence(a)).toContain('a las 21:00 en un resto o bar a cenar. Menú: improvisamos.');
  });
  it('arma la frase con anfitrión y lo que cocinan', () => {
    const base = closeCuando({ a: { slots: [slotId(days[1].id, 'noche')] } }, days);
    const a = closeDonde({
      likes: ['cena'], spots: [], answers: base, nick: (id) => ({ tomi: 'Tomi' } as Record<string, string>)[id] || id,
      ballots: { tomi: { plan: ['cena'], lugar: ['casa'], host: true, menu: ['cocinamos'], cocina: ['pastas'], hora: ['21:00'] } },
    });
    expect(planSentence(a)).toBe(`Nos juntamos ${days[1].phrase} a las 21:00 en lo de Tomi a cenar. Cocinamos pastas caseras.`);
  });
});
