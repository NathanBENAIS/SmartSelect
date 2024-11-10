// ComputerFilter.js

class ComputerFilter extends BaseProductFilter {
    async initializeFilters() {
        console.log('Initializing computer filters');
        
        // Charger les données des filtres
        await Promise.all([
            this.loadSelectOptions('manufacturer'),
            this.loadSelectOptions('ram'),
            this.loadSelectOptions('storage'),
            this.loadSelectOptions('processor'),
            this.loadSelectOptions('gpu'),
            this.loadSelectOptions('screen_size')
        ]);

        // Initialiser les écouteurs d'événements
        const filters = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'processor', 'gpu', 'screen-size'
        ];
        
        filters.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log(`Filter ${id} changed to ${element.value}`);
                    this.loadProducts();
                });

                if (id.includes('price')) {
                    element.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') this.loadProducts();
                    });
                }
            }
        });
    }

    async loadSelectOptions(filterType) {
        try {
            const response = await fetch(`${window.appConfig.apiUrl}/filters.php?category=2&type=${filterType}`);
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById(filterType);
                if (select) {
                    select.innerHTML = '<option value="">Tous</option>';
                    data.data.forEach(option => {
                        const optElement = document.createElement('option');
                        switch(filterType) {
                            case 'processor':
                                optElement.value = option.brand;
                                optElement.textContent = `${option.brand} ${option.model}`;
                                break;
                            case 'gpu':
                                optElement.value = option.brand;
                                optElement.textContent = `${option.brand} ${option.model}`;
                                break;
                            case 'storage':
                                optElement.value = option.storage_capacity;
                                optElement.textContent = `${option.storage_capacity} Go ${option.storage_type || ''}`;
                                break;
                            default:
                                optElement.value = option;
                                optElement.textContent = option;
                        }
                        select.appendChild(optElement);
                    });
                }
            }
        } catch (error) {
            console.error(`Error loading ${filterType} options:`, error);
        }
    }

    generateSpecsSummary(product) {
        const specs = [];
        
        if (product.ram_capacity) specs.push(`${product.ram_capacity} Go RAM`);
        if (product.storage_capacity) specs.push(`${product.storage_capacity} Go ${product.storage_type || ''}`);
        if (product.processor_model) specs.push(product.processor_model);
        if (product.gpu_model) specs.push(product.gpu_model);
        if (product.screen_size) specs.push(`${product.screen_size}"`);
        
        return specs.join(' • ') || 'Spécifications non disponibles';
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'processor', 'gpu', 'usage'
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
window.ComputerFilter = ComputerFilter;