class BaseProductFilter {
    constructor() {
        // Définir les méthodes avant de les lier
        this.handleFilters = this.handleFilters.bind(this);
        this.resetFilters = this.resetFilters.bind(this);
        this.loadProducts = this.loadProducts.bind(this);
        this.sortAndDisplayProducts = this.sortAndDisplayProducts.bind(this);
        this.updateResultsCount = this.updateResultsCount.bind(this);
        this.updatePagination = this.updatePagination.bind(this);
        this.changePage = this.changePage.bind(this);
        this.handleTemperatureVote = this.handleTemperatureVote.bind(this);
        this.toggleFavorite = this.toggleFavorite.bind(this);
        
        console.log('BaseProductFilter Constructor called');
        this.bindMethods();
        this.initialized = false;
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.sortOrder = 'date-desc';
        this.loading = false;
        
        
        // Get category from current page
        const path = window.location.pathname.toLowerCase();
        if (path.includes('smartphones')) this.categoryId = '1';
        else if (path.includes('ordinateurs')) this.categoryId = '2';
        else if (path.includes('tablettes')) this.categoryId = '3';
        else this.categoryId = '1';
        
        console.log('Selected category:', this.categoryId);
        this.initialize();
    }

    determineCategoryFromPage() {
        // Cette méthode doit être implémentée selon votre logique de page
        return 1; // Valeur par défaut
    }

    bindMethods() {
        // Liaison des méthodes à l'instance
        // this.showLoading = this.showLoading.bind(this);
        // this.hideLoading = this.hideLoading.bind(this);
        // this.handleFilters = this.handleFilters.bind(this);
        // this.resetFilters = this.resetFilters.bind(this);
        // this.sortProducts = this.sortProducts.bind(this);
        // this.changePage = this.changePage.bind(this);
        // this.handleTemperatureVote = this.handleTemperatureVote.bind(this);
        // this.toggleFavorite = this.toggleFavorite.bind(this);
        // this.loadProducts = this.loadProducts.bind(this);
        // this.sortAndDisplayProducts = this.sortAndDisplayProducts.bind(this);
        // this.updateResultsCount = this.updateResultsCount.bind(this);
        // this.updatePagination = this.updatePagination.bind(this);
  
   // Original method bindings
   this.handleFilters = this.handleFilters.bind(this);
   this.resetFilters = this.resetFilters.bind(this);
   this.loadProducts = this.loadProducts.bind(this);
   this.sortAndDisplayProducts = this.sortAndDisplayProducts.bind(this);
   this.updateResultsCount = this.updateResultsCount.bind(this);
   this.updatePagination = this.updatePagination.bind(this);
   this.changePage = this.changePage.bind(this);
   this.handleTemperatureVote = this.handleTemperatureVote.bind(this);
   this.toggleFavorite = this.toggleFavorite.bind(this);
    }

