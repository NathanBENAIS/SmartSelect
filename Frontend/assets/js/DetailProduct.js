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
            imageContainer.style.position = 'relative';
            
            // Création du conteneur pour les boutons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'absolute top-0 left-0 right-0 p-3 flex justify-between z-10';
            
            // Bouton favoris
            const favoriteButton = this.createFavoriteButton();
            
            // Conteneur des boutons de température
            const temperatureContainer = this.createTemperatureContainer();
            
            buttonsContainer.appendChild(favoriteButton);
            buttonsContainer.appendChild(temperatureContainer);
            imageContainer.insertBefore(buttonsContainer, imageContainer.firstChild);
        }       

        // Image du produit
        const productImage = document.getElementById('product-image');
        if (productImage) {
            productImage.src = this.product.image_url || `${this.baseUrl}/Frontend/assets/images/Products/default.jpg`;
            productImage.alt = this.product.name;
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
                return `<svg class="${iconSize} text-[#FF9900]" viewBox="0 0 48 48" fill="currentColor">
                            <path d="M24.71 21.71c-3.5 2.21-8.14 3.38-12.28 3.38-5.84 0-11.09-2.16-15.07-5.75-.31-.27-.03-.64.34-.43 4.27 2.48 9.56 3.98 15.02 3.98 3.68 0 7.73-.76 11.45-2.34.56-.24 1.03.37.54 1.16"/>
                            <path d="M26.06 20.08c-.45-.57-2.97-.27-4.1-.14-.34.04-.4-.26-.09-.47 2.01-1.41 5.3-1 5.69-.53.39.47-.1 3.77-1.98 5.35-.29.24-.56.11-.43-.21.42-1.04 1.36-3.39.91-3.97"/>
                            <path d="M22.59 12.33v-1.42c0-.22.16-.36.36-.36h6.4c.2 0 .36.14.36.36v1.21c0 .2-.17.47-.47.89l-3.31 4.73c1.23-.03 2.53.16 3.64.79.25.14.32.36.34.57v1.51c0 .21-.23.46-.48.33-2.01-1.05-4.67-1.17-6.88.01-.23.12-.47-.12-.47-.34v-1.44c0-.24 0-.65.24-1.01l3.83-5.5h-3.33c-.2 0-.36-.14-.36-.36"/>
                            <path d="M8.09 26.77c-1.09.31-2.23.47-3.37.47-1.59 0-3.16-.33-4.64-1.01-.28-.13-.05-.34.15-.23 1.58.52 3.25.84 4.93.84.87 0 1.73-.09 2.58-.27.21-.04.39.23.12.42"/>
                            <path d="M8.87 25.95c-.14-.18-.92-.08-1.27-.04-.11.01-.12-.08-.03-.15.62-.44 1.65-.31 1.77-.16.12.15-.03 1.17-.61 1.66-.09.08-.18.04-.13-.06.13-.32.42-1.05.28-1.23"/>
                        </svg>`;
            case 'fnac':
                return `<svg class="${iconSize} text-[#E6A329]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2.5 3v12h3V6h-3zm5 0v12h3V6h-3z"/>
                        </svg>`;
            case 'darty':
            case 'lp':
                return `<svg class="${iconSize} text-[#DA291C]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                            <path d="M8 7h8v2H8zm0 4h8v2H8zm0 4h4v2H8z"/>
                        </svg>`;
            default:
                return `<svg class="${iconSize} text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                        </svg>`;
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
                    </div>
                `;
                return;
            }
    
            let videosHTML = '<div class="space-y-4">';
            videosHTML += videoUrls.map(url => `
                <a href="${url}" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div class="flex-shrink-0 mr-4">
                        <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="font-medium text-red-600 dark:text-red-400">
                            ${this.extractVideoTitle(url)}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${url}</div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
            `).join('');
            videosHTML += '</div>';
            
            videosContainer.innerHTML = videosHTML;
        } catch (error) {
            console.error('Erreur lors du rendu des vidéos:', error);
            videosContainer.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-red-500">Erreur lors du chargement des vidéos</div>
                </div>
            `;
        }
    }
    
    
    extractVideoTitle(url) {
        try {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                // Extraire l'identifiant de la vidéo YouTube
                const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^\/&#?]{11})/);
                if (videoId) {
                    return 'Vidéo YouTube';
                }
            }
            return 'Voir la vidéo';
        } catch (e) {
            return 'Voir la vidéo';
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