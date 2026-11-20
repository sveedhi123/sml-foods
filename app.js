/**
 * SML Foods - Luxury Artisanal Storefront
 * Complete storefront with product seeding, weight selectors, cart drawer, WhatsApp checkout
 * Exposes global API for 3D store integration
 */

// Firebase initialization
const db = firebase.firestore();

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const emptyState = document.getElementById('empty-state');
const categoryTabs = document.querySelectorAll('.category-tab');
const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartDeliveryEl = document.getElementById('cart-delivery');
const cartTotalEl = document.getElementById('cart-total');
const checkoutWhatsAppBtn = document.getElementById('checkout-whatsapp');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const deliveryAddressInput = document.getElementById('delivery-address');
const cartCountEl = document.getElementById('cart-count');
const header = document.getElementById('header');

// State
let products = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
let isFirestoreLoaded = false;

// Default Products Seed Data
const DEFAULT_PRODUCTS = [
  // BILONA GHEE
  {
    id: 'ghee-bilona-250',
    name: 'Bilona A2 Cow Ghee',
    category: 'ghee',
    description: 'Hand-churned from curd of free-grazing Gir cows using the ancient bilona method. 30L of A2 milk yields just 1kg of this liquid gold. Rich in Omega-3, butyric acid, and fat-soluble vitamins.',
    shortDesc: 'Traditional bilona-churned from Gir cow curd',
    image: 'https://images.unsplash.com/photo-1625944970930-2d7825127b96?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    variants: [
      { weight: '250ml', price: 850, sku: 'GHEE-BIL-250', inStock: true },
      { weight: '500ml', price: 1650, sku: 'GHEE-BIL-500', inStock: true },
      { weight: '1L', price: 3100, sku: 'GHEE-BIL-1000', inStock: true }
    ],
    badges: ['Bestseller', '100% Pure'],
    tags: ['A2', 'Bilona', 'Gir Cow', 'No Preservatives'],
    churnDate: '2026-11-15',
    status: 'in_stock',
    shelfPosition: 'ghee'
  },
  {
    id: 'ghee-bilona-cultured',
    name: 'Cultured Desi Ghee (Glass Jar)',
    category: 'ghee',
    description: 'Premium small-batch ghee cultured for 24 hours before churning. Stored in premium borosilicate glass jars with nitrogen flush. Deeper nutty aroma, higher smoke point.',
    shortDesc: '24hr cultured, glass jar, nitrogen flushed',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1625944970930-2d7825127b96?w=600&q=80',
    variants: [
      { weight: '250ml', price: 1100, sku: 'GHEE-CUL-250', inStock: true },
      { weight: '500ml', price: 2100, sku: 'GHEE-CUL-500', inStock: true }
    ],
    badges: ['Premium', 'Glass Jar'],
    tags: ['A2', 'Cultured', 'Glass Jar', 'Nitrogen Flushed'],
    churnDate: '2026-11-10',
    status: 'in_stock',
    shelfPosition: 'ghee'
  },

  // ANDHRA PICKLES
  {
    id: 'pickle-avakaya',
    name: 'Avakaya Mango Pickle',
    category: 'pickles',
    description: "Andhra's crown jewel — raw Rajapuri mangoes hand-cut, layered with kachi ghani mustard oil, rock salt, red chili, mustard, methi, and turmeric. Sun-cured 21 days on cotton cloth. No vinegar, no water.",
    shortDesc: 'Raw Rajapuri mango, 21-day sun cure, kachi ghani oil',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
    variants: [
      { weight: '200g', price: 320, sku: 'PKL-AVA-200', inStock: true },
      { weight: '500g', price: 750, sku: 'PKL-AVA-500', inStock: true },
      { weight: '1kg', price: 1400, sku: 'PKL-AVA-1000', inStock: true }
    ],
    badges: ['Bestseller', 'Traditional'],
    tags: ['Andhra', 'Mango', 'Sun-Cured', 'No Vinegar', 'Mustard Oil'],
    cureDate: '2026-10-25',
    status: 'in_stock',
    shelfPosition: 'pickles'
  },
  {
    id: 'pickle-gongura',
    name: 'Gongura Pickle (Sorrel Leaves)',
    category: 'pickles',
    description: 'Tangy gongura leaves (sorrel) hand-picked at dawn, stone-ground with garlic, red chili, and cold-pressed sesame oil. The quintessential Andhra accompaniment — sour, spicy, deeply aromatic.',
    shortDesc: 'Dawn-picked sorrel leaves, stone-ground, sesame oil',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
    variants: [
      { weight: '200g', price: 280, sku: 'PKL-GON-200', inStock: true },
      { weight: '500g', price: 650, sku: 'PKL-GON-500', inStock: true }
    ],
    badges: ['Regional Specialty'],
    tags: ['Andhra', 'Gongura', 'Sorrel', 'Stone-Ground', 'Sesame Oil'],
    cureDate: '2026-11-01',
    status: 'in_stock',
    shelfPosition: 'pickles'
  },
  {
    id: 'pickle-tomato',
    name: 'Sun-Dried Tomato Pickle',
    category: 'pickles',
    description: 'Roma tomatoes sun-dried for 5 days, then slow-cooked with tamarind, jaggery, and a secret spice blend. Sweet, tangy, spicy — a modern classic that pairs with everything from curd rice to toast.',
    shortDesc: '5-day sun-dried tomatoes, tamarind-jaggery base',
    image: 'https://images.unsplash.com/photo-1584269621910-57c0b4b5b5e9?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1611890652135-51c393b8b5e0?w=600&q=80',
    variants: [
      { weight: '200g', price: 250, sku: 'PKL-TOM-200', inStock: true },
      { weight: '500g', price: 580, sku: 'PKL-TOM-500', inStock: true }
    ],
    badges: ['New', 'Vegetarian'],
    tags: ['Tomato', 'Sun-Dried', 'Sweet-Spicy', 'Tamarind'],
    cureDate: '2026-11-05',
    status: 'in_stock',
    shelfPosition: 'pickles'
  },
  {
    id: 'pickle-mixed',
    name: 'Mixed Vegetable Pickle',
    category: 'pickles',
    description: 'Carrots, cauliflower, green mango, lime, and green chili — each vegetable cured separately then combined. A symphony of textures in mustard oil with panch phoron. The complete Andhra thali experience in one jar.',
    shortDesc: '5 vegetables, panch phoron, mustard oil',
    image: 'https://images.unsplash.com/photo-1611890652135-51c393b8b5e0?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1584269621910-57c0b4b5b5e9?w=600&q=80',
    variants: [
      { weight: '300g', price: 350, sku: 'PKL-MIX-300', inStock: true },
      { weight: '600g', price: 680, sku: 'PKL-MIX-600', inStock: true }
    ],
    badges: ['Variety Pack'],
    tags: ['Mixed Veg', 'Panch Phoron', 'Mustard Oil', 'Lime'],
    cureDate: '2026-11-08',
    status: 'in_stock',
    shelfPosition: 'pickles'
  },

  // MALAI PANEER
  {
    id: 'paneer-malai-200',
    name: 'Farm-Fresh Malai Paneer',
    category: 'paneer',
    description: 'Made fresh each morning from full-cream A2 Gir cow milk. No citric acid — coagulated with traditional whey starter. Soft, creamy, holds shape in gravy. Delivered chilled within hours of setting.',
    shortDesc: 'Whey-coagulated, A2 milk, delivered fresh daily',
    image: 'https://images.unsplash.com/photo-1633791023101-6d824a9c7e2d?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1603133872878-684f208aaaf4?w=600&q=80',
    variants: [
      { weight: '200g', price: 180, sku: 'PNR-MAL-200', inStock: true },
      { weight: '500g', price: 420, sku: 'PNR-MAL-500', inStock: true }
    ],
    badges: ['Fresh Daily', 'A2 Milk'],
    tags: ['Paneer', 'Malai', 'A2', 'Whey-Set', 'No Acid'],
    madeDate: '2026-11-20',
    status: 'in_stock',
    shelfPosition: 'paneer'
  },
  {
    id: 'paneer-malai-spiced',
    name: 'Herbed Malai Paneer (Coriander-Chili)',
    category: 'paneer',
    description: 'Our classic malai paneer infused with fresh coriander, green chili, and black pepper. Ready to grill, toss in salad, or eat as-is. No additional seasoning needed.',
    shortDesc: 'Coriander, green chili, black pepper infused',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208aaaf4?w=600&q=80',
    imageHover: 'https://images.unsplash.com/photo-1633791023101-6d824a9c7e2d?w=600&q=80',
    variants: [
      { weight: '200g', price: 210, sku: 'PNR-HRB-200', inStock: true },
      { weight: '500g', price: 490, sku: 'PNR-HRB-500', inStock: true }
    ],
    badges: ['Ready to Eat', 'Flavored'],
    tags: ['Paneer', 'Herbed', 'Coriander', 'Chili', 'Grilled'],
    madeDate: '2026-11-20',
    status: 'in_stock',
    shelfPosition: 'paneer'
  }
];

