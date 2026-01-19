# 🍺 BeerTracker

Une application web élégante pour suivre votre consommation de bière en temps réel avec des statistiques détaillées et des alertes intelligentes.

## ✨ Fonctionnalités

### 📊 Suivi en Temps Réel

- **Enregistrement instantané** : Chaque bière est enregistrée avec l'heure exacte
- **Compteurs visuels** : Interface intuitive pour ajouter/retirer des consommations
- **Trois formats** : Pintes (50cl), Demis (25cl), 33cl

### 🚨 Système d'Alertes Intelligent

- **Fenêtres mobiles 3h** : Détecte automatiquement les consommations excessives
- **Alerte 1.5L** : Signale quand la limite est dépassée dans une période de 3 heures
- **Une fenêtre par groupe** : Agrège intelligemment les consommations successives

### 📈 Statistiques Avancées

- **Vue d'ensemble** : Total en pintes, demis, 33cl et litres
- **Graphiques mensuels** : Comparaison visuelle par type de bière
- **Courbe cumulative** : Évolution totale sur la période
- **Plages personnalisées** : Filtrez sur n'importe quelle période

### 👥 Gestion Multi-Utilisateurs

- **Comptes personnels** : Chaque utilisateur a son historique privé
- **Tableau de bord admin** : Gestion centralisée des utilisateurs
- **Classement** : Voir les top consommateurs

### 📥📤 Import/Export

- **Export CSV** : Téléchargez vos données ou celles de tous les utilisateurs
- **Import CSV** : Chargez en masse les enregistrements historiques
- **Création auto d'utilisateurs** : Lors de l'import avec nouveaux utilisateurs

## 🚀 Installation

### Prérequis

Docker ou Python 3.8+ (avec pip)

### Avec Docker (recommandé)

1. **Téléchargez le dépôt et lancer le conteneur**

```bash
git clone <votre-repo>
cd beertracker
docker compose up -d --build
```

2. **Accédez à l'application**

```
http://localhost:8080
```

### Avec Python (3.8+)

1. **Clonez le dépôt**
   
   ```bash
   git clone <votre-repo>
   cd beertracker
   ```

2. **Créez un environnement virtuel**
   
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   ```

3. **Installez les dépendances**
   
   ```bash
   pip install flask
   ```

4. **Lancez l'application**
   
   ```bash
   python app.py
   ```

5. **Accédez à l'application**
   
   ```
   http://localhost:5000
   ```

## 🔐 Configuration

### Admin par Défaut

Modifiez les identifiants dans `config.py` :

```python
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'  # ⚠️ À changer absolument en production !
```

### Variables d'Environnement

```bash
export SECRET_KEY='votre-clé-secrète'
export FLASK_ENV='production'  # ou 'development'
```

## 📁 Structure du Projet

```
beertracker/
├── app.py                 # Application Flask principale
├── config.py             # Configuration (admin, BD, sessions)
├── models.py             # Modèle de base de données SQLite
├── auth.py               # Authentification & décorateurs
├── utils.py              # Utilitaires (stats, export, import)
├── templates/
│   ├── login.html        # Page de connexion
│   ├── dashboard.html    # Tableau de bord utilisateur
│   └── admin.html        # Panel administrateur
├── static/
│   ├── css/style.css     # Styles globaux
│   └── js/app.js         # Logique frontend
└── data/
    └── db.sqlite3        # Base de données (créée auto)
