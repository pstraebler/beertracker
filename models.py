import sqlite3
import os
from datetime import datetime
from pathlib import Path

DB_PATH = '/app/data/db.sqlite3'

class Database:
    @staticmethod
    def init_db():
        """Initialiser la base de données"""
        Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Table utilisateurs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table consommation - MODIFIÉE: ajout de la colonne 'time'
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS consumption (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL DEFAULT '00:00:00',
                pints INTEGER DEFAULT 0,
                half_pints INTEGER DEFAULT 0,
                liters_33 INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, date, time)
            )
        ''')
        
        # ⭐ MIGRATION: Ajouter la colonne 'time' si elle n'existe pas
        cursor.execute("PRAGMA table_info(consumption)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'time' not in columns:
            cursor.execute('ALTER TABLE consumption ADD COLUMN time TIME DEFAULT "00:00:00"')
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_connection():
        """Obtenir une connexion à la base de données"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    @staticmethod
    def user_exists(username):
        """Vérifier si un utilisateur existe"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        result = cursor.fetchone()
        conn.close()
        return result is not None
    
    @staticmethod
    def get_user_id(username):
        """Obtenir l'ID d'un utilisateur"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    
    @staticmethod
    def create_user(username, password):
        """Créer un nouvel utilisateur"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                (username, password)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            conn.close()
            return False
    
    @staticmethod
    def update_user_password(username, new_password):
        """Mettre à jour le mot de passe d'un utilisateur"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET password = ? WHERE username = ?', 
                      (new_password, username))
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_all_users():
        """Obtenir tous les utilisateurs"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, created_at FROM users ORDER BY username')
        users = cursor.fetchall()
        conn.close()
        return users
    
    @staticmethod
    def add_consumption(user_id, date, pints=0, half_pints=0, liters_33=0, time='00:00:00'):
        """Ajouter une consommation avec heure (AJOUTER, non remplacer)"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        # Vérifier si l'entrée existe (même date ET même heure)
        cursor.execute(
            'SELECT pints, half_pints, liters_33 FROM consumption WHERE user_id = ? AND date = ? AND time = ?',
            (user_id, date, time)
        )
        existing = cursor.fetchone()
        
        if existing:
            # AJOUTER aux valeurs existantes
            new_pints = (existing['pints'] or 0) + pints
            new_half_pints = (existing['half_pints'] or 0) + half_pints
            new_liters_33 = (existing['liters_33'] or 0) + liters_33
            
            cursor.execute('''
                UPDATE consumption 
                SET pints = ?, half_pints = ?, liters_33 = ?
                WHERE user_id = ? AND date = ? AND time = ?
            ''', (new_pints, new_half_pints, new_liters_33, user_id, date, time))
        else:
            # Créer une nouvelle entrée
            cursor.execute('''
                INSERT INTO consumption (user_id, date, time, pints, half_pints, liters_33)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, date, time, pints, half_pints, liters_33))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_consumption(user_id, start_date=None, end_date=None):
        """Obtenir la consommation d'un utilisateur"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM consumption WHERE user_id = ?'
        params = [user_id]
        
        if start_date:
            query += ' AND date >= ?'
            params.append(start_date)
        
        if end_date:
            query += ' AND date <= ?'
            params.append(end_date)
        
        query += ' ORDER BY date DESC, time DESC'
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        conn.close()
        
        return records
    
    @staticmethod
    def delete_user(user_id):
        """Supprimer un utilisateur et ses données"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM consumption WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
