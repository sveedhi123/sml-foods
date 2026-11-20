/**
 * SML Foods - Storefront with Firestore Integration
 */

const db = firebase.firestore();
const productsGrid = document.getElementById('products-grid');
const categoryTabs = document.querySelectorAll('.category-tab');
const taglineSection = document.getElementById('tagline-section');
const taglineText = document.getElementById('tagline-text');

let products = [];
let currentCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupCategoryTabs();
    initLiveOrders();
    setupTaglineReveal();
});

// Category Tab Handling
function setupCategoryTabs() {
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            categoryTabs.forEach(t => t.classList.remove('active', 'bg-amber-500', 'text-black'));
            categoryTabs.forEach(t => t.classList.add('bg-stone-900', 'border', 'border-stone-800', 'text-stone-300', 'hover:text-white', 'hover:bg-stone-800'));
            this.classList.add('active', 'bg-amber-500', 'text-black');
            currentCategory = this.dataset.category;
            renderProducts();
        });
    });
}

// Load Products from Firestore
db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'in_stock';
            if (status !== 'hidden') {
                products.push({ id: doc.id, ...data, status });
            }
        });
        renderProducts();
    }, error => {
        productsGrid.innerHTML = '<p class="text-center py-8 text-stone-500">Error loading products.</p>';
    });

// Render Products by Category
function renderProducts() {
    productsGrid.innerHTML = '';
    let filteredProducts = products;
    
    if (currentCategory !== 'all') {
        filteredProducts = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            if (currentCategory === 'ghee') return name.includes('ghee');
            if (currentCategory === 'pickles') return name.includes('pickle');
            if (currentCategory === 'paneer') return name.includes('paneer');
            return true;
        });
    }
    
    filteredProducts.forEach(product => {
        productsGrid.innerHTML += generateProductCard(product);
    });
}

// Generate Product Card
function generateProductCard(p) {
    const statusClass = p.status === 'in_stock' ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600';
    const statusLabel = p.status === 'in_stock' ? 'In Stock' : 'Out of Stock';
    const prices = [{ label: '250g', value: p.price250g }, { label: '500g', value: p.price500g }, { label: '1kg', value: p.price1kg }].filter(pr => pr.value > 0);

    return `
        <div class="bg-brand-card rounded-2xl border border-stone-800 overflow-hidden hover:border-amber-500/40 flex flex-col">
            <div class="h-56 bg-stone-900 flex items-center justify-center">
                <span class="text-6xl text-amber-400 opacity-30">${getEmojiForProduct(p.name)}</span>
                ${p.status === 'out_of_stock' ? '<span class="absolute top-4 right-4 px-2 py-1 rounded-full bg-red-500 text-white">Sold Out</span>' : ''}
            </div>
            <div class="p-5 flex-grow flex flex-col">
                <h3 class="text-lg font-bold text-white mb-2">${escapeHtml(p.name)}</h3>
                <p class="text-stone-400 text-sm mb-4">${escapeHtml(p.description)}</p>
                <div class="mt-auto">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs px-2 py-1 rounded-full ${statusClass}">${statusLabel}</span>
                        <span class="text-amber-400 font-bold">₹${prices[0]?.value || 0}</span>
                    </div>
                    ${prices.length > 0 ? `<div class="flex gap-2 mb-3">${prices.map(pr => pr.value > 0 ? `<button onclick="addToCart('${escapeHtml(p.name)}', ${pr.value}, '${pr.label}')" class="flex-1 text-xs py-1.5 rounded-lg bg-amber-500 text-black">${pr.label} - ₹${pr.value}</button>` : '').join('')}</div>` : ''}
                    <button onclick="addToCart('${escapeHtml(p.name)}', 0, 'Contact')" class="w-full py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-sm">Add to Order</button>
                </div>
            </div>
        </div>
    `;
}

function getEmojiForProduct(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('ghee')) return '🪔';
    if (n.includes('pickle')) return '🥭';
    if (n.includes('paneer')) return '🧀';
    return '🍽️';
}

// Cart & Order Functions
window.addToCart = function(name, price, size) {
    const cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
    const existing = cart.find(i => i.name === name && i.size === size);
    if (existing) existing.qty++;
    else cart.push({ id: Date.now(), name, price, size, qty: 1 });
    localStorage.setItem('sml_cart', JSON.stringify(cart));
    document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-drawer').classList.add('open');
    renderCart();
};

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-stone-500 text-center py-8">Your cart is empty</p>';
        totalEl.textContent = '₹0';
        return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `<div class="flex items-center gap-3 p-3 bg-stone-900 rounded-xl border">
            <div class="flex-1"><p class="text-stone-200 font-medium text-sm">${escapeHtml(item.name)}</p><p class="text-xs text-amber-400">${escapeHtml(item.size)} × ${item.qty}</p></div>
            <div class="flex items-center gap-1">
                <button onclick="updateCartQty(${item.id}, -1)" class="p-1 rounded-lg hover:bg-amber-500/20 text-stone-400">−</button>
                <span class="font-bold text-amber-400">₹${itemTotal.toLocaleString()}</span>
                <button onclick="updateCartQty(${item.id}, 1)" class="p-1 rounded-lg hover:bg-amber-500/20 text-stone-400">+</button>
            </div>
        </div>`;
    }).join('');
    totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

window.updateCartQty = function(id, delta) {
    let cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
    const itemIndex = cart.findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    cart[itemIndex].qty += delta;
    if (cart[itemIndex].qty <= 0) cart.splice(itemIndex, 1);
    localStorage.setItem('sml_cart', JSON.stringify(cart));
    renderCart();
    document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
};

window.placeOrder = async function() {
    const cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
    if (cart.length === 0) return;
    
    const order = {
        customerName: document.getElementById('customer-name')?.value || 'Customer',
        phone: document.getElementById('customer-phone')?.value || '',
        address: document.getElementById('delivery-address')?.value || '',
        paymentMode: document.getElementById('payment-mode')?.value || 'UPI',
        items: cart.map(i => ({ name: i.name, qty: i.qty, size: i.size, price: i.price })),
        total: cart.reduce((sum, i) => sum + (i.price * i.qty), 0),
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('orders').add(order);
        localStorage.removeItem('sml_cart');
        cart.length = 0;
        renderCart();
        document.getElementById('cart-count').textContent = 0;
        document.getElementById('cart-drawer').classList.remove('open');
        alert('Order placed successfully!');
    } catch (error) {
        alert('Error placing order. Please try again.');
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '' }[tag]));
}

// Setup
document.getElementById('cart-backdrop')?.addEventListener('click', () => {
    document.getElementById('cart-drawer').classList.remove('open');
});
document.getElementById('close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-drawer').classList.remove('open');
});
document.getElementById('checkout-btn')?.addEventListener('click', window.placeOrder);

// Tagline Reveal
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) taglineText.classList.add('is-revealed');
}, { threshold: 0.3 });
observer.observe(taglineSection);