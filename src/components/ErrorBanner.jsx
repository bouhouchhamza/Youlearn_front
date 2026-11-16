export default function ErrorBanner({ message }) {
  return message ? <p className="error-banner" role="alert">{message}</p> : null;
}
