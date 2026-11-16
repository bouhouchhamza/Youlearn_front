import { useState } from 'react';
import ErrorBanner from '../components/ErrorBanner';

export default function LoginPage({ onLogin, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    if (!email.trim() || !password.trim()) { setError('Tous les champs sont obligatoires.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Adresse email invalide.'); return; }
    setLoading(true); setError('');
    try { await onLogin({ email: email.trim(), password }); }
    catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }
  return <main className="login-layout">
    <section className="login-intro">
      <a className="brand" href="#connexion" aria-label="YouLearn, connexion"><span className="brand-mark">Y</span>YouLearn</a>
      <div><p className="eyebrow">VOTRE ESPACE DE FORMATION</p>
        <h1>Un nouvel élan<br />pour apprendre.</h1>
        <p>Retrouvez votre parcours, développez vos compétences et avancez à votre rythme.</p>
      </div>
      <p className="intro-note">Apprendre aujourd’hui. Aller plus loin demain.</p>
    </section>
    <section className="login-content" id="connexion">
      <div className="login-card"><p className="eyebrow">BIENVENUE SUR YOULEARN</p>
        <h2>Connectez-vous</h2><p className="muted">Accédez à votre espace personnel.</p>
        <ErrorBanner message={error || notice} />
        <form onSubmit={handleSubmit} aria-busy={loading}>
          <fieldset disabled={loading}>
            <label htmlFor="email">Adresse email</label>
            <input type="email" id="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="submit" className="primary full-width">{loading ? 'Connexion en cours…' : 'Se connecter →'}</button>
          </fieldset>
        </form>
        <p className="login-help">Utilisez les identifiants fournis par votre établissement.</p>
      </div>
    </section>
  </main>;
}
