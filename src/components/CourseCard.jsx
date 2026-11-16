const statuses = { published: 'Publié', draft: 'Brouillon', archived: 'Archivé' };
const levels = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };
export default function CourseCard({ course, busy, onEdit, onPublication }) {
  return <article className="panel course-card">
    <div className="course-top"><span className="category">{course.category}</span><span className={'badge ' + course.status}>{statuses[course.status]}</span></div>
    <h2>{course.title}</h2><p className="course-description">{course.description}</p>
    <p className="muted">{levels[course.level] || course.level}</p>
    <div className="actions"><button disabled={busy} onClick={() => onEdit(course)}>Modifier</button>
      {course.status !== 'archived' && <button disabled={busy} onClick={() => onPublication(course)}>{course.status === 'published' ? 'Dépublier' : 'Publier'}</button>}
    </div>
  </article>;
}
