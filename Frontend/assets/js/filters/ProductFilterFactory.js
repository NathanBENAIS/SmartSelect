// ProductFilterFactory.js
class ProductFilterFactory {
    static create(categoryId = null) {
        // Si pas de categoryId fourni, essayer de le récupérer depuis l'URL
        if (!categoryId) {
            categoryId = new URLSearchParams(window.location.search).get('category') || '1';
        }

        console.log('Creating filter for category:', categoryId);

        // Créer et retourner l'instance appropriée
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

    static isValidCategory(categoryId) {
        const validCategories = ['1', '2', '3'];
        return validCategories.includes(categoryId);
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
            // On pourrait ajouter ici un traitement d'erreur supplémentaire
            // Comme l'affichage d'un message à l'utilisateur
        });
    }
}

// Initialiser la gestion d'erreurs au chargement du fichier
ProductFilterFactory.initializeErrorHandling();

// Rendre la factory disponible globalement
window.ProductFilterFactory = ProductFilterFactory;