# Notes de soutenance

## Démonstration courte

1. Ouvrir le frontend : aucune requête API n’est déclenchée.
2. Saisir les identifiants d’un compte existant. Montrer login puis /auth/me dans le réseau.
3. Avec admin, cliquer sur Charger les cours. Combiner catégorie/statut : aucun nouvel appel.
4. Créer un brouillon, modifier, publier puis demander une dépublication. Annuler une fois pour montrer l’absence de requête, puis confirmer.
5. Montrer la page Utilisateurs et expliquer le contrat manquant.
6. Déconnecter puis connecter un learner. Montrer l’accueil personnalisé et l’absence d’administration. Expliquer pourquoi les inscriptions ne peuvent pas être affichées.
7. Montrer les tests 401/403 et les formulaires après 400/409, sans prétendre que les mocks sont des réponses réelles de production.

## Composants et props

App détient la session certifiée. LoginPage reçoit onLogin et notice ; il conserve seulement les champs et l’état du formulaire. AdminLayout et LearnerLayout reçoivent le profil et onLogout. CoursesPage reçoit un objet de service ; CourseCard reçoit course et des callbacks. ProtectedView vérifie rôle et statut du profil authentifié. Le backend reste responsable de l’autorisation effective.

Une prop est une entrée en lecture seule. CourseForm initialise ses valeurs depuis le cours, puis modifie son propre état : il ne change jamais course.title directement. Sa clé change quand un autre cours est ouvert pour réinitialiser proprement la saisie.

## Lifting state

CoursesPage possède la liste, les filtres, l’éditeur et la confirmation. Il transmet les données vers les cartes et reçoit les intentions par callbacks. La réponse validée du service remonte dans la liste. App conserve la session au niveau commun aux espaces.

## Immutabilité et état dérivé

Une modification utilise map pour remplacer l’élément correspondant au même _id ; une création utilise [course, ...current]. Les mises à jour fonctionnelles reçoivent la liste actuelle. Les catégories et visibleCourses sont calculés pendant le rendu sans appel réseau ni état dupliqué.

## Virtual DOM et clés

React décrit l’arbre d’interface, compare les rendus et applique les changements nécessaires au DOM. Une clé _id stable identifie chaque carte ; l’index du tableau n’est pas utilisé. La clé du formulaire détermine son identité et la réinitialisation de son état local.

## Événements synthétiques et hooks

onSubmit/onChange/onClick reçoivent les événements React. preventDefault empêche le rechargement du formulaire. Les handlers async pilotent chargement, erreur et résultat ; les appels API ne se trouvent jamais dans le corps de rendu. Seul useState est utilisé : aucune synchronisation par useEffect ni routage externe.

## Sécurité et limites

Le JWT reste dans App, sans stockage persistant. Le rôle vient de /auth/me. Logout et HTTP 401 annulent les requêtes et démontent l’espace ; HTTP 403 affiche un refus en gardant la session. Une réponse retardée après déconnexion ne doit pas repeupler un espace.

Les protections visuelles facilitent l’usage ; elles ne remplacent pas les contrôles backend. La livraison est partielle à cause des contrats utilisateurs, inscriptions personnelles et liste complète des cours. Aucun faux utilisateur, cours ou succès n’est fourni pour masquer ces limites.
