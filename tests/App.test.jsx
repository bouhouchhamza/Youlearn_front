import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

const course = { _id: 'course-1', title: 'React', description: 'Les bases', category: 'Web', level: 'beginner', status: 'published' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

async function login(role = 'admin') {
  const fetch = vi.fn().mockResolvedValueOnce(json({ token: 'test-token' }))
    .mockResolvedValueOnce(json({ fullName: 'Compte test', email: 'test@example.invalid', role, status: true }));
  vi.stubGlobal('fetch', fetch);
  const user = userEvent.setup();
  render(<App />);
  expect(fetch).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Adresse email'), 'test@example.invalid');
  await user.type(screen.getByLabelText('Mot de passe'), 'test-password');
  await user.click(screen.getByRole('button', { name: /Se connecter/ }));
  await screen.findByRole('button', { name: 'Se déconnecter' });
  return { user, fetch };
}
async function loadCourse(fetch, user) {
  fetch.mockResolvedValueOnce(json({ data: [course] }));
  await user.click(screen.getByRole('button', { name: 'Charger les cours' }));
  return screen.findByRole('article');
}
async function fillCourse(user) {
  await user.type(screen.getByLabelText('Titre'), 'Nouveau cours');
  await user.type(screen.getByLabelText('Description'), 'Description du cours');
  await user.type(screen.getByRole('textbox', { name: 'Catégorie' }), 'Web');
}
describe('Parcours React — API simulée explicitement', () => {
  it('ne fait aucun appel au montage et garde la saisie après une connexion refusée', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ message: 'Refus test' }, 403));
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    render(<App />);
    expect(fetch).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Adresse email'), 'test@example.invalid');
    await user.type(screen.getByLabelText('Mot de passe'), 'incorrect');
    await user.click(screen.getByRole('button', { name: /Se connecter/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
    expect(screen.getByLabelText('Adresse email')).toHaveValue('test@example.invalid');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('utilise le rôle du profil et ne présente aucune administration au learner', async () => {
    const { fetch } = await login('learner');
    expect(screen.getByRole('heading', { name: /Bienvenue, Compte test/ })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Mes cours' })).toBeVisible();
    expect(screen.queryByRole('navigation', { name: 'Administration' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nouveau cours/ })).not.toBeInTheDocument();
    expect(screen.getByText(/ne pouvons donc pas déterminer/)).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('ne donne pas l’administration à un formateur', async () => {
    await login('trainer');
    expect(screen.getByRole('alert')).toHaveTextContent('Aucun accès administrateur');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('charge sur clic puis combine les filtres sans nouvelle requête', async () => {
    const { user, fetch } = await login();
    expect(fetch).toHaveBeenCalledTimes(2);
    await loadCourse(fetch, user);
    await user.selectOptions(screen.getByLabelText('Catégorie'), 'Web');
    await user.selectOptions(screen.getByLabelText('Statut'), 'draft');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText('Aucun cours ne correspond à ces filtres.')).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(3);
    await user.selectOptions(screen.getByLabelText('Statut'), 'published');
    expect(screen.getByRole('heading', { name: 'React' })).toBeVisible();
  });
  it('distingue le catalogue vide de la liste non chargée', async () => {
    const { user, fetch } = await login();
    expect(screen.queryByText('Le catalogue publié est vide. Vous pouvez créer un cours.')).not.toBeInTheDocument();
    fetch.mockResolvedValueOnce(json({ data: [] }));
    await user.click(screen.getByRole('button', { name: 'Charger les cours' }));
    expect(await screen.findByText('Le catalogue publié est vide. Vous pouvez créer un cours.')).toBeVisible();
  });
  it.each([400, 409, 500])('préserve le formulaire après HTTP %i, sans succès', async (status) => {
    const { user, fetch } = await login();
    await user.click(screen.getByRole('button', { name: /Nouveau cours/ }));
    await fillCourse(user);
    fetch.mockResolvedValueOnce(json({ message: 'Erreur test' }, status));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByLabelText('Titre')).toHaveValue('Nouveau cours');
    expect(screen.queryByText('Cours créé en brouillon.')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
  it('crée, modifie puis publie uniquement après réponse confirmée', async () => {
    const { user, fetch } = await login();
    await user.click(screen.getByRole('button', { name: /Nouveau cours/ }));
    await fillCourse(user);
    fetch.mockResolvedValueOnce(json({ data: { ...course, title: 'Nouveau cours', status: 'draft' } }, 201));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Cours créé en brouillon.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.clear(screen.getByLabelText('Titre'));
    await user.type(screen.getByLabelText('Titre'), 'Titre modifié');
    fetch.mockResolvedValueOnce(json({ data: { ...course, title: 'Titre modifié', status: 'draft' } }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('heading', { name: 'Titre modifié' })).toBeVisible();
    fetch.mockResolvedValueOnce(json({ data: { ...course, title: 'Titre modifié' } }));
    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(await screen.findByText('Cours publié.')).toBeVisible();
    expect(fetch.mock.calls[3][0]).toBe('/api/courses/course-1');
    expect(fetch.mock.calls[4][0]).toBe('/api/courses/course-1/publish');
  });
  it('exige confirmation avant dépublication et accepte le champ succuss du vrai backend', async () => {
    const { user, fetch } = await login();
    await loadCourse(fetch, user);
    await user.click(screen.getByRole('button', { name: 'Dépublier' }));
    expect(fetch).toHaveBeenCalledTimes(3);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }));
    expect(fetch).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole('button', { name: 'Dépublier' }));
    fetch.mockResolvedValueOnce(json({ succuss: true, data: { ...course, status: 'draft' } }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la dépublication' }));
    expect(await screen.findByText('Cours dépublié.')).toBeVisible();
    expect(screen.getByRole('article')).toHaveTextContent('Brouillon');
  });
  it('conserve la session après 403 et la purge après 401', async () => {
    const { user, fetch } = await login();
    fetch.mockResolvedValueOnce(json({ message: 'Forbidden' }, 403));
    await user.click(screen.getByRole('button', { name: 'Charger les cours' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
    fetch.mockResolvedValueOnce(json({ message: 'Expired' }, 401));
    await user.click(screen.getByRole('button', { name: 'Charger les cours' }));
    expect(await screen.findByRole('button', { name: /Se connecter/ })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Session expirée');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('efface les données de session et ignore une requête encore en vol au logout', async () => {
    const { user, fetch } = await login();
    let resolve;
    fetch.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    await user.click(screen.getByRole('button', { name: 'Charger les cours' }));
    const signal = fetch.mock.calls[2][1].signal;
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(signal.aborted).toBe(true);
    resolve(json({ data: [course] }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Se connecter/ })).toBeVisible());
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it('affiche le blocage utilisateurs sans appeler une route inexistante', async () => {
    const { user, fetch } = await login();
    await user.click(screen.getByRole('button', { name: 'Utilisateurs' }));
    expect(screen.getByRole('heading', { name: 'Gestion des utilisateurs indisponible' })).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
