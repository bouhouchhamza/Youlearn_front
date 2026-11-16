# YouLearn — Sprint 3, Brief 1

Frontend React / Vite en JavaScript et JSX. Le travail existant et les deux commits initiaux ont été conservés.

## Démarrer

Prérequis : Node.js 24.15.x (version utilisée pour la validation) et npm. Depuis la racine du frontend :

```sh
npm ci
npm run dev
```

La configuration par défaut fonctionne sans fichier .env : les appels /api sont transmis à http://localhost:3100 par le proxy Vite. Démarrer séparément le backend de référence ../lms-api et MongoDB selon son README, avec ses propres variables et comptes existants. Le frontend ne crée aucun compte administrateur.

Pour changer la configuration, copier .env.example vers .env.local et adapter API_PROXY_TARGET. VITE_API_BASE_URL est une URL publique, jamais un emplacement pour des secrets. Pour Docker, la cible documentée côté backend est http://localhost:3101.

## Parcours disponibles

- Connexion contrôlée : POST /api/auth/login, puis vérification du profil par GET /api/auth/me. Le rôle du profil décide de l’espace affiché.
- JWT uniquement dans l’état de App.jsx : aucune persistance navigateur, aucun cookie ajouté. Un rechargement demande une nouvelle connexion.
- Déconnexion : annulation des requêtes de session et démontage des pages pour effacer listes, formulaires, messages et profil.
- Administration des cours : chargement explicite, états chargement/vide/erreur, filtres locaux combinés catégorie/statut, création, modification, publication et dépublication avec confirmation.
- Les saisies restent présentes si un enregistrement échoue ; aucun succès n’est affiché avant une réponse positive conforme.
- Espace apprenant : accueil personnalisé sans interface d’administration. L’indisponibilité de la liste des inscriptions est expliquée.
- HTTP 401 : retour à la connexion ; HTTP 403 : session conservée avec « Accès refusé ». Les 400, 404, 409, 500, erreurs réseau et réponses illisibles sont traités.

Tous les appels partent d’un événement utilisateur. Aucun chargement au montage, pendant le rendu ou lors d’un changement de filtre.

## Limites du backend confirmées

Le brief complet reste partiellement bloqué. L’audit des routes et de docs/openapi.yaml dans ../lms-api confirme :

- aucune route d’administration des utilisateurs : liste, détails, création et modification sont bloqués ;
- aucune route de consultation des inscriptions du compte connecté : « Mes cours » ne peut pas afficher de liste réelle ni affirmer qu’elle est vide ;
- GET /api/courses retourne uniquement les cours publiés. Il n’existe pas de liste administrative de tous les statuts. Les brouillons créés/dépubliés dans cette session restent en mémoire jusqu’à la déconnexion ou au rechargement, y compris lors d’un changement d’onglet. Une actualisation du catalogue ne certifie pas leur état actuel en base ;
- l’archivage n’a aucune route : l’action disponible est la dépublication vers draft ;
- l’espace trainer est hors brief : il n’obtient jamais l’administration ;
- le frontend ne remplace pas les autorisations du serveur.

Les pages bloquées ne font aucun appel vers une URL inventée. Aucun mock n’est livré dans le code applicatif. Les données simulées existent uniquement dans les tests. Le backend séparé n’a pas été modifié.

Voir [l’audit et les contrats à définir](docs/backend-contracts.md), [la soutenance](docs/soutenance.md), [les tickets proposés](docs/jira-tickets.md) et [le rapport de validation](docs/delivery.md).

## Architecture

```text
src/
  App.jsx                 session, authentification, séparation des rôles
  components/             formulaires, cartes, protection, messages, confirmation
  layouts/                espaces admin et learner
  pages/                  connexion, cours, utilisateurs, inscriptions
  services/api.js         fetch, erreurs HTTP, contrôle des réponses
  styles/app.css          responsive, focus visible, présentation
tests/                    tests de service et interactions ; intégration optionnelle
```

Seul useState est utilisé. Les props sont en lecture seule, les listes sont mises à jour via map/filter/spread et les filtres sont dérivés pendant le rendu. Aucun routeur ni gestionnaire d’état externe. Les seules dépendances applicatives sont React et React DOM.

## Vérifications

```sh
npm run lint
npm test
npm run build
```

Les 25 tests Vitest / Testing Library utilisent des réponses explicitement simulées et couvrent les interactions réelles des composants dans jsdom.

Test optionnel contre Express et MongoDB réels :

```sh
npm run test:integration
```

Il requiert ../lms-api avec ses dépendances et MongoDB local sur 127.0.0.1:27017. LMS_BACKEND_PATH permet de désigner un autre dossier backend. Il démarre Express sur un port temporaire, crée une base youlearn_frontend_test_<aléatoire>, provisionne deux fixtures de test en base isolée avec mots de passe hachés, obtient de vrais JWT via login, vérifie les parcours API, puis supprime uniquement cette base dans finally. Il ne lit pas les secrets backend et ne modifie pas les bases métier.

Test navigateur optionnel, avec Microsoft Edge installé :

```sh
npm run test:browser
```

Il réutilise l’environnement isolé d’intégration, démarre Vite temporairement, utilise Edge sans fenêtre visible via Playwright, et vérifie les interactions et l’absence de débordement horizontal sur desktop et mobile. Les captures réelles sont enregistrées dans test-results/ (ignoré par Git). LMS_BROWSER_EXECUTABLE permet de choisir un autre exécutable Chromium.

## Production

npm run build produit dist/. Servir le frontend en HTTPS et configurer un reverse proxy /api vers le backend : le proxy Vite est réservé au développement, npm run preview n’en fournit pas. Une URL absolue VITE_API_BASE_URL nécessite une politique CORS adaptée côté serveur. Ne jamais placer JWT_SECRET, MONGO_URI ou des mots de passe dans une variable VITE_*.

Dépôt : https://github.com/bouhouchhamza/Youlearn_front
