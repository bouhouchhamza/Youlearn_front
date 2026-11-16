const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const messages = {
  400: 'Données invalides. Vérifiez votre saisie.',
  401: 'Session expirée ou invalide. Reconnectez-vous.',
  403: 'Accès refusé. Votre compte ne dispose pas de cette autorisation.',
  404: 'La ressource demandée est introuvable.',
  409: 'Conflit : ces données existent déjà ou ont changé.',
  500: 'Erreur du serveur. Réessayez plus tard.',
};
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}
export async function request(path, { token, signal, onUnauthorized, method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      method, signal, credentials: 'omit',
      headers: { Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') throw error;
    throw new ApiError('Impossible de contacter le serveur. Vérifiez la connexion et réessayez.');
  }
  signal?.throwIfAborted();
  if (response.status === 401 && token) onUnauthorized?.();
  let data;
  try { data = await response.json(); }
  catch {
    if (!response.ok) throw new ApiError(messages[response.status] || 'La requête a échoué.', response.status);
    throw new ApiError('Réponse du serveur illisible. Aucun succès ne peut être confirmé.', response.status);
  }
  signal?.throwIfAborted();
  if (!response.ok || data?.success === false) {
    throw new ApiError((messages[response.status] || 'La requête a échoué.') +
      (typeof data?.message === 'string' ? ' ' + data.message : ''), response.status);
  }
  return data;
}
function courseResponse(data) {
  const course = data?.data;
  if (!course || typeof course._id !== 'string' || typeof course.title !== 'string' ||
      !['draft', 'published', 'archived'].includes(course.status)) {
    throw new ApiError('Réponse cours incompatible avec le contrat API. Rechargez avant de réessayer.');
  }
  return course;
}
export const authApi = {
  async login(credentials) {
    const data = await request('/auth/login', { method: 'POST', body: credentials });
    if (typeof data?.token !== 'string' || !data.token.trim()) throw new ApiError('JWT absent de la réponse de connexion.');
    return data.token;
  },
  async profile(token) {
    const profile = await request('/auth/me', { token });
    if (typeof profile?.fullName !== 'string' || typeof profile.email !== 'string' ||
        typeof profile.status !== 'boolean' || !['admin', 'learner', 'trainer'].includes(profile.role)) {
      throw new ApiError('Profil incompatible avec le contrat API.');
    }
    if (!profile.status) throw new ApiError(messages[403], 403);
    return profile;
  },
};
// Construction pure : aucune requête avant l'appel explicite d'une méthode.
export function createCoursesApi(options) {
  return {
    async listPublished() {
      const data = await request('/courses', options);
      if (!Array.isArray(data?.data)) throw new ApiError('Liste de cours incompatible avec le contrat API.');
      return data.data.map((course) => courseResponse({ data: course }));
    },
    async save(course, id) {
      return courseResponse(await request(id ? '/courses/' + encodeURIComponent(id) : '/courses', {
        ...options, method: id ? 'PATCH' : 'POST', body: course,
      }));
    },
    async changePublication(id, publish) {
      return courseResponse(await request('/courses/' + encodeURIComponent(id) + (publish ? '/publish' : '/unpublish'), {
        ...options, method: 'PATCH',
      }));
    },
  };
}
