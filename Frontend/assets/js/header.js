// Fonction pour vérifier si un utilisateur est connecté
function isUserLoggedIn() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Fonction pour mettre à jour la section d'authentification
function updateAuthSection() {
  const authSection = document.getElementById("auth-section");
  if (!authSection) return;

  const user = isUserLoggedIn();

  if (user) {
    // Condition pour afficher le lien d'administration
    const adminLink = user.username === 'Nathan BENAIS' 
      ? `<a href="admin.html" class="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 font-semibold">Administration</a>`
      : '';

    authSection.innerHTML = `
      <div class="relative">
        <button id="user-menu-button" class="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-md transition duration-300 ease-in-out transform hover:from-blue-600 hover:to-blue-700 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <span>${user.username}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
          <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mon profil</a>
          <a href="favorites.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mes favoris</a>
          ${adminLink}
          <hr class="my-1">
          <button id="logout-button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Se déconnecter
          </button>
        </div>
      </div>
    `;

    // Gestion du menu utilisateur
    const userMenuButton = document.getElementById("user-menu-button");
    const userDropdown = document.getElementById("user-dropdown");
    const logoutButton = document.getElementById("logout-button");

    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("hidden");
      });

      // Fermer le menu si on clique ailleurs
      document.addEventListener("click", (e) => {
        if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.add("hidden");
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.reload();
      });
    }
  } else {
    // Version non connectée
    authSection.innerHTML = `
         <button class="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md transition duration-300 ease-in-out transform hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Connexion
         </button>
        `;

    // Ajouter l'événement de redirection vers la page de connexion
    const loginButton = authSection.querySelector("button");
    if (loginButton) {
      loginButton.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
  }
}

// Fonction de debounce pour limiter les appels à l'API
function debounce(func, wait) {
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

// Fonction pour formater les résultats de recherche
function formatSearchResult(result) {
  const imageUrl = result.image_url.replace("/smartselectassets/", "/smartselect/Frontend/assets/");
    
  return `
      <a href="${window.appConfig.baseUrl}/Frontend/detailproduct.html?id=${result.id}" class="flex items-center p-4 hover:bg-gray-50 transition-colors">
          <img src="${imageUrl}" alt="${result.name}" class="w-12 h-12 object-cover rounded-md">
          <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${result.name}</div>
              <div class="text-sm text-gray-500">${result.manufacturer}</div>                
          </div>
      </a>
  `;
}

// Initialisation de la recherche
function initializeSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  if (!searchInput || !searchResults) return;

  // Fonction de recherche
  const performSearch = debounce(async (query) => {
    if (query.length < 2) {
      searchResults.classList.add("hidden");
      return;
    }

    try {
      // Utiliser l'URL de l'API depuis la configuration
      const apiUrl = `${
        window.appConfig.apiUrl
      }/products.php?action=search&q=${encodeURIComponent(query)}`;
      console.log("URL de recherche:", apiUrl); // Pour debug

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        searchResults.innerHTML = data.data
          .map((result) => formatSearchResult(result))
          .join("");
        searchResults.classList.remove("hidden");
      } else {
        searchResults.innerHTML =
          '<div class="p-4 text-sm text-gray-500">Aucun résultat trouvé</div>';
        searchResults.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      searchResults.innerHTML =
        '<div class="p-4 text-sm text-red-500">Une erreur est survenue</div>';
      searchResults.classList.remove("hidden");
    }
  }, 300);

  // Écouteurs d'événements
  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value.trim());
  });

  // Fermer les résultats si on clique ailleurs
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  // Naviguer dans les résultats avec le clavier
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchResults.classList.add("hidden");
    }
  });
}

// Fonction d'initialisation des menus
function initializeMenus() {
  const megaMenuButton = document.getElementById("mega-menu-dropdown-button");
  const megaMenuDropdown = document.getElementById("mega-menu-dropdown");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu-2");

  // Initialiser la section d'authentification
  updateAuthSection();

  // Initialiser la recherche
  initializeSearch();

  if (megaMenuButton && megaMenuDropdown) {
    // Gestion du menu déroulant des catégories
    megaMenuButton.addEventListener("click", () => {
      const isExpanded =
        megaMenuButton.getAttribute("aria-expanded") === "true";
      megaMenuDropdown.classList.toggle("hidden");
      megaMenuButton.setAttribute("aria-expanded", !isExpanded);
    });

    // Fermer le menu déroulant quand on clique en dehors
    document.addEventListener("click", (event) => {
      const isClickInside =
        megaMenuButton.contains(event.target) ||
        megaMenuDropdown.contains(event.target);

      if (!isClickInside && !megaMenuDropdown.classList.contains("hidden")) {
        megaMenuDropdown.classList.add("hidden");
        megaMenuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (mobileMenuButton && mobileMenu) {
    // Gestion du menu mobile
    mobileMenuButton.addEventListener("click", () => {
      const isExpanded =
        mobileMenuButton.getAttribute("aria-expanded") === "true";
      mobileMenu.classList.toggle("hidden");
      mobileMenuButton.setAttribute("aria-expanded", !isExpanded);
    });
  }

  // Gestion du redimensionnement
  window.addEventListener("resize", () => {
    if (mobileMenu && window.innerWidth >= 1024) {
      mobileMenu.classList.remove("hidden");
    }

    if (megaMenuDropdown && megaMenuButton) {
      megaMenuDropdown.classList.add("hidden");
      megaMenuButton.setAttribute("aria-expanded", "false");
    }
  });
}

// Écouter l'événement personnalisé 'headerLoaded'
document.addEventListener("headerLoaded", () => {
  console.log("Header loaded, initializing menus...");
  initializeMenus();
});

// Aussi vérifier au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("header-container").children.length > 0) {
    initializeMenus();
  }
});
