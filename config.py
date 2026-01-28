import os
from pathlib import Path

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False
    PERMANENT_SESSION_LIFETIME = 86400 * 3
    
    ADMIN_USERNAME = 'admin'
    
    @staticmethod
    def get_admin_password():
        """
        Lit le mot de passe depuis un volume mount (recommandé)
        Compatible avec: Kubernetes Secrets, External Secrets, Docker Secrets
        """
        # Chemins possibles selon l'orchestrateur
        possible_paths = [
            '/run/secrets/admin_password',  # Docker Swarm/Compose
            '/etc/secrets/admin_password',   # Kubernetes volume mount
            '/mnt/secrets/admin_password'    # Alternative mount path
        ]
        
        for secret_path in possible_paths:
            if Path(secret_path).exists():
                try:
                    with open(secret_path, 'r') as f:
                        password = f.read().strip()
                        if password:
                            return password
                except Exception as e:
                    print(f"Erreur lecture secret {secret_path}: {e}")
        
        # Fallback sur variable d'environnement (moins sécurisé)
        env_password = os.environ.get('ADMIN_PASSWORD')
        if env_password:
            print("⚠️  ATTENTION: Mot de passe admin lu depuis variable d'environnement")
            return env_password
        
        # Dernière option: valeur par défaut (dev uniquement)
        print("⚠️  ATTENTION: Utilisation du mot de passe admin par défaut!")
        return 'admin123'
    
     # Charger le mot de passe au démarrage et le stocker comme attribut de classe
    ADMIN_PASSWORD = get_admin_password.__func__()