// Delivery fee structure
const DELIVERY_FREE_THRESHOLD = 1500;
const DELIVERY_FEE = 60;

// ==========================================================================
// GLOBAL API FOR 3D STORE INTEGRATION
// ==========================================================================

// Expose products array globally for store3d.js
Object.defineProperty(window, 'smlProducts', {
  get: () => products,
  configurable: true
});

// Expose addToCart function globally for store3d.js
window.smlAddToCart = function(productId, variantIndex) {
  // This will be overridden by the actual addToCart function after initialization
  console.log('smlAddToCart called before initialization:', productId, variantIndex);
};

// Expose other useful functions
window.smlGetProducts = () => products;
window.smlGetCart = () => cart;
window.smlRefreshProducts = () => loadProducts().then(() => renderProducts());

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load cart from localStorage
  loadCart();
  
  // Setup event listeners
  setupCategoryTabs();
  setupCartDrawer();
  setupWhatsAppCheckout();
  setupHeaderScroll();
  setupIntersectionObserver();
  
  // Load products: try Firestore first, fallback to defaults
  await loadProducts();
  
  // Now expose the real addToCart function globally
  window.smlAddToCart = addToCart;
  
  // Initial render
  renderProducts();
  updateCartUI();
  
  // Trigger hero animations
  animateHeroElements();
  
  console.log('🪔 SML Foods Storefront Initialized - Global API ready for 3D store');
});

