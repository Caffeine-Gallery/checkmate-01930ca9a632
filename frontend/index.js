import { backend } from "declarations/backend";

const form = document.getElementById('add-item-form');
const input = document.getElementById('new-item');
const list = document.getElementById('shopping-list');
const loading = document.getElementById('loading');
const suggestionsDiv = document.getElementById('suggestions');

const toggleLoading = (show) => {
    loading.classList.toggle('d-none', !show);
};

const renderItems = async () => {
    toggleLoading(true);
    try {
        const items = await backend.getItems();
        list.innerHTML = items
            .sort((a, b) => b.id - a.id)
            .map(item => `
                <li class="list-group-item d-flex justify-content-between align-items-center ${item.completed ? 'completed' : ''}"
                    data-id="${item.id}">
                    <span class="item-text" onclick="window.toggleItem(${item.id})">
                        <i class="far ${item.completed ? 'fa-check-square' : 'fa-square'} me-2"></i>
                        ${item.text}
                    </span>
                    <button class="btn btn-danger btn-sm delete-btn" onclick="window.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
            `)
            .join('');
    } catch (error) {
        console.error('Error fetching items:', error);
    } finally {
        toggleLoading(false);
    }
};

let suggestionTimeout;
const updateSuggestions = async (inputText = '') => {
    try {
        const suggestions = await backend.getSuggestions(inputText);
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = `
                <div class="suggestions-container">
                    ${suggestions.map(suggestion => `
                        <button class="btn btn-outline-secondary btn-sm me-2 mb-2 suggestion-btn" 
                                onclick="window.useSuggestion('${suggestion}')">
                            ${suggestion}
                        </button>
                    `).join('')}
                </div>
            `;
        } else {
            suggestionsDiv.innerHTML = '';
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsDiv.innerHTML = '';
    }
};

const debouncedUpdateSuggestions = (inputText) => {
    clearTimeout(suggestionTimeout);
    suggestionTimeout = setTimeout(() => updateSuggestions(inputText), 300);
};

input.addEventListener('input', (e) => {
    debouncedUpdateSuggestions(e.target.value.trim());
});

window.useSuggestion = (text) => {
    input.value = text;
    suggestionsDiv.innerHTML = '';
    input.focus();
};

form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    toggleLoading(true);
    try {
        await backend.addItem(text);
        await renderItems();
        input.value = '';
        // Update suggestions immediately after adding item
        await updateSuggestions('');
    } catch (error) {
        console.error('Error adding item:', error);
    } finally {
        toggleLoading(false);
    }
};

window.toggleItem = async (id) => {
    toggleLoading(true);
    try {
        await backend.toggleItem(id);
        await renderItems();
    } catch (error) {
        console.error('Error toggling item:', error);
    } finally {
        toggleLoading(false);
    }
};

window.deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    toggleLoading(true);
    try {
        await backend.deleteItem(id);
        await renderItems();
        // Update suggestions after deleting item
        await updateSuggestions(input.value.trim());
    } catch (error) {
        console.error('Error deleting item:', error);
    } finally {
        toggleLoading(false);
    }
};

// Initialize
(async () => {
    await renderItems();
    await updateSuggestions('');
})();
