# Règles d'équipe

## Fonctionnement

- Une story ou une tâche = une carte sur le board.
- Statuts : **À faire**, **En cours**, **À valider**, **Terminé**.
- Une personne commence une carte à la fois.
- Seul le Product Owner déplace une story vers **Terminé**, après l'avoir vue fonctionner.
- Un blocage se dit tout de suite, au daily ou en commentaire sur la carte.
- Chaque soir, on met à jour les points restants dans `docs/04-suivi-quotidien/burndown.csv`.

## Daily Stand-up

10 à 15 minutes, trois questions :

1. Qu'est-ce que j'ai fait depuis hier ?
2. Qu'est-ce que je fais aujourd'hui ?
3. Qu'est-ce qui me bloque ?

Le Scrum Master note les réponses dans `docs/04-suivi-quotidien/journal-daily.md`.

## Definition of Done

Une story est terminée quand :

- [ ] elle répond à tous ses critères d'acceptation ;
- [ ] les calculs sont vérifiés sur quelques lignes du CSV ;
- [ ] le graphique est lisible, nommé, sans erreur visible ;
- [ ] un autre membre l'a relue ;
- [ ] le Product Owner l'a acceptée ;
- [ ] la carte est dans **Terminé**.

## Git

- Branche `main`. Pour le code, on crée une branche courte et on ouvre une pull request relue par un autre membre.
- Messages de commit courts. `Closes #12` dans un commit ou une PR ferme l'issue 12.
- Données synthétiques seulement.
