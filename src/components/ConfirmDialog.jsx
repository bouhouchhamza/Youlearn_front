export default function ConfirmDialog({ course, busy, onConfirm, onCancel }) {
  return <dialog open className="confirmation" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="confirm-title">Dépublier ce cours ?</h2>
    <p id="confirm-description">« {course.title} » sera retiré du catalogue et redeviendra un brouillon.</p>
    <div className="actions"><button disabled={busy} onClick={onCancel} autoFocus>Annuler</button><button className="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Dépublication…' : 'Confirmer la dépublication'}</button></div>
  </dialog>;
}
