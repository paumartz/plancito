import { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store';
import { api } from './data';
import { I } from './components/ui';
import ProposeSheet from './components/ProposeSheet';
import Login from './pages/Login';
import Home from './pages/Home';
import Groups from './pages/Groups';
import GroupPage from './pages/GroupPage';
import PlanPage from './pages/PlanPage';
import Profile from './pages/Profile';
import Join from './pages/Join';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const { ready, userId } = useStore();
  const loc = useLocation();
  const [propose, setPropose] = useState<string | null | undefined>(undefined);

  // El link de "olvidé mi contraseña" abre esta pantalla, haya sesión o no.
  if (loc.pathname === '/nueva-clave') return <ResetPassword />;
  if (!ready) return <div className="center-page"><p className="muted">Cargando…</p></div>;
  if (!userId) {
    // Guardamos adónde quería ir (por ejemplo un link de invitación) para volver después del login.
    if (loc.pathname !== '/') try { sessionStorage.setItem('plancito-after-login', loc.pathname); } catch { /* */ }
    return <Login />;
  }
  let after: string | null = null;
  try { after = sessionStorage.getItem('plancito-after-login'); if (after) sessionStorage.removeItem('plancito-after-login'); } catch { /* */ }
  if (after && after !== loc.pathname) return <Navigate to={after} replace />;

  return (
    <div className="shell">
      {api.mode === 'local' && <div className="banner-local">Modo local: los datos quedan solo en este navegador.</div>}
      <main>
        <Routes>
          <Route path="/" element={<Home onPropose={(g) => setPropose(g ?? null)} />} />
          <Route path="/grupos" element={<Groups />} />
          <Route path="/g/:id" element={<GroupPage onPropose={(g) => setPropose(g)} />} />
          <Route path="/p/:id" element={<PlanPage />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/i/:code" element={<Join />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <nav className="bar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'on' : '')}>{I.home}Inicio</NavLink>
        <NavLink to="/grupos" className={({ isActive }) => (isActive || loc.pathname.startsWith('/g/') || loc.pathname.startsWith('/p/') ? 'on' : '')}>{I.groups}Grupos</NavLink>
        <button onClick={() => setPropose(null)} aria-label="Proponer plancito"><span className="plus">{I.plus}</span></button>
        <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'on' : '')}>{I.me}Perfil</NavLink>
      </nav>
      {propose !== undefined && <ProposeSheet groupId={propose} onClose={() => setPropose(undefined)} />}
    </div>
  );
}
