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
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!reviewsList) return;
            
            if (!data.data || data.data.length === 0) {
                reviewsList.innerHTML = `
                    <p class="text-center text-gray-500 dark:text-gray-400">
                        Aucun avis pour le moment. Soyez le premier à donner votre avis !
                    </p>`;
                return;
            }
    
            reviewsList.innerHTML = data.data.map(review => `
                <div class="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0" data-review-id="${review.id}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            ${generateStars(review.rating)}
                            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                par ${review.username}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                ${new Date(review.created_at).toLocaleDateString()}
                            </span>
                            ${currentUser.id === review.user_id ? `
                                <button class="edit-review-btn text-blue-600 hover:text-blue-800">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                                <button class="delete-review-btn text-red-600 hover:text-red-800">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300">${review.comment}</p>
                </div>
            `).join('');
    
            // Ajouter les écouteurs d'événements pour les boutons
            document.querySelectorAll('.edit-review-btn').forEach(btn => {
                btn.addEventListener('click', handleEditReview);
            });
    
            document.querySelectorAll('.delete-review-btn').forEach(btn => {
                btn.addEventListener('click', handleDeleteReview);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des avis:', error);
        }
    }
    
    // Fonction de gestion de la modification
    async function handleEditReview(e) {
        const reviewContainer = e.target.closest('[data-review-id]');
        const reviewId = reviewContainer.dataset.reviewId;
        const commentElement = reviewContainer.querySelector('p');
        const ratingElement = reviewContainer.querySelector('.flex.items-center');
        
        // Remplacer le texte par un formulaire d'édition
        const currentComment = commentElement.textContent;
        const currentRating = reviewContainer.querySelectorAll('.text-yellow-400').length;
    
        commentElement.innerHTML = `
            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md">${currentComment}</textarea>
            <div class="flex gap-2 mt-2">
                <button class="save-edit-btn px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enregistrer</button>
                <button class="cancel-edit-btn px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700">Annuler</button>
            </div>
        `;
    
        // Gérer la sauvegarde
        const saveBtn = commentElement.querySelector('.save-edit-btn');
        const cancelBtn = commentElement.querySelector('.cancel-edit-btn');
        
        saveBtn.addEventListener('click', async () => {
            const newComment = commentElement.querySelector('textarea').value;
            try {
                const response = await fetch('/smartselect/Backend/api/reviews.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        review_id: reviewId,
                        user_id: JSON.parse(localStorage.getItem('user')).id,
                        rating: currentRating,
                        comment: newComment
                    })
                });
                
                if (response.ok) {
                    loadReviews(); // Recharger tous les avis
                    toastManager.success('Avis modifié avec succès');
                }
            } catch (error) {
                toastManager.error('Erreur lors de la modification de l\'avis');
            }
        });
    
        cancelBtn.addEventListener('click', () => {
            commentElement.textContent = currentComment;
        });
    }
    
    // Fonction de gestion de la suppression
    async function handleDeleteReview(e) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
            return;
        }
    
        const reviewContainer = e.target.closest('[data-review-id]');
        const reviewId = reviewContainer.dataset.reviewId;
        const userId = JSON.parse(localStorage.getItem('user')).id;
    
        try {
            const response = await fetch(`/smartselect/Backend/api/reviews.php?review_id=${reviewId}&user_id=${userId}`, {
                method: 'DELETE'
            });
    
            if (response.ok) {
                loadReviews(); // Recharger tous les avis
                toastManager.success('Avis supprimé avec succès');
            }
        } catch (error) {
            toastManager.error('Erreur lors de la suppression de l\'avis');
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