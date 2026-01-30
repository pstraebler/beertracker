# 🍺 BeerTracker

Application web de suivi de consommation de bière avec gestion multi-utilisateurs et tableau de bord statistique.

## Fonctionnalités

### Pour les utilisateurs
- **Suivi de consommation** : Enregistrement de pintes (50cl), demis (25cl) et 33cl avec horodatage
- **Mode soirée** : Mode spécial qui s'active jusqu'à 7h le lendemain pour éviter les retraits inopinés ###### 
- **Statistiques personnelles** : 
  - Visualisation du total en litres
  - Estimation du coût (~6€ pour 50cL de bière)
  - Graphiques mensuels et hebdomadaires (4 dernières semaines)
  - Timeline complète de consommation
- **Alertes intelligentes** :
  - Avertissement si plus de 1,5L consommés sur une fenêtre glissante de 3 heures
  - Alerte à partir de 3 jours de consommation dans la même semaine
- **Export de données** : Téléchargement de l'historique personnel en CSV

### Pour les administrateurs
- **Gestion des utilisateurs** :
  - Création, modification et suppression de comptes
  - Changement de mot de passe
  - Activation/désactivation du mode soirée pour chaque utilisateur
- **Classement** : Tableau des plus gros buveurs (pintes, demis, 33cl)
- **Import/Export global** : Gestion des données de tous les utilisateurs en CSV
- **Création automatique d'utilisateurs** : Lors de l'import CSV, les utilisateurs manquants sont créés avec un mot de passe temporaire

## Prérequis

- Docker + Docker Compose

## Déploiement 

```bash
git clone https://github.com/pstraebler/beertracker
cd beertracker
cp .env.example .env
```

**⚠️ Important** : Modifiez les valeurs suivantes dans `.env` :

- `SECRET_KEY` : Clé secrète pour les sessions Flask (générez une chaîne aléatoire longue)
- `ADMIN_USERNAME` : Facultatif. Nom d'utilisateur de l'administrateur (par défaut : `admin`)
- `ADMIN_PASSWORD` : Mot de passe de l'administrateur

### Lancer l'application

```bash
docker-compose up -d --build
```

L'application sera accessible sur **http://localhost:8080**

### Premier démarrage

1. Connectez-vous avec les identifiants admin configurés
2. Créez les utilisateurs depuis le panel d'administration
3. Les utilisateurs peuvent se connecter avec leurs identifiants

## Stockage des données

La base de données SQLite est stockée dans le volume Docker `beertracker_data` 
Le fichier est situé dans `./data/db.sqlite3`. 

## Format d'import CSV

### Pour l'administrateur (import complet)

```csv
Utilisateur,Date,Heure,Pintes,Demis,33cl
baptiste,2026-01-15,20:30:00,2,1,0
guy,2026-01-15,21:00:00,0,2,1
```

- **Utilisateur** : Nom d'utilisateur (créé automatiquement s'il n'existe pas)
- **Date** : Format `YYYY-MM-DD`
- **Heure** : Format `HH:MM:SS` (optionnel, par défaut `00:00:00`)
- **Pintes** : Nombre de pintes (50cl)
- **Demis** : Nombre de demis (25cl)
- **33cl** : Nombre de bouteilles/canettes de 33cl
