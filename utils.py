from models import Database
from auth import hash_password
from datetime import datetime, timedelta, date, time as dt_time
import csv
import io

def calculate_stats(user_id, start_date=None, end_date=None):
    """Calculer les statistiques de consommation avec détection de fenêtres de 3h"""
    records = Database.get_consumption(user_id, start_date, end_date)
    
    total_pints = 0
    total_half_pints = 0
    total_33cl = 0
    total_liters = 0
    three_hour_warnings = []  # ⭐ NEW: Avertissements basés sur fenêtres 3h
    today_str = date.today().isoformat()
    monthly_stats = {}
    
    for record in records:
        pints = record['pints'] or 0
        half_pints = record['half_pints'] or 0
        liters_33 = record['liters_33'] or 0
        
        total_pints += pints
        total_half_pints += half_pints
        total_33cl += liters_33
        
        # Calculer les litres (1 pinte = 0.5L, 1 demi = 0.25L, 1x33cl = 0.33L)
        daily_liters = (pints * 0.5) + (half_pints * 0.25) + (liters_33 * 0.33)
        total_liters += daily_liters
        
        # Stats par mois
        month_key = record['date'][:7]  # YYYY-MM
        if month_key not in monthly_stats:
            monthly_stats[month_key] = {'pints': 0, 'half_pints': 0, '33cl': 0}
        monthly_stats[month_key]['pints'] += pints
        monthly_stats[month_key]['half_pints'] += half_pints
        monthly_stats[month_key]['33cl'] += liters_33
    
    # ⭐ NOUVEAU: Détection des dépassements dans les fenêtres de 3h
    # On ne considère que les enregistrements d'aujourd'hui
    if records:
        today_records = [r for r in records if r['date'] == today_str]
        
        # Pour chaque enregistrement, vérifier les 3h suivantes
        for i, record in enumerate(today_records):
            record_time = datetime.strptime(record['time'], '%H:%M:%S').time()
            record_datetime = datetime.combine(datetime.strptime(record['date'], '%Y-%m-%d').date(), record_time)
            
            # Fenêtre: de record_time à record_time + 3 heures
            window_end = record_datetime + timedelta(hours=3)
            
            # Chercher tous les enregistrements dans cette fenêtre (y compris celui-ci)
            window_liters = 0
            window_items = []
            
            for other_record in today_records:
                other_time = datetime.strptime(other_record['time'], '%H:%M:%S').time()
                other_datetime = datetime.combine(datetime.strptime(other_record['date'], '%Y-%m-%d').date(), other_time)
                
                # Si l'enregistrement est dans la fenêtre de 3h
                if record_datetime <= other_datetime <= window_end:
                    other_pints = other_record['pints'] or 0
                    other_half = other_record['half_pints'] or 0
                    other_33 = other_record['liters_33'] or 0
                    
                    other_liters = (other_pints * 0.5) + (other_half * 0.25) + (other_33 * 0.33)
                    window_liters += other_liters
                    window_items.append({
                        'time': other_record['time'],
                        'liters': round(other_liters, 2)
                    })
            
            # ⭐ ALERTE: Si le total dans la fenêtre 3h >= 1.5L
            if window_liters >= 1.5:
                # Vérifier qu'on n'a pas déjà cet avertissement (pour éviter les doublons)
                warning_exists = any(
                    w['start_time'] == record['time'] and 
                    w['total_liters'] == round(window_liters, 2)
                    for w in three_hour_warnings
                )
                
                if not warning_exists:
                    three_hour_warnings.append({
                        'start_time': record['time'],
                        'end_time': window_end.strftime('%H:%M:%S'),
                        'total_liters': round(window_liters, 2),
                        'start_date': record['date'],
                        'end_date': window_end.strftime('%Y-%m-%d'),
                        'items': window_items
                    })
    
    return {
        'total_pints': total_pints,
        'total_half_pints': total_half_pints,
        'total_33cl': total_33cl,
        'total_liters': round(total_liters, 2),
        'warnings': three_hour_warnings,  # ⭐ NEW
        'monthly_stats': monthly_stats,
        'all_records': records
    }

