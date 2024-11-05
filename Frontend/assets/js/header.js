// Fonction pour vérifier si un utilisateur est connecté
function isUserLoggedIn() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Fonction pour mettre à jour la section d'authentification
function updateAuthSection() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    const user = isUserLoggedIn();

    if (user) {
        // Version connectée
        authSection.innerHTML = `
            <div class="relative">
                <button id="user-menu-button" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    <span>${user.username}</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mon profil</a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mes favoris</a>
                    <hr class="my-1">
                    <button id="logout-button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        Se déconnecter
                    </button>
                </div>
            </div>
        `;

        // Gestion du menu utilisateur
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Fermer le menu si on clique ailleurs
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    } else {
        // Version non connectée
        authSection.innerHTML = `
            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Connexion
            </button>
        `;

        // Ajouter l'événement de redirection vers la page de connexion
        const loginButton = authSection.querySelector('button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }
}

// Fonction d'initialisation des menus
function initializeMenus() {
    const megaMenuButton = document.getElementById('mega-menu-dropdown-button');
    const megaMenuDropdown = document.getElementById('mega-menu-dropdown');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu-2');

    // Initialiser la section d'authentification
    updateAuthSection();

    if (megaMenuButton && megaMenuDropdown) {
        // Gestion du menu déroulant des catégories
        megaMenuButton.addEventListener('click', () => {
            const isExpanded = megaMenuButton.getAttribute('aria-expanded') === 'true';
            megaMenuDropdown.classList.toggle('hidden');
            megaMenuButton.setAttribute('aria-expanded', !isExpanded);
        });

        // Fermer le menu déroulant quand on clique en dehors
        document.addEventListener('click', (event) => {
            const isClickInside = megaMenuButton.contains(event.target) || 
                                megaMenuDropdown.contains(event.target);
            
            if (!isClickInside && !megaMenuDropdown.classList.contains('hidden')) {
                megaMenuDropdown.classList.add('hidden');
                megaMenuButton.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (mobileMenuButton && mobileMenu) {
        // Gestion du menu mobile
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenu.classList.toggle('hidden');
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        if (mobileMenu && window.innerWidth >= 1024) {
            mobileMenu.classList.remove('hidden');
        }
        
        if (megaMenuDropdown && megaMenuButton) {
            megaMenuDropdown.classList.add('hidden');
            megaMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
}

// Écouter l'événement personnalisé 'headerLoaded'
document.addEventListener('headerLoaded', () => {
    console.log('Header loaded, initializing menus...');
    initializeMenus();
});

// Aussi vérifier au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('header-container').children.length > 0) {
        initializeMenus();
    }
});