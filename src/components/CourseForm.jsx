import { useState } from 'react';
export default function CourseForm({ course, onSave, onCancel, busy }) {
  const [values, setValues] = useState({
    title: course?.title || '', description: course?.description || '',
    category: course?.category || '', level: course?.level || 'beginner',
  });
  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])), course?._id);
  }
  return <section className="panel form-panel" aria-labelledby="course-form-title">
    <h2 id="course-form-title">{course ? 'Modifier le cours' : 'Nouveau cours'}</h2>
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        <label htmlFor="course-title">Titre</label><input id="course-title" name="title" required pattern=".*\S.*" value={values.title} onChange={change} />
        <label htmlFor="course-description">Description</label><textarea id="course-description" name="description" required value={values.description} onChange={change} rows={4} />
        <div className="form-grid"><div><label htmlFor="course-category">Catégorie</label><input id="course-category" name="category" required pattern=".*\S.*" value={values.category} onChange={change} /></div>
          <div><label htmlFor="course-level">Niveau</label><select id="course-level" name="level" value={values.level} onChange={change}>
            <option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option>
          </select></div></div>
        <div className="actions"><button type="submit" className="primary">{busy ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" onClick={onCancel}>Annuler</button></div>
      </fieldset>
    </form>
  </section>;
}