def export_csv(user_id=None, all_users=False):
    """Exporter les données en CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    if all_users:
        writer.writerow(['Utilisateur', 'Date', 'Heure', 'Pintes', 'Demis', '33cl'])
        users = Database.get_all_users()
        for user in users:
            records = Database.get_consumption(user['id'])
            for record in records:
                writer.writerow([
                    user['username'],
                    record['date'],
                    record['time'] if 'time' in record.keys() else '00:00:00',
                    record['pints'] or 0,
                    record['half_pints'] or 0,
                    record['liters_33'] or 0
                ])
    else:
        writer.writerow(['Date', 'Heure', 'Pintes', 'Demis', '33cl'])
        records = Database.get_consumption(user_id)
        for record in records:
            writer.writerow([
                record['date'],
                record['time'] if 'time' in record.keys() else '00:00:00',
                record['pints'] or 0,
                record['half_pints'] or 0,
                record['liters_33'] or 0
            ])
    
    return output.getvalue()

def import_csv(file_content, user_id=None, all_users=False):
    """Importer des données depuis un CSV"""
    lines = file_content.decode('utf-8').strip().split('\n')
    reader = csv.DictReader(io.StringIO('\n'.join(lines)))
    
    imported_count = 0
    created_users = []
    errors = []
    
    for row in reader:
        try:
            if all_users:
                username = row.get('Utilisateur', '').strip()
                if not username:
                    errors.append(f"Erreur ligne {imported_count + 1}: Utilisateur vide")
                    continue
                
                user_id_import = Database.get_user_id(username)
                
                if not user_id_import:
                    default_password = f"user_{username}_{datetime.now().strftime('%Y%m%d')}"
                    password_hash = hash_password(default_password)
                    
                    if Database.create_user(username, password_hash):
                        user_id_import = Database.get_user_id(username)
                        created_users.append({
                            'username': username,
                            'password': default_password
                        })
                    else:
                        errors.append(f"Erreur: Impossible de créer l'utilisateur '{username}'")
                        continue
            else:
                user_id_import = user_id
            
            date = row.get('Date', '').strip()
            if not date:
                errors.append(f"Erreur ligne {imported_count + 1}: Date vide")
                continue
            
            # ⭐ NEW: Récupérer l'heure depuis le CSV (ou utiliser 00:00:00)
            time = row.get('Heure', '00:00:00').strip()
            if not time:
                time = '00:00:00'
            
            pints = int(row.get('Pintes', 0)) if row.get('Pintes', '').strip() else 0
            half_pints = int(row.get('Demis', 0)) if row.get('Demis', '').strip() else 0
            liters_33 = int(row.get('33cl', 0)) if row.get('33cl', '').strip() else 0
            
            Database.add_consumption(user_id_import, date, pints, half_pints, liters_33, time)
            imported_count += 1
        except ValueError as e:
            errors.append(f"Erreur ligne {imported_count + 1}: Valeur invalide - {str(e)}")
        except Exception as e:
            errors.append(f"Erreur ligne {imported_count + 1}: {str(e)}")
    
    return imported_count, errors, created_users

def get_top_drinkers():
    """Obtenir le classement des plus gros buveurs"""
    conn = Database.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT users.username, 
               SUM(consumption.pints) as total_pints,
               SUM(consumption.half_pints) as total_half_pints,
               SUM(consumption.liters_33) as total_33cl
        FROM users
        LEFT JOIN consumption ON users.id = consumption.user_id
        GROUP BY users.id, users.username
        ORDER BY total_pints DESC, total_half_pints DESC, total_33cl DESC
    ''')
    
    drinkers = cursor.fetchall()
    conn.close()
    
    return drinkers
