// SmartphoneFilter.js

class SmartphoneFilter extends BaseProductFilter {
    initializeFilters() {
        console.log('Initializing smartphone filters');
        // Filtres de base
        const filters = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'refresh-rate', 'battery', 'os'
        ];
        
        filters.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log(`Filter ${id} changed to ${element.value}`);
                    this.loadProducts();
                });

                // Ajouter un événement pour la touche Enter sur les champs de prix
                if (id.includes('price')) {
                    element.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') this.loadProducts();
                    });
                }
            }
        });
    }

    async initializeCategorySpecificFilters() {
        console.log('Initializing smartphone specific filters');
        
        try {
            // Charger les options pour les différents filtres
            await Promise.all([
                this.loadSelectOptions('min-ram', 'filters.php?type=ram&category=1', 'Toutes les RAM'),
                this.loadSelectOptions('storage', 'filters.php?type=storage&category=1', 'Tout le stockage'),
                this.loadSelectOptions('screen-size', 'filters.php?type=screen_size&category=1', 'Toutes les tailles'),
                this.loadSelectOptions('refresh-rate', 'filters.php?type=refresh_rate&category=1', 'Tous les taux'),
                this.loadSelectOptions('battery', 'filters.php?type=battery&category=1', 'Toutes les capacités'),
                this.loadSelectOptions('os', 'filters.php?type=os&category=1', 'Tous les OS')
            ]);

            // Ajouter les écouteurs d'événements
            const filters = [
                'min-ram', 'storage', 'screen-size', 
                'refresh-rate', 'battery', 'os'
            ];

            filters.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', () => this.loadProducts());
                }
            });
        } catch (error) {
            console.error('Error initializing smartphone filters:', error);
        }
    }

    getFilterValues() {
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

        console.log('Filter values:', values);
        return values;
    }

    generateSpecsSummary(product) {
        const specs = [];
        
        if (product.ram) specs.push(`${product.ram} Go RAM`);
        if (product.storage_capacity) specs.push(`${product.storage_capacity} Go`);
        if (product.screen_size) specs.push(`${product.screen_size}"`);
        if (product.battery_capacity) specs.push(`${product.battery_capacity} mAh`);
        if (product.operating_system) specs.push(product.operating_system);
        if (product.refresh_rate) specs.push(`${product.refresh_rate} Hz`);
        
        return specs.join(' • ') || 'Spécifications non disponibles';
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'refresh-rate', 'battery', 'os'
        ];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`Resetting filter ${id}`);
                element.value = '';
            }
        });

        this.loadProducts();
    }
}

// Rendre la classe disponible globalement
window.SmartphoneFilter = SmartphoneFilter;
