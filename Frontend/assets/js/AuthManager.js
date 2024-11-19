// Configuration de l'URL de base de l'API
const API_URL = 'http://localhost/smartselect/Backend';

class AuthManager {
    static isUserLoggedIn() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    static requireAuth(redirectUrl = 'login.html') {
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();
        const user = this.isUserLoggedIn();
        
        // Liste des pages publiques (qui ne nécessitent pas d'authentification)
        const publicPages = [
            'index.html',
            '',
            'login.html',
            'register.html'
        ];

        // Si c'est une page publique, on ne fait rien
        if (publicPages.includes(currentPage)) {
            return;
        }

        // Si l'utilisateur n'est pas connecté et que la page n'est pas publique,
        // on redirige vers la page de login
        if (!user) {
            window.location.href = redirectUrl;
        }
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                toastManager.success('Connexion réussie !');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                return true;
            } else {
                toastManager.error(data.message);
                return false;
            }
        } catch (error) {
            console.error('Erreur:', error);
            toastManager.error('Erreur lors de la connexion');
            return false;
        }
    }

    static logout() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifie l'authentification
    AuthManager.requireAuth();
});