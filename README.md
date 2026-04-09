# 🍺 BeerTracker

[French version](./README.fr.md)

A web app to track beer consumption with multi-user management and a statistical dashboard.

<img width="2560" height="1664" alt="beertracker" src="https://github.com/user-attachments/assets/fbefe3bd-58ac-49df-90dc-58cdf3db4856" />

## Features

### For users
- **Consumption tracking**: Log pints (50cl), half-pints (25cl), and 33cl beers with timestamps.
- **Night mode**: A special mode that stays active until 7:00 AM the next day to prevent removing beers from the counter while intoxicated.
- **Personal stats**:
  - Total liters consumed
  - Cost estimate (~€6 for a 50cl beer)
  - Monthly and weekly charts (last 4 weeks)
  - Full consumption timeline
- **Smart alerts**:
  - Warning if more than 1.5L is consumed within a rolling 3-hour window
  - Alert starting from 3 drinking days within the same week
- **Other users' consumption**: Displays the top 3 users with the highest beer consumption for the current year, with detailed breakdowns.
- **Data export**: Download personal history as CSV.

### For administrators
- **User management**:
  - Create, update, and delete accounts
  - Change passwords
  - Enable/disable night mode for each user
- **Ranking**: Table containing all users and their consumption (pints, half-pints, 33cl) for the current year.
- **Global import/export**: Manage all users' data via CSV.
- **Automatic user creation**: During CSV import, missing users are created with a temporary password.

## Requirements

- Docker / Docker Compose (recommended) or Python (3.11+)

## Deployment

```bash
git clone https://github.com/pstraebler/beertracker.git
cd beertracker
cp .env.example .env
```

**⚠️ Important**: Update the following values in `.env`:

- `SECRET_KEY`: Secret key for Flask sessions (generate a long random string):

    ```bash
    python -c 'import secrets; print(secrets.token_hex(32))'
    # OR
    openssl rand -hex 32
    ```

- `APP_PORT`: Port the app will listen on
- `HOST_PORT`: Port exposed by Docker (Docker only)
- `ADMIN_USERNAME`: Optional. Admin username (default: `admin`)
- `ADMIN_PASSWORD`: Admin password
- `USE_HTTPS`: Do not enable in local environments (default: `0`)

### With Docker (recommended)

```bash
docker-compose up -d --build
```

You can also use the Beertracker image from Docker Hub:

```bash
mkdir beertracker-data
docker run --rm -v ./beertracker-data:/app/data --env-file=.env -p 8080:8080 pierrestraebler/beertracker:latest
```

### With Python

*Required packages: python3, python3-pip, python3-venv*

```bash
python3 -m venv ./beertracker-venv
source ./beertracker-venv/bin/activate
pip install -r requirements.txt
python app.py
```

### First startup

The app is available at **http://localhost:8080**

1. Log in with the configured admin credentials.
2. Create users from the admin panel.
3. Users can log in with their own credentials.

## Data storage

The SQLite database is stored in the Docker volume `beertracker_data`.
The file is located at `./data/db.sqlite3`.

## CSV import format

### For administrator (full import)

```csv
User,Date,Time,Pints,HalfPints,33cl
baptiste,2026-01-15,20:30:00,2,1,0
guy,2026-01-15,21:00:00,0,2,1
```

- **User**: Username (created automatically if it does not exist)
- **Date**: `YYYY-MM-DD` format
- **Time**: `HH:MM:SS` format (optional, default `00:00:00`)
- **Pints**: Number of pints (50cl)
- **HalfPints**: Number of half-pints (25cl)
- **33cl**: Number of 33cl bottles/cans
