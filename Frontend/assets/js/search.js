// assets/js/search.js
class SearchManager {
    constructor(inputElement, resultsElement) {
        this.searchInput = inputElement;
        this.searchResults = resultsElement;
        this.initializeSearch();
    }

    // Fonction de debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Formater les résultats
    formatSearchResult(result) {
        return `
            <a href="${window.appConfig.baseUrl}/Frontend/detailproduct.html?id=${result.id}" class="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <img src="${window.appConfig.baseUrl}${result.image_url}" alt="${result.name}" class="w-12 h-12 object-cover rounded-md">
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${result.name}</div>
                    <div class="text-sm text-gray-500">${result.manufacturer}</div>
                    <div class="flex items-center mt-1">
                        <span class="text-sm font-medium text-blue-600">${result.price}</span>
                        <span class="mx-2 text-gray-300">•</span>
                        <span class="text-sm text-gray-500">${result.category}</span>
                    </div>
                </div>
            </a>
        `;
    }

    // Initialiser la recherche
    initializeSearch() {
        if (!this.searchInput || !this.searchResults) return;

        // Fonction de recherche
        const performSearch = this.debounce(async (query) => {
            if (query.length < 2) {
                this.searchResults.classList.add('hidden');
                return;
            }

            try {
                const apiUrl = `${window.appConfig.apiUrl}/products.php?action=search&q=${encodeURIComponent(query)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    this.searchResults.innerHTML = data.data.map(result => this.formatSearchResult(result)).join('');
                    this.searchResults.classList.remove('hidden');
                } else {
                    this.searchResults.innerHTML = '<div class="p-4 text-sm text-gray-500">Aucun résultat trouvé</div>';
                    this.searchResults.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                this.searchResults.innerHTML = '<div class="p-4 text-sm text-red-500">Une erreur est survenue</div>';
                this.searchResults.classList.remove('hidden');
            }
        }, 300);

        // Écouteurs d'événements
        this.searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value.trim());
        });

        // Fermer les résultats si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.classList.remove('hidden');
            }
        });

        // Navigation clavier
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchResults.classList.add('hidden');
            }
        });
    }
}