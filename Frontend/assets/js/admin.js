class AdminPanel {
    constructor() {
        this.apiUrl = '/smartselect/Backend';
        this.tableSelect = document.getElementById('table-select');
        this.tableHeaders = document.getElementById('table-headers');
        this.tableBody = document.getElementById('table-body');
        this.currentUser = JSON.parse(localStorage.getItem('user'));
        this.currentTableData = null;
        this.init();
    }

    async init() {
        try {
            if (!this.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            await this.loadTables();
            this.addEventListeners();
        } catch (error) {
            toastManager.error('Impossible d\'initialiser l\'administration');
        }
    }


    async loadTables() {
        try {
            const response = await fetch(`${this.apiUrl}/admin.php?action=get_tables`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                this.tableSelect.innerHTML = `
                    <option value="">Sélectionner une table</option>
                    ${data.data.map(table => `<option value="${table}">${table}</option>`).join('')}
                `;
            }
        } catch (error) {
            toastManager.error('Impossible de charger les tables');
        }
    }

    async loadTableData(tableName) {
        try {
            console.log('Chargement des données pour la table:', tableName);
            const url = `${this.apiUrl}/admin.php?action=get_table_data&table=${encodeURIComponent(tableName)}`;
            console.log('URL de requête:', url);
    
            const response = await fetch(url);
            console.log('Statut de la réponse:', response.status);
    
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
            const responseText = await response.text();
            console.log('Réponse brute:', responseText);
    
            const data = JSON.parse(responseText);
            console.log('Données parsées:', data);
    
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                console.log('Données valides reçues');
                this.currentTableData = data.data;
                this.renderTable(data.data);
            } else {
                console.warn('Données invalides ou vides reçues:', data);
                toastManager.warning('Cette table est vide');
            }
        } catch (error) {
            console.error('Erreur détaillée:', error);
            toastManager.error('Impossible de charger les données');
        }
    }
    renderTable(data) {
        const columns = Object.keys(data[0]);
        
        // Supprimer l'ancien bouton Ajouter s'il existe
        const oldAddButton = document.querySelector('.mb-4.flex.justify-end');
        if (oldAddButton) {
            oldAddButton.remove();
        }

        // Ajouter le bouton "Ajouter" au bon endroit
        const tableContainer = document.querySelector('.bg-white.dark\\:bg-gray-900');
        if (tableContainer) {
            const addButtonContainer = document.createElement('div');
            addButtonContainer.className = 'mb-4 flex justify-end';
            addButtonContainer.innerHTML = `
                <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
                        title="Ajouter un nouvel enregistrement">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Ajouter
                </button>
            `;
            
            const addButton = addButtonContainer.querySelector('button');
            addButton.onclick = () => this.openAddModal();
            
            // Insérer le bouton avant le conteneur de la table
            tableContainer.parentNode.insertBefore(addButtonContainer, tableContainer);
        }
        
        // Render headers
        this.tableHeaders.innerHTML = `
            ${columns.map(column => `
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ${column}
                </th>
            `).join('')}
            <th class="px-6 py-3">Actions</th>
        `;

        // Render rows
        this.tableBody.innerHTML = data.map(row => `
            <tr class="hover:bg-gray-50" data-id="${row.id}">
                ${columns.map(column => `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${row[column] !== null ? row[column] : ''}
                    </td>
                `).join('')}
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        class="text-blue-600 hover:text-blue-900 mr-3 p-2 rounded hover:bg-blue-50"
                        onclick="adminPanel.openEditModal('${row.id}')"
                        title="Modifier">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button 
                        class="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                        onclick="adminPanel.deleteRecord('${row.id}')"
                        title="Supprimer">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async openEditModal(id) {
        const record = this.currentTableData.find(row => row.id === id);
        if (!record) return;

        const columns = Object.keys(record).filter(col => col !== 'id');
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg w-96 relative max-h-[90vh] overflow-y-auto">
                <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                        onclick="this.closest('.fixed').remove()">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 class="text-lg font-semibold mb-4">Modifier l'enregistrement</h3>
                <form id="edit-form" class="space-y-4">
                    ${columns.map(col => `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">${col}</label>
                            <input type="text" 
                                   name="${col}" 
                                   value="${record[col] || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    `).join('')}
                    <div class="mt-6 flex justify-end gap-4">
                        <button type="button" 
                                class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                                onclick="this.closest('.fixed').remove()">
                            Annuler
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('edit-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData);
            await this.updateRecord(id, updatedData);
            modal.remove();
        };
    }

    async openAddModal() {
        if (!this.currentTableData || this.currentTableData.length === 0) return;

        const columns = Object.keys(this.currentTableData[0]).filter(col => col !== 'id');
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg w-96 relative max-h-[90vh] overflow-y-auto">
                <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                        onclick="this.closest('.fixed').remove()">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 class="text-lg font-semibold mb-4">Ajouter un enregistrement</h3>
                <form id="add-form" class="space-y-4">
                    ${columns.map(col => `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">${col}</label>
                            <input type="text" 
                                   name="${col}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    `).join('')}
                    <div class="mt-6 flex justify-end gap-4">
                        <button type="button" 
                                class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                                onclick="this.closest('.fixed').remove()">
                            Annuler
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('add-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newData = Object.fromEntries(formData);
            await this.addRecord(newData);
            modal.remove();
        };
    }

    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white ${colors[type]} shadow-lg z-50 transform transition-all duration-300 ease-in-out translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">
                    ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
                </span>
                ${message}
            </div>
        `;

        document.body.appendChild(toast);

        // Animation d'entrée
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Animation de sortie et suppression
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    async updateRecord(id, data) {
        try {
            const response = await fetch(`${this.apiUrl}/admin.php?action=update_record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: this.tableSelect.value,
                    id: id,
                    data: data
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            if (result.success) {
                toastManager.success('Modifications enregistrées avec succès');
                await this.loadTableData(this.tableSelect.value);
            } else {
                toastManager.error('Impossible de sauvegarder les modifications');
            }
        } catch (error) {
            toastManager.error('Une erreur est survenue lors de la modification');
        }
    }

    async addRecord(data) {
        try {
            const response = await fetch(`${this.apiUrl}/admin.php?action=add_record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: this.tableSelect.value,
                    data: data
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            if (result.success) {
                toastManager.success('Nouvel enregistrement ajouté avec succès');
                await this.loadTableData(this.tableSelect.value);
            } else {
                toastManager.error('Impossible d\'ajouter l\'enregistrement');
            }
        } catch (error) {
            toastManager.error('Une erreur est survenue lors de l\'ajout');
        }
    }

    async deleteRecord(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/admin.php?action=delete_record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: this.tableSelect.value,
                    id: id
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            if (result.success) {
                toastManager.success('Enregistrement supprimé avec succès');
                await this.loadTableData(this.tableSelect.value);
            } else {
                toastManager.error('Impossible de supprimer l\'enregistrement');
            }
        } catch (error) {
            toastManager.error('Une erreur est survenue lors de la suppression');
        }
    }
    
    addEventListeners() {
        if (this.tableSelect) {
            this.tableSelect.addEventListener('change', (e) => {
                const selectedTable = e.target.value;
                if (selectedTable) {
                    this.loadTableData(selectedTable);
                } else {
                    this.tableHeaders.innerHTML = '';
                    this.tableBody.innerHTML = '';
                    // Supprimer le bouton Ajouter s'il existe
                    const addButton = document.querySelector('.mb-4.flex.justify-end');
                    if (addButton) {
                        addButton.remove();
                    }
                }
            });
        }

        // Gestionnaire d'événements pour le thème sombre
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
            });
        }

        // Initialiser le thème au chargement
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark');
            if (darkModeToggle) {
                darkModeToggle.checked = true;
            }
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    // Rendre l'instance accessible globalement
    window.adminPanel = adminPanel;
});