// ==========================================================================
// PRODUCT LOADING & SEEDING
// ==========================================================================
async function loadProducts() {
  try {
    // Try to load from Firestore
    const snapshot = await db.collection('products')
      .where('status', '!=', 'hidden')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (!snapshot.empty) {
      products = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({ id: doc.id, ...data });
      });
      isFirestoreLoaded = true;
      console.log(`Loaded ${products.length} products from Firestore`);
    } else {
      // Seed default products if Firestore is empty
      await seedDefaultProducts();
    }
  } catch (error) {
    console.warn('Firestore unavailable, using default products:', error);
    // Use default products as fallback
    products = DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: p.id || `default-${i}` }));
    isFirestoreLoaded = false;
  }
  
  // Update global reference
  window.smlProducts = products;
}

async function seedDefaultProducts() {
  console.log('Seeding default products to Firestore...');
  const batch = db.batch();
  
  DEFAULT_PRODUCTS.forEach((product, index) => {
    const docRef = db.collection('products').doc(product.id);
    batch.set(docRef, {
      ...product,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  
  try {
    await batch.commit();
    products = [...DEFAULT_PRODUCTS];
    isFirestoreLoaded = true;
    console.log('Default products seeded successfully');
  } catch (error) {
    console.error('Failed to seed products:', error);
    products = [...DEFAULT_PRODUCTS];
    isFirestoreLoaded = false;
  }
  
  window.smlProducts = products;
}

// ==========================================================================
// PRODUCT RENDERING
// ==========================================================================
function renderProducts() {
  if (!productsGrid) return;
  
  let filteredProducts = products;
  
  if (currentCategory !== 'all') {
    filteredProducts = products.filter(p => p.category === currentCategory);
  }
  
  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  
  productsGrid.innerHTML = filteredProducts.map((product, index) => 
    generateProductCard(product, index)
  ).join('');
  
  // Attach weight selector listeners
  attachWeightSelectors();
  
  // Stagger animation
  staggerProductCards();
}

function generateProductCard(product, index) {
  const defaultVariant = product.variants?.find(v => v.inStock) || product.variants?.[0];
  const hasMultipleVariants = (product.variants?.length || 0) > 1;
  const badgesHtml = product.badges?.map(badge => 
    `<span class="product-card-badge ${badge.toLowerCase().includes('best') ? 'badge-bestseller' : badge.toLowerCase().includes('pure') ? 'badge-pure' : badge.toLowerCase().includes('new') ? 'badge-new' : badge.toLowerCase().includes('premium') ? 'badge-bestseller' : ''}">${escapeHtml(badge)}</span>`
  ).join('') || '';
  
  const imageHover = product.imageHover ? `data-hover="${escapeHtml(product.imageHover)}"` : '';
  
  return `
    <article class="product-card reveal delay-${Math.min(index + 1, 6)}" data-product-id="${escapeHtml(product.id)}" role="listitem">
      <div class="product-card-image relative">
        <img 
          src="${escapeHtml(product.image)}" 
          alt="${escapeHtml(product.name)}" 
          loading="lazy"
          width="400" height="400"
          ${imageHover}
        >
        ${badgesHtml ? `<div class="absolute top-3 left-3 flex flex-col gap-1.5">${badgesHtml}</div>` : ''}
        ${!defaultVariant?.inStock ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center"><span class="text-white font-medium px-4 py-2 rounded-lg bg-red-500/90">Out of Stock</span></div>' : ''}
      </div>
      <div class="product-card-content">
        <span class="product-card-category">${escapeHtml(product.category.charAt(0).toUpperCase() + product.category.slice(1))}</span>
        <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
        <p class="product-card-desc">${escapeHtml(product.shortDesc || product.description?.slice(0, 100) + '...')}</p>
        
        ${hasMultipleVariants ? `
          <div class="weight-selector" role="group" aria-label="Select weight">
            ${product.variants.map((variant, vIndex) => `
              <button 
                type="button"
                class="weight-pill ${vIndex === 0 ? 'active' : ''}" 
                data-product-id="${escapeHtml(product.id)}"
                data-variant-index="${vIndex}"
                data-weight="${escapeHtml(variant.weight)}"
                data-price="${variant.price}"
                data-sku="${escapeHtml(variant.sku)}"
                ${!variant.inStock ? 'disabled aria-disabled="true"' : ''}
                aria-pressed="${vIndex === 0}"
              >
                ${escapeHtml(variant.weight)} · ₹${variant.price.toLocaleString('en-IN')}
              </button>
            `).join('')}
          </div>
        ` : `
          <input type="hidden" class="weight-pill active" data-product-id="${escapeHtml(product.id)}" data-variant-index="0" data-weight="${escapeHtml(defaultVariant?.weight)}" data-price="${defaultVariant?.price}" data-sku="${escapeHtml(defaultVariant?.sku)}">
        `}
        
        <div class="product-card-footer">
          <div class="product-card-price-row">
            <span class="product-card-price" data-price-display>₹${defaultVariant?.price?.toLocaleString('en-IN') || 0}</span>
            <span class="product-card-status ${defaultVariant?.inStock ? 'status-in-stock' : 'status-out-stock'}">
              ${defaultVariant?.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <button 
            class="btn-add-cart ${!defaultVariant?.inStock ? 'disabled' : ''}" 
            data-product-id="${escapeHtml(product.id)}"
            data-variant-index="0"
            ${!defaultVariant?.inStock ? 'disabled aria-disabled="true"' : ''}
            aria-label="Add ${escapeHtml(product.name)} ${escapeHtml(defaultVariant?.weight)} to cart"
          >
            <span class="btn-text">Add to Cart</span>
            <span class="btn-loading hidden" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function attachWeightSelectors() {
  document.querySelectorAll('.weight-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      const productId = this.dataset.productId;
      const variantIndex = parseInt(this.dataset.variantIndex);
      const price = parseInt(this.dataset.price);
      const weight = this.dataset.weight;
      const sku = this.dataset.sku;
      
      // Update active state within this product's pills
      document.querySelectorAll(`.weight-pill[data-product-id="${productId}"]`).forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      
      // Update price display
      const card = this.closest('.product-card');
      const priceDisplay = card?.querySelector('[data-price-display]');
      const addBtn = card?.querySelector('.btn-add-cart');
      
      if (priceDisplay) priceDisplay.textContent = `₹${price.toLocaleString('en-IN')}`;
      if (addBtn) {
        addBtn.dataset.variantIndex = variantIndex;
        addBtn.dataset.weight = weight;
        addBtn.dataset.price = price;
        addBtn.dataset.sku = sku;
        addBtn.setAttribute('aria-label', `Add ${card?.querySelector('.product-card-title')?.textContent} ${weight} to cart`);
      }
    });
  });
  
  // Add to cart buttons
  document.querySelectorAll('.btn-add-cart:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.dataset.productId;
      const variantIndex = parseInt(this.dataset.variantIndex);
      addToCart(productId, variantIndex);
    });
  });
}

function staggerProductCards() {
  const cards = document.querySelectorAll('.product-card.reveal');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('visible');
    }, index * 80);
  });
}

// ==========================================================================
// CATEGORY TABS
// ==========================================================================
function setupCategoryTabs() {
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      categoryTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        // Reset non-active styles
        t.classList.remove('bg-gradient-to-r', 'from-brand-gold', 'to-brand-gold-light', 'text-brand-dark', 'shadow-sm', 'shadow-brand-gold/30');
        t.classList.add('bg-brand-card', 'border', 'border-brand-gold/20', 'text-brand-cream/80');
      });
      
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      this.classList.remove('bg-brand-card', 'border', 'border-brand-gold/20', 'text-brand-cream/80');
      this.classList.add('bg-gradient-to-r', 'from-brand-gold', 'to-brand-gold-light', 'text-brand-dark', 'shadow-sm', 'shadow-brand-gold/30');
      
      currentCategory = this.dataset.category;
      renderProducts();
    });
  });
}

// ==========================================================================
// CART FUNCTIONALITY
// ==========================================================================
function addToCart(productId, variantIndex) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const variant = product.variants?.[variantIndex];
  if (!variant || !variant.inStock) return;
  
  const btn = document.querySelector(`.btn-add-cart[data-product-id="${productId}"][data-variant-index="${variantIndex}"]`);
  if (btn) {
    btn.classList.add('loading');
    btn.querySelector('.btn-text')?.classList.add('hidden');
    btn.querySelector('.btn-loading')?.classList.remove('hidden');
    btn.disabled = true;
  }
  
  // Check if item already in cart
  const existingIndex = cart.findIndex(item => item.productId === productId && item.variantIndex === variantIndex);
  
  if (existingIndex >= 0) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({
      id: Date.now() + Math.random(),
      productId,
      variantIndex,
      name: product.name,
      weight: variant.weight,
      price: variant.price,
      sku: variant.sku,
      image: product.image,
      qty: 1
    });
  }
  
  saveCart();
  updateCartUI();
  openCartDrawer();
  
  // Reset button after animation
  setTimeout(() => {
    if (btn) {
      btn.classList.remove('loading');
      btn.querySelector('.btn-text')?.classList.remove('hidden');
      btn.querySelector('.btn-loading')?.classList.add('hidden');
      btn.disabled = false;
    }
  }, 600);
}

function updateCartQty(cartItemId, delta) {
  const index = cart.findIndex(item => item.id === cartItemId);
  if (index === -1) return;
  
  cart[index].qty += delta;
  
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  
  saveCart();
  updateCartUI();
}

function removeFromCart(cartItemId) {
  cart = cart.filter(item => item.id !== cartItemId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('sml_cart', JSON.stringify(cart));
}

function loadCart() {
  cart = JSON.parse(localStorage.getItem('sml_cart') || '[]');
}

function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function calculateDelivery(subtotal) {
  return subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
}

function updateCartUI() {
  // Update cart count badge
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
  }
  
  // Update cart items
  renderCartItems();
  
  // Update totals
  const subtotal = calculateSubtotal();
  const delivery = calculateDelivery(subtotal);
  const total = subtotal + delivery;
  
  if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (cartDeliveryEl) cartDeliveryEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery.toLocaleString('en-IN')}`;
  if (cartTotalEl) cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  
  // Enable/disable checkout
  if (checkoutWhatsAppBtn) {
    checkoutWhatsAppBtn.disabled = cart.length === 0;
    checkoutWhatsAppBtn.classList.toggle('opacity-50', cart.length === 0);
    checkoutWhatsAppBtn.classList.toggle('cursor-not-allowed', cart.length === 0);
  }
}

function renderCartItems() {
  if (!cartItemsContainer) return;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-brand-cream/50 text-center py-8">Your cart is empty</p>';
    return;
  }
  
  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item" data-cart-id="${item.id}">
      <div class="cart-item-image">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" width="80" height="80">
      </div>
      <div class="cart-item-details">
        <p class="cart-item-title">${escapeHtml(item.name)}</p>
        <p class="cart-item-variant">${escapeHtml(item.weight)} · ${escapeHtml(item.sku)}</p>
        <p class="cart-item-price">₹${item.price.toLocaleString('en-IN')} each</p>
        <div class="cart-item-controls mt-2 flex items-center gap-3">
          <div class="flex items-center gap-2 bg-brand-dark-elevated rounded-lg border border-brand-gold/10 p-1">
            <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)" aria-label="Decrease quantity" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
            <span class="font-medium text-brand-cream w-8 text-center">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-item-subtotal ml-2">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
          <button class="btn-remove ml-auto" onclick="removeFromCart(${item.id})" aria-label="Remove ${escapeHtml(item.name)}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// CART DRAWER
// ==========================================================================
function setupCartDrawer() {
  if (cartBtn) {
    cartBtn.addEventListener('click', openCartDrawer);
  }
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCartDrawer);
  }
  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', closeCartDrawer);
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer?.classList.contains('open')) {
      closeCartDrawer();
    }
  });
}

function openCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus first input for accessibility
    setTimeout(() => customerNameInput?.focus(), 300);
  }
}

function closeCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ==========================================================================
// WHATSAPP CHECKOUT
// ==========================================================================
function setupWhatsAppCheckout() {
  if (checkoutWhatsAppBtn) {
    checkoutWhatsAppBtn.addEventListener('click', sendWhatsAppOrder);
  }
}

function sendWhatsAppOrder() {
  if (cart.length === 0) return;
  
  const customerName = customerNameInput?.value?.trim() || 'Customer';
  const customerPhone = customerPhoneInput?.value?.trim() || '';
  const deliveryAddress = deliveryAddressInput?.value?.trim() || '';
  
  if (!customerPhone) {
    alert('Please enter your phone number for WhatsApp confirmation.');
    customerPhoneInput?.focus();
    return;
  }
  
  if (!deliveryAddress) {
    alert('Please enter your delivery address.');
    deliveryAddressInput?.focus();
    return;
  }
  
  const subtotal = calculateSubtotal();
  const delivery = calculateDelivery(subtotal);
  const total = subtotal + delivery;
  
  // Format order message
  const itemLines = cart.map((item, index) => 
    `${index + 1}. ${item.name} (${item.weight}) × ${item.qty} = ₹${(item.price * item.qty).toLocaleString('en-IN')}`
  ).join('\n');
  
  const message = `🛒 *New Order - SML Foods*\n\n` +
    `👤 *Customer:* ${customerName}\n` +
    `📞 *Phone:* ${customerPhone}\n` +
    `📍 *Address:* ${deliveryAddress}\n\n` +
    `📦 *Items:*\n${itemLines}\n\n` +
    `💰 *Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n` +
    `🚚 *Delivery:* ${delivery === 0 ? 'FREE' : '₹' + delivery.toLocaleString('en-IN')}\n` +
    `💵 *Total:* ₹${total.toLocaleString('en-IN')}\n\n` +
    `💬 *Payment:* Cash on Delivery / UPI\n` +
    `✅ *Please confirm this order.*`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/919876543210?text=${encodedMessage}`;
  
  // Open WhatsApp
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
  // Clear cart after successful redirect (with delay)
  setTimeout(() => {
    if (confirm('Order sent to WhatsApp! Clear your cart?')) {
      clearCart();
    }
  }, 1000);
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  closeCartDrawer();
  
  // Clear form inputs
  customerNameInput?.value = '';
  customerPhoneInput?.value = '';
  deliveryAddressInput?.value = '';
}

// ==========================================================================
// HEADER SCROLL EFFECT
// ==========================================================================
function setupHeaderScroll() {
  let lastScroll = 0;
  const scrollThreshold = 50;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (header) {
      if (currentScroll > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

// ==========================================================================
// INTERSECTION OBSERVER FOR REVEAL ANIMATIONS
// ==========================================================================
function setupIntersectionObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Unobserve after animation to save resources
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==========================================================================
// HERO ANIMATIONS
// ==========================================================================
function animateHeroElements() {
  // Animate floating cards
  const floatCards = document.querySelectorAll('.animate-float, .animate-float-delayed');
  floatCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.5}s`;
  });
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, tag => ({
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '\''
  }[tag]));
}

// Expose functions globally for inline handlers
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;

// ==========================================================================
// FIRESTORE REAL-TIME LISTENER (Optional Enhancement)
// ==========================================================================
if (isFirestoreLoaded) {
  db.collection('products')
    .where('status', '!=', 'hidden')
    .onSnapshot(snapshot => {
      const changes = snapshot.docChanges();
      if (changes.length > 0) {
        let hasChanges = false;
        changes.forEach(change => {
          if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
            hasChanges = true;
          }
        });
        if (hasChanges) {
          loadProducts().then(() => renderProducts());
        }
      }
    }, error => {
      console.warn('Realtime listener error:', error);
    });
}

console.log('🪔 SML Foods Storefront Initialized');