# Règles d'équipe

## Rôles

- **Product Owner (Isselmou)** : porte la vision, ordonne le Product Backlog, répond aux questions sur le besoin, accepte les stories terminées.
- **Scrum Master (Ndeye Sokhna)** : anime les cérémonies, tient le journal des daily et le burndown, aide à lever les obstacles.
- **Équipe de réalisation (Ibrahima)** : analyse les données, construit le tableau de bord, teste, prépare la démonstration.

## Fonctionnement

- Une story = une issue. Une tâche = une issue rattachée à sa story (sous-issue).
- Le board est la référence. Si ce n'est pas sur le board, ce n'est pas commencé.
- Statuts : **À faire**, **En cours**, **À valider**, **Terminé**.
- Une seule story en cours à la fois pour la personne qui la réalise.
- Seul le Product Owner déplace une story vers **Terminé**, après l'avoir vue fonctionner.
- Un obstacle se signale tout de suite dans le daily ou en commentaire sur l'issue, avec le label `obstacle`.
- Les points restants sont mis à jour chaque soir dans `docs/04-suivi-quotidien/burndown.csv`.

## Daily Stand-up

15 minutes au plus. Chacun répond à trois questions :

1. Qu'ai-je fait depuis hier ?
2. Que vais-je faire aujourd'hui ?
3. Qu'est-ce qui me bloque ?

Le Scrum Master note les réponses dans `docs/04-suivi-quotidien/journal-daily.md`.

## Definition of Done

Une story est terminée quand toutes les cases sont cochées :

- [ ] Elle répond à tous ses critères d'acceptation.
- [ ] Les calculs ont été vérifiés sur quelques lignes du jeu de données.
- [ ] La visualisation est lisible, nommée et sans erreur visible.
- [ ] Un autre membre de l'équipe l'a relue.
- [ ] Le Product Owner l'a acceptée.
- [ ] La carte est dans la colonne **Terminé**.

Une story qui ne respecte pas cette liste n'est pas comptée comme terminée.

## Branches et commits

- Branche principale : `main`. Le travail du tableau de bord passe par des branches courtes et des pull requests relues par un autre membre.
- Les commits sont courts et décrivent ce qui change. On y mentionne l'issue : `Closes #12` ferme l'issue à la fusion.
- Pas de données réelles dans le dépôt : le jeu de données est synthétique.
