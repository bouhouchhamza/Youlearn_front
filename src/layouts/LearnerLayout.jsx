import Header from '../components/Header';
import Footer from '../components/Footer';
import MyCoursesPage from '../pages/MyCoursesPage';
export default function LearnerLayout({ profile, onLogout }) {
  return <div className="app-shell"><Header profile={profile} onLogout={onLogout} label="Espace apprenant" />
    <main id="contenu" className="main-content learner-content">
      <section className="welcome"><p className="eyebrow">MON ESPACE</p><h1>Bienvenue, {profile.fullName}.</h1>
        <p>Chaque étape compte. Retrouvez ici votre espace de formation.</p></section>
      <MyCoursesPage />
    </main><Footer /></div>;
}
