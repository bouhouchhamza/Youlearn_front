import UnavailableFeature from '../components/UnavailableFeature';
export default function MyCoursesPage() {
  return <section><h2>Mes cours</h2>
    <UnavailableFeature title="Vos inscriptions ne sont pas encore consultables">
      <p>Le service ne permet pas encore de récupérer les cours auxquels votre compte est inscrit.</p>
      <p>Nous ne pouvons donc pas déterminer si vous avez des inscriptions.</p>
    </UnavailableFeature>
  </section>;
}
