// TabletFilter.js

class TabletFilter extends BaseProductFilter {
    initializeFilters() {
        console.log('Initializing tablet filters');
        const filters = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'connectivity', 'usage-type', 'os'
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

    getFilterValues() {
        const values = {
            minPrice: document.getElementById('min-price')?.value || '',
            maxPrice: document.getElementById('max-price')?.value || '',
            manufacturer: document.getElementById('manufacturer')?.value || '',
            minRam: document.getElementById('min-ram')?.value || '',
            storage: document.getElementById('storage')?.value || '',
            screenSize: document.getElementById('screen-size')?.value || '',
            connectivity: document.getElementById('connectivity')?.value || '',
            usageType: document.getElementById('usage-type')?.value || '',
            os: document.getElementById('os')?.value || ''
        };

        console.log('Tablet filter values:', values);
        return values;
    }

    generateSpecsSummary(product) {
        const specs = [];
        
        if (product.ram_capacity) specs.push(`${product.ram_capacity} Go RAM`);
        if (product.storage_capacity) specs.push(`${product.storage_capacity} Go`);
        if (product.screen_size) specs.push(`${product.screen_size}"`);
        if (product.connectivity) specs.push(product.connectivity);
        if (product.os) specs.push(product.os);
        
        return specs.join(' • ') || 'Spécifications non disponibles';
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'connectivity', 'usage-type', 'os'
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
window.TabletFilter = TabletFilter;