```

## 🎯 Utilisation

### Pour un Utilisateur Normal

1. **Connexion** : Entrez vos identifiants
2. **Enregistrement** : Cliquez les boutons `+/-` pour ajouter/retirer des bières
3. **Statistiques** : Consultez vos totaux et graphiques
4. **Alertes** : Recevez des notifications si vous dépassez 1.5L en 3h
5. **Export** : Téléchargez votre historique en CSV

### Pour l'Administrateur

1. Connectez-vous avec les identifiants admin
2. **Créer des utilisateurs** : Ajoutez des membres avec mots de passe auto-générés
3. **Modifier les mots de passe** : Réinitialisez les identifiants
4. **Supprimer des comptes** : Nettoyage de BD
5. **Export global** : Téléchargez les données de tous les utilisateurs
6. **Import global** : Chargez des données depuis un CSV (crée automatiquement les utilisateurs)
7. **Classement** : Consultez le top des consommateurs

## 📊 Format CSV

### Export Standard

```
Date,Heure,Pintes,Demis,33cl
2026-01-19,14:30:00,2,1,0
2026-01-19,16:45:00,0,2,3
2026-01-20,20:15:00,1,0,1
```

### Export Admin (tous les utilisateurs)

```
Utilisateur,Date,Heure,Pintes,Demis,33cl
Alice,2026-01-19,14:30:00,2,1,0
Bob,2026-01-19,15:45:00,1,0,2
Alice,2026-01-20,20:15:00,0,1,3
```

### Import (pour les administrateurs)

- Utilisez le même format
- Les utilisateurs sont créés automatiquement (import admin)
- Les enregistrements s'ajoutent à l'historique existant

## 🔧 API Endpoints

### Authentification

- `POST /login` - Connexion utilisateur/admin
- `GET /logout` - Déconnexion

### Utilisateur

- `GET /dashboard` - Tableau de bord principal
- `GET /api/consumption?start_date=X&end_date=Y` - Récupère les enregistrements
- `POST /api/consumption` - Ajoute une consommation
- `GET /api/export` - Exporte en CSV

### Admin

- `GET /admin` - Panel administrateur
- `POST /admin/users` - Crée un utilisateur
- `POST /admin/password` - Change un mot de passe
- `DELETE /admin/users/<id>` - Supprime un utilisateur
- `POST /admin/export` - Export de tous les utilisateurs
- `POST /admin/import` - Import depuis CSV
- `GET /api/ranking` - Récupère le classement

## ⚙️ Détails Techniques

### Base de Données

- **SQLite** : Léger, aucune installation requise
- **Tables** :
  - `users` : Identifiants et mots de passe (hashés SHA-256)
  - `consumption` : Enregistrements avec date, heure, quantités

### Conversions

```
1 Pinte = 0.5L
1 Demi = 0.25L
1 x 33cl = 0.33L
```

### Algorithme d'Alerte

- Fenêtres mobiles de 3 heures
- Vérifie chaque enregistrement comme point de départ
- Agrège intelligemment pour éviter les doublons
- Seuil : ≥ 1.5L déclenche l'alerte
- Les alertes disparaissent après 3h depuis le premier enregistrement

### Sécurité

- ✅ Mots de passe hashés (SHA-256)
- ✅ Sessions HTTP-only
- ✅ Durée de session : 30 jours
- ⚠️ À améliorer en production : HTTPS, sessions plus courtes, hashage plus fort (bcrypt)

## 🐛 Dépannage

### "Utilisateur non trouvé"

Vérifiez l'orthographe. Les comptes sont créés uniquement via admin ou import.

### Les statistiques ne se mettent pas à jour

Rechargez la page ou vérifiez la plage de dates sélectionnée.

### Les alertes ne s'affichent pas

- Assurez-vous d'avoir enregistré au moins deux bières dans une fenêtre 3h
- Le total doit être ≥ 1.5L
- Les alertes disparaissent 3h après le premier enregistrement

### Les graphiques ne s'affichent pas

Vérifiez que Chart.js est correctement chargé (CDN accessible).

## 📈 Optimisations Futures

- [ ] Authentification renforcée (bcrypt, 2FA)
- [ ] Thèmes sombre/clair
- [ ] Notifications push
- [ ] Statistiques par heure du jour
- [ ] Objectifs mensuels personnalisables
- [ ] Intégration réseaux sociaux pour partager
- [ ] API REST complète
- [ ] Application mobile

## 📝 Licence

MIT - Libre d'utilisation

## 👨‍💻 Contributions

Les contributions sont bienvenues ! Créez une pull request pour proposer des améliorations.

## 📞 Support

Pour les bugs ou questions, ouvrez une issue ou contactez l'équipe de développement.

---

**Bon tracking ! 🍺**

*BeerTracker v1.0 - Suivi de consommation responsable et amusant*