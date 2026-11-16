export default function Header({ profile, onLogout, label }) {
  return <header className="app-header">
    <a href="#contenu" className="brand"><span className="brand-mark">Y</span>YouLearn</a>
    <span className="workspace-label">{label}</span>
    <div className="account"><span>{profile.fullName}</span><button onClick={onLogout}>Se déconnecter</button></div>
  </header>;
}
