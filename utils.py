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
    three_hour_warnings = []
    today_str = date.today().isoformat()
    monthly_stats = {}
    
    for record in records:
        pints = record['pints'] or 0
        half_pints = record['half_pints'] or 0
        liters_33 = record['liters_33'] or 0
        
        total_pints += pints
        total_half_pints += half_pints
        total_33cl += liters_33
        
        daily_liters = (pints * 0.5) + (half_pints * 0.25) + (liters_33 * 0.33)
        total_liters += daily_liters
        
        month_key = record['date'][:7]
        if month_key not in monthly_stats:
            monthly_stats[month_key] = {'pints': 0, 'half_pints': 0, '33cl': 0}
        monthly_stats[month_key]['pints'] += pints
        monthly_stats[month_key]['half_pints'] += half_pints
        monthly_stats[month_key]['33cl'] += liters_33
    
    # ⭐ OPTIMISATION: Une seule fenêtre 3h par groupe consécutif
    if records:
        today_records = [r for r in records if r['date'] == today_str]
        
        if today_records:
            processed_times = set()
            
            for record in sorted(today_records, key=lambda r: r['time']):
                record_time_str = record['time']
                
                # Sauter si on a déjà traité cette heure
                if record_time_str in processed_times:
                    continue
                
                record_time = datetime.strptime(record_time_str, '%H:%M:%S').time()
                record_datetime = datetime.combine(
                    datetime.strptime(record['date'], '%Y-%m-%d').date(), 
                    record_time
                )
                
                # Fenêtre: de record_time à record_time + 3 heures
                window_end = record_datetime + timedelta(hours=3)
                
                # Chercher tous les enregistrements dans cette fenêtre
                window_liters = 0
                window_items = []
                window_times = []
                
                for other_record in today_records:
                    other_time_str = other_record['time']
                    other_time = datetime.strptime(other_time_str, '%H:%M:%S').time()
                    other_datetime = datetime.combine(
                        datetime.strptime(other_record['date'], '%Y-%m-%d').date(), 
                        other_time
                    )
                    
                    # Si l'enregistrement est dans la fenêtre de 3h
                    if record_datetime <= other_datetime <= window_end:
                        other_pints = other_record['pints'] or 0
                        other_half = other_record['half_pints'] or 0
                        other_33 = other_record['liters_33'] or 0
                        
                        other_liters = (other_pints * 0.5) + (other_half * 0.25) + (other_33 * 0.33)
                        window_liters += other_liters
                        window_items.append({
                            'time': other_time_str,
                            'liters': round(other_liters, 2)
                        })
                        window_times.append(other_time_str)
                
                # ⭐ Créer l'avertissement seulement si dépassement ET première fois
                if window_liters >= 1.5:
                    three_hour_warnings.append({
                        'start_time': record_time_str,
                        'end_time': window_end.strftime('%H:%M:%S'),
                        'total_liters': round(window_liters, 2),
                        'start_date': record['date'],
                        'end_date': window_end.strftime('%Y-%m-%d'),
                        'items': window_items
                    })
                    
                    # Marquer tous les enregistrements de cette fenêtre comme traités
                    for time_str in window_times:
                        processed_times.add(time_str)
    
    return {
        'total_pints': total_pints,
        'total_half_pints': total_half_pints,
        'total_33cl': total_33cl,
        'total_liters': round(total_liters, 2),
        'warnings': three_hour_warnings,
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
