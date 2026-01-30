from flask import Flask, render_template, request, session, redirect, url_for, jsonify, send_file, flash
from datetime import datetime, timedelta
from models import Database
from auth import hash_password, verify_password, login_required, admin_required
from utils import calculate_stats, export_csv, import_csv, get_top_drinkers, calculate_weekly_stats
from config import Config
import io
from auth import bcrypt, hash_password
from flask_wtf.csrf import CSRFProtect
import os
import uuid

app = Flask(__name__)
app.config.from_object(Config)
bcrypt.init_app(app)
csrf = CSRFProtect(app)

# Initialiser la base de données au démarrage
Database.init_db()

admin_username = os.environ.get("ADMIN_USERNAME", "admin")
admin_password = os.environ.get("ADMIN_PASSWORD")

if not admin_password:
    raise RuntimeError("ADMIN_PASSWORD must be set")

admin_password_hash = hash_password(admin_password)

conn = Database.get_connection()
cursor = conn.cursor()

cursor.execute(
    "SELECT id FROM users WHERE username = ? AND is_admin = 1",
    (admin_username,)
)
admin = cursor.fetchone()

if admin:
    # 🔁 Mise à jour systématique
    cursor.execute(
        "UPDATE users SET password = ? WHERE username = ? AND is_admin = 1",
        (admin_password_hash, admin_username)
    )
else:
    # 🆕 Création
    cursor.execute(
        "INSERT INTO users (id, username, password, is_admin) VALUES (?, ?, ?, 1)",
        (str(uuid.uuid4()), admin_username, admin_password_hash)
    )

conn.commit()
conn.close()

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        # Vérifier si l'utilisateur classique existe
        if Database.user_exists(username):
            user_id = Database.get_user_id(username)
            conn = Database.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                'SELECT id, password, is_admin FROM users WHERE username = ?',
                (username,)
            )
            user = cursor.fetchone()
            conn.close()
            
            if user and verify_password(password, user['password']):
                session.clear()  # rotation de session
                session['user_id'] = user['id']
                session['username'] = username
                session['is_admin'] = bool(user['is_admin'])
                session.permanent = True
                return redirect(url_for('index'))

            else:
                # Mot de passe utilisateur incorrect
                return render_template('login.html', error='Mot de passe incorrect')
        else:
            # Utilisateur n'existe pas
            return render_template('login.html', error='Utilisateur non trouvé')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    if session.get('is_admin'):
        return redirect(url_for('admin'))
    
    return render_template('dashboard.html', username=session['username'])

@app.route('/api/consumption', methods=['GET', 'POST'])
@login_required
def api_consumption():
    user_id = session['user_id']
    
    if request.method == 'POST':
        data = request.get_json()
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        time = data.get('time', datetime.now().strftime('%H:%M:%S'))
        pints = int(data.get('pints', 0))
        half_pints = int(data.get('half_pints', 0))
        liters_33 = int(data.get('liters_33', 0))
        
        Database.add_consumption(user_id, date, pints, half_pints, liters_33, time)
        
        return jsonify({'success': True})
    
    # GET - récupérer les stats
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    stats = calculate_stats(user_id, start_date, end_date)
    weekly_stats = calculate_weekly_stats(user_id)  # AJOUTER CETTE LIGNE
    
    return jsonify({
        'total_pints': stats['total_pints'],
        'total_half_pints': stats['total_half_pints'],
        'total_33cl': stats['total_33cl'],
        'total_liters': stats['total_liters'],
        'warnings': stats['warnings'], 
        'monthly_stats': stats['monthly_stats'],
        'records': [dict(record) for record in stats['all_records']],
        'weekly_stats': weekly_stats  # AJOUTER CETTE LIGNE
    })

