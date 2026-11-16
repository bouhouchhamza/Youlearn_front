export default function UnavailableFeature({ title, children }) {
  return <section className="panel unavailable" aria-label={title}>
    <span className="badge">En attente du backend</span><h2>{title}</h2>
    {children}<p className="muted">Cette fonctionnalité sera disponible lorsque le contrat API correspondant sera fourni.</p>
  </section>;
}
