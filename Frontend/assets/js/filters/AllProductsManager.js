class AllProductsManager {
    constructor() {
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.sortOrder = 'date-desc';
        this.loading = false;
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadAllManufacturers();
            await this.loadProducts();
            await this.loadFavorites(); // Ajoutez ceci
            this.setupEventListeners();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            toastManager.error('Erreur lors de l\'initialisation de la page');
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

    async loadAllManufacturers() {
        try {
            const manufacturers = new Set();
            
            for (const categoryId of [1, 2, 3]) {
                const response = await fetch(
                    `${window.appConfig.baseUrl}/Backend/api/products.php?action=manufacturers&category=${categoryId}`
                );
                const data = await response.json();
                if (data.success && Array.isArray(data.data)) {
                    data.data.forEach(manufacturer => manufacturers.add(manufacturer));
                }
            }

            const manufacturerSelect = document.getElementById('manufacturer');
            if (manufacturerSelect) {
                manufacturerSelect.innerHTML = '<option value="">Toutes les marques</option>';
                [...manufacturers].sort().forEach(manufacturer => {
                    const option = document.createElement('option');
                    option.value = manufacturer;
                    option.textContent = manufacturer;
                    manufacturerSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des fabricants:', error);
            toastManager.error('Erreur lors du chargement des fabricants');
        }
    }

    async loadProducts() {
        try {
            this.showLoading();
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/products.php?action=getAll`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.products = data.data;
                this.handleFilters();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des produits');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toastManager.error(error.message || 'Erreur lors du chargement des produits');
        } finally {
            this.hideLoading();
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

    sortAndDisplayProducts(products) {
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
                default:
                    return 0;
            }
        });

        this.displayProducts(sortedProducts);
        this.updatePagination(sortedProducts.length);
        this.updateResultsCount(sortedProducts.length);
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

    createProductCard(product) {
        const defaultImageUrl = `${window.appConfig.baseUrl}/Frontend/assets/images/Products/default-product.jpg`;
        
        return `
            <div class="relative block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <!-- Voting Buttons and Favorite Icon Section -->
                   <div class="absolute top-3 left-3 z-10">
                    <button
                        type="button"
                        title="${product.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-primary/50 ${product.isFavorite ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-500'}"
                        data-product-id="${product.id}"
                        data-is-favorite="${product.isFavorite ? '1' : '0'}"
                        onclick="window.productsManager.toggleFavorite(event, this)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="${product.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
                
                <div class="absolute top-3 right-3 z-10 flex items-center space-x-3 p-2 bg-white border border-primary/50 rounded-full shadow-lg">
                    <button
                        type="button"
                        title="Pas convaincu(e) ? Vous pouvez baisser la température."
                        class="overflow-visible flex items-center justify-center text-blue-500 hover:text-blue-700"
                        data-vote-type="down"
                        data-product-id="${product.id}"
                        onclick="window.productsManager.handleTemperatureVote(event, this)">
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
                        onclick="window.productsManager.handleTemperatureVote(event, this)">
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
                             style="object-fit: contain;
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

    updatePagination(totalItems) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let pagination = `<div class="flex items-center justify-center space-x-2">`;

        // Bouton précédent
        pagination += `
            <button 
                class="px-3 py-2 rounded-lg ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${this.currentPage === 1 ? 'disabled' : ''}
                onclick="window.productsManager.changePage(${this.currentPage - 1})">
                Précédent
            </button>`;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            pagination += `
                <button 
                    class="px-3 py-2 rounded-lg ${i === this.currentPage ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                    onclick="window.productsManager.changePage(${i})">
                    ${i}
                </button>`;
        }

        // Bouton suivant
        pagination += `
            <button 
                class="px-3 py-2 rounded-lg ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${this.currentPage === totalPages ? 'disabled' : ''}
                onclick="window.productsManager.changePage(${this.currentPage + 1})">
                Suivant
            </button>`;

        pagination += '</div>';
        container.innerHTML = pagination;
    }

    changePage(page) {
        this.currentPage = page;
        this.handleFilters();
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
        toastManager.success('Filtres réinitialisés');
    }

    updateResultsCount(count) {
        const element = document.getElementById('results-count');
        if (element) {
            element.textContent = `${count} produit${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
        }
    }

    async handleTemperatureVote(event, button) {
        event.preventDefault();
        event.stopPropagation();

        const user = localStorage.getItem('user');
        if (!user) {
            toastManager.warning('Vous devez être connecté pour voter. Redirection vers la page de connexion...');
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
                toastManager.success('Vote enregistré avec succès !');
            } else {
                throw new Error(data.message || 'Erreur lors du vote');
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            toastManager.error('Une erreur est survenue lors du vote. Veuillez réessayer.');
        }
    }
    

    
        async toggleFavorite(event, button) {
            event.preventDefault();
            event.stopPropagation();
        
            try {
                const user = localStorage.getItem('user');
                if (!user) {
                    toastManager.warning('Vous devez être connecté pour gérer les favoris. Redirection vers la page de connexion...');
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
                    // Mettre à jour l'état du bouton immédiatement
                    button.dataset.isFavorite = (!isFavorite).toString();
                    button.title = !isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
                    button.classList.toggle('text-blue-500', !isFavorite);
                    button.classList.toggle('text-gray-400', isFavorite);
                    button.querySelector('svg').setAttribute('fill', !isFavorite ? 'currentColor' : 'none');
                    
                    // Recharger les produits pour maintenir la synchronisation
                    await this.loadProducts();
                    await this.loadFavorites();
                    
                    toastManager.success(`Produit ${!isFavorite ? 'ajouté aux' : 'retiré des'} favoris avec succès !`);
                } else {
                    throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
                }
                
            } catch (error) {
                console.error('Detailed error in toggleFavorite:', error);
                toastManager.error('Une erreur est survenue lors de la mise à jour des favoris. Veuillez réessayer.');
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
                this.sortAndDisplayProducts(this.products);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des favoris');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des favoris:', error);
            toastManager.error('Une erreur est survenue lors du chargement des favoris. Veuillez réessayer.');
        }
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

    showError(message) {
        const container = document.getElementById('products-grid');
        if (container) {
            container.innerHTML = `
                <p class="text-center text-red-500 col-span-full py-8">
                    Une erreur est survenue lors du chargement des produits: ${message}
                </p>`;
        }
        toastManager.error(message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.productsManager = new AllProductsManager();
});