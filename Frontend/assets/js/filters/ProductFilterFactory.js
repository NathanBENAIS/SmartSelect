// ProductFilterFactory.js
class ProductFilterFactory {
    static create() {
        const categoryId = this.getCategoryFromPath();
        console.log('Creating filter for category:', categoryId);

        switch(categoryId) {
            case '1': 
                console.log('Creating SmartphoneFilter');
                return new SmartphoneFilter();
            case '2':
                console.log('Creating ComputerFilter');
                return new ComputerFilter();
            case '3':
                console.log('Creating TabletFilter');
                return new TabletFilter();
            default:
                console.error('Invalid category ID:', categoryId);
                throw new Error(`Invalid category ID: ${categoryId}`);
        }
    }

    static getCategoryFromPath() {
        const path = window.location.pathname.toLowerCase();
        console.log('Current path:', path);
        
        if (path.includes('smartphones.html')) return '1';
        if (path.includes('ordinateurs.html')) return '2';
        if (path.includes('tablettes.html')) return '3';
        return '1';  // Default to smartphones if no match
    }

    static isValidCategory(categoryId) {
        return ['1', '2', '3'].includes(categoryId);
    }

    static getCategoryName(categoryId) {
        const categoryNames = {
            '1': 'Smartphones',
            '2': 'Ordinateurs',
            '3': 'Tablettes'
        };
        return categoryNames[categoryId] || 'Catégorie inconnue';
    }

    static getAllCategories() {
        return [
            { id: '1', name: 'Smartphones' },
            { id: '2', name: 'Ordinateurs' },
            { id: '3', name: 'Tablettes' }
        ];
    }
    static updatePageTitle(categoryId) {
        const categoryName = this.getCategoryName(categoryId);
        document.title = `SmartSelect - ${categoryName}`;
    }

    static initializeErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('ProductFilterFactory Error:', event.error);
            // Vous pouvez ajouter ici une gestion d'erreur supplémentaire si nécessaire
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Gestion des rejets de promesse non gérés
        });
    }
}

// Initialiser la gestion d'erreurs au chargement du fichier
ProductFilterFactory.initializeErrorHandling();

// Rendre la factory disponible globalement
window.ProductFilterFactory = ProductFilterFactory;