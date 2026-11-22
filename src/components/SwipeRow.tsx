import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fila que se desliza de costado, con señales claras de que hay más:
 * bordes que se desvanecen, flechas para avanzar y un aviso "Deslizá para ver más".
 */
export default function SwipeRow({ children, className = '', resetKey }: { children: ReactNode; className?: string; resetKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [touched, setTouched] = useState(false);

  const update = () => {
    const el = ref.current; if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => { const el = ref.current; if (el) el.scrollLeft = 0; setTouched(false); update(); }, [resetKey]);
  useEffect(() => { update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); });
  const go = (dir: number) => { const el = ref.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' }); setTouched(true); };

  return <div className={`swipe ${edges.left ? 'has-left' : ''} ${edges.right ? 'has-right' : ''}`}>
    <div ref={ref} className={className} onScroll={update} onTouchStart={() => setTouched(true)} onPointerDown={() => setTouched(true)} onWheel={() => setTouched(true)}>{children}</div>
    {edges.left && <button type="button" className="swipe-btn l" aria-label="Ver anteriores" onClick={() => go(-1)}>‹</button>}
    {edges.right && <button type="button" className="swipe-btn r" aria-label="Ver más opciones" onClick={() => go(1)}>›</button>}
    {edges.right && !touched && <p className="swipe-hint">Deslizá para ver más ›</p>}
  </div>;
}
