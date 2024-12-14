class SmartphoneFilter extends BaseProductFilter {
    constructor() {
        super();
        this.categoryId = 1; // Smartphones
    }

    getFilterValues() {
        // Récupérer toutes les valeurs des filtres
        const values = {
            minPrice: document.getElementById('min-price')?.value || '',
            maxPrice: document.getElementById('max-price')?.value || '',
            manufacturer: document.getElementById('manufacturer')?.value || '',
            minRam: document.getElementById('min-ram')?.value || '',
            storage: document.getElementById('storage')?.value || '',
            screenSize: document.getElementById('screen-size')?.value || '',
            refreshRate: document.getElementById('refresh-rate')?.value || '',
            battery: document.getElementById('battery')?.value || '',
            os: document.getElementById('os')?.value || ''
        };

        // Créer l'objet de filtres pour l'API
        const filters = {};
        
        // N'ajouter que les filtres qui ont une valeur
        if (values.minPrice) filters.minPrice = parseFloat(values.minPrice);
        if (values.maxPrice) filters.maxPrice = parseFloat(values.maxPrice);
        if (values.manufacturer) filters.manufacturer = values.manufacturer;
        if (values.minRam) filters.minRam = parseInt(values.minRam);
        if (values.storage) filters.storage = parseInt(values.storage);
        if (values.screenSize) filters.screenSize = parseFloat(values.screenSize);
        if (values.refreshRate) filters.refreshRate = parseInt(values.refreshRate);
        if (values.battery) filters.battery = parseInt(values.battery);
        if (values.os) filters.os = values.os;

        return filters;
    }

    async loadProducts() {
        try {
            this.showLoading();
            const filters = this.getFilterValues();
            
            // Construire l'URL avec la catégorie
            const url = `${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}`;
            
            // Envoyer les filtres dans le body de la requête
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.products = data.data;
                this.sortAndDisplayProducts();
                this.updateResultsCount();
                this.updatePagination();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des produits');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('error', 'Erreur lors du chargement des produits');
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Ajouter les écouteurs pour les filtres spécifiques aux smartphones
        const smartphoneFilters = [
            'min-ram', 'storage', 'screen-size', 
            'refresh-rate', 'battery', 'os'
        ];

        smartphoneFilters.forEach(filterId => {
            document.getElementById(filterId)?.addEventListener('change', () => {
                this.loadProducts();
            });
        });
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer',
            'min-ram', 'storage', 'screen-size',
            'refresh-rate', 'battery', 'os'
        ];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        this.loadProducts();
        this.showToast('success', 'Filtres réinitialisés');
    }
}

// Rendre la classe disponible globalement
window.SmartphoneFilter = SmartphoneFilter;