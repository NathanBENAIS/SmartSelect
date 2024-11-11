// Configuration de l'URL de base de l'API
const API_URL = 'http://localhost/smartselect/Backend';

// Fonction pour initialiser les gestionnaires d'événements
// Fonction pour initialiser les gestionnaires d'événements
function initializeLoginHandlers() {
    // Gestion du bouton de connexion dans le header
    const loginButton = document.querySelector('button.bg-blue-600');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    // Gestion du lien d'inscription
    const signInLink = document.querySelector('a[href="#"]');
    if (signInLink) {
        signInLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'signIn.html';
        });
    }

    // Sélectionner les boutons de soumission
    const loginSubmitButton = document.querySelector('button.bg-blue-500');
    const signInSubmitButton = document.querySelector('button.bg-blue-500');

    // Gestion du formulaire de connexion
    if (loginSubmitButton && window.location.pathname.includes('login.html')) {
        loginSubmitButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
    
            if (!emailInput.value || !passwordInput.value) {
                toastManager.warning('Veuillez remplir tous les champs');
                return;
            }
    
            try {
                const response = await fetch(`${API_URL}/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });
    
                const data = await response.json();
                
                if (data.success) {
                    toastManager.success('Connexion réussie !');
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    toastManager.error(data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                toastManager.error('Erreur lors de la connexion');
            }
        });
    }
    
    // Gestion du formulaire d'inscription
    if (signInSubmitButton && window.location.pathname.includes('signIn.html')) {
        signInSubmitButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirm-password');
    
            if (!nameInput.value || !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
                toastManager.warning('Veuillez remplir tous les champs');
                return;
            }
    
            if (passwordInput.value !== confirmPasswordInput.value) {
                toastManager.error('Les mots de passe ne correspondent pas');
                return;
            }
    
            try {
                const response = await fetch(`${API_URL}/register.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: nameInput.value,
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });
    
                const data = await response.json();
                
                if (data.success) {
                    toastManager.success('Inscription réussie! Vous allez être redirigé vers la page de connexion.');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    toastManager.error(data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                toastManager.error('Erreur lors de l\'inscription');
            }
        });
    }
}

// Écouter l'événement personnalisé 'headerLoaded'
document.addEventListener('headerLoaded', () => {
    initializeLoginHandlers();
});

// Aussi vérifier au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeLoginHandlers();
});