from flask import Flask, render_template, request, session, redirect, url_for, jsonify, send_file, flash
from datetime import datetime, timedelta
from models import Database
from auth import hash_password, verify_password, login_required, admin_required
from utils import calculate_stats, export_csv, import_csv, get_top_drinkers
from config import Config
import io

app = Flask(__name__)
app.config.from_object(Config)

# Initialiser la base de données au démarrage
Database.init_db()

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
        
        # Vérifier si c'est l'admin
        if username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD:
            session['user_id'] = 0
            session['username'] = 'admin'
            session['is_admin'] = True
            session.permanent = True
            return redirect(url_for('admin'))
        
        # Vérifier l'utilisateur normal
        if not Database.user_exists(username):
            return render_template('login.html', error='Utilisateur non trouvé')
        
        user_id = Database.get_user_id(username)
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT password FROM users WHERE id = ?', (user_id,))
        stored_hash = cursor.fetchone()[0]
        conn.close()
        
        if not verify_password(password, stored_hash):
            return render_template('login.html', error='Mot de passe incorrect')
        
        session['user_id'] = user_id
        session['username'] = username
        session['is_admin'] = False
        session.permanent = True
        
        return redirect(url_for('dashboard'))
    
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
        pints = int(data.get('pints', 0))
        half_pints = int(data.get('half_pints', 0))
        liters_33 = int(data.get('liters_33', 0))
        
        Database.add_consumption(user_id, date, pints, half_pints, liters_33)
        
        return jsonify({'success': True})
    
    # GET - récupérer les stats
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    stats = calculate_stats(user_id, start_date, end_date)
    
    return jsonify({
        'total_pints': stats['total_pints'],
        'total_half_pints': stats['total_half_pints'],
        'total_33cl': stats['total_33cl'],
        'total_liters': stats['total_liters'],
        'warnings': stats['daily_warnings'],
        'monthly_stats': stats['monthly_stats'],
        'records': [dict(record) for record in stats['all_records']]
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

@app.route('/admin/user/<int:user_id>/delete', methods=['POST'])
@admin_required
def admin_delete_user(user_id):
    Database.delete_user(user_id)
    return redirect(url_for('admin'))

@app.route('/admin/user/<int:user_id>/password', methods=['POST'])
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
