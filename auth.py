from functools import wraps
from flask import session, redirect, url_for
import hashlib

def hash_password(password):
    """Hasher un mot de passe"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hash):
    """Vérifier un mot de passe"""
    return hash_password(password) == hash

def verify_user_exists(user_id):
    """Vérifier qu'un utilisateur existe toujours en base de données"""
    from models import Database
    conn = Database.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
    user_exists = cursor.fetchone()
    conn.close()
    return user_exists is not None

def login_required(f):
    """Décorateur pour vérifier si l'utilisateur est connecté"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        # ⭐ Vérifier l'existence de l'utilisateur
        if not verify_user_exists(session['user_id']):
            session.clear()
            return redirect(url_for('login'))
        
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Décorateur pour vérifier si l'utilisateur est admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'is_admin' not in session or not session['is_admin']:
            return redirect(url_for('login'))
        
        # Vérifier l'existence (sauf pour l'admin par défaut avec ID = 0)
        if session.get('user_id') != 0 and not verify_user_exists(session['user_id']):
            session.clear()
            return redirect(url_for('login'))
        
        return f(*args, **kwargs)
    return decorated_function
