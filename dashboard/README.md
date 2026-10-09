# Tableau de bord

```
dashboard/
  index.html
  css/style.css      couleurs en haut du fichier (indigo, safran, rose), polices dans css/fonts/
  js/app.js          lecture du CSV, calculs, filtres, graphiques
  js/vendor/         ECharts et PapaParse
  img/
```

Les données sont lues dans `../donnees/ventes.csv`.

## Ouvrir en local

Un navigateur bloque la lecture d'un CSV quand on ouvre `index.html` par double-clic. Il faut un petit serveur local, lancé depuis la racine du dépôt :

```
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000/dashboard/ (sous Windows : `python -m http.server 8000`).

Si la page est ouverte par double-clic, elle propose de choisir le fichier `ventes.csv` à la main.

## Ce qu'il affiche

- 4 indicateurs : chiffre d'affaires, commandes, quantité vendue, panier moyen, avec l'évolution par rapport à la semaine précédente.
- Évolution des ventes par date, ventes par catégorie, Top 5 des produits, ventes par jour de la semaine, canal et zone.
- 3 filtres : période (semaine ou tout), catégorie, canal.
- 3 constats écrits à partir des chiffres affichés.
- Un bouton Tableau sur chaque graphique donne les mêmes valeurs en tableau.

On peut ouvrir une vue précise avec l'adresse, par exemple `#s=3&c=Mode&k=Web` (semaine 3, catégorie Mode, canal Web).

## Affichage

- Sur un écran d'ordinateur (1180 px de large ou plus), tout le tableau de bord tient dans la fenêtre : une seule capture suffit. La taille du texte suit la fenêtre, de 1280 x 720 à 2560 x 1440.
- Sur tablette, les blocs passent sur deux colonnes. Sur téléphone, sur une seule.

## Changer les données

Le fichier doit garder les colonnes `date_commande, produit, categorie, quantite, prix_unitaire, canal, zone`. Le reste s'adapte : nombre de semaines, catégories, canaux.
