from flask import request

SUPPORTED_LANGUAGES = {"fr", "en"}
DEFAULT_LANGUAGE = "en"

TRANSLATIONS = {
    "fr": {
        "login_incorrect_password": "Mot de passe incorrect",
        "login_unknown_user": "Utilisateur non trouvé",
        "admin_user_required": "Le nom d'utilisateur et le mot de passe sont requis",
        "admin_user_created": "Utilisateur créé avec succès",
        "admin_user_create_error": "Erreur lors de la création de l'utilisateur",
        "admin_no_file_sent": "Aucun fichier envoyé.",
        "admin_no_file_selected": "Aucun fichier sélectionné.",
        "admin_import_completed": "Import terminé: {count} entrées importées",
        "admin_import_users_created": "Utilisateurs créés: {count}",
        "admin_import_important": "IMPORTANT: Changez ces mots de passe par défaut !",
        "admin_import_errors": "Erreurs: {count}",
        "night_mode_enabled": "Mode soirée activé",
        "night_mode_disabled": "Mode soirée désactivé",
        "password_all_fields_required": "Tous les champs sont requis",
        "password_mismatch": "Les nouveaux mots de passe ne correspondent pas",
        "password_too_short": "Le mot de passe doit contenir au moins 6 caractères",
        "password_current_incorrect": "Mot de passe actuel incorrect",
        "password_changed_success": "Mot de passe modifié avec succès",
    },
    "en": {
        "login_incorrect_password": "Incorrect password",
        "login_unknown_user": "User not found",
        "admin_user_required": "Username and password are required",
        "admin_user_created": "User created successfully",
        "admin_user_create_error": "Error while creating user",
        "admin_no_file_sent": "No file sent.",
        "admin_no_file_selected": "No file selected.",
        "admin_import_completed": "Import complete: {count} entries imported",
        "admin_import_users_created": "Users created: {count}",
        "admin_import_important": "IMPORTANT: Change these default passwords!",
        "admin_import_errors": "Errors: {count}",
        "night_mode_enabled": "Night mode enabled",
        "night_mode_disabled": "Night mode disabled",
        "password_all_fields_required": "All fields are required",
        "password_mismatch": "New passwords do not match",
        "password_too_short": "Password must contain at least 6 characters",
        "password_current_incorrect": "Current password is incorrect",
        "password_changed_success": "Password changed successfully",
    },
}


def detect_language_from_header(header_value):
    if not header_value:
        return DEFAULT_LANGUAGE

    normalized = header_value.lower()
    if "fr" in normalized:
        return "fr"
    return "en"


def get_request_language():
    if request.endpoint in {"login", "change_password"}:
        return detect_language_from_header(request.headers.get("Accept-Language", ""))

    cookie_lang = request.cookies.get("lang", "").lower()
    if cookie_lang in SUPPORTED_LANGUAGES:
        return cookie_lang
    return detect_language_from_header(request.headers.get("Accept-Language", ""))


def t(key, lang=None, **kwargs):
    selected_lang = lang if lang in SUPPORTED_LANGUAGES else get_request_language()
    template = TRANSLATIONS.get(selected_lang, {}).get(key)
    if template is None:
        template = TRANSLATIONS["en"].get(key, key)
    if kwargs:
        return template.format(**kwargs)
    return template
