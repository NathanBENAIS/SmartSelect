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
            this.renderProduct();
            this.initializeEventListeners();
        } catch (error) {
            console.error('Error initializing product details:', error);
            this.showError('Une erreur est survenue lors du chargement du produit.');
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

        this.updateElement('product-name', this.product.name);
        this.updateElement('product-price', this.formatPrice(this.product.price));
        this.updateElement('product-description', this.product.description || 'Aucune description disponible');
        this.updateElement('product-manufacturer', this.product.manufacturer);
        this.updateElement('product-model', this.product.model || 'Non spécifié');
        this.updateElement('product-sku', this.product.sku || 'Non spécifié');
        this.updateElement('product-ean', this.product.ean || 'Non spécifié');
        
        const stockElement = document.getElementById('product-stock');
        if (stockElement) {
            stockElement.textContent = this.product.stock > 0 ? 'En stock' : 'Rupture de stock';
            stockElement.className = `px-3 py-1 rounded-full text-sm ${
                this.product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
        }

        const productImage = document.getElementById('product-image');
        if (productImage) {
            productImage.src = this.product.image_url || `${this.baseUrl}/Frontend/assets/images/Products/default.jpg`;
            productImage.alt = this.product.name;
        }

        this.updateElement('repairability-index', this.product.repairability_index ? `${this.product.repairability_index}/10` : 'Non disponible');
        const repairabilityBar = document.getElementById('repairability-bar');
        if (repairabilityBar && this.product.repairability_index) {
            repairabilityBar.style.width = `${(this.product.repairability_index / 10) * 100}%`;
        }

        this.updateElement('spare-parts', this.product.spare_parts_availability ? 
            `${this.product.spare_parts_availability} mois` : 'Non spécifié');
        this.updateElement('manufacturing-origin', this.product.manufacturing_origin || 'Non spécifié');
        this.updateElement('is-sustainable', this.product.is_sustainable ? 'Oui' : 'Non');

        this.renderSpecifications();
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
            <div class="grid grid-cols-2 gap-4">
                ${this.createSpecRowWithRating('RAM', `${this.product.ram_capacity} GB ${this.product.ram_type || ''}`, this.product.ram_rating)}
                ${this.createSpecRowWithRating('Stockage', `${this.product.storage_capacity} GB ${this.product.storage_type || ''}`, this.product.storage_rating)}
                ${this.createSpecRowWithRating('Processeur', `${this.product.processor_brand} ${this.product.processor_model}`, this.product.processor_rating)}
                ${this.createSpecRowWithRating('Carte graphique', `${this.product.gpu_brand} ${this.product.gpu_model}`, this.product.gpu_rating)}
                ${this.createSpecRow('Écran', `${this.product.screen_size}" - ${this.product.resolution}`)}
            </div>
        `;
    }

    renderTabletSpecs() {
        return `
            <div class="grid grid-cols-2 gap-4">
                ${this.createSpecRowWithRating('RAM', `${this.product.ram_capacity} GB`, this.product.ram_rating)}
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
                        <div class="font-medium">${value}</div>
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
            <div class="spec-row">
                <div class="text-sm text-gray-600 dark:text-gray-400">${label}</div>
                <div class="font-medium">${value}</div>
            </div>
        `;
    }

    initializeEventListeners() {
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => window.history.back());
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