@app.route('/api/export', methods=['GET'])
@login_required
def api_export():
    user_id = session['user_id']
    csv_data = export_csv(user_id)
    
    return send_file(
        io.BytesIO(csv_data.encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"consommation_{session['username']}.csv"
    )

@app.route('/admin')
@admin_required
def admin():
    users = Database.get_all_users()
    top_drinkers = get_top_drinkers()
    
    return render_template('admin.html', users=users, top_drinkers=top_drinkers)

@app.route('/admin/user/create', methods=['POST'])
@admin_required
def admin_create_user():
    username = request.form.get('username', '').strip()
    password = request.form.get('password', '').strip()
    
    if not username or not password:
        return redirect(url_for('admin'))
    
    password_hash = hash_password(password)
    Database.create_user(username, password_hash)
    
    return redirect(url_for('admin'))

@app.route('/admin/user/<user_id>/delete', methods=['POST'])
@admin_required
def admin_delete_user(user_id):
    Database.delete_user(user_id)
    return redirect(url_for('admin'))

@app.route('/admin/user/<user_id>/password', methods=['POST'])
@admin_required
def admin_change_password(user_id):
    new_password = request.form.get('password', '').strip()
    
    conn = Database.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        username = result[0]
        password_hash = hash_password(new_password)
        Database.update_user_password(username, password_hash)
    
    return redirect(url_for('admin'))

@app.route('/admin/export', methods=['GET'])
@admin_required
def admin_export():
    csv_data = export_csv(all_users=True)
    
    return send_file(
        io.BytesIO(csv_data.encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"consommation_complete_{datetime.now().strftime('%Y%m%d')}.csv"
    )

@app.route('/admin/import', methods=['POST'])
@admin_required
def admin_import():
    if 'file' not in request.files:
        return redirect(url_for('admin'))
    
    file = request.files['file']
    
    if file.filename == '':
        return redirect(url_for('admin'))
    
    imported_count, errors, created_users = import_csv(file.read(), all_users=True)
    
    # Créer un message avec les informations d'import
    message = f"Import terminé: {imported_count} entrées importées"
    
    if created_users:
        message += f"\n\nUtilisateurs créés ({len(created_users)}):\n"
        for user in created_users:
            message += f"- {user['username']}: {user['password']}\n"
        message += "\n⚠️ IMPORTANT: Changez ces mots de passe par défaut !"
    
    if errors:
        message += f"\n\nErreurs ({len(errors)}):\n"
        for error in errors:
            message += f"- {error}\n"
    
    # Pour afficher le message, utiliser les templates avec variables
    users = Database.get_all_users()
    top_drinkers = get_top_drinkers()
    
    return render_template('admin.html', 
                         users=users, 
                         top_drinkers=top_drinkers,
                         import_message=message,
                         import_success=True if imported_count > 0 else False,
                         created_users=created_users)

@app.route('/api/night-mode', methods=['GET', 'POST'])
@login_required
def night_mode():
    """Gérer le mode soirée"""
    if request.method == 'GET':
        user_id = session['user_id']
        is_enabled = Database.get_night_mode_status(user_id)
        return jsonify({'night_mode_enabled': is_enabled})
    
    if request.method == 'POST':
        data = request.get_json()
        user_id = session['user_id']
        enabled = data.get('enabled', False)
        
        Database.set_night_mode(user_id, enabled)
        
        return jsonify({
            'success': True,
            'night_mode_enabled': enabled
        })

# Endpoint admin pour gérer le mode soirée d'autres utilisateurs
@app.route('/admin/night-mode/<user_id>', methods=['POST'])
@admin_required
def toggle_night_mode(user_id):
    """Admin: Basculer le mode soirée (vrai toggle)"""
    # Récupérer l'état actuel
    current_state = Database.get_night_mode_status(user_id)
    
    # Inverser l'état
    new_state = not current_state
    
    # Appliquer le changement
    Database.set_night_mode(user_id, new_state)
    
    action = "activé" if new_state else "désactivé"
    return jsonify({'success': True, 'message': f'Mode soirée {action}'})


@app.route('/api/night-mode-status/<user_id>', methods=['GET'])
@admin_required
def get_night_mode_status(user_id):
    """Admin: Récupère l'état du mode soirée pour un utilisateur"""
    is_enabled = Database.get_night_mode_status(user_id)
    return jsonify({'night_mode_enabled': is_enabled})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
