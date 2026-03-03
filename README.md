# 🍺 BeerTracker

Application web de suivi de consommation de bière avec gestion multi-utilisateurs et tableau de bord statistique.

<img width="2560" height="1664" alt="beertracker" src="https://github.com/user-attachments/assets/fbefe3bd-58ac-49df-90dc-58cdf3db4856" />

## Fonctionnalités

### Pour les utilisateurs
- **Suivi de consommation** : Enregistrement de pintes (50cl), demis (25cl) et 33cl avec horodatage
- **Mode soirée** : Mode spécial qui reste actif jusqu’à 7h le lendemain pour éviter de retirer ses bières du compteur sous l’effet de l’ivresse.
- **Statistiques personnelles** : 
  - Visualisation du total en litres
  - Estimation du coût (~6€ pour 50cL de bière)
  - Graphiques mensuels et hebdomadaires (4 dernières semaines)
  - Timeline complète de consommation
- **Alertes intelligentes** :
  - Avertissement si plus de 1,5L consommés sur une fenêtre glissante de 3 heures
  - Alerte à partir de 3 jours de consommation dans la même semaine
- **Consommation des autres utilisateurs** : Le top 3 des utilisateurs ayant consommé le plus de bières pour l'année en cours est affiché, avec le détail des consommations
- **Export de données** : Téléchargement de l'historique personnel en CSV

### Pour les administrateurs
- **Gestion des utilisateurs** :
  - Création, modification et suppression de comptes
  - Changement de mot de passe
  - Activation/désactivation du mode soirée pour chaque utilisateur
- **Classement** : Tableau contenant tous les utilisateurs, avec leurs consommations (pintes, demis, 33cl) pour l'année en cours
- **Import/Export global** : Gestion des données de tous les utilisateurs en CSV
- **Création automatique d'utilisateurs** : Lors de l'import CSV, les utilisateurs manquants sont créés avec un mot de passe temporaire

## Prérequis

- Docker / Docker Compose (recommandé) ou Python (3.11 +)

## Déploiement 

```bash
git clone https://github.com/pstraebler/beertracker.git
cd beertracker
cp .env.example .env
```

**⚠️ Important** : Modifiez les valeurs suivantes dans `.env` :

- `SECRET_KEY` : Clé secrète pour les sessions Flask (générez une chaîne aléatoire longue)
- `APP_PORT` : Port sur lequel l'application va écouter
- `HOST_PORT` : Port sur lequel l'application sera exposée (uniquement pour Docker)
- `ADMIN_USERNAME` : Facultatif. Nom d'utilisateur de l'administrateur (par défaut : `admin`)
- `ADMIN_PASSWORD` : Mot de passe de l'administrateur
- `USE_HTTPS` : À ne pas activer sur des environnements locaux (défaut : `0`)

### Via Docker (recommandé)

```bash
docker-compose up -d --build
```

Il est également possible d'utiliser l'image Beertracker depuis le *Docker Hub* :

```bash
docker run --rm --env-file=.env -p 8080:8080 pierrestraebler/beertracker:latest
```

### Via Python

*Paquets nécessaires : python3, python3-pip, python3-venv*

```bash
python3 -m venv ./beertracker-venv
source ./beertracker-venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Premier démarrage

L'application est accessible sur **http://localhost:8080**

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
