import { describe, it, expect, vi, afterEach } from 'vitest';
import { authApi, createCoursesApi, request } from '../src/services/api';

afterEach(() => vi.unstubAllGlobals());
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
describe('Contrat API — réponses simulées uniquement dans les tests', () => {
  it('ne charge rien à la construction et envoie le Bearer sans cookies', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ data: [] }));
    vi.stubGlobal('fetch', fetch);
    const api = createCoursesApi({ token: 'test-token' });
    expect(fetch).not.toHaveBeenCalled();
    expect(await api.listPublished()).toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/courses', expect.objectContaining({
      credentials: 'omit', headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }));
  });
  it.each([400, 401, 403, 404, 409, 500])('traite HTTP %i sans faux succès', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ message: 'Erreur test' }, status)));
    const onUnauthorized = vi.fn();
    await expect(request('/courses', { token: 'test-token', onUnauthorized })).rejects.toMatchObject({ status });
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });
  it('purge sur 401 même si le corps est du HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('proxy error', { status: 401 })));
    const onUnauthorized = vi.fn();
    await expect(request('/courses', { token: 'test-token', onUnauthorized })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
  it('rejette les pannes réseau et le JSON illisible', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response('<html/>'));
    vi.stubGlobal('fetch', fetch);
    await expect(request('/courses')).rejects.toThrow(/Impossible de contacter/);
    await expect(request('/courses')).rejects.toThrow(/illisible/);
  });
  it('refuse un succès métier négatif et une réponse cours mal formée', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({ success: false }))
      .mockResolvedValueOnce(json({ data: {} })));
    await expect(request('/courses')).rejects.toThrow();
    await expect(createCoursesApi({}).save({})).rejects.toThrow(/incompatible/);
  });
  it('exige un JWT et un profil certifié par le backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ fullName: 'Test', email: 'test@example.invalid', status: true, role: 'superadmin' })));
    await expect(authApi.login({})).rejects.toThrow(/JWT absent/);
    await expect(authApi.profile('test-token')).rejects.toThrow(/Profil incompatible/);
  });
  it('ne traite pas une réponse arrivée après la déconnexion', async () => {
    const controller = new AbortController();
    let resolve;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((done) => { resolve = done; })));
    const promise = request('/courses', { signal: controller.signal });
    controller.abort();
    resolve(json({ data: [] }));
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
