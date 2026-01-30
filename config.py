import os
from auth import hash_password
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be set")

    APP_PORT = os.environ.get('APP_PORT')
    if not APP_PORT:
        raise RuntimeError("APP_PORT must be set")
    
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.environ.get("USE_HTTPS", "0") == "1"
    
    PERMANENT_SESSION_LIFETIME = 86400 * 3
