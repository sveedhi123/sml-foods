/* SML Foods — shared helpers for storefront, order page and admin */
(function () {
  const { DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } = window.SML_DEFAULTS;

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => (v === null || v === undefined ? "" : String(v).replace(/[&<>"']/g, (c) => ESC[c]));

  const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const STATUS = {
    payment_submitted: { label: "Payment submitted", te: "చెల్లింపు పరిశీలనలో", tone: "amber", step: 1 },
    confirmed: { label: "Payment confirmed", te: "చెల్లింపు నిర్ధారించబడింది", tone: "green", step: 2 },
    packed: { label: "Packed", te: "ప్యాక్ చేయబడింది", tone: "blue", step: 3 },
    shipped: { label: "Shipped", te: "పంపబడింది", tone: "blue", step: 4 },
    delivered: { label: "Delivered", te: "డెలివరీ అయింది", tone: "green", step: 5 },
    payment_failed: { label: "Payment not received", te: "చెల్లింపు అందలేదు", tone: "red", step: 0 },
    cancelled: { label: "Cancelled", te: "రద్దు చేయబడింది", tone: "red", step: 0 }
  };
  const FLOW = ["payment_submitted", "confirmed", "packed", "shipped", "delivered"];

  function shade(hex, amt) {
    const h = (hex || "#c8871e").replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  function mix(hex, base, t) {
    const n = (h) => { h = (h || "#c8871e").replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const v = parseInt(h, 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
    const a = n(hex), b = n(base);
    return "#" + a.map((x, i) => Math.round(x * (1 - t) + b[i] * t).toString(16).padStart(2, "0")).join("");
  }

  /* Illustrated jar / paneer artwork used until real photos are uploaded */
  function productArt(p) {
    const c = p.color || "#C8871E";
    const te = esc(p.nameTe || "");
    const light = mix(c, "#FBF7EF", 0.72);
    if (p.category === "paneer") {
      return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.nameEn)}">
        <rect width="400" height="400" fill="#F3EEE2"/>
        <circle cx="200" cy="215" r="150" fill="#E9E1CF"/>
        <ellipse cx="200" cy="300" rx="150" ry="26" fill="#DCD2BC"/>
        <g transform="translate(200 230)">
          <path d="M-110 -10 L-20 -50 L70 -10 L-20 30 Z" fill="#FFFDF6"/>
          <path d="M-110 -10 L-20 30 L-20 90 L-110 50 Z" fill="#EFE7D3"/>
          <path d="M-20 30 L70 -10 L70 50 L-20 90 Z" fill="#E4DAC2"/>
          <path d="M10 -80 L70 -106 L130 -80 L70 -54 Z" fill="#FFFDF6"/>
          <path d="M10 -80 L70 -54 L70 -14 L10 -40 Z" fill="#EFE7D3"/>
          <path d="M70 -54 L130 -80 L130 -40 L70 -14 Z" fill="#E4DAC2"/>
        </g>
        <text x="200" y="372" text-anchor="middle" font-family="'Noto Serif Telugu', serif" font-size="30" fill="#6B5B45">${te}</text>
      </svg>`;
    }
    const isGhee = p.category === "ghee";
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.nameEn)}">
      <rect width="400" height="400" fill="${mix(c, "#FBF7EF", 0.86)}"/>
      <circle cx="200" cy="210" r="150" fill="${light}" opacity=".55"/>
      <ellipse cx="200" cy="350" rx="110" ry="14" fill="#000" opacity=".08"/>
      <rect x="118" y="78" width="164" height="42" rx="10" fill="${isGhee ? "#B8862B" : "#7A1F1F"}"/>
      <rect x="118" y="110" width="164" height="10" fill="#000" opacity=".12"/>
      <path d="M110 128 h180 a22 22 0 0 1 22 22 v168 a30 30 0 0 1 -30 30 h-164 a30 30 0 0 1 -30 -30 v-168 a22 22 0 0 1 22 -22z" fill="#fff" opacity=".55"/>
      <path d="M116 168 h168 v148 a24 24 0 0 1 -24 24 h-120 a24 24 0 0 1 -24 -24z" fill="${c}"/>
      ${isGhee ? `<g fill="#fff" opacity=".35"><circle cx="150" cy="200" r="3"/><circle cx="230" cy="230" r="2.5"/><circle cx="180" cy="290" r="3"/><circle cx="250" cy="300" r="2"/><circle cx="140" cy="260" r="2"/></g>`
        : `<g fill="${shade(c, -40)}" opacity=".55"><rect x="140" y="215" width="26" height="20" rx="5" transform="rotate(-18 153 225)"/><rect x="218" y="250" width="30" height="22" rx="6" transform="rotate(22 233 261)"/><rect x="168" y="292" width="24" height="18" rx="5"/></g>`}
      <rect x="132" y="190" width="136" height="96" rx="12" fill="#FFFBF2"/>
      <rect x="140" y="198" width="120" height="80" rx="8" fill="none" stroke="${isGhee ? "#B8862B" : "#7A1F1F"}" stroke-width="1.5" opacity=".6"/>
      <text x="200" y="230" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="700" font-size="20" letter-spacing="4" fill="#7A1F1F">SML</text>
      <text x="200" y="262" text-anchor="middle" font-family="'Noto Serif Telugu', serif" font-size="${te.length > 8 ? 17 : 21}" fill="#2B1D14">${te}</text>
      <path d="M128 146 q8 -6 16 0 v150" stroke="#fff" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>
    </svg>`;
  }

  const productVisual = (p, cls = "") =>
    p.images && p.images[0]
      ? `<img class="${cls}" src="${esc(p.images[0])}" alt="${esc(p.nameEn)}" loading="lazy" decoding="async">`
      : `<div class="art ${cls}">${productArt(p)}</div>`;

  const prefixes = (s) => String(s || "").split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
  const pinMatches = (pin, list) => !list.length || list.some((pre) => String(pin).startsWith(pre));

  function lowestPrice(p) {
    const vs = (p.variants || []).filter((v) => v.inStock !== false);
    const all = vs.length ? vs : p.variants || [];
    return all.length ? Math.min(...all.map((v) => Number(v.price) || 0)) : 0;
  }

  const variantAvailable = (v) => v && v.inStock !== false && (v.stock === null || v.stock === undefined || v.stock === "" || Number(v.stock) > 0);

  function deliveryFor(subtotal, s) {
    if (!subtotal) return 0;
    const free = Number(s.freeDeliveryAbove) || 0;
    if (free && subtotal >= free) return 0;
    return Number(s.deliveryFee) || 0;
  }

  function upiLink(s, amount, orderNo) {
    const params = new URLSearchParams({
      pa: s.upiId, pn: s.upiPayee || "SML Foods", am: Number(amount).toFixed(2), cu: "INR", tn: `Order ${orderNo}`, tr: orderNo
    });
    return "upi://pay?" + params.toString().replace(/\+/g, "%20");
  }

  const digits = (s) => String(s || "").replace(/\D/g, "");
  function waLink(number, text) {
    let n = digits(number);
    if (n.length === 10) n = "91" + n;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  function genOrderNo() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const r = crypto.getRandomValues(new Uint8Array(4));
    return `SML-${ymd}-${Array.from(r, (x) => abc[x % abc.length]).join("")}`;
  }

  /* ---------- Firebase ---------- */
  let _db = null;
  function db() {
    if (_db) return _db;
    if (!window.firebase || !firebase.initializeApp) return null;
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.SML_CONFIG.firebase);
      _db = firebase.firestore();
      return _db;
    } catch (e) {
      console.warn("Firebase init failed", e);
      return null;
    }
  }

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

  const CACHE_KEY = "sml_catalog_v2";
  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }

  function normalise(data) {
    const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    const categories = (data.categories && data.categories.length ? data.categories : DEFAULT_CATEGORIES).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const products = (data.products && data.products.length ? data.products : DEFAULT_PRODUCTS)
      .filter((p) => p.status !== "hidden")
      .slice()
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    return { settings, categories, products, reviews: data.reviews || [], live: !!data.live };
  }

  /* Loads catalogue from Firestore; falls back to cache, then defaults. */
  async function loadStore() {
    const d = db();
    if (!d) return normalise(readCache() || {});
    try {
      const [s, c, p, r] = await withTimeout(Promise.all([
        d.collection("settings").doc("store").get(),
        d.collection("settings").doc("categories").get(),
        d.collection("products").get(),
        d.collection("reviews").where("visible", "==", true).get().catch(() => null)
      ]), 9000);
      const data = {
        settings: s.exists ? s.data() : {},
        categories: c.exists ? c.data().list || [] : [],
        products: p.docs.map((x) => ({ ...x.data(), id: x.id })),
        reviews: r ? r.docs.map((x) => ({ ...x.data(), id: x.id })).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)) : [],
        live: true
      };
      writeCache(data);
      return normalise(data);
    } catch (e) {
      console.warn("Using cached/default catalogue:", e.message);
      return normalise(readCache() || {});
    }
  }

  window.SML = {
    esc, inr, STATUS, FLOW, productArt, productVisual, prefixes, pinMatches, lowestPrice, variantAvailable,
    deliveryFor, upiLink, waLink, digits, genOrderNo, db, loadStore, readCache, withTimeout, shade,
    DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS
  };
})();
