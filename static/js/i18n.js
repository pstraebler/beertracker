(function () {
    const dictionaries = {
        fr: {
            page_dashboard_title: "Tableau de Bord - BeerTracker",
            page_admin_title: "Administration - BeerTracker",
            page_login_title: "BeerTracker - Connexion",
            page_password_title: "Changer le mot de passe - BeerTracker",
            navbar_change_password: "🔒 Changer mot de passe",
            navbar_logout: "Déconnexion",
            navbar_back_dashboard: "Retour au tableau de bord",
            warning_title: "⚠️ Alerte",
            add_consumption: "Ajouter une consommation",
            date: "Date",
            night_mode_activate: "🌙 Activer Mode Soirée",
            night_mode_active: "🌙 Mode Soirée ACTIF",
            beer_pints: "Pintes (50cl)",
            beer_halves: "Demis (25cl)",
            stats_title: "Statistiques",
            stats_from: "Depuis le",
            stats_to: "jusqu'au",
            update: "Mettre à jour",
            total: "Total",
            pints: "Pintes",
            halves: "Demis",
            estimated_cost: "Coût estimé",
            monthly_consumption: "Consommation par mois",
            last_four_weeks_consumption: "📊 Consommation sur les 4 dernières semaines",
            total_timeline: "Timeline totale",
            ranking_title: "Classement des plus gros buveurs (pour l'année {year})",
            rank: "Rang",
            user: "Utilisateur",
            liters_total: "Total en L",
            liters_total_short: "Total (en L)",
            export_data_title: "Exporter vos données",
            export_csv: "Télécharger en CSV",
            admin_title: "🍺 Administration",
            success: "Succès",
            error: "Erreur",
            import_success: "✅ Import réussi",
            import_partial: "⚠️ Import avec problèmes",
            auto_created_users: "👤 Utilisateurs créés automatiquement",
            temp_password: "Mot de passe temporaire",
            temp_password_warning: "⚠️ Important:",
            temp_password_warning_text: "Ces utilisateurs ont un mot de passe temporaire. Demandez-leur de le changer lors de leur première connexion ou changez-le depuis le panel admin.",
            user_management: "Gestion des utilisateurs",
            create_user: "Créer un nouvel utilisateur",
            nickname_placeholder: "Pseudo",
            password_placeholder: "Mot de passe",
            create: "Créer",
            existing_users: "Utilisateurs existants",
            new_password_placeholder: "Nouveau mot de passe",
            change_password_short: "Changer MDP",
            night_mode: "🌙 Mode Soirée",
            delete: "Supprimer",
            import_export: "Import / Export de données",
            export_all_data: "Exporter toutes les données",
            export_full_csv: "Télécharger CSV complet",
            import_data: "Importer des données",
            import: "Importer",
            expected_format_label: "Format attendu:",
            expected_format_value: "Utilisateur | Date | Pintes | Demis | 33cl",
            missing_users_created: "Les utilisateurs manquants seront créés automatiquement.",
            login_username: "Pseudo",
            login_password: "Mot de passe",
            login_button: "Connexion",
            change_password_title: "🔒 Changer le mot de passe",
            current_password: "Mot de passe actuel",
            new_password: "Nouveau mot de passe",
            confirm_new_password: "Confirmer le nouveau mot de passe",
            change_password_button: "Modifier le mot de passe",
            confirm_delete_user: "Êtes-vous sûr ?",
            switch_to_other_language: "English",
            night_mode_modal_title: "🌙 Activer le Mode Soirée ?",
            night_mode_modal_intro: "Le mode soirée vous empêchera de :",
            night_mode_modal_item_1: "Décrémenter le nombre de bières",
            night_mode_modal_item_2: "Modifier la date",
            night_mode_modal_warning: "⏰ Le mode se désactivera automatiquement demain à 7h.",
            cancel: "Annuler",
            activate: "Activer",
            error_night_mode_activation: "Erreur lors de l'activation du mode soirée",
            night_mode_notification: "🌙 Mode Soirée activé ! Jusqu'à demain 7h.",
            night_mode_block_decrement: "⚠️ Mode Soirée actif : impossible de retirer une bière 😏",
            error_save_connection: "Erreur lors de l'enregistrement. Vérifiez votre connexion.",
            alert_three_hour_title: "⚠️ Plus de 1.5L bu depuis {time}",
            alert_total: "Total",
            chart_cumulative_label: "Total cumulé (L)",
            chart_weekly_dataset: "Litres consommés",
            chart_weekly_title: "4 dernières semaines (en litres)",
            chart_unit_liters: "L",
            week_of: "Semaine du",
            days_of_drinking: "⚠️ {count} jours de consommation cette semaine ({days})",
            day_0: "lundi",
            day_1: "mardi",
            day_2: "mercredi",
            day_3: "jeudi",
            day_4: "vendredi",
            day_5: "samedi",
            day_6: "dimanche",
            error_generic_update: "Erreur lors de la modification"
        },
        en: {
            page_dashboard_title: "Dashboard - BeerTracker",
            page_admin_title: "Administration - BeerTracker",
            page_login_title: "BeerTracker - Login",
            page_password_title: "Change Password - BeerTracker",
            navbar_change_password: "🔒 Change password",
            navbar_logout: "Log out",
            navbar_back_dashboard: "Back to dashboard",
            warning_title: "⚠️ Alert",
            add_consumption: "Add consumption",
            date: "Date",
            night_mode_activate: "🌙 Enable Night Mode",
            night_mode_active: "🌙 Night Mode ACTIVE",
            beer_pints: "Pints (50cl)",
            beer_halves: "Half-pints (25cl)",
            stats_title: "Statistics",
            stats_from: "From",
            stats_to: "to",
            update: "Update",
            total: "Total",
            pints: "Pints",
            halves: "Half-pints",
            estimated_cost: "Estimated cost",
            monthly_consumption: "Consumption by month",
            last_four_weeks_consumption: "📊 Consumption over the last 4 weeks",
            total_timeline: "Full timeline",
            ranking_title: "Top drinkers ranking (for {year})",
            rank: "Rank",
            user: "User",
            liters_total: "Total in L",
            liters_total_short: "Total (L)",
            export_data_title: "Export your data",
            export_csv: "Download as CSV",
            admin_title: "🍺 Administration",
            success: "Success",
            error: "Error",
            import_success: "✅ Import successful",
            import_partial: "⚠️ Import with issues",
            auto_created_users: "👤 Automatically created users",
            temp_password: "Temporary password",
            temp_password_warning: "⚠️ Important:",
            temp_password_warning_text: "These users have a temporary password. Ask them to change it on first login or change it in the admin panel.",
            user_management: "User management",
            create_user: "Create a new user",
            nickname_placeholder: "Username",
            password_placeholder: "Password",
            create: "Create",
            existing_users: "Existing users",
            new_password_placeholder: "New password",
            change_password_short: "Change password",
            night_mode: "🌙 Night Mode",
            delete: "Delete",
            import_export: "Data import / export",
            export_all_data: "Export all data",
            export_full_csv: "Download full CSV",
            import_data: "Import data",
            import: "Import",
            expected_format_label: "Expected format:",
            expected_format_value: "User | Date | Pints | Half-pints | 33cl",
            missing_users_created: "Missing users will be created automatically.",
            login_username: "Username",
            login_password: "Password",
            login_button: "Login",
            change_password_title: "🔒 Change password",
            current_password: "Current password",
            new_password: "New password",
            confirm_new_password: "Confirm new password",
            change_password_button: "Update password",
            confirm_delete_user: "Are you sure?",
            switch_to_other_language: "Français",
            night_mode_modal_title: "🌙 Enable Night Mode?",
            night_mode_modal_intro: "Night mode will prevent you from:",
            night_mode_modal_item_1: "Decreasing beer quantities",
            night_mode_modal_item_2: "Changing the date",
            night_mode_modal_warning: "⏰ Mode will automatically disable tomorrow at 7am.",
            cancel: "Cancel",
            activate: "Enable",
            error_night_mode_activation: "Error while enabling night mode",
            night_mode_notification: "🌙 Night mode enabled! Until tomorrow at 7am.",
            night_mode_block_decrement: "⚠️ Night mode is active: you cannot remove a beer 😏",
            error_save_connection: "Error while saving. Please check your connection.",
            alert_three_hour_title: "⚠️ More than 1.5L consumed since {time}",
            alert_total: "Total",
            chart_cumulative_label: "Cumulative total (L)",
            chart_weekly_dataset: "Liters consumed",
            chart_weekly_title: "Last 4 weeks (in liters)",
            chart_unit_liters: "L",
            week_of: "Week of",
            days_of_drinking: "⚠️ {count} days of drinking this week ({days})",
            day_0: "Monday",
            day_1: "Tuesday",
            day_2: "Wednesday",
            day_3: "Thursday",
            day_4: "Friday",
            day_5: "Saturday",
            day_6: "Sunday",
            error_generic_update: "Error while updating"
        }
    };

    const languageStorageKey = "beertracker_lang";
    let currentLanguage = "en";

    function isSupported(lang) {
        return Object.prototype.hasOwnProperty.call(dictionaries, lang);
    }

    function detectBrowserLanguage() {
        const browserLanguage = (navigator.language || navigator.userLanguage || "en").toLowerCase();
        return browserLanguage.startsWith("fr") ? "fr" : "en";
    }

    function persistLanguage(lang) {
        localStorage.setItem(languageStorageKey, lang);
        document.cookie = `lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }

    function t(key, vars) {
        const dict = dictionaries[currentLanguage] || dictionaries.en;
        let value = dict[key] || dictionaries.en[key] || key;
        if (!vars) return value;
        Object.keys(vars).forEach((varKey) => {
            value = value.replace(`{${varKey}}`, vars[varKey]);
        });
        return value;
    }

    function applyBasicTranslations() {
        const titleKey = document.body ? document.body.getAttribute("data-i18n-title") : null;
        if (titleKey) {
            document.title = t(titleKey);
        }

        document.querySelectorAll("[data-i18n]").forEach((element) => {
            element.textContent = t(element.getAttribute("data-i18n"));
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
            element.placeholder = t(element.getAttribute("data-i18n-placeholder"));
        });

        document.querySelectorAll("[data-i18n-html]").forEach((element) => {
            element.innerHTML = t(element.getAttribute("data-i18n-html"));
        });

        document.querySelectorAll("[data-i18n-with-year]").forEach((element) => {
            const key = element.getAttribute("data-i18n-with-year");
            const year = element.getAttribute("data-year");
            element.textContent = t(key, { year });
        });
    }

    function applyConfirmMessages() {
        document.querySelectorAll("[data-i18n-confirm]").forEach((form) => {
            if (form.dataset.i18nConfirmBound === "true") {
                return;
            }
            form.addEventListener("submit", function (event) {
                const key = form.getAttribute("data-i18n-confirm");
                if (!window.confirm(t(key))) {
                    event.preventDefault();
                }
            });
            form.dataset.i18nConfirmBound = "true";
        });
    }

    function getToggleFlag() {
        return currentLanguage === "fr" ? "🇬🇧" : "🇫🇷";
    }

    function updateLanguageButtons() {
        document.querySelectorAll(".language-toggle-btn").forEach((button) => {
            button.textContent = getToggleFlag();
            button.title = t("switch_to_other_language");
            button.setAttribute("aria-label", t("switch_to_other_language"));
        });
    }

    function applyTranslations() {
        document.documentElement.lang = currentLanguage;
        applyBasicTranslations();
        applyConfirmMessages();
        updateLanguageButtons();
    }

    function setLanguage(lang, persist = true) {
        const normalizedLang = (lang || "").toLowerCase();
        if (!isSupported(normalizedLang)) {
            return;
        }
        currentLanguage = normalizedLang;
        if (persist) {
            persistLanguage(currentLanguage);
        }
        applyTranslations();
        document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: currentLanguage } }));
    }

    function toggleLanguage() {
        setLanguage(currentLanguage === "fr" ? "en" : "fr");
    }

    function initLanguage() {
        const forceBrowserLanguage = document.body && document.body.getAttribute("data-force-browser-language") === "true";
        if (forceBrowserLanguage) {
            setLanguage(detectBrowserLanguage(), false);
            return;
        }

        const storedLanguage = localStorage.getItem(languageStorageKey);
        const initialLanguage = isSupported(storedLanguage) ? storedLanguage : detectBrowserLanguage();
        setLanguage(initialLanguage, true);

        document.querySelectorAll(".language-toggle-btn").forEach((button) => {
            if (button.dataset.languageBound === "true") {
                return;
            }
            button.addEventListener("click", toggleLanguage);
            button.dataset.languageBound = "true";
        });
    }

    window.BeerTrackerI18n = {
        t,
        initLanguage,
        setLanguage,
        toggleLanguage,
        getCurrentLanguage: function () { return currentLanguage; }
    };

    document.addEventListener("DOMContentLoaded", initLanguage);
})();
