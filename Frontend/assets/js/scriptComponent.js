// Fonction pour charger le contenu HTML
async function loadComponent(containerId, filepath) {
    try {
        const response = await fetch(filepath);
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            // Déclencher un événement personnalisé quand le header est chargé
            if (containerId === 'header-container') {
                document.dispatchEvent(new CustomEvent('headerLoaded'));
            }
        }
    } catch (error) {
        console.error(`Erreur lors du chargement de ${filepath}:`, error);
    }
}

// Charger les composants
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('header-container', './components/header.html');
    await loadComponent('currently-container', './components/currently.html');
    await loadComponent('recommended-container', './components/recommendedProducts.html');
    await loadComponent('footer-container', './components/footer.html');
    await loadComponent('logo-container', './components/logo.html');  
    await loadComponent('default-carousel-container', './components/carousel.html');
});