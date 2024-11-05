// category.js

// Configuration globale
window.appConfig = {
    baseUrl: window.location.origin // ou votre URL de base spécifique
};

// Fonction pour initialiser tous les écouteurs d'événements
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
        }
    });
}

// Fonction d'initialisation principale
function initializeCategory() {
    console.log('Category.js: Initializing category page');
    
    // Vérification de la configuration
    if (!window.appConfig) {
        console.error('Configuration manquante. Assurez-vous que window.appConfig est défini.');
        return;
    }

    try {
        // Récupérer la catégorie depuis l'URL
        const categoryId = new URLSearchParams(window.location.search).get('category') || '1';

        // Vérifier si la catégorie est valide
        if (!ProductFilterFactory.isValidCategory(categoryId)) {
            console.error('Catégorie invalide:', categoryId);
            // Rediriger vers une page d'erreur ou la première catégorie
            window.location.href = '?category=1';
            return;
        }

        // Mettre à jour le titre de la page
        ProductFilterFactory.updatePageTitle(categoryId);

        // Créer l'instance du filtre approprié
        window.productFilter = ProductFilterFactory.create(categoryId);
        
        // Initialiser les écouteurs d'événements
        initializeEventListeners();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la catégorie:', error);
        // Gérer l'erreur (afficher un message à l'utilisateur, etc.)
    }
}

// Fonction pour la gestion des erreurs globales
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // Ici vous pouvez ajouter une logique pour afficher les erreurs à l'utilisateur
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Gestion des rejets de promesses non gérés
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Category.js: DOM Content Loaded');
    
    // Mettre en place la gestion des erreurs
    setupErrorHandling();
    
    // Initialiser la page de catégorie
    initializeCategory();
});

// Exposer certaines fonctions globalement si nécessaire
window.categoryModule = {
    initializeCategory,
    initializeEventListeners
};