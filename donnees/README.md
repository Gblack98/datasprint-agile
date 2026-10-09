# Données

Fichier : `ventes.csv`, 289 lignes, synthétique. Une ligne = une commande, numérotée dans l'ordre des dates.
Période : du 2026-09-07 au 2026-10-04 (4 semaines). Encodage UTF-8, séparateur virgule.

| Champ | Exemple |
|---|---|
| id_commande | CMD-1106 |
| date_commande | 2026-09-18 |
| jour_semaine | Vendredi |
| produit | Ventilateur sur pied |
| categorie | Maison |
| quantite | 1 |
| prix_unitaire | 22000 |
| canal | Boutique |
| zone | Dakar |
| mode_paiement | Carte |

Prix en FCFA, sans espace ni symbole. Le montant d'une commande se calcule : `quantite x prix_unitaire`.

Catégories : Électronique, Beauté, Mode, Maison (18 produits). Canaux : Web, Boutique. Zones : Dakar, Thiès, Saint-Louis.
Modes de paiement : Wave, Orange Money, Espèces, Carte (pas d'espèces sur le Web).

Valeurs de contrôle (fichier complet) : CA total 4 066 000 FCFA, 289 commandes, 522 articles, panier moyen 14 069 FCFA.
