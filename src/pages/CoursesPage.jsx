import { useState } from 'react';
import CourseForm from '../components/CourseForm';
import CourseCard from '../components/CourseCard';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorBanner from '../components/ErrorBanner';
import Loader from '../components/Loader';

export default function CoursesPage({ api }) {
  const [courses, setCourses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const categories = [...new Set(courses.map((course) => course.category))].sort();
  const visibleCourses = courses.filter((course) => (!category || course.category === category) && (!status || course.status === status));
  function begin() { setBusy(true); setError(''); setSuccess(''); }
  function fail(failure) { if (failure.name !== 'AbortError') setError(failure.message); }
  function upsert(course) {
    setCourses((current) => current.some((item) => item._id === course._id)
      ? current.map((item) => item._id === course._id ? course : item)
      : [course, ...current]);
  }
  async function load() {
    if (busy) return;
    begin();
    try {
      const published = await api.listPublished();
      // L'API ne liste pas les brouillons : conserver seulement ceux connus de cette session.
      setCourses((current) => [...published, ...current.filter((course) => course.status !== 'published' && !published.some((item) => item._id === course._id))]);
      setLoaded(true);
    } catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }
  async function save(values, id) {
    if (busy) return;
    if (Object.values(values).some((value) => !value) || !['beginner', 'intermediate', 'advanced'].includes(values.level)) {
      setSuccess(''); setError('Tous les champs du cours sont obligatoires.'); return;
    }
    begin();
    try {
      const course = await api.save(values, id);
      upsert(course); setEditor(null); setSuccess(id ? 'Cours modifié.' : 'Cours créé en brouillon.');
    } catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }
  async function changePublication(course) {
    if (busy) return;
    begin();
    try {
      const updated = await api.changePublication(course._id, course.status !== 'published');
      upsert(updated); setConfirmation(null);
      setSuccess(updated.status === 'published' ? 'Cours publié.' : 'Cours dépublié.');
    } catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }
  function edit(course) { setError(''); setSuccess(''); setEditor({ course }); }
  return <>
    <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Gérer les cours</h1><p className="muted">Construisez les parcours de demain.</p></div>
      <div className="actions"><button disabled={busy || !!confirmation} onClick={load}>{loaded ? 'Actualiser le catalogue' : 'Charger les cours'}</button>
        <button className="primary" disabled={busy || !!confirmation || !!editor} onClick={() => edit(null)}>+ Nouveau cours</button></div>
    </div>
    <p className="info-banner">Le catalogue fournit uniquement les cours publiés. Les brouillons créés ou dépubliés ici restent visibles pendant cette session ; la liste administrative complète nécessite une évolution du service.</p>
    <ErrorBanner message={error} />{success && <p className="success-banner" role="status">{success}</p>}
    {busy && <Loader />}
    {confirmation && <ConfirmDialog course={confirmation} busy={busy} onCancel={() => setConfirmation(null)} onConfirm={() => changePublication(confirmation)} />}
    {editor && <CourseForm key={editor.course?._id || 'new'} course={editor.course} busy={busy} onSave={save} onCancel={() => { setEditor(null); setError(''); }} />}
    <section aria-label="Catalogue des cours" inert={confirmation ? true : undefined}>
      <div className="filters"><div><label htmlFor="category-filter">Catégorie</label><select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="">Toutes les catégories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
      </select></div><div><label htmlFor="status-filter">Statut</label><select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="">Tous les statuts</option><option value="published">Publié</option><option value="draft">Brouillon</option><option value="archived">Archivé</option>
      </select></div><p className="muted">{visibleCourses.length} cours affiché(s)</p></div>
      {!loaded && courses.length === 0 && !busy && <div className="empty-state"><h2>Votre catalogue, à portée de clic</h2><p>Cliquez sur « Charger les cours » pour consulter les cours publiés.</p></div>}
      {(loaded || courses.length > 0) && visibleCourses.length === 0 && !busy && <div className="empty-state"><h2>Aucun cours à afficher</h2><p>{courses.length ? 'Aucun cours ne correspond à ces filtres.' : 'Le catalogue publié est vide. Vous pouvez créer un cours.'}</p></div>}
      <div className="course-grid">{visibleCourses.map((course) => <CourseCard key={course._id} course={course} busy={busy || !!editor || !!confirmation} onEdit={edit} onPublication={(item) => item.status === 'published' ? setConfirmation(item) : changePublication(item)} />)}</div>
    </section>
  </>;
}
