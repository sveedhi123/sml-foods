/**
 * SML Foods Admin Dashboard Logic
 * Firebase Auth + Firestore for Product Management & Live Orders
 */

// Firebase Configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const productGrid = document.getElementById('product-grid');
const mobileMenu = document.getElementById('mobile-menu');
const ordersSection = document.getElementById('orders-section');
const ordersTable = document.getElementById('orders-table');

// Current Product Being Edited
let editingProduct = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Show login modal by default
    showLoginModal();

    // Setup Listeners
    setupAuthListener();
    setupEventListeners();
    
    if (isAuthenticated()) {
        initAdminPanel();
    }
});

// Authentication Functions
function showLoginModal() {
    loginModal.classList.remove('hidden');
    loginForm.reset();
}

function hideLoginModal() {
    loginModal.classList.add('hidden');
}

function isAuthenticated() {
    return !!auth.currentUser;
}

function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        if (user) {
            hideLoginModal();
            initAdminPanel();
        }
    });
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Product Manager Functions
function setupEventListeners() {
    addProductBtn?.addEventListener('click', openAddProductModal);
    document.getElementById('cancel-product')?.addEventListener('click', closeProductModal);
    productForm?.addEventListener('submit', handleProductSubmit);
}

function openAddProductModal() {
    editingProduct = null;
    productForm.reset();
    document.getElementById('modal-title').textContent = 'Add Product';
    productModal.classList.remove('hidden');
}

function closeProductModal() {
    editingProduct = null;
    productForm.reset();
    productModal.classList.remove('hidden');
}

async function loadProducts() {
    if (!productGrid) return;
    
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    productGrid.innerHTML = '';
    
    if (snapshot.empty) {
        productGrid.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <p class="text-forest-dark/60">No products added yet. Click "Add Product" to get started.</p>
            </div>
        `;
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        productGrid.innerHTML += generateProductCard(data, doc.id);
    });
}

function generateProductCard(data, id) {
    return `
        <div class="bg-white rounded-2xl border border-forest-light p-5 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-forest-dark">${escapeHtml(data.name)}</h3>
                <div class="flex gap-2">
                    <button onclick="editProduct('${id}')" class="p-1.5 rounded-lg hover:bg-gold/10 text-forest-dark" title="Edit"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5l-5-5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12.5L12 8.5v3.75l6.5 4z"/></svg></button>
                    <button onclick="deleteProduct('${id}')" class="p-1.5 rounded-lg hover:bg-gold/10 text-forest-dark" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
            </div>
            <p class="text-forest-dark/70 text-sm mb-4">${escapeHtml(data.description || '')}</p>
            <div class="border-t border-forest-light pt-4 mb-4">
                <div class="flex gap-4 text-sm">
                    <span class="bg-gold/15 px-3 py-1 rounded-full">${data.price250g ? '₹' + data.price250g + ' (250g)' : ''}</span>
                    <span class="bg-gold/15 px-3 py-1 rounded-full">${data.price500g ? '₹' + data.price500g + ' (500g)' : ''}</span>
                    <span class="bg-gold/15 px-3 py-1 rounded-full">${data.price1kg ? '₹' + data.price1kg + ' (1kg)' : ''}</span>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs px-3 py-1 rounded-full ${data.status === 'Available' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}">${data.status}</span>
                <button onclick="toggleStatus('${id}', '${data.status}')" class="px-3 py-1 text-xs rounded-lg border border-forest-light hover:bg-gold/10">
                    ${data.status === 'Available' ? 'Mark Out of Stock' : 'Mark Available'}
                </button>
            </div>
        </div>
    `;
}

// Edit Product
window.editProduct = async function(id) {
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) return;
    
    const data = doc.data();
    editingProduct = { id, ...data };
    
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('product-name').value = data.name || '';
    document.getElementById('product-desc').value = data.description || '';
    document.getElementById('price-250g').value = data.price250g || '';
    document.getElementById('price-500g').value = data.price500g || '';
    document.getElementById('price-1kg').value = data.price1kg || '';
    document.getElementById('product-status').value = data.status || 'Available';
    
    productModal.classList.remove('hidden');
};

// Delete Product
window.deleteProduct = async function(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await db.collection('products').doc(id).delete();
        await loadProducts();
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
};

// Toggle Status
window.toggleStatus = async function(id, currentStatus) {
    try {
        await db.collection('products').doc(id).update({
            status: currentStatus === 'Available' ? 'Out of Stock' : 'Available'
        });
        await loadProducts();
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
};

// Handle Product Form Submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value.trim(),
        description: document.getElementById('product-desc').value.trim(),
        price250g: parseFloat(document.getElementById('price-250g').value) || 0,
        price500g: parseFloat(document.getElementById('price-500g').value) || 0,
        price1kg: parseFloat(document.getElementById('price-1kg').value) || 0,
        status: document.getElementById('product-status').value,
        createdAt: editingProduct ? editingProduct.createdAt : firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (editingProduct) {
            await db.collection('products').doc(editingProduct.id).update(productData);
        } else {
            await db.collection('products').add(productData);
        }
        closeProductModal();
        await loadProducts();
    } catch (error) {
        alert('Error saving product: ' + error.message);
    }
}

// Live Orders Viewer
window.initLiveOrders = async function() {
    const query = db.collection('orders').orderBy('createdAt', 'desc').limit(50);
    
    query.onSnapshot(snapshot => {
        let ordersHtml = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const timeAgo = getTimeAgo(data.createdAt?.toDate());
            ordersHtml += `
                <div class="bg-white rounded-2xl border border-forest-light p-5 mb-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-forest-dark">Order #${doc.id.slice(0, 8).toUpperCase()}</h3>
                            <p class="text-xs text-forest-dark/60">${timeAgo} • ${data.customerName || 'Guest'}</p>
                        </div>
                        <span class="text-xs px-3 py-1 rounded-full ${getStatusColor(data.status)}">${data.status}</span>
                    </div>
                    <div class="text-sm space-y-1 mb-3">
                        ${data.items?.map(item => `<p>${item.name} × ${item.qty} (${item.size}) - ₹${(item.price * item.qty).toLocaleString()}</p>`).join('') || ''}
                    </div>
                    <div class="flex justify-between items-center pt-3 border-t border-forest-light">
                        <span class="font-bold text-forest-dark">₹${data.total ? data.total.toLocaleString() : '0'}</span>
                        <button onclick="updateOrderStatus('${doc.id}', 'processing')" class="px-3 py-1 text-xs rounded-lg bg-gold/10 text-gold hover:bg-gold/20">Processing</button>
                    </div>
                </div>
            `;
        });
        ordersTable.innerHTML = ordersHtml || '<p class="text-center py-8 text-forest-dark/60">No orders yet</p>';
    });
};

window.updateOrderStatus = async function(id, status) {
    await db.collection('orders').doc(id).update({ status });
};

// Utility Functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag]));
}

function getTimeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function getStatusColor(status) {
    const colors = {
        'Pending': 'bg-amber-500/15 text-amber-600',
        'Processing': 'bg-blue-500/15 text-blue-600',
        'Shipped': 'bg-purple-500/15 text-purple-600',
        'Delivered': 'bg-green-500/15 text-green-600',
        'Cancelled': 'bg-red-500/15 text-red-600'
    };
    return colors[status] || 'bg-gray-500/15 text-gray-600';
}

// Initialize Admin Panel after Login
async function initAdminPanel() {
    await loadProducts();
    initLiveOrders();
}

// Mobile Menu Toggle
if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
        }
    });
}