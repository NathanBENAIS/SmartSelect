// ComputerFilter.js

class ComputerFilter extends BaseProductFilter {
    initializeFilters() {
        console.log('Initializing computer filters');
        const filters = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'processor', 'gpu', 'usage'
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
            processor: document.getElementById('processor')?.value || '',
            gpu: document.getElementById('gpu')?.value || '',
            usage: document.getElementById('usage')?.value || ''
        };

        console.log('Computer filter values:', values);
        return values;
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