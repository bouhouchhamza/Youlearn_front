import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoursesPage from '../pages/CoursesPage';
import UsersPage from '../pages/UsersPage';

export default function AdminLayout({ profile, onLogout, coursesApi }) {
  const [page, setPage] = useState('courses');
  return <div className="app-shell">
    <Header profile={profile} onLogout={onLogout} label="Administration" />
    <div className="workspace">
      <aside className="sidebar"><p className="eyebrow">ESPACE ADMIN</p><nav aria-label="Administration">
        <button aria-current={page === 'courses' ? 'page' : undefined} onClick={() => setPage('courses')}>Cours</button>
        <button aria-current={page === 'users' ? 'page' : undefined} onClick={() => setPage('users')}>Utilisateurs</button>
      </nav><p className="sidebar-note">Accompagnez chaque parcours d’apprentissage.</p></aside>
      <main id="contenu" className="main-content">
        <div hidden={page !== 'courses'}><CoursesPage api={coursesApi} /></div>
        <div hidden={page !== 'users'}><UsersPage /></div>
      </main>
    </div><Footer />
  </div>;
}
