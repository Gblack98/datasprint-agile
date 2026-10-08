"""Génère donnees/ventes.csv : ventes synthétiques d'une boutique, 4 semaines."""
import csv
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(2026)

DEBUT = date(2026, 9, 7)  # un lundi
JOURS = 28

# produit, catégorie, prix FCFA, popularité
PRODUITS = [
    ("Casque Bluetooth", "Électronique", 15000, 5),
    ("Chargeur rapide", "Électronique", 8500, 7),
    ("Enceinte portable", "Électronique", 22000, 3),
    ("Montre connectée", "Électronique", 28000, 2),
    ("Câble USB-C", "Électronique", 3500, 9),
    ("Batterie externe", "Électronique", 12500, 5),
    ("T-shirt coton", "Mode", 6500, 9),
    ("Boubou brodé", "Mode", 35000, 2),
    ("Sandales en cuir", "Mode", 14000, 5),
    ("Casquette", "Mode", 4500, 6),
    ("Sac en wax", "Mode", 16500, 4),
    ("Foulard", "Mode", 5500, 6),
    ("Théière émaillée", "Maison", 7500, 4),
    ("Set de verres", "Maison", 12000, 4),
    ("Lampe LED", "Maison", 11000, 5),
    ("Coussin wax", "Maison", 6000, 6),
    ("Bougie parfumée", "Maison", 4000, 7),
    ("Beurre de karité", "Beauté", 3500, 10),
    ("Huile de baobab", "Beauté", 7000, 6),
    ("Savon noir", "Beauté", 2500, 9),
    ("Parfum", "Beauté", 24000, 2),
    ("Café Touba", "Alimentation", 3000, 10),
    ("Miel local", "Alimentation", 5500, 5),
    ("Bissap séché", "Alimentation", 2000, 8),
    ("Thé à la menthe", "Alimentation", 2500, 7),
]

POIDS_JOUR = [1.0, 0.95, 1.0, 1.05, 1.25, 1.65, 0.55]  # lundi à dimanche
ZONES = {"Boutique": [("Dakar", 70), ("Thiès", 18), ("Saint-Louis", 12)],
         "Web": [("Dakar", 45), ("Thiès", 28), ("Saint-Louis", 27)]}


def choisir(paires):
    return random.choices([p[0] for p in paires], [p[1] for p in paires])[0]


def quantite(prix):
    if prix >= 20000:
        return random.choices([1, 2], [90, 10])[0]
    if prix >= 8000:
        return random.choices([1, 2, 3], [70, 22, 8])[0]
    return random.choices([1, 2, 3, 4, 5], [45, 28, 14, 9, 4])[0]


lignes = []
for i in range(JOURS):
    jour = DEBUT + timedelta(days=i)
    tendance = 1 + 0.025 * i / 7          # activité en légère hausse
    fin_de_mois = 1.3 if 25 <= jour.day <= 30 and jour.month == 9 else 1.0
    attendu = 8.0 * POIDS_JOUR[jour.weekday()] * tendance * fin_de_mois
    n = max(2, round(random.gauss(attendu, 1.8)))
    for _ in range(n):
        p = choisir([((nom, cat, prix), pop) for nom, cat, prix, pop in PRODUITS])
        nom, cat, prix = p
        poids_web = 0.28 + 0.12 * (cat == "Électronique") + 0.06 * (jour.weekday() >= 4)
        canal = "Web" if random.random() < poids_web else "Boutique"
        lignes.append([jour.isoformat(), nom, cat, quantite(prix), prix, canal, choisir(ZONES[canal])])

sortie = Path(__file__).with_name("ventes.csv")
with sortie.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["date_commande", "produit", "categorie", "quantite", "prix_unitaire", "canal", "zone"])
    w.writerows(lignes)

ca = sum(l[3] * l[4] for l in lignes)
print(f"{len(lignes)} lignes, CA {ca:,} FCFA".replace(",", " "))
