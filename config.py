import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # À mettre à True en HTTPS
    PERMANENT_SESSION_LIFETIME = 86400 * 3  # 3 jours
    
    # Admin credentials
    ADMIN_USERNAME = 'admin'
    ADMIN_PASSWORD = 'admin123'  # À changer absolument en production

