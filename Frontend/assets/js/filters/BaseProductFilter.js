class BaseProductFilter {
    constructor() {
        console.log('BaseProductFilter Constructor called');
        this.initialized = false;
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.sortOrder = 'price-asc';
        this.loading = false;
        this.categoryId = new URLSearchParams(window.location.search).get('category') || '1';

        this.bindMethods();
        this.init();
    }

    bindMethods() {
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.loadProducts = this.loadProducts.bind(this);
        this.sortProducts = this.sortProducts.bind(this);
        this.changePage = this.changePage.bind(this);
        this.resetFilters = this.resetFilters.bind(this);
    }

    showLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.remove('hidden');
        }
        this.loading = true;
    }

    hideLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.add('hidden');
        }
        this.loading = false;
    }

    async init() {
        console.log('Init method started');
        this.showLoading();
        try {
            await this.loadManufacturers();
            this.initializeFilters();
            await this.loadProducts();
            this.initialized = true;
            console.log('Init completed successfully');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        } finally {
            this.hideLoading();
        }
    }

    async loadManufacturers() {
        console.log('LoadManufacturers started');
        try {
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}&action=manufacturers`);
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const manufacturerSelect = document.getElementById('manufacturer');
                if (manufacturerSelect) {
                    data.data.forEach(manufacturer => {
                        const option = document.createElement('option');
                        option.value = manufacturer;
                        option.textContent = manufacturer;
                        manufacturerSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading manufacturers:', error);
        }
    }

    async loadProducts() {
        console.log('LoadProducts started');
        try {
            this.showLoading();
            const filters = this.getFilterValues();
            
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            
            const data = await response.json();
            if (data.success) {
                this.products = data.data;
                this.currentPage = 1;
                this.sortAndDisplayProducts();
                this.updateResultsCount();
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            this.hideLoading();
        }
    }

    sortAndDisplayProducts() {
        console.log('SortAndDisplayProducts started');
        const sortedProducts = [...this.products].sort((a, b) => {
            switch (this.sortOrder) {
                case 'price-asc':
                    return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
                case 'price-desc':
                    return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
                case 'rating-desc':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                default:
                    return 0;
            }
        });

        this.displayProducts(sortedProducts);
        this.updatePagination();
    }

    displayProducts(products) {
        console.log('DisplayProducts started with', products.length, 'products');
        const container = document.getElementById('products-grid');
        if (!container) {
            console.error('Products grid container not found');
            return;
        }

        container.innerHTML = '';

        if (!Array.isArray(products) || products.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Aucun produit trouvé.</p>';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedProducts = products.slice(start, end);

        paginatedProducts.forEach(product => {
            const cardElement = document.createElement('div');
            cardElement.innerHTML = this.createProductCard(product);
            container.appendChild(cardElement.firstElementChild);
        });
    }

    createProductCard(product) {
        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="aspect-w-3 aspect-h-2">
                    <img src="${product.image_url || window.appConfig.baseUrl + '/Frontend/assets/images/placeholder.png'}" 
                         alt="${product.name}"
                         class="w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
                    <p class="text-sm text-gray-600">${product.manufacturer}</p>
                    <div class="text-sm text-gray-600 mb-4">
                        ${this.generateSpecsSummary(product)}
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <div class="text-lg font-bold text-primary-600">
                            ${parseFloat(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </div>
                </div>
            </div>`;
    }

    updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `${this.products.length} produits trouvés`;
        }
    }

    updatePagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.products.length / this.itemsPerPage);
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

    changePage(page) {
        this.currentPage = page;
        this.sortAndDisplayProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sortProducts(order) {
        this.sortOrder = order;
        this.sortAndDisplayProducts();
    }

    initializeFilters() {
        throw new Error('initializeFilters must be implemented by child class');
    }

    getFilterValues() {
        throw new Error('getFilterValues must be implemented by child class');
    }

    generateSpecsSummary() {
        throw new Error('generateSpecsSummary must be implemented by child class');
    }
}

window.BaseProductFilter = BaseProductFilter;
