import ErrorBanner from './ErrorBanner';
export default function ProtectedView({ profile, role, children }) {
  if (!profile?.status || profile.role !== role) return <ErrorBanner message="Accès refusé." />;
  return children;
}
