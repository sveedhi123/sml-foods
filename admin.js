/**
 * SML Foods Admin Dashboard Logic
 * Firebase Auth + Firestore for Product Management & Live Orders
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgnqYw8DJfylglex9DCOFX028h2gpfaTE",
  authDomain: "sml-foods.firebaseapp.com",
  projectId: "sml-foods",
  storageBucket: "sml-foods.firebasestorage.app",
  messagingSenderId: "44875745236",
  appId: "1:44875745236:web:ec116f2396ff92899bf841",
  measurementId: "G-KCSXJMD94K"
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
    if (loginModal) {
        loginModal.classList.remove('hidden');
        if (loginForm) loginForm.reset();
    }
}

function hideLoginModal() {
    if (loginModal) loginModal.classList.add('hidden');
}

function isAuthenticated() {
    return !!auth.currentUser;
}

function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        if (user) {
            hideLoginModal();
            initAdminPanel();
        } else {
            showLoginModal();
        }
    });
}

// Login Handler
if (loginForm) {
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
}

// Product Manager Functions
function setupEventListeners() {
    addProductBtn?.addEventListener('click', openAddProductModal);
    document.getElementById('cancel-product')?.addEventListener('click', closeProductModal);
    productForm?.addEventListener('submit', handleProductSubmit);
}

function openAddProductModal() {
    editingProduct = null;
    if (productForm) productForm.reset();
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = 'Add Product';
    if (productModal) productModal.classList.remove('hidden');
}

function closeProductModal() {
    editingProduct = null;
    if (productForm) productForm.reset();
    if (productModal) productModal.classList.add('hidden');
}

async function loadProducts() {
    if (!productGrid) return;
    
    try {
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
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function generateProductCard(data, id) {
    const statusLabel = {
        'in_stock': 'In Stock',
        'Available': 'In Stock',
        'out_of_stock': 'Out of Stock',
        'Out of Stock': 'Out of Stock',
        'hidden': 'Hidden'
    }[data.status] || data.status || 'In Stock';

    const statusBg = {
        'in_stock': 'bg-green-500/15 text-green-600',
        'Available': 'bg-green-500/15 text-green-600',
        'out_of_stock': 'bg-red-500/15 text-red-600',
        'Out of Stock': 'bg-red-500/15 text-red-600',
        'hidden': 'bg-gray-500/15 text-gray-600'
    }[data.status] || 'bg-green-500/15 text-green-600';

    return `
        <div class="bg-white rounded-2xl border border-forest-light p-5 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-forest-dark">${escapeHtml(data.name)}</h3>
                <div class="flex gap-2">
                    <button onclick="editProduct('${id}')" class="p-1.5 rounded-lg hover:bg-gold/10 text-forest-dark" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5l-5-5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12.5L12 8.5v3.75l6.5 4z"/></svg>
                    </button>
                    <button onclick="deleteProduct('${id}')" class="p-1.5 rounded-lg hover:bg-gold/10 text-red-600" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>
            <p class="text-forest-dark/70 text-sm mb-4">${escapeHtml(data.description || '')}</p>
            <div class="border-t border-forest-light pt-4 mb-4">
                <div class="flex flex-wrap gap-2 text-xs font-semibold">
                    ${data.price250g ? `<span class="bg-gold/15 px-2.5 py-1 rounded-full text-forest-dark">250g: ₹${data.price250g}</span>` : ''}
                    ${data.price500g ? `<span class="bg-gold/15 px-2.5 py-1 rounded-full text-forest-dark">500g: ₹${data.price500g}</span>` : ''}
                    ${data.price1kg ? `<span class="bg-gold/15 px-2.5 py-1 rounded-full text-forest-dark">1kg: ₹${data.price1kg}</span>` : ''}
                </div>
            </div>
            <div class="flex justify-between items-center pt-2">
                <span class="text-xs px-3 py-1 rounded-full font-medium ${statusBg}">${statusLabel}</span>
                <select onchange="updateProductStatus('${id}', this.value)" class="text-xs px-2 py-1 rounded-lg border border-forest-light bg-white focus:outline-none focus:ring-1 focus:ring-gold">
                    <option value="in_stock" ${(data.status === 'in_stock' || data.status === 'Available') ? 'selected' : ''}>In Stock</option>
                    <option value="out_of_stock" ${(data.status === 'out_of_stock' || data.status === 'Out of Stock') ? 'selected' : ''}>Out of Stock</option>
                    <option value="hidden" ${data.status === 'hidden' ? 'selected' : ''}>Hidden</option>
                </select>
            </div>
        </div>
    `;
}

// Edit Product
window.editProduct = async function(id) {
    try {
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) return;
        
        const data = doc.data();
        editingProduct = { id, ...data };
        
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Product';

        document.getElementById('product-name').value = data.name || '';
        document.getElementById('product-desc').value = data.description || '';
        document.getElementById('price-250g').value = data.price250g || '';
        document.getElementById('price-500g').value = data.price500g || '';
        document.getElementById('price-1kg').value = data.price1kg || '';
        
        const statusSelect = document.getElementById('product-status');
        if (statusSelect) {
            let statusVal = data.status || 'in_stock';
            if (statusVal === 'Available') statusVal = 'in_stock';
            if (statusVal === 'Out of Stock') statusVal = 'out_of_stock';
            statusSelect.value = statusVal;
        }
        
        if (productModal) productModal.classList.remove('hidden');
    } catch (error) {
        console.error("Error fetching product for edit:", error);
    }
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

// Update Product Status
window.updateProductStatus = async function(id, newStatus) {
    try {
        await db.collection('products').doc(id).update({
            status: newStatus
        });
        await loadProducts();
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
};

// Legacy toggle function compatibility
window.toggleStatus = async function(id, currentStatus) {
    const nextStatus = (currentStatus === 'in_stock' || currentStatus === 'Available') ? 'out_of_stock' : 'in_stock';
    await updateProductStatus(id, nextStatus);
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
        status: document.getElementById('product-status')?.value || 'in_stock',
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
window.initLiveOrders = function() {
    if (!ordersTable) return;

    db.collection('orders').orderBy('createdAt', 'desc').limit(50).onSnapshot(snapshot => {
        let ordersHtml = '';
        if (snapshot.empty) {
            ordersTable.innerHTML = '<p class="text-center py-8 text-forest-dark/60">No customer orders yet.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const timeAgo = getTimeAgo(data.createdAt?.toDate());
            const currentStatus = data.status || 'Pending';

            ordersHtml += `
                <div class="bg-white rounded-2xl border border-forest-light p-5 mb-4 shadow-sm">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-forest-dark text-base">Order #${doc.id.slice(0, 8).toUpperCase()}</h3>
                            <p class="text-xs text-forest-dark/60">${timeAgo} • ${escapeHtml(data.customerName || 'Customer')}</p>
                            ${data.phone ? `<p class="text-xs text-forest-dark/60">📞 ${escapeHtml(data.phone)}</p>` : ''}
                            ${data.address ? `<p class="text-xs text-forest-dark/60">📍 ${escapeHtml(data.address)}</p>` : ''}
                        </div>
                        <span class="text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(currentStatus)}">${currentStatus}</span>
                    </div>
                    <div class="text-sm space-y-1 my-3 bg-ivory/50 p-3 rounded-xl border border-forest-light/40">
                        ${data.items?.map(item => `
                            <div class="flex justify-between text-xs">
                                <span>${escapeHtml(item.name)} <span class="text-forest-dark/50">(${escapeHtml(item.size || 'Standard')})</span> × ${item.qty}</span>
                                <span class="font-semibold">₹${((item.price || 0) * item.qty).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('') || '<p class="text-xs text-forest-dark/50">No items listed</p>'}
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-forest-light">
                        <span class="font-bold text-forest-dark text-base">Total: ₹${data.total ? data.total.toLocaleString('en-IN') : '0'}</span>
                        <div class="flex items-center gap-2">
                            <label class="text-xs text-forest-dark/70">Status:</label>
                            <select onchange="updateOrderStatus('${doc.id}', this.value)" class="text-xs px-2.5 py-1 rounded-lg border border-forest-light bg-white font-medium focus:ring-1 focus:ring-gold">
                                <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${currentStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });
        ordersTable.innerHTML = ordersHtml;
    }, error => {
        console.error("Error listening to live orders:", error);
    });
};

window.updateOrderStatus = async function(id, status) {
    try {
        await db.collection('orders').doc(id).update({ status });
    } catch (error) {
        alert('Error updating order status: ' + error.message);
    }
};

// Utility Functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag]));
}

function getTimeAgo(date) {
    if (!date) return 'Recently';
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