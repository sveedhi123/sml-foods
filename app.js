/**
 * Seetha Maha Lakshmi (SML) Foods - Shopping Cart & Interactive Logic
 */

// State Management
let cart = [];

// DOM Elements
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const taglineText = document.getElementById('tagline-text');
const taglineSection = document.getElementById('tagline-section');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupCartListeners();
    setupTaglineReveal();
    renderCart();
});

// Cart Drawer Open / Close Functions
function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
}

function setupCartListeners() {
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
    
    // Escape key to close cart
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
    });
}

// Global Add to Cart Function
window.addToCart = function(name, price, size = 'Standard') {
    const existingIndex = cart.findIndex(item => item.name === name && item.size === size);
    
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            size: size,
            qty: 1
        });
    }

    renderCart();
    openCart();
    animateBadge();
};

// Update Item Quantity
window.updateQty = function(id, delta) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    cart[itemIndex].qty += delta;

    if (cart[itemIndex].qty <= 0) {
        cart.splice(itemIndex, 1);
    }

    renderCart();
};

// Remove Item Entirely
window.removeItem = function(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
};

// Render Cart HTML & Totals
function renderCart() {
    if (!cartItemsContainer || !cartTotalEl || !cartCount) return;

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Update Badge Count & Total
    cartCount.textContent = totalQty;
    cartTotalEl.textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
    
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }

    // Render Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-12">
                <span class="text-4xl block mb-3 opacity-60">🛍️</span>
                <p class="text-stone-400 text-sm font-medium">Your basket is currently empty.</p>
                <p class="text-stone-600 text-xs mt-1">Explore our pantry to add pure delicacies.</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="flex-grow pr-3">
                <h4 class="text-stone-100 font-semibold text-sm leading-snug">${escapeHtml(item.name)}</h4>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-amber-400/90 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">${escapeHtml(item.size)}</span>
                    <span class="text-xs text-stone-400">₹${item.price} each</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                    <button onclick="updateQty(${item.id}, -1)" class="qty-btn" aria-label="Decrease quantity">-</button>
                    <span class="text-xs font-bold text-stone-200 w-5 text-center">${item.qty}</span>
                    <button onclick="updateQty(${item.id}, 1)" class="qty-btn" aria-label="Increase quantity">+</button>
                </div>
                <button onclick="removeItem(${item.id})" class="text-stone-500 hover:text-red-400 text-xs p-1 transition-colors" title="Remove Item">&times;</button>
            </div>
        </div>
    `).join('');
}

// Badge Animation Effect
function animateBadge() {
    if (!cartCount) return;
    cartCount.classList.add('cart-badge-pulse');
    setTimeout(() => cartCount.classList.remove('cart-badge-pulse'), 300);
}

// Tagline Scroll Reveal
function setupTaglineReveal() {
    if (!taglineText || !taglineSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                taglineText.classList.add('is-revealed');
            }
        });
    }, { threshold: 0.3 });

    observer.observe(taglineSection);
}

// Order Checkout Modal Handler
function handleCheckout() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in';
    modalOverlay.innerHTML = `
        <div class="bg-stone-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <div class="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-2xl mx-auto mb-4 shadow-lg shadow-amber-500/20">
                ✓
            </div>
            <h3 class="text-2xl font-serif font-bold text-white mb-2">Order Confirmed!</h3>
            <p class="text-stone-300 text-sm mb-6">
                Thank you for choosing <span class="text-amber-400 font-semibold">Seetha Maha Lakshmi Foods</span>. Your order of <span class="text-white font-semibold">${itemCount} item(s)</span> worth <span class="text-amber-400 font-bold">₹${total.toLocaleString('en-IN')}</span> has been received.
            </p>
            <div class="bg-stone-950 p-4 rounded-xl border border-stone-800 text-left mb-6 text-xs text-stone-400 space-y-1">
                <p><strong class="text-stone-200">Delivery Status:</strong> Fresh batch preparation initiated</p>
                <p><strong class="text-stone-200">Payment:</strong> Pay on Delivery / UPI Confirmation</p>
                <p><strong class="text-stone-200">Brand Promise:</strong> 100% Pure & Traditional Ingredients</p>
            </div>
            <button id="close-modal-btn" class="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all">
                Back to Pantry
            </button>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    document.getElementById('close-modal-btn').onclick = () => {
        document.body.removeChild(modalOverlay);
        cart = [];
        renderCart();
        closeCart();
    };
}

// Utility: Prevent XSS in rendered cart items
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
