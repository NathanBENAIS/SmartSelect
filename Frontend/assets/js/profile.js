class ProfileManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.initializeEventListeners();
    }

    loadUserData() {
        const userData = localStorage.getItem('user');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }

        this.user = JSON.parse(userData);
        this.updateProfileDisplay();
        this.populateForm();
    }

    updateProfileDisplay() {
        // Mettre à jour les initiales
        const initialsElement = document.getElementById('profile-initials');
        if (initialsElement) {
            initialsElement.textContent = this.getInitials(this.user.username);
        }

        // Mettre à jour le nom d'utilisateur et l'email
        document.getElementById('profile-username').textContent = this.user.username;
        document.getElementById('profile-email').textContent = this.user.email;
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    populateForm() {
        document.getElementById('username').value = this.user.username;
        document.getElementById('email').value = this.user.email;
    }

    initializeEventListeners() {
        // Gestionnaire pour le formulaire
        document.getElementById('profile-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Gestionnaire pour la suppression du compte
        document.getElementById('delete-account').addEventListener('click', () => this.handleDeleteAccount());
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const formData = {
            user_id: this.user.id,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            current_password: document.getElementById('current-password').value,
            new_password: document.getElementById('new-password').value,
            confirm_password: document.getElementById('confirm-password').value
        };

        // Validation basique
        if (!formData.username || !formData.email) {
            toastManager.error('Le nom d\'utilisateur et l\'email sont requis');
            return;
        }

        if (!this.validateEmail(formData.email)) {
            toastManager.error('L\'adresse email n\'est pas valide');
            return;
        }

        // Validation du mot de passe si changement demandé
        if (formData.new_password || formData.confirm_password) {
            if (!formData.current_password) {
                toastManager.error('Le mot de passe actuel est requis pour le changement');
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                toastManager.error('Les nouveaux mots de passe ne correspondent pas');
                return;
            }
            if (formData.new_password.length < 8) {
                toastManager.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
                return;
            }
        }

        try {
            const response = await fetch(`${window.appConfig.apiUrl}/update-profile.php?action=update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Mise à jour du localStorage
                this.user = {
                    ...this.user,
                    username: formData.username,
                    email: formData.email
                };
                localStorage.setItem('user', JSON.stringify(this.user));

                // Mise à jour de l'affichage
                this.updateProfileDisplay();
                
                // Réinitialiser les champs de mot de passe
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';

                toastManager.success('Profil mis à jour avec succès');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toastManager.error(error.message || 'Erreur lors de la mise à jour du profil');
        }
    }

    async handleDeleteAccount() {
        const confirmed = confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
        
        if (!confirmed) return;

        try {
            const response = await fetch(`${window.appConfig.apiUrl}/update-profile.php?action=delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.user.id
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('user');
                toastManager.success('Compte supprimé avec succès. Redirection...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toastManager.error(error.message || 'Erreur lors de la suppression du compte');
        }
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});