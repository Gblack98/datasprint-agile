# Tableau de bord

```
dashboard/
  index.html
  css/
  js/
  img/
```

Les données sont lues dans `../donnees/`.

## Ouvrir en local

Un navigateur bloque la lecture d'un CSV quand on ouvre `index.html` par double-clic. Il faut un petit serveur local, lancé depuis la racine du dépôt :

```
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000/dashboard/.
