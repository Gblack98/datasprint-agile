# Tableau de bord

Page statique : `index.html`, `css/style.css`, `js/app.js`. ECharts et PapaParse sont dans `js/vendor/`. Les données sont lues dans `../donnees/ventes.csv`.

## Ouvrir en local

Un navigateur bloque la lecture du CSV quand on ouvre `index.html` par double-clic. Depuis la racine du dépôt :

```
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000/dashboard/. En double-clic, la page propose de choisir `ventes.csv` à la main.

## Ce qu'il affiche

- 4 indicateurs : chiffre d'affaires, commandes, quantité vendue, panier moyen.
- 5 graphiques : évolution par date, catégories, Top 5 des produits, jours de la semaine, canal et zone.
- 3 filtres : période, catégorie, canal.
- 3 constats écrits à partir des chiffres affichés.
