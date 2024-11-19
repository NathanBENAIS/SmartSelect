class FavoritesManager {
    constructor() {
        this.favorites = [];
        this.loading = false;
        if (this.isOnFavoritesPage()) {
            this.initialize();
        }
    }

    isOnFavoritesPage() {
        return window.location.pathname.includes('favorites.html');
    }

    async initialize() {
        try {
            await this.loadFavorites();
            this.setupEventListeners();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            toastManager.error('Erreur lors de l\'initialisation de la page');
        }
    }

    setupEventListeners() {
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.sortAndDisplayFavorites();
        });
    }

    async loadFavorites() {
        try {
            const user = localStorage.getItem('user');
            if (!user) {
                if (this.isOnFavoritesPage()) {
                    const container = document.getElementById('favorites-grid');
                    if (container) {
                        container.innerHTML = `
                            <div class="col-span-full text-center py-8">
                                <p class="text-gray-500 mb-4">Vous devez être connecté pour voir vos favoris</p>
                            </div>`;
                    }
                }
                return;
            }

            const userData = JSON.parse(user);
            this.showLoading();

            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/favorites.php?user_id=${userData.id}`);
            const data = await response.json();

            if (data.success) {
                this.favorites = data.data;
                if (this.isOnFavoritesPage()) {
                    this.displayFavorites();
                    this.updateResultsCount(this.favorites.length);
                }
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des favoris');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toastManager.error(error.message || 'Erreur lors du chargement des favoris');
        } finally {
            this.hideLoading();
        }
    }
    
    sortAndDisplayFavorites() {
        const sortedFavorites = [...this.favorites].sort((a, b) => {
            switch (this.sortOrder) {
                case 'date-desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'price-asc':
                    return parseFloat(a.price) - parseFloat(b.price);
                case 'price-desc':
                    return parseFloat(b.price) - parseFloat(a.price);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        this.displayFavorites(sortedFavorites);
    }

    displayFavorites() {
        const container = document.getElementById('favorites-grid');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500 mb-4">Vous n'avez pas encore de favoris</p>
                    <a href="products.html" class="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Découvrir nos produits
                    </a>
                </div>`;
            return;
        }

        container.innerHTML = this.favorites.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const defaultImageUrl = `${window.appConfig.baseUrl}/Frontend/assets/images/Products/default-product.jpg`;
        
        return `
            <div class="relative block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <!-- Favorite Icon Section -->
                <div class="absolute top-3 left-3 z-10">
                  <button
                        type="button"
                        title="Retirer des favoris"
                        class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-primary/50 text-blue-500 hover:text-blue-700"
                        data-product-id="${product.id}"
                        data-is-favorite="1"
                        onclick="window.favoritesManager.handleFavoriteClick(event, '${product.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
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

    async handleFavoriteClick(event, productId) {
        event.preventDefault();
        event.stopPropagation();
        
        const user = localStorage.getItem('user');
        if (!user) {
            toastManager.warning('Vous devez être connecté pour gérer les favoris');
            return;
        }

        const button = event.currentTarget;
        const isFavorite = button.dataset.isFavorite === '1';
        
        try {
            const userData = JSON.parse(user);
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/favorites.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.id,
                    product_id: productId,
                    action: isFavorite ? 'remove' : 'add'
                })
            });
    
            const data = await response.json();
            if (data.success) {
                button.dataset.isFavorite = (!isFavorite).toString();
                button.classList.toggle('text-blue-500', !isFavorite);
                button.classList.toggle('text-gray-400', isFavorite);
                button.querySelector('svg').setAttribute('fill', !isFavorite ? 'currentColor' : 'none');
                
                toastManager.success(`Produit ${!isFavorite ? 'ajouté aux' : 'retiré des'} favoris`);
                
                if (window.location.pathname.includes('favorites.html')) {
                    await this.loadFavorites();
                }
            } else {
                throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toastManager.error('Une erreur est survenue lors de la mise à jour des favoris');
        }
    }

    updateResultsCount(count) {
        const element = document.getElementById('results-count');
        if (element) {
            element.textContent = `${count} favori${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
        }
    }

    showLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.classList.remove('hidden');
        this.loading = true;
    }

    hideLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.classList.add('hidden');
        this.loading = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = new FavoritesManager();
});