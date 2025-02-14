// Frontend: currentlyProducts.js
class CurrentlyProducts {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        try {
            await this.loadProducts();
            await this.loadFavorites();
            this.displayProducts();
            this.initializeScrollButtons();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            toastManager.error('Erreur lors de l\'initialisation de la page');
        }
    }

    async loadProducts() {
        try {
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/products.php?action=getLatest`);
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            toastManager.error('Erreur lors du chargement des produits');
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
                this.displayProducts();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des favoris');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des favoris:', error);
            toastManager.error('Une erreur est survenue lors du chargement des favoris');
        }
    }

    initializeScrollButtons() {
        const container = document.getElementById('products-container');
        const leftButton = document.getElementById('scroll-left-button');
        const rightButton = document.getElementById('scroll-right-button');

        if (container && leftButton && rightButton) {
            const scrollAmount = 320 + 24;

            leftButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            });

            rightButton.addEventListener('click', () => {
                container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            });

            const toggleButtonVisibility = () => {
                const isAtStart = container.scrollLeft === 0;
                const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

                leftButton.style.opacity = isAtStart ? '0.5' : '1';
                leftButton.style.pointerEvents = isAtStart ? 'none' : 'auto';
                
                rightButton.style.opacity = isAtEnd ? '0.5' : '1';
                rightButton.style.pointerEvents = isAtEnd ? 'none' : 'auto';
            };

            container.addEventListener('scroll', toggleButtonVisibility);
            window.addEventListener('resize', toggleButtonVisibility);

            setTimeout(toggleButtonVisibility, 100);
        }
    }

    createProductCard(product) {
        const defaultImageUrl = `${window.appConfig.baseUrl}/Frontend/assets/images/Products/default-product.jpg`;
        
        return `
            <div class="flex-none w-80 relative">
                <div class="relative bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div class="absolute top-3 left-3 z-10">
                        <button
                            type="button"
                            title="${product.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                            class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-primary/50 ${product.isFavorite ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-500'}"
                            data-product-id="${product.id}"
                            data-is-favorite="${product.isFavorite ? '1' : '0'}"
                            onclick="window.currentlyProducts.toggleFavorite(event, this)">
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
                            onclick="window.currentlyProducts.handleTemperatureVote(event, this)">
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
                            onclick="window.currentlyProducts.handleTemperatureVote(event, this)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <a href="detailproduct.html?id=${product.id}" class="block">
                        <img 
                            class="w-full h-64 rounded-t-lg"
                            style="object-fit: contain"
                            src="${product.image_url || defaultImageUrl}"
                            alt="${product.name}"
                            onerror="this.src='${defaultImageUrl}'"
                        >
                        <div class="p-4">
                            <h5 class="mb-2 text-lg font-bold tracking-tight text-gray-900">${product.name}</h5>
                            <p class="text-sm text-gray-600">${product.manufacturer}</p>
                            <div class="mt-2 text-lg font-bold text-primary-600">
                                ${parseFloat(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                        </div>
                    </a>
                </div>
            </div>`;
    }

    displayProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;
        
        container.innerHTML = this.products
            .map(product => this.createProductCard(product))
            .join('');
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
                button.dataset.isFavorite = (!isFavorite).toString();
                button.title = !isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
                button.classList.toggle('text-blue-500', !isFavorite);
                button.classList.toggle('text-gray-400', isFavorite);
                button.querySelector('svg').setAttribute('fill', !isFavorite ? 'currentColor' : 'none');
                
                const productIndex = this.products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    this.products[productIndex].isFavorite = !isFavorite;
                }
                
                toastManager.success(`Produit ${!isFavorite ? 'ajouté aux' : 'retiré des'} favoris avec succès !`);
            } else {
                throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
            }
            
        } catch (error) {
            console.error('Detailed error in toggleFavorite:', error);
            toastManager.error('Une erreur est survenue lors de la mise à jour des favoris. Veuillez réessayer.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.currentlyProducts = new CurrentlyProducts();
});