// Configuration globale
window.appConfig = {
    baseUrl: '/smartselect',
    apiUrl: '/smartselect/Backend/api'
};

// Fonction pour déterminer la catégorie en fonction de la page actuelle
function determineCategoryFromPage() {
    const currentPage = window.location.pathname.toLowerCase();
    console.log('Page courante:', currentPage);
    
    if (currentPage.includes('ordinateurs')) {
        console.log('Page ordinateurs détectée');
        return '2';
    } else if (currentPage.includes('tablettes')) {
        console.log('Page tablettes détectée');
        return '3';
    } else {
        console.log('Page smartphones détectée');
        return '1';
    }
}

// Gestionnaire pour réinitialiser les filtres
function initializeEventListeners() {
    // Gestionnaire pour réinitialiser les filtres
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (window.productFilter) {
                window.productFilter.resetFilters();
            }
        });
    }

    // Gestionnaire de tri
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            if (window.productFilter) {
                window.productFilter.sortProducts(e.target.value);
            }
        });
    }

    // Gestionnaire pour les entrées de prix
    ['min-price', 'max-price'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && window.productFilter) {
                    window.productFilter.loadProducts();
                }
            });

            // Ajouter un écouteur pour le changement de valeur
            element.addEventListener('change', () => {
                if (window.productFilter) {
                    window.productFilter.loadProducts();
                }
            });

            // Ajouter un écouteur pour la perte de focus
            element.addEventListener('blur', () => {
                if (window.productFilter) {
                    window.productFilter.loadProducts();
                }
            });
        }
    });

    // Gestionnaire pour les autres filtres
    const filterIds = [
        'manufacturer', 'min-ram', 'storage', 'screen-size',
        'connectivity', 'usage-type', 'os', 'processor', 'gpu', 'usage'
    ];

    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                if (window.productFilter) {
                    window.productFilter.loadProducts();
                }
            });
        }
    });
}

// Fonction d'initialisation principale
function initializeCategory() {
    console.log('Category.js: Initializing category page');
    
    if (!window.appConfig) {
        console.error('Configuration manquante. Assurez-vous que window.appConfig est défini.');
        return;
    }

    try {
        const categoryId = determineCategoryFromPage();
        console.log('Catégorie détectée:', categoryId);

        // Vérifier si la catégorie est valide
        if (!ProductFilterFactory.isValidCategory(categoryId)) {
            console.error('Catégorie invalide:', categoryId);
            return;
        }

        // Mettre à jour le titre de la page
        ProductFilterFactory.updatePageTitle(categoryId);

        // Créer l'instance du filtre approprié
        window.productFilter = ProductFilterFactory.create(categoryId);
        
        // Initialiser les écouteurs d'événements
        initializeEventListeners();

        // Ajouter un gestionnaire pour le rafraîchissement de la page
        window.addEventListener('beforeunload', () => {
            // Sauvegarder l'état des filtres si nécessaire
            if (window.productFilter) {
                const filters = window.productFilter.getFilterValues();
                sessionStorage.setItem('lastFilters', JSON.stringify(filters));
            }
        });

        // Restaurer les filtres précédents si nécessaire
        const lastFilters = sessionStorage.getItem('lastFilters');
        if (lastFilters && window.productFilter) {
            try {
                const filters = JSON.parse(lastFilters);
                // Implémenter la logique pour restaurer les filtres
                // Cette partie dépendra de votre implémentation spécifique
            } catch (e) {
                console.error('Erreur lors de la restauration des filtres:', e);
            }
        }

    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la catégorie:', error);
        // Afficher un message d'erreur à l'utilisateur
        const container = document.getElementById('products-grid');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-red-500 col-span-full py-8">
                    <p>Une erreur est survenue lors de l'initialisation de la page:</p>
                    <p class="mt-2">${error.message}</p>
                    <button 
                        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onclick="window.location.reload()">
                        Rafraîchir la page
                    </button>
                </div>`;
        }
    }
}

// Fonction pour la gestion des erreurs globales
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // Gérer les erreurs globales si nécessaire
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Gérer les rejets de promesse non gérés
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Category.js: DOM Content Loaded');
    setupErrorHandling();
    initializeCategory();
});

// Fonction utilitaire pour déboguer les requêtes API
function debugApiCall(url, options = {}) {
    console.log('Debug API Call:');
    console.log('URL:', url);
    console.log('Options:', options);
    return fetch(url, options)
        .then(response => {
            console.log('Response status:', response.status);
            return response;
        })
        .catch(error => {
            console.error('API call error:', error);
            throw error;
        });
}

// Exposer les fonctions et configurations nécessaires globalement
window.categoryModule = {
    determineCategoryFromPage,
    initializeCategory,
    initializeEventListeners,
    debugApiCall
};