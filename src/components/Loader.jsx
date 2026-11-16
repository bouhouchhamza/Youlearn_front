export default function Loader({ label = 'Chargement en cours…' }) {
  return <p className="loader" role="status"><span aria-hidden="true" />{label}</p>;
}
