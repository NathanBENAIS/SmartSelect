class DetailProduct {
    constructor() {
        this.productId = new URLSearchParams(window.location.search).get('id');
        this.product = null;
        this.baseUrl = '/smartselect';
        this.apiUrl = '/smartselect/Backend/api';
        this.init();
    }


    async init() {
        try {
            await this.loadProduct();
            await this.loadFavoriteStatus(); // Ajout du chargement du statut favoris
            this.renderProduct();
            this.initializeEventListeners();
        } catch (error) {
            console.error('Error initializing product details:', error);
            this.showError('Une erreur est survenue lors du chargement du produit.');
        }
    }

    async loadFavoriteStatus() {
        const user = localStorage.getItem('user');
        if (!user) return;

        try {
            const userData = JSON.parse(user);
            const response = await fetch(`${this.apiUrl}/favorites.php?user_id=${userData.id}`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                // Mettre à jour le statut favoris du produit
                this.product.isFavorite = data.data.some(fav => fav.id === this.product.id);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des favoris:', error);
        }
    }

    async loadProduct() {
        try {
            const response = await fetch(`${this.apiUrl}/product-details.php?id=${this.productId}`);
            const data = await response.json();
            
            if (data.success) {
                this.product = data.data;
                console.log('Product data:', this.product);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement du produit');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            throw error;
        }
    }

    renderProduct() {
        if (!this.product) return;

        document.title = `${this.product.name} - SmartSelect`;

        // Ajout des boutons de température et favoris
        const imageContainer = document.querySelector('.aspect-w-1');
        if (imageContainer) {
            const nameElement = document.createElement('h1');
            nameElement.className = 'text-2xl font-bold text-gray-900 dark:text-white mb-4';
            nameElement.textContent = this.product.name;
            imageContainer.parentNode.insertBefore(nameElement, imageContainer);
            
            imageContainer.style.position = 'relative';
            
            // Buttons container creation remains the same
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'absolute top-0 left-0 right-0 p-3 flex justify-between z-10';
            
            const favoriteButton = this.createFavoriteButton();
            const temperatureContainer = this.createTemperatureContainer();
            
            buttonsContainer.appendChild(favoriteButton);
            buttonsContainer.appendChild(temperatureContainer);
            imageContainer.insertBefore(buttonsContainer, imageContainer.firstChild);
        }       

        // Update product image
        const productImage = document.getElementById('product-image');
        if (productImage) {
            productImage.src = this.product.image_url || `${this.baseUrl}/Frontend/assets/images/Products/default.jpg`;
            productImage.alt = this.product.name;
        }

        // Remove old product name display if it exists
        const oldNameElement = document.getElementById('product-name');
        if (oldNameElement) {
            oldNameElement.remove();
        }









        // Indice de réparabilité
        this.updateElement('repairability-index', 
            this.product.repairability_index ? `${this.product.repairability_index}/10` : 'Non disponible');
        
        const repairabilityBar = document.getElementById('repairability-bar');
        if (repairabilityBar && this.product.repairability_index) {
            repairabilityBar.style.width = `${(this.product.repairability_index / 10) * 100}%`;
        }

        // Autres informations
        this.updateElement('spare-parts', 
            this.product.spare_parts_availability ? `${this.product.spare_parts_availability} mois` : 'Non spécifié');
        this.updateElement('manufacturing-origin', this.product.manufacturing_origin || 'Non spécifié');
        this.updateElement('is-sustainable', this.product.is_sustainable ? 'Oui' : 'Non');
        const descriptionTab = document.getElementById('tab-description');
        if (descriptionTab) {
            if (!this.product.description || this.product.description.trim() === '') {
                descriptionTab.innerHTML = `
                    <div class="text-center p-8">
                        <div class="text-gray-500 dark:text-gray-400">Aucune description disponible pour ce produit</div>
                    </div>`;
            } else {
                // Convert newlines to <br> tags and format the description
                const formattedDescription = this.product.description
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Handle bold text
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');  // Handle italic text

                descriptionTab.innerHTML = `
                    <div class="prose prose-sm max-w-none dark:prose-invert">
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                            ${formattedDescription}
                        </p>
                    </div>`;
            }
        }






        // Rendu des onglets et du contenu
        this.renderStoreTabs();
        this.renderStoreAndVideoContent();
        this.renderSpecifications();
    }

    createFavoriteButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.title = this.product.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
        button.className = `favorite-button w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-primary/50 ${
            this.product.isFavorite ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-500'
        }`;
        button.dataset.productId = this.product.id;
        button.dataset.isFavorite = this.product.isFavorite ? '1' : '0';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="${this.product.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        `;
        
        // Ajout de l'écouteur d'événement directement sur le bouton
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const user = localStorage.getItem('user');
            if (!user) {
                toastManager.warning('Vous devez être connecté pour gérer les favoris. Redirection vers la page de connexion...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }

            const userData = JSON.parse(user);
            const isFavorite = button.dataset.isFavorite === '1';
            const action = isFavorite ? 'remove' : 'add';

            try {
                const response = await fetch(`${this.apiUrl}/favorites.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userData.id,
                        product_id: this.product.id,
                        action: action
                    })
                });

                const data = await response.json();
                if (data.success) {
                    // Mise à jour du statut du bouton
                    const newIsFavorite = !isFavorite;
                    button.dataset.isFavorite = newIsFavorite ? '1' : '0';
                    button.title = newIsFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
                    
                    // Mise à jour des classes
                    button.classList.toggle('text-blue-500', newIsFavorite);
                    button.classList.toggle('text-gray-400', !newIsFavorite);
                    
                    // Mise à jour de l'icône
                    const svg = button.querySelector('svg');
                    if (svg) {
                        svg.setAttribute('fill', newIsFavorite ? 'currentColor' : 'none');
                    }

                    // Mise à jour du statut dans l'objet product
                    this.product.isFavorite = newIsFavorite;
                    
                    toastManager.success(`Produit ${newIsFavorite ? 'ajouté aux' : 'retiré des'} favoris avec succès !`);
                } else {
                    throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour des favoris:', error);
                toastManager.error('Une erreur est survenue lors de la mise à jour des favoris');
            }
        });

        return button;
    }
    createTemperatureContainer() {
        const container = document.createElement('div');
        container.className = 'flex items-center space-x-3 p-2 bg-white border border-primary/50 rounded-full shadow-lg';
        
        container.innerHTML = `
            <button type="button"
                title="Pas convaincu(e) ? Vous pouvez baisser la température."
                class="overflow-visible flex items-center justify-center text-blue-500 hover:text-blue-700"
                data-vote-type="down"
                data-product-id="${this.product.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M5 12h14v2H5z"/>
                </svg>
            </button>
            <span
                title="Actuellement évalué à ${this.product.temperature || '0'}° par la communauté."
                class="text-sm font-medium text-yellow-500"
                data-temperature="${this.product.id}">
                ${this.product.temperature || '0'}°
            </span>
            <button type="button"
                title="Bon deal ? Votez pour le mettre en avant !"
                class="overflow-visible flex items-center justify-center text-red-500 hover:text-red-700"
                data-vote-type="up"
                data-product-id="${this.product.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        // Ajout des gestionnaires d'événements pour les boutons de température
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            button.onclick = (e) => this.handleTemperatureVote(e, button);
        });

        return container;
    }

    async handleFavoriteClick(event, button) {
        event.preventDefault();
        event.stopPropagation();

        const user = localStorage.getItem('user');
        if (!user) {
            toastManager.warning('Vous devez être connecté pour gérer les favoris. Redirection vers la page de connexion...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const userData = JSON.parse(user);
        const isFavorite = button.dataset.isFavorite === '1';
        const action = isFavorite ? 'remove' : 'add';

        try {
            const response = await fetch(`${this.apiUrl}/favorites.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.id,
                    product_id: this.product.id,
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
                
                this.product.isFavorite = !isFavorite;
                toastManager.success(`Produit ${!isFavorite ? 'ajouté aux' : 'retiré des'} favoris avec succès !`);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des favoris:', error);
            toastManager.error('Une erreur est survenue lors de la mise à jour des favoris');
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
        const voteType = button.dataset.voteType;

        try {
            const response = await fetch(`${this.apiUrl}/temperature-vote.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.id,
                    product_id: this.product.id,
                    vote_type: voteType
                })
            });

            const data = await response.json();
            if (data.success) {
                const temperatureElement = document.querySelector(`[data-temperature="${this.product.id}"]`);
                if (temperatureElement) {
                    temperatureElement.textContent = `${data.newTemperature}°`;
                    temperatureElement.title = `Actuellement évalué à ${data.newTemperature}° par la communauté.`;
                }
                this.product.temperature = data.newTemperature;
                toastManager.success('Vote enregistré avec succès !');
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            toastManager.error('Une erreur est survenue lors du vote');
        }
    }




    renderStoreTabs() {
        const tabsContainer = document.getElementById('product-tabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = `
            <div class="border-b border-gray-200 dark:border-gray-700">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        id="specs-tab"
                        class="tab-button border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm active"
                        data-tab="specs-content">
                        Spécifications
                    </button>
                    <button
                        id="stores-tab"
                        class="tab-button border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="stores-content">
                        Acheter
                        <span class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800">
                            ${this.getStoreCount()}
                        </span>
                    </button>
                    <button
                        id="videos-tab"
                        class="tab-button border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="videos-content">
                        Vidéos
                        <span class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800">
                            ${this.getVideoCount()}
                        </span>
                    </button>
                </nav>
            </div>
        `;

        const contentContainer = document.getElementById('product-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div id="specs-content" class="tab-content">
                    <div id="product-specs" class="mt-6"></div>
                    <div id="camera-specs" class="mt-6 hidden">
                        <h3 class="text-lg font-medium mb-4 dark:text-gray-200">Appareil photo</h3>
                        <div class="grid grid-cols-1 gap-4"></div>
                    </div>
                    <div id="connectivity-specs" class="mt-6 hidden">
                        <h3 class="text-lg font-medium mb-4 dark:text-gray-200">Connectivité</h3>
                        <div class="grid grid-cols-1 gap-4"></div>
                    </div>
                    <div id="sar-ratings" class="mt-6 hidden">
                        <h3 class="text-lg font-medium mb-4 dark:text-gray-200">Valeurs DAS</h3>
                        <div class="grid grid-cols-3 gap-4"></div>
                    </div>
                </div>
                <div id="stores-content" class="tab-content hidden">
                    <div class="mt-6 space-y-4"></div>
                </div>
                <div id="videos-content" class="tab-content hidden">
                    <div class="mt-6 space-y-4"></div>
                </div>
            `;
        }

        this.initializeTabListeners();
    }

    getStoreCount() {
        const storeUrls = this.parseJsonField(this.product.store_urls);
        return storeUrls.length;
    }

    getVideoCount() {
        const videoUrls = this.parseJsonField(this.product.video_urls);
        return videoUrls.length;
    }

    renderStoreAndVideoContent() {
        this.renderStoreList();
        this.renderVideoList();
    }

    renderStoreList() {
        const storesContainer = document.querySelector('#tab-stores');
        if (!storesContainer) return;
    
        try {
            const storeUrls = this.parseJsonField(this.product.store_urls);
            
            if (!storeUrls || storeUrls.length === 0) {
                storesContainer.innerHTML = `
                    <div class="text-center p-8">
                        <div class="text-gray-500 dark:text-gray-400">
                            Aucun magasin disponible pour le moment
                        </div>
                    </div>
                `;
                return;
            }
    
            let storesHTML = '<div class="space-y-6">';
            storesHTML += storeUrls.map(url => {
                const storeName = this.extractStoreName(url);
                const storeIcon = this.getStoreIcon(storeName.toLowerCase());
                
                return `
                    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-4">
                                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-full p-3">
                                    ${storeIcon}
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    ${storeName}
                                </h3>
                            </div>
                            <a href="${url}" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                Voir sur ${storeName}
                                <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </a>
                        </div>
                    ${this.shouldAddDivider(storeUrls, url) ? '<hr class="border-gray-200 dark:border-gray-700">' : ''}
                `;
            }).join('');
            storesHTML += '</div>';
            
            storesContainer.innerHTML = storesHTML;
        } catch (error) {
            console.error('Erreur lors du rendu des magasins:', error);
            storesContainer.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-red-500">Erreur lors du chargement des magasins</div>
                </div>
            `;
        }
    }
    
    shouldAddDivider(array, currentItem) {
        return array.indexOf(currentItem) < array.length - 1;
    }
    
    getStoreIcon(storeName) {
        const iconSize = 'w-6 h-6';
        switch (storeName.toLowerCase()) {
            case 'amazon':
                return `<img src="${this.baseUrl}/Frontend/assets/images/Stores/amazon-logo.svg" class="${iconSize}" alt="Amazon logo">`;
            case 'fnac':
                return `<img src="${this.baseUrl}/Frontend/assets/images/Stores/Fnac-logo.svg" class="${iconSize}" alt="Fnac logo">`;
            case 'darty':
            case 'lp':
                return `<img src="${this.baseUrl}/Frontend/assets/images/Stores/darty-logo.svg" class="${iconSize}" alt="Darty logo">`;
            default:
                return `<img src="${this.baseUrl}/Frontend/assets/images/Stores/default-store.svg" class="${iconSize}" alt="Store logo">`;
        }
    }
    
    extractStoreName(url) {
        try {
            const hostname = new URL(url).hostname;
            const name = hostname
                .replace('www.', '')
                .split('.')[0]
                .toLowerCase();
                
            // Mapping des noms de magasins
            const storeMapping = {
                'lp': 'Darty',
                'darty': 'Darty',
                'fnac': 'Fnac',
                'amazon': 'Amazon'
            };
            
            return storeMapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
        } catch (e) {
            return 'Voir le magasin';
        }
    }
    renderVideoList() {
        const videosContainer = document.querySelector('#tab-videos');
        if (!videosContainer) return;
    
        try {
            const videoUrls = this.parseJsonField(this.product.video_urls);
            
            if (!videoUrls || videoUrls.length === 0) {
                videosContainer.innerHTML = `
                    <div class="text-center p-8">
                        <div class="text-gray-500 dark:text-gray-400">
                            Aucune vidéo disponible pour le moment
                        </div>
                    </div>`;
                return;
            }
    
            let videosHTML = '<div class="space-y-6">';
            videosHTML += videoUrls.map(url => {
                const videoId = this.extractVideoId(url);
                return `
                    <div class="video-container bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <iframe
                            class="w-full aspect-video rounded-lg mb-4"
                            src="https://www.youtube.com/embed/${videoId}"
                            title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                        ></iframe>
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Source: YouTube</span>
                            <a href="${url}" 
                               target="_blank"
                               rel="noopener noreferrer"
                               class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                                Voir sur YouTube
                                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
            videosHTML += '</div>';
            
            videosContainer.innerHTML = videosHTML;
        } catch (error) {
            console.error('Erreur lors du rendu des vidéos:', error);
            videosContainer.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-red-500">Erreur lors du chargement des vidéos</div>
                </div>`;
        }
    }


    async loadNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;
    
        // Afficher l'état de chargement
        newsContainer.innerHTML = `
            <div class="p-8 text-center">
                <div class="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Chargement des actualités...</p>
            </div>
        `;
    
        try {
            // Utilisation de l'API Rss2Json pour obtenir le flux RSS de 01net (ou autre source tech)
            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.01net.com%2Frss%2Factualites%2F');
            const data = await response.json();
    
            if (!data.items || data.items.length === 0) {
                throw new Error('Aucune actualité disponible');
            }
    
            // Générer le HTML pour chaque actualité
            const newsHTML = data.items.slice(0, 5).map(item => {
                const date = new Date(item.pubDate).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
    
                return `
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-sm text-gray-500 dark:text-gray-400">${data.feed.title}</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">${date}</span>
                        </div>
                        ${item.thumbnail ? `
                            <img src="${item.thumbnail}" alt="${item.title}" 
                                 class="w-full h-48 object-cover rounded-lg mb-4">
                        ` : ''}
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${item.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-4">${item.description.split(' ').slice(0, 30).join(' ')}...</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                            Lire la suite
                            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </a>
                    </div>
                `;
            }).join('');
    
            newsContainer.innerHTML = newsHTML;
    
        } catch (error) {
            newsContainer.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-red-500 dark:text-red-400">
                        Une erreur est survenue lors du chargement des actualités
                    </div>
                    <button onclick="window.productDetail.loadNews()" 
                            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Réessayer
                    </button>
                </div>
            `;
            console.error('Erreur de chargement des actualités:', error);
        }
    }
    
   
    extractVideoId(url) {
        try {
            const regex = /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^\/&#?]{11})/;
            const match = url.match(regex);
            return match ? match[1] : '';
        } catch (e) {
            console.error('Erreur lors de l\'extraction de l\'ID vidéo:', e);
            return '';
        }
    }
    
    
    parseJsonField(jsonString) {
        if (!jsonString) return [];
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Erreur parsing JSON:', e);
            return [];
        }
    }

    renderSpecifications() {
        const specsContainer = document.getElementById('product-specs');
        if (!specsContainer) return;

        let specsHTML = '<div class="space-y-4">';

        switch (parseInt(this.product.category_id)) {
            case 1:
                specsHTML += this.renderSmartphoneSpecs();
                this.renderCameraSpecs();
                this.renderConnectivitySpecs();
                this.renderSARRatings();
                break;
            case 2:
                specsHTML += this.renderLaptopSpecs();
                break;
            case 3:
                specsHTML += this.renderTabletSpecs();
                this.renderCameraSpecs();
                this.renderConnectivitySpecs();
                break;
        }

        specsHTML += '</div>';
        specsContainer.innerHTML = specsHTML;
    }

    renderSmartphoneSpecs() {
        return `
            <div class="grid grid-cols-1 gap-4">
                ${this.createSpecRowWithRating('RAM', `${this.product.ram} GB`, this.product.ram_rating)}
                ${this.createSpecRowWithRating('Stockage', `${this.product.storage_capacity} GB`, this.product.storage_rating)}
                ${this.createSpecRowWithRating('Écran', `${this.product.screen_size}" - ${this.product.screen_technology}`, this.product.screen_rating)}
                ${this.createSpecRow('Résolution', this.product.screen_resolution)}
                ${this.createSpecRow('Taux de rafraîchissement', this.product.refresh_rate ? `${this.product.refresh_rate} Hz` : null)}
                ${this.createSpecRowWithRating('Batterie', `${this.product.battery_capacity} mAh`, this.product.battery_rating)}
                ${this.createSpecRow('Système d\'exploitation', `${this.product.operating_system} ${this.product.os_version || ''}`)}
                ${this.createSpecRowWithRating('Processeur', this.product.processor_name, this.product.processor_rating)}
            </div>
        `;
    }
    
    renderLaptopSpecs() {
        return `
            <div class="grid grid-cols-1 gap-4">
                ${this.createSpecRowWithRating('RAM', `${this.product.ram_capacity} GB ${this.product.ram_type || ''}`, this.product.ram_rating)}
                ${this.createSpecRowWithRating('Stockage', `${this.product.storage_capacity} GB ${this.product.storage_type || ''}`, this.product.storage_rating)}
                ${this.createSpecRowWithRating('Processeur', `${this.product.processor_brand} ${this.product.processor_model}`, this.product.processor_rating)}
                ${this.createSpecRowWithRating('Carte graphique', `${this.product.gpu_brand} ${this.product.gpu_model}`, this.product.gpu_rating)}
                ${this.createSpecRow('Écran', `${this.product.screen_size}" - ${this.product.resolution}`)}
                ${this.createSpecRow('Luminosité', this.product.brightness ? `${this.product.brightness} nits` : null)}
                ${this.createSpecRow('Clavier numérique', this.product.has_numeric_pad ? 'Oui' : 'Non')}
                ${this.createSpecRow('Lecteur d\'empreintes', this.product.has_fingerprint_reader ? 'Oui' : 'Non')}
                ${this.createSpecRow('PC Gaming', this.product.is_gaming_laptop ? 'Oui' : 'Non')}
            </div>
        `;
    }

    renderTabletSpecs() {
        return `
            <div class="grid grid-cols-1 gap-4">
                ${this.createSpecRowWithRating('RAM', `${this.product.ram} GB`, this.product.ram_rating)}
                ${this.createSpecRowWithRating('Stockage', `${this.product.storage_capacity} GB`, this.product.storage_rating)}
                ${this.createSpecRow('Écran', `${this.product.screen_size}" - ${this.product.screen_technology}`)}
                ${this.createSpecRow('Résolution', this.product.screen_resolution)}
                ${this.createSpecRowWithRating('Processeur', this.product.processor_name, this.product.processor_rating)}
                ${this.createSpecRow('Système d\'exploitation', this.product.operating_system)}
            </div>
        `;
    }

    renderCameraSpecs() {
        const container = document.getElementById('camera-specs');
        if (!container || !this.product.main_camera_resolution) return;

        container.classList.remove('hidden');
        container.querySelector('div').innerHTML = `
            ${this.createSpecRow('Caméra principale', this.product.main_camera_resolution)}
            ${this.createSpecRow('Caméra frontale', this.product.front_camera_resolution)}
            ${this.createSpecRow('Résolution vidéo', this.product.video_resolution)}
        `;
    }

    renderConnectivitySpecs() {
        const container = document.getElementById('connectivity-specs');
        if (!container) return;

        container.classList.remove('hidden');
        container.querySelector('div').innerHTML = `
            ${this.createSpecRow('Type de SIM', this.product.sim_type)}
            ${this.createSpecRow('Slot SD', this.product.has_sd_slot ? 'Oui' : 'Non')}
            ${this.createSpecRow('USB', this.product.usb_type)}
            ${this.createSpecRow('Jack Audio', this.product.has_audio_jack ? 'Oui' : 'Non')}
            ${this.createSpecRow('5G', this.product.has_5g ? 'Oui' : 'Non')}
            ${this.createSpecRow('NFC', this.product.has_nfc ? 'Oui' : 'Non')}
        `;
    }

    renderSARRatings() {
        const container = document.getElementById('sar-ratings');
        if (!container || !this.product.head_sar) return;

        container.classList.remove('hidden');
        container.querySelector('div').innerHTML = `
            <div class="text-center">
                <div class="font-medium mb-1">Tête</div>
                <div class="text-lg">${this.product.head_sar}</div>
            </div>
            <div class="text-center">
                <div class="font-medium mb-1">Tronc</div>
                <div class="text-lg">${this.product.trunk_sar}</div>
            </div>
            <div class="text-center">
                <div class="font-medium mb-1">Membres</div>
                <div class="text-lg">${this.product.limb_sar}</div>
            </div>
        `;
    }

    createSpecRowWithRating(label, value, rating) {
        if (!value) return '';
        return `
            <div class="spec-row p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">${label}</div>
                        <div class="font-medium dark:text-gray-200">${value}</div>
                    </div>
                    ${rating ? `
                        <div class="ml-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                                ${this.getRatingColorClass(rating)}">
                                ${rating}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getRatingColorClass(rating) {
        switch(rating) {
            case 'Exceptionnel':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'Excellent':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Bien':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Correct':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Passable':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    }

    createSpecRow(label, value) {
        if (!value) return '';
        return `
            <div class="spec-row p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-sm text-gray-600 dark:text-gray-400">${label}</div>
                <div class="font-medium dark:text-gray-200">${value}</div>
            </div>
        `;
    }

    initializeTabListeners() {
        const tabs = document.querySelectorAll('.tab-button');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('border-blue-500', 'text-blue-600');
                    t.classList.add('border-transparent', 'text-gray-500');
                });

                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.classList.add('border-blue-500', 'text-blue-600');

                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });

                const contentId = tab.getAttribute('data-tab');
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.remove('hidden');
                }
            });
        });
    }


    initializeEventListeners() {
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => window.history.back());
        }
        document.querySelector('[onclick="switchTab(\'news\')"]')?.addEventListener('click', () => {
            this.loadNews();
        });
    }

    async loadNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;
    
        // Ajouter des styles pour une barre de défilement personnalisée
        newsContainer.style.cssText = `
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        `;
    
        // Afficher l'état de chargement
        newsContainer.innerHTML = `
            <div class="p-8 text-center">
                <div class="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Chargement des actualités...</p>
            </div>
        `;
    
        try {
            // Liste des flux RSS à récupérer
            const feeds = [
                'https://www.01net.com/rss/actualites/',
                'https://www.frandroid.com/feed',
                'https://www.lesnumeriques.com/rss.xml'
            ];
    
            // Récupérer tous les flux en parallèle
            const feedPromises = feeds.map(feed => 
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`)
                    .then(res => res.json())
            );
    
            const results = await Promise.all(feedPromises);
    
            // Fusionner et trier les actualités par date
            const allNews = results.flatMap(data => 
                data.items?.map(item => ({
                    ...item,
                    sourceName: data.feed.title
                })) || []
            ).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 15); // Augmenté à 15 articles puisqu'on a une barre de défilement
    
            if (allNews.length === 0) {
                throw new Error('Aucune actualité disponible');
            }
    
            const newsHTML = `
                <style>
                    /* Styles pour la barre de défilement - Webkit (Chrome, Safari) */
                    #news-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    #news-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    #news-container::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.5);
                        border-radius: 20px;
                    }
                    #news-container::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(156, 163, 175, 0.7);
                    }
                    /* Style pour le mode sombre */
                    .dark #news-container::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.3);
                    }
                    .dark #news-container::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(156, 163, 175, 0.5);
                    }
                </style>
                ${allNews.map(item => {
                    const date = new Date(item.pubDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
    
                    return `
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm text-gray-500 dark:text-gray-400">${item.sourceName}</span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">${date}</span>
                            </div>
                            ${item.thumbnail ? `
                                <img src="${item.thumbnail}" alt="${item.title}" 
                                     class="w-full h-48 object-cover rounded-lg mb-4">
                            ` : ''}
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${item.title}</h3>
                            <p class="text-gray-600 dark:text-gray-300 mb-4">${item.description.split(' ').slice(0, 30).join(' ')}...</p>
                            <a href="${item.link}" target="_blank" rel="noopener noreferrer" 
                               class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                                Lire la suite
                                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </a>
                        </div>
                    `;
                }).join('')}
            `;
    
            newsContainer.innerHTML = newsHTML;
    
        } catch (error) {
            newsContainer.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-red-500 dark:text-red-400">
                        Une erreur est survenue lors du chargement des actualités
                    </div>
                    <button onclick="window.productDetail.loadNews()" 
                            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Réessayer
                    </button>
                </div>
            `;
            console.error('Erreur de chargement des actualités:', error);
        }
    }

    parseJsonField(jsonString) {
        if (!jsonString) return [];
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Erreur parsing JSON:', e);
            return [];
        }
    }

    extractStoreName(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname
                .replace('www.', '')
                .split('.')[0]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } catch (e) {
            return 'Voir le magasin';
        }
    }

    extractVideoTitle(url) {
        try {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return 'Test YouTube';
            }
            return 'Voir la vidéo de test';
        } catch (e) {
            return 'Voir la vidéo';
        }
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    formatPrice(price) {
        return parseFloat(price).toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        });
    }

    showError(message) {
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Erreur!</strong>
                    <span class="block sm:inline">${message}</span>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.productDetail = new DetailProduct();
});