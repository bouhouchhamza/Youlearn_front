import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import LearnerLayout from './layouts/LearnerLayout';
import ProtectedView from './components/ProtectedView';
import ErrorBanner from './components/ErrorBanner';
import { authApi, createCoursesApi } from './services/api';

export default function App() {
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState('');
  async function login(credentials) {
    const token = await authApi.login(credentials);
    const profile = await authApi.profile(token);
    setNotice('');
    setSession({ token, profile, controller: new AbortController() });
  }
  function logout() {
    session?.controller.abort();
    setSession(null);
    setNotice('');
  }
  function expireSession() {
    session.controller.abort();
    setSession((current) => current === session ? null : current);
    setNotice('Session expirée ou invalide. Reconnectez-vous.');
  }
  if (!session) return <LoginPage onLogin={login} notice={notice} />;
  const coursesApi = createCoursesApi({
    token: session.token, signal: session.controller.signal, onUnauthorized: expireSession,
  });
  if (session.profile.role === 'admin') {
    return <ProtectedView profile={session.profile} role="admin">
      <AdminLayout profile={session.profile} onLogout={logout} coursesApi={coursesApi} />
    </ProtectedView>;
  }
  if (session.profile.role === 'learner') {
    return <ProtectedView profile={session.profile} role="learner">
      <LearnerLayout profile={session.profile} onLogout={logout} />
    </ProtectedView>;
  }
  return <main className="panel unsupported"><h1>Bienvenue {session.profile.fullName}</h1>
    <ErrorBanner message="L’espace formateur ne fait pas partie de ce brief. Aucun accès administrateur n’est accordé." />
    <button onClick={logout}>Se déconnecter</button>
  </main>;
}
