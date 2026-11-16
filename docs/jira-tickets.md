# Tickets Jira proposés

Ces tickets sont proposés, pas créés dans Jira. Aucun accès Jira n’a été utilisé.

| Référence proposée | Ticket | Critères d’acceptation |
| --- | --- | --- |
| S3-01 | Frontend — authentification et session mémoire | login réel puis /auth/me, rôle certifié, logout, 401 purge, 403 conserve la session ; réalisé |
| S3-02 | Frontend — gestion des cours compatible API | chargement sur clic, filtres combinés locaux, création/modification, publication/dépublication confirmée, saisie préservée après erreur ; réalisé |
| S3-03 | Backend — contrat admin utilisateurs | liste/détail/création/modification documentés, admin uniquement, réponses sans hash, erreurs et règles de rôles définies |
| S3-04 | Frontend — utilisateurs | après S3-03 : liste réelle, filtres rôle/statut, détails, formulaires contrôlés et mise à jour immuable ; bloqué |
| S3-05 | Backend — inscriptions personnelles | identité depuis req.user, liste des cours inscrits, cas vide, annulation et cours dépubliés documentés |
| S3-06 | Frontend — Mes cours | après S3-05 : chargement explicite des seules inscriptions authentifiées, loading/empty/error ; bloqué |
| S3-07 | Backend — catalogue administratif complet | tous les statuts accessibles à admin, contrat de liste documenté, contrôles d’accès testés |
| S3-08 | Frontend — récupération des brouillons historiques | après S3-07 : remplacer la liste publique partielle par la liste admin réelle ; bloqué |
| S3-09 | Qualité et livraison | responsive, labels/focus, lint/build/tests, README, soutenance et rapport ; réalisé selon rapport de validation |

Les références servent uniquement à organiser le backlog et ne sont pas des identifiants Jira existants.
