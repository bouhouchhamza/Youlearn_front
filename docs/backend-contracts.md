# Audit API et contrats nécessaires

Audit du 16 novembre 2026. Sources locales : ../lms-api/docs/openapi.yaml et ../lms-api/src/{app.js,routes,controllers,models,middlewares}. Aucun PDF propre à ce brief n’a été fourni. L’OpenAPI et le code ont été comparés, le code des routes montées faisant foi.

## Contrats réels réutilisés

| Opération | Route existante | Réponse utilisée |
| --- | --- | --- |
| Connexion | POST /api/auth/login | { message, token } |
| Profil authentifié | GET /api/auth/me | { fullName, email, role, status } ; aucun id retourné |
| Catalogue publié | GET /api/courses | { success, count, data: Course[] } |
| Création de cours | POST /api/courses | 201, { success, message, data: Course } |
| Modification | PATCH /api/courses/:id | { success, message, data: Course } |
| Publication | PATCH /api/courses/:id/publish | { success, message, data: Course } |
| Dépublication | PATCH /api/courses/:id/unpublish | { succuss, message, data: Course }, faute de frappe réelle du backend |

Course possède _id, title, description, category, level (beginner/intermediate/advanced), status (draft/published/archived), trainer et timestamps. Les quatre champs de contenu sont obligatoires. La création attribue trainer depuis req.user._id et status=draft ; le frontend n’envoie aucun rôle, propriétaire ni statut inventé. La dépublication retourne draft.

Fichiers source : routes/authRoutes.js, controllers/authController.js, routes/courseRoutes.js, controllers/courseController.js, models/Course.js, middlewares/authMiddleware.js et authorize.js. Le rôle est lu en base par l’authentification, et non pris dans un champ fourni par le frontend.

Autres fonctionnalités réutilisables ultérieurement : inscription POST /api/courses/:courseId/enroll, annulation DELETE de cette même route, reprise GET /api/courses/:courseId/resume, modules et ressources. Elles n’offrent aucune liste personnelle des inscriptions.

GET /api/trainer/courses est limité au rôle trainer et à ses cours : il ne constitue pas une liste d’administration. Les routes de consultation des apprenants d’un cours sont également limitées au trainer. La route /get-trainers de app.js est non authentifiée, limitée aux formateurs et contient un appel res.status incorrect ; elle n’est pas utilisée.

## Fonctionnalités bloquées et contrat à faire valider

Les opérations ci-dessous sont des besoins de contrat. Aucune URL nouvelle n’est supposée disponible, aucune méthode correspondante n’est appelée par le frontend.

### Administration des utilisateurs

À définir côté backend : consultation de liste, lecture du détail, création administrative et modification contrôlée. Authentification Bearer et autorisation admin requises sur chaque opération.

Le modèle existant fournit _id, fullName, email, role (learner/trainer/admin) et status booléen. La réponse doit exclure password et tout hash. La création nécessite fullName/email/password ; la politique d’attribution de rôle doit être définie côté serveur. Les champs modifiables, la désactivation de son propre compte et les règles concernant le dernier administrateur sont à convenir.

Il faut documenter les enveloppes exactes des réponses de liste/détail/écriture, la pagination éventuelle et les erreurs 400/401/403/404/409/500. Une liste vide doit avoir une représentation stable.

POST /api/auth/register est public, impose learner et retourne seulement un message : il ne remplace pas un contrat d’administration.

Frontend à connecter : services/api.js puis pages/UsersPage.jsx. Les composants UserForm et UserDetails seront créés après validation de ce contrat ; les filtres locaux par rôle/statut dériveront de la liste réelle. L’état et la sélection resteront dans UsersPage, avec mise à jour immuable après réponse confirmée.

Backend concerné, pour un sprint ultérieur : src/app.js, routes dédiées à définir, contrôleurs dédiés à définir, models/User.js, middlewares/authMiddleware.js, authorize.js, docs/openapi.yaml et tests. Aucun de ces fichiers n’a été modifié.

### Inscriptions du compte connecté

À définir : une opération authentifiée learner qui choisit l’identité exclusivement depuis req.user et retourne les inscriptions de ce compte avec leurs cours associés. Elle doit préciser si les inscriptions annulées sont exclues, comment sont traités les cours dépubliés/supprimés et comment sont retournés statut et progression.

L’enveloppe et les champs exacts restent à valider : identifiant stable d’inscription, cours avec identifiant/titre/catégorie/niveau/statut, statut d’inscription et progression si prise en charge. Une réponse vide certifiée permettra le véritable empty state ; actuellement l’absence d’inscriptions est inconnue.

Frontend concerné : services/api.js, pages/MyCoursesPage.jsx et éventuellement CourseCard.jsx adapté à un affichage sans actions admin.

Backend concerné : routes/enrollmentRoutes.js, controllers/enrollmentController.js, models/Enrollment.js, modèles Course/User et docs/openapi.yaml. Aucun fichier modifié.

### Liste administrative des cours

GET /api/courses applique toujours status=published. Il faut une opération admin listant tous les statuts avec une enveloppe documentée, sans détourner /api/trainer/courses ni essayer des paramètres non reconnus.

Frontend concerné : createCoursesApi.listPublished dans services/api.js et le chargement dans pages/CoursesPage.jsx. Le catalogue actuel fonctionne, mais ne permet pas de récupérer les brouillons historiques après rechargement. Les brouillons connus en mémoire peuvent devenir obsolètes si un autre utilisateur les modifie.

Backend concerné : routes/courseRoutes.js, controllers/courseController.js et docs/openapi.yaml.

Aucun endpoint d’archivage n’existe. Le brief autorise la dépublication selon le contrat disponible : celle-ci est implémentée avec confirmation.

## Transport et sécurité

Le backend local ne configure pas CORS dans app.js ; Vite utilise un proxy /api en développement. Le déploiement nécessite le même routage ou une politique CORS serveur appropriée. Les statuts HTTP réels peuvent différer des attentes du brief : une validation Mongoose passe actuellement par errorHandler qui renvoie parfois 500. Le frontend traite le statut reçu et ne transforme pas une erreur en succès.