    async initialize() {
        try {
            await this.loadAllManufacturers();
            await this.loadProducts();
            await this.loadFavorites();
            this.setupEventListeners();
            this.initialized = true;
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            this.showToast('error', 'Erreur lors de l\'initialisation de la page');
        }
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('min-price')?.addEventListener('input', () => this.handleFilters());
        document.getElementById('max-price')?.addEventListener('input', () => this.handleFilters());
        document.getElementById('manufacturer')?.addEventListener('change', () => this.handleFilters());
        document.getElementById('storage')?.addEventListener('change', () => this.handleFilters());
        document.getElementById('category-filter')?.addEventListener('change', () => this.handleFilters());
        
        // Tri
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.handleFilters();
        });

        // Reset
        document.getElementById('reset-filters')?.addEventListener('click', () => this.resetFilters());
    }

    showToast(type, message) {
        if (typeof toastManager === 'undefined') {
            console.warn('ToastManager non disponible, utilisation de alert comme fallback');
            alert(message);
            return;
        }
        toastManager[type](message);
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

    async loadAllManufacturers() {
        try {
            const response = await fetch(
                `${window.appConfig.baseUrl}/Backend/api/products.php?action=manufacturers&category=${this.categoryId}`
            );
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const manufacturerSelect = document.getElementById('manufacturer');
                if (manufacturerSelect) {
                    manufacturerSelect.innerHTML = '<option value="">Toutes les marques</option>';
                    data.data.sort().forEach(manufacturer => {
                        const option = document.createElement('option');
                        option.value = manufacturer;
                        option.textContent = manufacturer;
                        manufacturerSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading manufacturers:', error);
            this.showToast('error', 'Error loading manufacturers');
        }
    }
    async loadProducts() {
        try {
            this.showLoading();
            const filters = this.getFilterValues();
            const url = `${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });

            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            const data = await response.json();
            if (data.success) {
                this.products = data.data;
                this.sortAndDisplayProducts();
                this.updateResultsCount();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('error', 'Erreur lors du chargement des produits');
        } finally {
            this.hideLoading();
        }
    }

    async loadFavorites() {
        const user = localStorage.getItem('user');
        if (!user) return;
    
        const userData = JSON.parse(user);
    
        try {
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/favorites.php?user_id=${userData.id}`);
            const data = await response.json();
    
            if (data.success) {
                const favorites = data.data;
                favorites.forEach(favorite => {
                    const productIndex = this.products.findIndex(p => p.id === favorite.id);
                    if (productIndex !== -1) {
                        this.products[productIndex].isFavorite = true;
                    }
                });
                this.sortAndDisplayProducts();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des favoris');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des favoris:', error);
            this.showToast('error', 'Une erreur est survenue lors du chargement des favoris');
        }
    }

    handleFilters() {
        const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
        const manufacturer = document.getElementById('manufacturer')?.value;
        const storage = document.getElementById('storage')?.value;
        const category = document.getElementById('category-filter')?.value;

        const filteredProducts = this.products.filter(product => {
            const price = parseFloat(product.price);
            return (
                price >= minPrice &&
                price <= maxPrice &&
                (!manufacturer || product.manufacturer === manufacturer) &&
                (!storage || (product.storage_capacity && parseInt(product.storage_capacity) >= parseInt(storage))) &&
                (!category || product.category_id === parseInt(category))
            );
        });

        this.sortAndDisplayProducts(filteredProducts);
    }

    sortAndDisplayProducts(products = this.products) {
        const sortedProducts = [...products].sort((a, b) => {
            switch (this.sortOrder) {
                case 'date-desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'price-asc':
                    return parseFloat(a.price) - parseFloat(b.price);
                case 'price-desc':
                    return parseFloat(b.price) - parseFloat(a.price);
                case 'rating-desc':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'temperature-desc':
                    return (b.temperature || 0) - (a.temperature || 0);
                default:
                    return 0;
            }
        });

        this.displayProducts(sortedProducts);
        this.updatePagination();
        this.updateResultsCount();
    }

    displayProducts(products) {
        const container = document.getElementById('products-grid');
        if (!container) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const productsToShow = products.slice(start, end);

        if (productsToShow.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Aucun produit trouvé.</p>';
            return;
        }

        container.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
    }

    generateSpecsSummary(product) {
        const specs = [];
        
        if (product.storage_capacity) {
            specs.push(`${product.storage_capacity} Go`);
        }
        if (product.ram || product.ram_capacity) {
            specs.push(`${product.ram || product.ram_capacity} Go RAM`);
        }
        if (product.screen_size) {
            specs.push(`${product.screen_size}"`);
        }
        if (product.processor_brand && product.processor_model) {
            specs.push(`${product.processor_brand} ${product.processor_model}`);
        }

        return specs.join(' • ') || 'Caractéristiques non disponibles';
    }

    createProductCard(product) {
        const defaultImageUrl = `${window.appConfig.baseUrl}/Frontend/assets/images/Products/default-product.jpg`;
        
        return `
            <div class="relative block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <!-- Favorite Button -->
                <div class="absolute top-3 left-3 z-10">
                    <button
                        type="button"
                        title="${product.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-primary/50 ${product.isFavorite ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-500'}"
                        data-product-id="${product.id}"
                        data-is-favorite="${product.isFavorite ? '1' : '0'}"
                        onclick="window.productFilter.toggleFavorite(event, this)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="${product.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                <!-- Temperature Voting Section -->
                <div class="absolute top-3 right-3 z-10 flex items-center space-x-3 p-2 bg-white border border-primary/50 rounded-full shadow-lg">
                    <button
                        type="button"
                        title="Pas convaincu(e) ? Vous pouvez baisser la température."
                        class="overflow-visible flex items-center justify-center text-blue-500 hover:text-blue-700"
                        data-vote-type="down"
                        data-product-id="${product.id}"
                        onclick="window.productFilter.handleTemperatureVote(event, this)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M5 12h14v2H5z"/>
                        </svg>
                    </button>
                    <span
                        title="Actuellement évalué à ${product.temperature || '0'}° par la communauté."
                        class="text-sm font-medium text-yellow-500"
                        data-temperature="${product.id}">
                        ${product.temperature || '0'}°
                    </span>
                    <button
                        type="button"
                        title="Bon deal ? Votez pour le mettre en avant !"
                        class="overflow-visible flex items-center justify-center text-red-500 hover:text-red-700"
                        data-vote-type="up"
                        data-product-id="${product.id}"
                        onclick="window.productFilter.handleTemperatureVote(event, this)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <a href="detailproduct.html?id=${product.id}" class="block">
                    <div class="aspect-w-3 aspect-h-2">
                        <img src="${product.image_url || defaultImageUrl}" 
                             alt="${product.name}"
                             class="w-full h-48 object-cover"
                             style="object-fit: contain;"
                             onerror="this.src='${defaultImageUrl}'">
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
                        <p class="text-sm text-gray-600 mb-2">${product.manufacturer || 'Non spécifié'}</p>
                        <div class="text-sm text-gray-600 mb-4">
                            ${this.generateSpecsSummary(product)}
                        </div>
                        <div class="flex items-center justify-between mt-4">
                            <div>
                                ${product.promo_price ? `
                                    <span class="text-lg font-bold text-red-500">${parseFloat(product.promo_price).toLocaleString('fr-FR')} €</span>
                                    <span class="text-sm text-gray-400 line-through ml-2">${parseFloat(product.price).toLocaleString('fr-FR')} €</span>
                                ` : `
                                    <span class="text-lg font-bold text-gray-800">${parseFloat(product.price).toLocaleString('fr-FR')} €</span>
                                `}
                            </div>
                            ${product.rating ? `
                                <div class="flex items-center">
                                    <span class="text-yellow-400">★</span>
                                    <span class="text-sm text-gray-600 ml-1">${Number(product.rating).toFixed(1)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </a>
            </div>`;
    }

    async handleTemperatureVote(event, button) {
        event.preventDefault();
        event.stopPropagation();

        const user = localStorage.getItem('user');
        if (!user) {
            this.showToast('warning', 'Vous devez être connecté pour voter. Redirection vers la page de connexion...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const userData = JSON.parse(user);
        const productId = button.dataset.productId;
        const voteType = button.dataset.voteType;

        try {
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/temperature-vote.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.id,
                    product_id: productId,
                    vote_type: voteType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const temperatureElement = document.querySelector(`[data-temperature="${productId}"]`);
                if (temperatureElement) {
                    temperatureElement.textContent = `${data.newTemperature}°`;
                    temperatureElement.title = `Actuellement évalué à ${data.newTemperature}° par la communauté.`;
                }

                const productIndex = this.products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    this.products[productIndex].temperature = data.newTemperature;
                }
                this.showToast('success', 'Vote enregistré avec succès !');
            } else {
                throw new Error(data.message || 'Erreur lors du vote');
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            this.showToast('error', 'Une erreur est survenue lors du vote');
        }
    }

    async toggleFavorite(event, button) {
        event.preventDefault();
        event.stopPropagation();
    
        try {
            const user = localStorage.getItem('user');
            if (!user) {
                this.showToast('warning', 'Vous devez être connecté pour gérer les favoris. Redirection vers la page de connexion...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
    
            const userData = JSON.parse(user);
            const productId = button.dataset.productId;
            const isFavorite = button.dataset.isFavorite === '1';
            const action = isFavorite ? 'remove' : 'add';
    
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/favorites.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.id,
                    product_id: productId,
                    action: action
                })
            });

            const data = await response.json();
            
            if (data.success) {
                button.dataset.isFavorite = (!isFavorite).toString();
                button.title = !isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
                button.classList.toggle('text-blue-500', !isFavorite);
                button.classList.toggle('text-gray-400', isFavorite);
                button.querySelector('svg').setAttribute('fill', !isFavorite ? 'currentColor' : 'none');
                
                await this.loadProducts();
                await this.loadFavorites();
                
                this.showToast('success', `Produit ${!isFavorite ? 'ajouté aux' : 'retiré des'} favoris avec succès !`);
            } else {
                throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
            }
            
        } catch (error) {
            console.error('Detailed error in toggleFavorite:', error);
            this.showToast('error', 'Une erreur est survenue lors de la mise à jour des favoris');
        }
    }

    updateResultsCount() {
        const element = document.getElementById('results-count');
        if (element) {
            element.textContent = `${this.products.length} produit${this.products.length > 1 ? 's' : ''} trouvé${this.products.length > 1 ? 's' : ''}`;
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

    resetFilters() {
        const elements = {
            'category-filter': '',
            'min-price': '',
            'max-price': '',
            'manufacturer': '',
            'storage': ''
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.value = value;
        }

        this.handleFilters();
        this.showToast('success', 'Filtres réinitialisés');
    }

    // Méthodes abstraites à implémenter dans les classes enfants
    initializeFilters() {
        throw new Error('initializeFilters must be implemented by child class');
    }

    getFilterValues() {
        throw new Error('getFilterValues must be implemented by child class');
    }
}

// Rendre la classe disponible globalement
window.BaseProductFilter = BaseProductFilter;