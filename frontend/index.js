import { backend } from "declarations/backend";

const form = document.getElementById('add-item-form');
const input = document.getElementById('new-item');
const list = document.getElementById('shopping-list');
const loading = document.getElementById('loading');

// Show/hide loading spinner
const toggleLoading = (show) => {
    loading.classList.toggle('d-none', !show);
};

// Render all items
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

// Add new item
form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    toggleLoading(true);
    try {
        await backend.addItem(text);
        input.value = '';
        await renderItems();
    } catch (error) {
        console.error('Error adding item:', error);
    } finally {
        toggleLoading(false);
    }
};

// Toggle item completion
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

// Delete item
window.deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    toggleLoading(true);
    try {
        await backend.deleteItem(id);
        await renderItems();
    } catch (error) {
        console.error('Error deleting item:', error);
    } finally {
        toggleLoading(false);
    }
};

// Initial render
renderItems();
