class TabletFilter extends BaseProductFilter {
    constructor() {
        super();
        this.categoryId = 3; // Tablettes
    }

    async loadProducts() {
        try {
            this.showLoading();
            const url = `${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data;
                this.filterProducts();
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

    getFilterValues() {
        return {
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
    }

    filterProducts() {
        const filters = this.getFilterValues();
        const filteredProducts = this.products.filter(product => {
            // Filtre de prix
            if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
            
            // Filtre de marque
            if (filters.manufacturer && (!product.manufacturer || 
                !product.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase()))) return false;
            
            // Filtre de RAM
            if (filters.minRam && (!product.ram_capacity || 
                parseInt(product.ram_capacity) < parseInt(filters.minRam))) return false;
            
            // Filtre de stockage
            if (filters.storage && (!product.storage_capacity || 
                parseInt(product.storage_capacity) < parseInt(filters.storage))) return false;
            
            // Filtre de taille d'écran
            if (filters.screenSize && product.screen_size) {
                const size = parseFloat(product.screen_size);
                if (filters.screenSize === "8" && size < 8) return false;
                if (filters.screenSize === "10" && (size < 10 || size >= 12)) return false;
                if (filters.screenSize === "12" && (size < 12 || size >= 14)) return false;
                if (filters.screenSize === "14" && size < 14) return false;
            }
            
            // Filtre de connectivité
            if (filters.connectivity && (!product.connectivity || 
                !product.connectivity.toLowerCase().includes(filters.connectivity.toLowerCase()))) return false;

            // Filtre d'usage
            if (filters.usageType && (!product.usage_type || 
                product.usage_type !== filters.usageType)) return false;

            // Filtre OS
            if (filters.os && (!product.operating_system || 
                !product.operating_system.toLowerCase().includes(filters.os.toLowerCase()))) return false;

            return true;
        });

        // Mettre à jour l'affichage
        this.displayProducts(filteredProducts);
        this.updateResultsCount(filteredProducts.length);
        this.updatePagination(Math.ceil(filteredProducts.length / this.itemsPerPage));
    }

    setupEventListeners() {
        // Filtres numériques
        ['min-price', 'max-price'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.filterProducts());
        });

        // Filtres de sélection
        ['manufacturer', 'min-ram', 'storage', 'screen-size', 
         'connectivity', 'usage-type', 'os'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.filterProducts());
        });

        // Tri
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.filterProducts();
        });
    }

    generateSpecsSummary(product) {
        const specs = [];
        
        if (product.ram_capacity) specs.push(`${product.ram_capacity} Go RAM`);
        if (product.storage_capacity) specs.push(`${product.storage_capacity} Go`);
        if (product.screen_size) specs.push(`${product.screen_size}"`);
        if (product.connectivity) specs.push(product.connectivity);
        if (product.operating_system) specs.push(product.operating_system);
        
        return specs.join(' • ') || 'Spécifications non disponibles';
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer', 'min-ram', 
            'storage', 'screen-size', 'connectivity', 'usage-type', 'os'
        ];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.filterProducts();
        this.showToast('success', 'Filtres réinitialisés');
    }

    updateResultsCount(count) {
        const element = document.getElementById('results-count');
        if (element) {
            element.textContent = `${count} produit${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
        }
    }
}

// Rendre la classe disponible globalement
window.TabletFilter = TabletFilter;