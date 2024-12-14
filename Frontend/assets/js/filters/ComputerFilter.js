class ComputerFilter extends BaseProductFilter {
    constructor() {
        super();
        this.categoryId = 2; // Ordinateurs
    }

    getFilterValues() {
        return {
            minPrice: document.getElementById('min-price')?.value || '',
            maxPrice: document.getElementById('max-price')?.value || '',
            manufacturer: document.getElementById('manufacturer')?.value || '',
            minRam: document.getElementById('min-ram')?.value || '',
            storage: document.getElementById('storage')?.value || '',
            processor: document.getElementById('processor')?.value || '',
            gpu: document.getElementById('gpu')?.value || '',
            screenSize: document.getElementById('screen-size')?.value || '',
            usage: document.getElementById('usage')?.value || ''
        };
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
            
            // Filtre de processeur
            if (filters.processor && (!product.processor_brand || 
                !product.processor_brand.toLowerCase().includes(filters.processor.toLowerCase()))) return false;
            
            // Filtre de GPU
            if (filters.gpu && (!product.gpu_brand || 
                !product.gpu_brand.toLowerCase().includes(filters.gpu.toLowerCase()))) return false;
            
            // Filtre de taille d'écran
            if (filters.screenSize && (!product.screen_size || 
                parseFloat(product.screen_size) < parseFloat(filters.screenSize))) return false;

            // Filtre d'usage (si disponible dans les données)
            if (filters.usage && product.usage !== filters.usage) return false;

            return true;
        });

        // Mettre à jour la liste filtrée et tous les éléments d'affichage
        this.displayProducts(filteredProducts);
        this.updateResultsCount(filteredProducts.length);
        this.updatePagination(Math.ceil(filteredProducts.length / this.itemsPerPage));
    }

    updateResultsCount(count) {
        const element = document.getElementById('results-count');
        if (element) {
            element.textContent = `${count} produit${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
        }
    }

    // Pour s'assurer que la pagination est aussi mise à jour correctement
    updatePagination(totalPages = Math.ceil(this.products.length / this.itemsPerPage)) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';

        if (totalPages > 1) {
            paginationHTML = '<div class="flex items-center justify-center space-x-2">';
            
            // Bouton précédent
            paginationHTML += `
                <button 
                    class="px-3 py-2 rounded-lg ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="window.productFilter.changePage(${this.currentPage - 1})">
                    Précédent
                </button>`;

            // Pages
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `
                    <button 
                        class="px-3 py-2 rounded-lg ${i === this.currentPage ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                        onclick="window.productFilter.changePage(${i})">
                        ${i}
                    </button>`;
            }

            // Bouton suivant
            paginationHTML += `
                <button 
                    class="px-3 py-2 rounded-lg ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="window.productFilter.changePage(${this.currentPage + 1})">
                    Suivant
                </button>`;

            paginationHTML += '</div>';
        }

        paginationContainer.innerHTML = paginationHTML;
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
                this.filterProducts(); // Ceci va maintenant mettre à jour le compte correctement
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
        // Filtres numériques
        ['min-price', 'max-price'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.filterProducts());
        });

        // Filtres de sélection
        ['manufacturer', 'min-ram', 'storage', 'processor', 'gpu', 'screen-size', 'usage'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.filterProducts());
        });

        // Tri
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.filterProducts();
        });
    }

    resetFilters() {
        const filterIds = [
            'min-price', 'max-price', 'manufacturer', 'min-ram',
            'storage', 'processor', 'gpu', 'screen-size', 'usage'
        ];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.filterProducts();
        this.showToast('success', 'Filtres réinitialisés');
    }
}

// Rendre la classe disponible globalement
window.ComputerFilter = ComputerFilter;