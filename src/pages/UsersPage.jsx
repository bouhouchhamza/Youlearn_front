import UnavailableFeature from '../components/UnavailableFeature';
export default function UsersPage() {
  return <><div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Utilisateurs</h1></div></div>
    <UnavailableFeature title="Gestion des utilisateurs indisponible">
      <p>Le service ne permet pas encore de consulter, créer ou modifier les utilisateurs depuis l’administration.</p>
      <p>Aucune liste d’utilisateurs n’a été chargée.</p>
    </UnavailableFeature></>;
}
