// Test optionnel : vrai backend Express + base MongoDB temporaire isolée.
// Aucun fichier du backend ni aucune base métier ne sont modifiés.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { authApi, createCoursesApi, request } from '../src/services/api.js';

const backendRoot = path.resolve(process.env.LMS_BACKEND_PATH || '../lms-api');
const backendRequire = createRequire(path.join(backendRoot, 'package.json'));
const mongoose = backendRequire('mongoose');
const bcrypt = backendRequire('bcrypt');
const database = 'youlearn_frontend_test_' + randomBytes(8).toString('hex');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const nativeFetch = globalThis.fetch;
let server;
let connected = false;
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/' + database, { serverSelectionTimeoutMS: 5000 });
  connected = true;
  const { default: app } = await import(pathToFileURL(path.join(backendRoot, 'src/app.js')).href);
  const { default: User } = await import(pathToFileURL(path.join(backendRoot, 'src/models/User.js')).href);
  const password = randomBytes(16).toString('hex');
  // Fixtures de test en base isolée, mot de passe haché. Le frontend obtient les rôles via /auth/me.
  await User.collection.insertMany(await Promise.all(['admin', 'learner'].map(async (role) => ({
    fullName: 'Test ' + role, email: role + '@example.invalid', role, status: true,
    password: await bcrypt.hash(password, 12),
  }))));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  globalThis.fetch = (url, options) => nativeFetch(origin + url, options);
  const adminToken = await authApi.login({ email: 'admin@example.invalid', password });
  const learnerToken = await authApi.login({ email: 'learner@example.invalid', password });
  assert.equal((await authApi.profile(adminToken)).role, 'admin');
  assert.equal((await authApi.profile(learnerToken)).role, 'learner');
  const api = createCoursesApi({ token: adminToken });
  const input = { title: 'Cours intégration', description: 'Vraie réponse MongoDB', category: 'Web', level: 'beginner' };
  const created = await api.save(input);
  assert.equal(created.status, 'draft');
  assert.equal((await api.listPublished()).length, 0);
  const updated = await api.save({ ...input, title: 'Cours modifié' }, created._id);
  assert.equal(updated.title, 'Cours modifié');
  assert.equal((await api.changePublication(created._id, true)).status, 'published');
  assert.equal((await api.listPublished())[0]._id, created._id);
  await assert.rejects(createCoursesApi({ token: learnerToken }).save(input), error => error.status === 403);
  await assert.rejects(api.save(input, 'invalid-id'), error => error.status === 400);
  await assert.rejects(api.save(input, '000000000000000000000000'), error => error.status === 404);
  await assert.rejects(request('/auth/register', { method: 'POST', body: { email: 'learner@example.invalid', password, fullName: 'Duplicate' } }), error => error.status === 409);
  let expired = false;
  await assert.rejects(request('/auth/me', { token: 'invalid-test-token', onUnauthorized: () => { expired = true; } }), error => error.status === 401);
  assert.equal(expired, true);
  assert.equal((await api.changePublication(created._id, false)).status, 'draft');
  assert.equal((await api.listPublished()).length, 0);
  console.log('Intégration réelle OK : login, profils admin/learner, CRUD cours disponible, publication/dépublication, HTTP 400/401/403/404/409.');
  if (process.env.LMS_BROWSER_TEST === '1') {
    const { runBrowserChecks } = await import('./browser.mjs');
    await runBrowserChecks({ origin, password });
  }
} finally {
  globalThis.fetch = nativeFetch;
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  if (connected) {
    assert.equal(mongoose.connection.name, database);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('Base temporaire de test supprimée.');
  }
}
