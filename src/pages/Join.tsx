import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../data';
import { useStore } from '../store';
import { TopBar } from '../components/ui';

export default function Join() {
  const { code } = useParams();
  const { groups, reload, toast } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const planId = params.get('p');
  const [preview, setPreview] = useState<{ id: string; name: string; members: number } | null | undefined>(undefined);

  useEffect(() => { api.groupPreview(code!).then(setPreview).catch(() => setPreview(null)); }, [code]);
  const already = preview && groups.some((g) => g.id === preview.id);
  // Si ya es parte y el link venía de un plancito, va directo al plancito.
  useEffect(() => { if (already && planId) nav(`/p/${planId}`, { replace: true }); }, [already, planId, nav]);

  async function join() {
    try { const id = await api.joinGroup(code!); await reload(); toast('¡Te sumaste al grupo!'); nav(planId ? `/p/${planId}` : `/g/${id}`, { replace: true }); }
    catch (e) { toast((e as Error).message); }
  }

  return <>
    <TopBar title="Invitación" back="/" />
    {preview === undefined ? <p className="muted">Buscando el grupo…</p>
      : preview === null ? <div className="empty">Este link de invitación no existe o ya no funciona. Pedile a alguien del grupo que te lo vuelva a mandar.</div>
      : <div className="sticker bg-peach">
          <span className="eyebrow" style={{ color: 'inherit' }}>Te invitaron a</span>
          <h2 style={{ fontSize: 26 }}>{preview.name}</h2>
          <p className="small muted">{preview.members} {preview.members === 1 ? 'integrante' : 'integrantes'}</p>
          {already ? <button className="btn" onClick={() => nav(`/g/${preview.id}`)}>Ya sos parte: ir al grupo</button> : <button className="btn" onClick={join}>Sumarme</button>}
        </div>}
  </>;
}
