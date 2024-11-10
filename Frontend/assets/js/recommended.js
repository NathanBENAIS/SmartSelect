class RecommendedProducts {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.displayProducts();
        this.initializeScrollButtons();
    }

    async loadProducts() {
        try {
            const response = await fetch(`${window.appConfig.baseUrl}/Backend/api/products.php?action=getAll`);
            const data = await response.json();
            
            if (data.success) {
                // Trier les produits par température décroissante
                this.products = data.data
                    .sort((a, b) => (b.temperature || 0) - (a.temperature || 0))
                    .slice(0, 10);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des produits recommandés:', error);
        }
    }

    initializeScrollButtons() {
        const container = document.getElementById('recommended-products-container');
        const leftButton = document.getElementById('recommended-scroll-left');
        const rightButton = document.getElementById('recommended-scroll-right');

        if (container && leftButton && rightButton) {
            const scrollAmount = 320 + 24; // 320px (w-80) + 24px (space-x-6)

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
                    <div class="absolute top-3 right-3 z-10 flex items-center space-x-3 p-2 bg-white border border-primary/50 rounded-full shadow-lg">
                        <button
                            type="button"
                            title="Pas convaincu(e) ? Vous pouvez baisser la température."
                            class="overflow-visible flex items-center justify-center text-blue-500 hover:text-blue-700"
                            data-vote-type="down"
                            data-product-id="${product.id}"
                            onclick="window.recommendedProducts.handleTemperatureVote(event, this)">
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
                            onclick="window.recommendedProducts.handleTemperatureVote(event, this)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <a href="detailproduct.html?id=${product.id}" class="block">
                        <img 
                            class="object-cover w-full h-64 rounded-t-lg"
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
        const container = document.getElementById('recommended-products-container');
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
                }
            } else {
                throw new Error(data.message || 'Erreur lors du vote');
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            alert('Une erreur est survenue lors du vote. Veuillez réessayer.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.recommendedProducts = new RecommendedProducts();
});