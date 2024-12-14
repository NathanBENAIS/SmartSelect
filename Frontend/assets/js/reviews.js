// Attendre que le document soit chargé
document.addEventListener('DOMContentLoaded', function() {
    let selectedRating = 0;
    const productId = new URLSearchParams(window.location.search).get('id');

    // Gérer les étoiles de notation
    const ratingStars = document.getElementById('rating-stars');
    const ratingValue = document.getElementById('rating-value');
    const reviewForm = document.getElementById('review-form');

    // Initialiser l'affichage des avis existants
    loadReviews();

    // Gérer le clic sur les étoiles
    if (ratingStars) {
        ratingStars.addEventListener('click', function(e) {
            const star = e.target.closest('.star-btn');
            if (!star) return;

            selectedRating = parseInt(star.dataset.rating);
            ratingValue.value = selectedRating;
            updateStars();
        });
    }

    // Mettre à jour l'affichage des étoiles
    function updateStars() {
        const stars = ratingStars.querySelectorAll('.star-btn svg');
        stars.forEach((star, index) => {
            if (index < selectedRating) {
                star.classList.remove('text-gray-300', 'dark:text-gray-600');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.add('text-gray-300', 'dark:text-gray-600');
                star.classList.remove('text-yellow-400');
            }
        });
    }

    // Soumettre un nouvel avis
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const user = localStorage.getItem('user');
            if (!user) {
                toastManager.warning('Vous devez être connecté pour laisser un avis');
                setTimeout(() => window.location.href = 'login.html', 2000);
                return;
            }

            const userData = JSON.parse(user);
            const comment = document.getElementById('comment').value;

            if (!selectedRating) {
                toastManager.error('Veuillez sélectionner une note');
                return;
            }

            try {
                const response = await fetch('/smartselect/Backend/api/reviews.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userData.id,
                        product_id: productId,
                        rating: selectedRating,
                        comment: comment
                    })
                });

                const data = await response.json();
                if (data.success) {
                    toastManager.success('Votre avis a été ajouté avec succès');
                    reviewForm.reset();
                    selectedRating = 0;
                    ratingValue.value = 0;
                    updateStars();
                    loadReviews(); // Recharger les avis
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                toastManager.error(error.message || 'Une erreur est survenue');
            }
        });
    }

    // Charger les avis existants
    async function loadReviews() {
        try {
            const response = await fetch(`/smartselect/Backend/api/reviews.php?product_id=${productId}`);
            const data = await response.json();
            
            const reviewsList = document.getElementById('reviews-list');
            
            if (!reviewsList) return;
            
            if (!data.data || data.data.length === 0) {
                reviewsList.innerHTML = `
                    <p class="text-center text-gray-500 dark:text-gray-400">
                        Aucun avis pour le moment. Soyez le premier à donner votre avis !
                    </p>`;
                return;
            }

            reviewsList.innerHTML = data.data.map(review => `
                <div class="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            ${generateStars(review.rating)}
                            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                par ${review.username}
                            </span>
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            ${new Date(review.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300">${review.comment}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des avis:', error);
        }
    }

    // Générer les étoiles pour l'affichage des avis
    function generateStars(rating) {
        return Array(5).fill(0).map((_, index) => `
            <svg class="w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}" 
                 fill="currentColor" 
                 viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
        `).join('');
    }
});