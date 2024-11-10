class BaseProductFilter {
    constructor() {
        console.log('BaseProductFilter Constructor called');
        this.initialized = false;
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.sortOrder = 'price-asc';
        this.loading = false;
        
        this.categoryId = determineCategoryFromPage();
        console.log('Catégorie sélectionnée:', this.categoryId);

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
        this.updateResultsCount = this.updateResultsCount.bind(this);
        this.handleTemperatureVote = this.handleTemperatureVote.bind(this);
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
            const url = `${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}&action=manufacturers`;
            console.log('Requête manufacturers URL:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Réponse brute:', responseText);

            if (!responseText) {
                throw new Error('Réponse vide du serveur');
            }

            const data = JSON.parse(responseText);
            console.log('Données fabricants reçues:', data);

            if (data.success && Array.isArray(data.data)) {
                const manufacturerSelect = document.getElementById('manufacturer');
                if (manufacturerSelect) {
                    // Vider les options existantes sauf la première
                    while (manufacturerSelect.options.length > 1) {
                        manufacturerSelect.remove(1);
                    }

                    // Ajouter les nouveaux fabricants
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
            const url = `${window.appConfig.baseUrl}/Backend/api/products.php?category=${this.categoryId}`;
            console.log('Requête produits URL:', url);
            console.log('Filtres:', filters);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Réponse brute:', responseText);

            if (!responseText) {
                throw new Error('Réponse vide du serveur');
            }

            const data = JSON.parse(responseText);
            console.log('Données produits reçues:', data);

            if (data.success) {
                this.products = data.data;
                this.currentPage = 1;
                this.sortAndDisplayProducts();
                this.updateResultsCount();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des produits');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            const container = document.getElementById('products-grid');
            if (container) {
                container.innerHTML = `<p class="text-center text-red-500 col-span-full py-8">
                    Une erreur est survenue lors du chargement des produits: ${error.message}
                </p>`;
            }
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
        const defaultImageUrl = `${window.appConfig.baseUrl}/Frontend/assets/images/Products/default-product.jpg`;
        
        return `
            <div class="relative block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <!-- Voting Buttons Section -->
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
                             onerror="this.src='${defaultImageUrl}'">
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
                </a>
            </div>`;
    }

    async handleTemperatureVote(event, button) {
        event.preventDefault();
        event.stopPropagation();

        // Vérifier si l'utilisateur est connecté en utilisant localStorage
        const user = localStorage.getItem('user');
        if (!user) {
            alert('Vous devez être connecté pour voter. Veuillez vous connecter ou créer un compte.');
            window.location.href = 'login.html';
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
                    user_id: userData.id, // Ajouter l'ID de l'utilisateur
                    product_id: productId,
                    vote_type: voteType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Mettre à jour l'affichage de la température
                const temperatureElement = document.querySelector(`[data-temperature="${productId}"]`);
                if (temperatureElement) {
                    temperatureElement.textContent = `${data.newTemperature}°`;
                }
            } else {
                throw new Error(data.message || 'Erreur lors du vote');
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            alert('Une erreur est survenue lors du vote. Veuillez réessayer.');
        }
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

    // Méthodes abstraites à implémenter dans les classes enfants
    initializeFilters() {
        throw new Error('initializeFilters must be implemented by child class');
    }

    getFilterValues() {
        throw new Error('getFilterValues must be implemented by child class');
    }



    resetFilters() {
        throw new Error('resetFilters must be implemented by child class');
    }
}

// Rendre la classe disponible globalement
window.BaseProductFilter = BaseProductFilter;