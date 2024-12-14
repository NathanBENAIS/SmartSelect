class Carousel {
    constructor() {
        this.currentSlide = 0;
        this.autoplayInterval = null;
    }

    init() {
        const container = document.getElementById('carousel-container');
        if (!container) return;

        container.innerHTML = this.createCarouselContent();

        // Initialiser les éléments
        this.items = Array.from(container.querySelectorAll('[data-carousel-item]'));
        this.prevButton = container.querySelector('[data-carousel-prev]');
        this.nextButton = container.querySelector('[data-carousel-next]');

        // Mettre en place les écouteurs d'événements
        this.setupEventListeners();

        // Démarrer l'autoplay
        this.startAutoplay();
    }

    createCarouselContent() {
        return `
            <div class="relative w-full" data-carousel="slide">
                <div class="relative h-56 overflow-hidden rounded-lg md:h-[32rem]">
                    <!-- Item 1 -->
                    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out" data-carousel-item style="opacity: 1;">
                        <img src="./assets/images/News/Group 5.png" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
                    </div>
                    <!-- Item 2 -->
                    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out" data-carousel-item style="opacity: 0; pointer-events: none;">
                        <img src="./assets/images/News/Group 6.png" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
                    </div>
                    <!-- Item 3 -->
                    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out" data-carousel-item style="opacity: 0; pointer-events: none;">
                        <img src="./assets/images/News/Group 7.png" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
                    </div>
                    <!-- Item 4 -->
                    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out" data-carousel-item style="opacity: 0; pointer-events: none;">
                        <img src="./assets/images/News/Group 8.png" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
                    </div>
                    <!-- Item 5 -->
                    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out" data-carousel-item style="opacity: 0; pointer-events: none;">
                        <img src="./assets/images/News/Group 9.png" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
                    </div>
                </div>
                
                <!-- Contrôles -->
                <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </span>
                </button>
                <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.stopAutoplay();
                this.prev();
                this.startAutoplay();
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.stopAutoplay();
                this.next();
                this.startAutoplay();
            });
        }
    }

    showSlide(index) {
        // Masquer le slide actuel
        if (this.items[this.currentSlide]) {
            this.items[this.currentSlide].style.opacity = '0';
            this.items[this.currentSlide].style.pointerEvents = 'none';
        }

        // Afficher le nouveau slide
        if (this.items[index]) {
            this.items[index].style.opacity = '1';
            this.items[index].style.pointerEvents = 'auto';
        }

        this.currentSlide = index;
    }

    next() {
        const nextIndex = (this.currentSlide + 1) % this.items.length;
        this.showSlide(nextIndex);
    }

    prev() {
        const prevIndex = (this.currentSlide - 1 + this.items.length) % this.items.length;
        this.showSlide(prevIndex);
    }

    startAutoplay() {
        if (!this.autoplayInterval) {
            this.autoplayInterval = setInterval(() => this.next(), 5000);
        }
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initCarousel);

function initCarousel() {
    const carousel = new Carousel();
    carousel.init();
}