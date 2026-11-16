import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function runBrowserChecks({ origin, password }) {
  const vite = await createServer({
    server: { host: '127.0.0.1', port: 0, open: false,
      proxy: { '/api': { target: origin, changeOrigin: true } } },
  });
  let browser;
  try {
    await vite.listen();
    browser = await chromium.launch({
      executablePath: process.env.LMS_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      headless: true,
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
    const apiRequests = [];
    page.on('request', (req) => { if (req.url().includes('/api/')) apiRequests.push(req.url()); });
    await page.goto('http://127.0.0.1:' + vite.httpServer.address().port);
    await expect(page.getByRole('button', { name: /Se connecter/ })).toBeVisible();
    expect(apiRequests).toHaveLength(0);
    await mkdir('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
    async function signIn(role) {
      await page.getByLabel('Adresse email').fill(role + '@example.invalid');
      await page.getByLabel('Mot de passe').fill(password);
      await page.getByRole('button', { name: /Se connecter/ }).click();
      await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
    }
    async function checkWidth() {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await signIn('admin');
    expect(apiRequests).toHaveLength(2);
    await page.getByRole('button', { name: 'Charger les cours' }).click();
    await expect(page.getByText('Le catalogue publié est vide. Vous pouvez créer un cours.')).toBeVisible();
    await page.getByRole('button', { name: /Nouveau cours/ }).click();
    await page.getByLabel('Titre', { exact: true }).fill('Cours navigateur');
    await page.getByLabel('Description', { exact: true }).fill('Test avec Express et MongoDB réels.');
    await page.getByRole('textbox', { name: 'Catégorie' }).fill('Web');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Cours créé en brouillon.')).toBeVisible();
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await page.getByLabel('Titre', { exact: true }).fill('Cours navigateur modifié');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Cours modifié.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Publier', exact: true }).click();
    await expect(page.getByText('Cours publié.', { exact: true })).toBeVisible();
    const beforeFilters = apiRequests.length;
    await page.getByLabel('Catégorie', { exact: true }).selectOption('Web');
    await page.getByLabel('Statut', { exact: true }).selectOption('draft');
    await expect(page.getByText('Aucun cours ne correspond à ces filtres.')).toBeVisible();
    expect(apiRequests).toHaveLength(beforeFilters);
    await page.getByLabel('Statut', { exact: true }).selectOption('published');
    await checkWidth();
    await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Dépublier', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    expect(apiRequests).toHaveLength(beforeFilters);
    await page.getByRole('button', { name: 'Dépublier', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmer la dépublication' }).click();
    await expect(page.getByText('Cours dépublié.', { exact: true })).toBeVisible();
    await page.getByLabel('Statut', { exact: true }).selectOption('draft');
    await page.getByRole('button', { name: 'Utilisateurs', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Gestion des utilisateurs indisponible' })).toBeVisible();
    await page.getByRole('button', { name: 'Cours', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cours navigateur modifié' })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await checkWidth();
    await page.screenshot({ path: 'test-results/admin-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await checkWidth();
    await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
    await signIn('learner');
    await expect(page.getByRole('heading', { name: 'Bienvenue, Test learner.' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Administration' })).toHaveCount(0);
    await expect(page.getByText(/ne pouvons donc pas déterminer/)).toBeVisible();
    await checkWidth();
    await page.screenshot({ path: 'test-results/learner-mobile.png', fullPage: true });
    expect(errors).toEqual([]);
    console.log('Navigateur réel OK : admin CRUD/publication/confirmation/filtres, logout, learner, desktop 1440px, mobile 390px, aucune erreur/warning console.');
  } finally {
    await browser?.close();
    await vite.close();
  }
}
