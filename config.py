import os
from auth import hash_password

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')

    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be set")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.environ.get("USE_HTTPS", "0") == "1"
    PERMANENT_SESSION_LIFETIME = 86400 * 3

    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
