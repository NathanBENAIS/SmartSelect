// Initialisation du carousel
function initCarousel() {
    // Vérifier si les éléments existent
    const carousel = document.querySelector('[data-carousel="slide"]');
    if (!carousel) {
        console.log('Carousel container not found, waiting...');
        return;
    }

    const carouselItems = document.querySelectorAll('[data-carousel-item]');
    const indicators = document.querySelectorAll('[data-carousel-slide-to]');
    const prevButton = document.querySelector('[data-carousel-prev]');
    const nextButton = document.querySelector('[data-carousel-next]');

    // Vérifier si tous les éléments nécessaires sont présents
    if (!carouselItems.length || !indicators.length || !prevButton || !nextButton) {
        console.log('Carousel elements not found, waiting...');
        return;
    }

    let currentIndex = 0;
    let intervalId = null;

    // Fonction pour afficher un élément spécifique
    function showCarouselItem(index) {
        // Masquer tous les éléments
        carouselItems.forEach((item, i) => {
            item.classList.add('hidden');
            indicators[i].classList.remove('bg-white');
            indicators[i].setAttribute('aria-current', 'false');
        });

        // Afficher l'élément actif
        carouselItems[index].classList.remove('hidden');
        indicators[index].classList.add('bg-white');
        indicators[index].setAttribute('aria-current', 'true');
        currentIndex = index;
    }

    // Initialiser le premier élément
    showCarouselItem(0);

    // Démarrer le défilement automatique
    function startAutoSlide() {
        if (!intervalId) {
            intervalId = setInterval(() => {
                currentIndex = (currentIndex + 1) % carouselItems.length;
                showCarouselItem(currentIndex);
            }, 3000);
        }
    }

    // Arrêter le défilement automatique
    function stopAutoSlide() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // Gestionnaire pour le bouton précédent
    prevButton.addEventListener('click', () => {
        stopAutoSlide();
        currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
        showCarouselItem(currentIndex);
        startAutoSlide();
    });

    // Gestionnaire pour le bouton suivant
    nextButton.addEventListener('click', () => {
        stopAutoSlide();
        currentIndex = (currentIndex + 1) % carouselItems.length;
        showCarouselItem(currentIndex);
        startAutoSlide();
    });

    // Gestionnaire pour les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            stopAutoSlide();
            showCarouselItem(index);
            startAutoSlide();
        });
    });

    // Pause au survol
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);

    // Démarrer le carousel
    startAutoSlide();
    
    console.log('Carousel initialized successfully');
}

// Fonction pour tenter l'initialisation du carousel
function tryInitCarousel() {
    try {
        initCarousel();
    } catch (error) {
        console.error('Error initializing carousel:', error);
    }
}

// Écouter l'événement spécifique du chargement du carousel
document.addEventListener('default-carousel-containerLoaded', () => {
    console.log('Carousel container loaded, initializing...');
    setTimeout(tryInitCarousel, 100);
});

// Écouter aussi l'événement de chargement de tous les composants comme backup
document.addEventListener('allComponentsLoaded', () => {
    console.log('All components loaded, checking carousel...');
    setTimeout(tryInitCarousel, 100);
});

// Garder l'écouteur DOMContentLoaded comme dernier recours
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for carousel component...');
    // Faire plusieurs tentatives d'initialisation
    let attempts = 0;
    const maxAttempts = 5;
    const checkInterval = setInterval(() => {
        attempts++;
        if (document.querySelector('[data-carousel="slide"]')) {
            clearInterval(checkInterval);
            tryInitCarousel();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.log('Failed to initialize carousel after maximum attempts');
        }
    }, 200);
});