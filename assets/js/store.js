/* SML Foods — storefront: catalogue, product view, cart, checkout (zero-fee UPI) */
(function () {
  const { esc, inr, perKg, qtyText, unitPrice, productVisual, img, prefixes, pinMatches, lowestPrice, variantAvailable, deliveryFor, upiLink, waLink, digits, genOrderNo, db } = window.SML;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const CART_KEY = "sml_cart_v2";
  const CUSTOMER_KEY = "sml_customer_v1";
  const STATES = ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra", "Odisha", "Goa", "Gujarat", "Delhi", "West Bengal", "Madhya Pradesh", "Chhattisgarh", "Rajasthan", "Uttar Pradesh", "Bihar", "Jharkhand", "Punjab", "Haryana", "Uttarakhand", "Himachal Pradesh", "Jammu and Kashmir", "Assam", "Puducherry", "Other"];

  let S = window.SML.loadStore ? null : null; // store data
  let cart = readJSON(CART_KEY, []);
  let cat = "all";
  let query = "";
  const chosen = {}; // productId -> variantId
  let co = null; // checkout session

  function readJSON(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }

  /* ---------------- Boot ---------------- */
  async function boot() {
    S = normaliseLocal();
    renderAll();
    const onScroll = () => { $("#header").classList.toggle("scrolled", scrollY > 80); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    bindEvents();
    routeFromHash();
    S = await window.SML.loadStore();
    renderAll();
    routeFromHash();
  }

  function normaliseLocal() {
    const cached = window.SML.readCache();
    const { DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } = window.SML;
    const src = cached || {};
    return {
      settings: { ...DEFAULT_SETTINGS, ...(src.settings || {}) },
      categories: (src.categories && src.categories.length ? src.categories : DEFAULT_CATEGORIES).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0)),
      products: (src.products && src.products.length ? src.products : DEFAULT_PRODUCTS).filter((p) => p.status !== "hidden").sort((a, b) => (a.sort || 0) - (b.sort || 0)),
      reviews: src.reviews || []
    };
  }

  function renderAll() {
    renderChrome();
    renderCats();
    renderFeatured();
    renderTabs();
    renderGrid();
    renderReviews();
    renderCartCount();
    if (!$("#cartDrawer").hidden) renderCart();
    observeReveal();
    window.SML.lazyImages();
  }

  let io;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("in")); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  const product = (id) => S.products.find((p) => p.id === id);
  const categoryOf = (id) => S.categories.find((c) => c.id === id);

  /* ---------------- Page chrome ---------------- */
  function renderChrome() {
    const s = S.settings;
    $("#announce").textContent = s.announcement || "";
    $("#heroText").textContent = s.heroText || "";
    $("#heroText").hidden = !s.heroText;
    $("#dispatchNote").textContent = s.dispatchNote || "";
    $("#year").textContent = new Date().getFullYear();
    $("#footerAddress").textContent = s.address || "";

    const legal = [];
    if (s.fssai) legal.push(`<span>FSSAI Lic. No. ${esc(s.fssai)}</span>`);
    if (s.gstin) legal.push(`<span>GSTIN ${esc(s.gstin)}</span>`);
    const social = [["instagram", "Instagram"], ["facebook", "Facebook"], ["youtube", "YouTube"]].filter(([k]) => s[k]);
    if (social.length) legal.push(`<span>${social.map(([k, n]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener">${n}</a>`).join(" · ")}</span>`);
    const reach = [];
    if (s.whatsapp) reach.push(`<a href="${waLink(s.whatsapp, "Namaste SML Foods!")}" target="_blank" rel="noopener">WhatsApp +91 ${esc(digits(s.whatsapp).slice(-10))}</a>`);
    if (s.phone) reach.push(`<a href="tel:${esc(digits(s.phone))}">Call ${esc(s.phone)}</a>`);
    if (s.email) reach.push(`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
    if (!reach.length) reach.push(`<span>Contact details coming soon.</span>`);
    $("#footerLegal").innerHTML = `<h3>Contact</h3>${reach.join("")}${legal.join("")}`;

    const acts = [];
    if (s.whatsapp) acts.push(`<a class="btn btn-wa btn-lg" href="${waLink(s.whatsapp, "Namaste SML Foods! I'd like to know more about your products.")}" target="_blank" rel="noopener">WhatsApp us</a>`);
    if (s.phone) acts.push(`<a class="btn btn-ghost btn-lg" href="tel:${esc(digits(s.phone))}">Call ${esc(s.phone)}</a>`);
    $("#contactActions").innerHTML = acts.join("") || `<p class="muted">Contact details coming soon.</p>`;

    const rows = [];
    if (s.whatsapp) rows.push(["WhatsApp", `<a href="${waLink(s.whatsapp, "Namaste SML Foods!")}" target="_blank" rel="noopener">+91 ${esc(digits(s.whatsapp).slice(-10))}</a>`]);
    if (s.email) rows.push(["Email", `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`]);
    if (s.address) rows.push(["Kitchen", esc(s.address)]);
    if (s.fssai) rows.push(["FSSAI", esc(s.fssai)]);
    $("#contactList").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    const D = window.SML.DEFAULT_SETTINGS;
    const defs = window.SML.DEFAULT_CATEGORIES;
    $$(".slide").forEach((sl, i) => {
      const id = sl.dataset.catImg;
      const c = S.categories.find((x) => x.id === id) || defs.find((x) => x.id === id) || {};
      const url = id === "pickles" ? (s.heroImage || D.heroImage || c.image) : (c.image || (defs.find((x) => x.id === id) || {}).image);
      const m = $(".slide-media", sl);
      if (!m || !url || m.dataset.u === url) return;
      const put = () => {
        m.dataset.u = url;
        const iu = window.SML.imgUrl;
        const cdn = /images\.unsplash\.com/.test(url);
        const portrait = cdn ? `<source media="(max-width: 640px)" srcset="${[480, 640, 750].map((w) => `${esc(iu(url, w, Math.round(w * 1.6)).replace("auto=format", "fm=webp"))} ${w}w`).join(", ")}" sizes="100vw">` : "";
        m.innerHTML = `<picture>${portrait}${img(url, "", { sizes: "100vw", widths: [960, 1280, 1920], eager: true })}</picture>`;
      };
      // the first slide shows at once; the slider (ui.js) loads each other photo shortly before it is shown
      if (i === 0) put(); else m._put = put;
    });
    setImg("#storyImg", s.storyImage || D.storyImage, "Paddy fields and coconut palms in Konaseema", { sizes: "100vw", widths: [800, 1280, 1920, 2400] });
    const pm = $("#promiseMedia");
    if (!pm) return;
    const k = [s.promiseImage || D.promiseImage, s.promiseImage2 || D.promiseImage2].join("|");
    if (pm.dataset.k !== k) {
      pm.dataset.k = k;
      pm.innerHTML = img(s.promiseImage || D.promiseImage, "Whole spices used in our pickles", { sizes: "(max-width: 980px) 100vw, 560px", widths: [500, 800, 1100], ratio: 1.25 }) +
        img(s.promiseImage2 || D.promiseImage2, "Grainy slow-cooked ghee", { cls: "float", sizes: "260px", widths: [300, 500], ratio: 1 });
    }
  }

  function setImg(sel, url, alt, opts) {
    const el = $(sel);
    if (!el || el.dataset.u === url) return;
    el.dataset.u = url || "";
    el.innerHTML = url ? img(url, alt, opts) : "";
  }

  function renderCats() {
    const defs = window.SML.DEFAULT_CATEGORIES;
    if (!$("#cats")) return;
    $("#cats").innerHTML = S.categories.map((c, i) => {
      const first = S.products.find((p) => p.category === c.id && p.status === "active" && (p.images || []).length) || S.products.find((p) => p.category === c.id);
      const url = c.image || (defs.find((x) => x.id === c.id) || {}).image || (first && (first.images || [])[0]);
      const visual = url ? img(url, c.name, { sizes: "(max-width: 640px) 100vw, 33vw", widths: [500, 800, 1100], ratio: 1.3 }) : first ? productVisual(first, "", { hover: false }) : "";
      const n = S.products.filter((p) => p.category === c.id && p.status !== "hidden").length;
      return `<button class="cat reveal" style="transition-delay:${i * 110}ms" data-cat="${esc(c.id)}" aria-label="Shop ${esc(c.name)}">
        <span class="cat-media">${visual}</span>
        <span class="cat-label"><small>${n} ${n === 1 ? "item" : "items"}</small><h3>${esc(c.name)}</h3><span class="cat-go">Shop now <span aria-hidden="true">→</span></span></span>
      </button>`;
    }).join("");
  }

  function renderFeatured() {
    if (!$("#featured")) return;
    let list = S.products.filter((p) => p.featured && p.status === "active");
    if (list.length < 4) list = list.concat(S.products.filter((p) => p.status === "active" && !list.includes(p))).slice(0, 4);
    $("#featured").innerHTML = list.slice(0, 4).map(cardHtml).join("");
  }

  function renderTabs() {
    const all = [{ id: "all", name: "All" }, ...S.categories];
    $("#tabs").innerHTML = all.map((c) => `<button class="tab" role="tab" data-tab="${esc(c.id)}" aria-selected="${c.id === cat}">${esc(c.name)}</button>`).join("");
  }

  function matches(p) {
    if (cat !== "all" && p.category !== cat) return false;
    if (!query) return true;
    const hay = [p.nameEn, p.nameTe, p.shortDesc, p.category, (categoryOf(p.category) || {}).name].join(" ").toLowerCase();
    return query.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  }

  function currentVariant(p) {
    const vs = p.variants || [];
    const v = vs.find((x) => x.id === chosen[p.id]);
    return v || vs.find(variantAvailable) || vs[0];
  }

  function priceHtml(v) {
    if (!v) return "";
    const mrp = Number(v.mrp) > Number(v.price) ? `<s>${inr(v.mrp)}</s>` : "";
    return `${inr(v.price)}${perKg(v.label) ? `<small class="unit">/kg</small>` : ""}${mrp}`;
  }

  // Product lines saved in Admin may still be in Telugu; show the English starter line instead.
  const TELUGU = /[\u0C00-\u0C7F]/;
  function englishLine(p) {
    if (p.shortDesc && !TELUGU.test(p.shortDesc)) return p.shortDesc;
    const d = (window.SML.DEFAULT_PRODUCTS || []).find((x) => x.id === p.id);
    return d && d.shortDesc && !TELUGU.test(d.shortDesc) ? d.shortDesc : "";
  }

  function cardHtml(p, i) {
    const v = currentVariant(p);
    const soon = p.status === "coming_soon";
    const avail = !soon && variantAvailable(v);
    const BADGE_EN = { "గోదావరి స్పెషల్": "Godavari special", "తాజా": "Fresh", "కోనసీమ స్పెషల్": "Konaseema special" };
    const badges = (p.badges || []).map((b) => BADGE_EN[b] || b).filter((b) => !TELUGU.test(b)).map((b) => `<span class="badge">${esc(b)}</span>`);
    if (soon) badges.unshift(`<span class="badge soon">Coming soon</span>`);
    if (p.localOnly) badges.push(`<span class="badge local">Local delivery</span>`);
    return `<article class="card" style="animation-delay:${Math.min(i, 8) * 40}ms" data-pid="${esc(p.id)}">
      <button class="card-media" data-open="${esc(p.id)}" aria-label="View ${esc(p.nameEn)}">
        ${productVisual(p)}
        <span class="badges">${badges.join("")}</span>
        <span class="quick" aria-hidden="true">Quick view</span>
      </button>
      <div class="card-body">
        <span class="card-cat">${esc((categoryOf(p.category) || {}).name || "")}</span>
        <h3><button data-open="${esc(p.id)}">${esc(p.nameEn)}</button></h3>
        ${p.nameTe ? `<span class="card-te">${esc(p.nameTe)}</span>` : ""}
        <p class="card-desc">${esc(englishLine(p))}</p>
        ${(p.variants || []).length > 1 ? `<div class="sizes" role="group" aria-label="Size">${p.variants.map((x) => `<button class="size" data-size="${esc(x.id)}" data-pid="${esc(p.id)}" aria-pressed="${x.id === (v && v.id)}" ${!variantAvailable(x) || soon ? "disabled" : ""}>${esc(x.label)}</button>`).join("")}</div>` : `<p class="min-qty">${v && perKg(v.label) ? "Min. 1 kg" : esc(v ? v.label : "")}</p>`}
        <div class="card-foot">
          <span class="price" data-price>${priceHtml(v)}</span>
          <button class="btn btn-primary add" data-add="${esc(p.id)}" ${avail ? "" : "disabled"}>${soon ? "Soon" : avail ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add` : "Sold out"}</button>
        </div>
      </div>
    </article>`;
  }

  function renderGrid() {
    const list = S.products.filter(matches);
    $("#grid").innerHTML = list.map(cardHtml).join("");
    $("#empty").hidden = list.length > 0;
    $$("#tabs .tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === cat));
  }

  function renderReviews() {
    const r = S.reviews || [];
    $("#reviews").hidden = r.length === 0;
    $("#reviewGrid").innerHTML = r.map((x) => `<blockquote class="review">
      <div class="stars" aria-label="${Number(x.rating) || 5} out of 5">${"★".repeat(Number(x.rating) || 5)}${"☆".repeat(5 - (Number(x.rating) || 5))}</div>
      <p>${esc(x.text)}</p>
      <footer>${esc(x.name)} <span>${x.city ? "· " + esc(x.city) : ""}</span></footer>
    </blockquote>`).join("");
  }

  /* ---------------- Product dialog ---------------- */
  function openProduct(id, push = true) {
    const p = product(id);
    if (!p) return;
    const v = currentVariant(p);
    const soon = p.status === "coming_soon";
    const imgs = p.images || [];
    const facts = [["Ingredients", p.ingredients], ["Shelf life", p.shelfLife], ["Storage", p.storage]].filter(([, val]) => val);
    $("#pmBody").innerHTML = `
      <div class="pm-media">
        ${imgs.length ? `<div id="pmMain">${img(imgs[0], p.nameEn, { cls: "main", sizes: "(max-width: 980px) 100vw, 480px", widths: [600, 900, 1200], ratio: 1, eager: true })}</div>` : `<div class="art main">${window.SML.productArt(p)}</div>`}
        ${imgs.length > 1 ? `<div class="pm-thumbs">${imgs.map((src, i) => `<button data-thumb="${i}" aria-current="${i === 0}" aria-label="Photo ${i + 1}">${img(src, "", { widths: [120, 200], sizes: "64px", ratio: 1 })}</button>`).join("")}</div>` : ""}
      </div>
      <div class="pm-info">
        <button class="icon-btn close" data-close aria-label="Close">✕</button>
        <h2 id="pmTitle">${esc(p.nameEn)}</h2>
        ${p.nameTe ? `<span class="card-te">${esc(p.nameTe)}</span>` : ""}
        ${soon ? `<p class="note">Coming soon. Message us on WhatsApp to be told when it is ready.</p>` : ""}
        ${p.localOnly ? `<p class="note green">Fresh product. Delivered only to nearby pincodes${S.settings.localPincodes ? ` (starting ${esc(prefixes(S.settings.localPincodes).join(", "))})` : ""}.</p>` : ""}
        <div class="price" id="pmPrice">${priceHtml(v)}</div>
        ${(p.variants || []).length < 2 ? `<p class="min-qty">${v && perKg(v.label) ? "Minimum 1 kg. Order any number of kilos." : ""}</p>` : ""}
        <div class="sizes" role="group" aria-label="Size" ${(p.variants || []).length < 2 ? "hidden" : ""}>${(p.variants || []).map((x) => `<button class="size" data-pm-size="${esc(x.id)}" aria-pressed="${x.id === (v && v.id)}" ${!variantAvailable(x) || soon ? "disabled" : ""}>${esc(x.label)}</button>`).join("")}</div>
        <div class="pm-buy">
          <div class="qty" aria-label="Quantity"><button data-pmq="-1" aria-label="Decrease">−</button><span id="pmQty">1${v && perKg(v.label) ? " kg" : ""}</span><button data-pmq="1" aria-label="Increase">+</button></div>
          <button class="btn btn-primary btn-lg" id="pmAdd" style="flex:1" ${!soon && variantAvailable(v) ? "" : "disabled"}>${soon ? "Coming soon" : variantAvailable(v) ? "Add to cart" : "Sold out"}</button>
        </div>
        <p class="desc">${esc(p.description || englishLine(p))}</p>
        ${facts.length ? `<div class="facts">${facts.map(([k, val]) => `<details><summary>${k}</summary><p>${esc(val)}</p></details>`).join("")}</div>` : ""}
      </div>`;
    $("#pmBody").dataset.pid = p.id;
    $("#pmBody").dataset.qty = "1";
    openLayer("#productModal");
    if (push && location.hash !== `#p/${p.id}`) history.pushState(null, "", `#p/${p.id}`);
  }

  function routeFromHash() {
    const m = location.hash.match(/^#p\/(.+)$/);
    if (m && product(decodeURIComponent(m[1]))) openProduct(decodeURIComponent(m[1]), false);
    else if (!$("#productModal").hidden) closeLayer("#productModal", false);
  }

  /* ---------------- Layers (modal / drawer) ---------------- */
  const stack = [];
  function openLayer(sel) {
    const el = $(sel);
    if (!el.hidden) return;
    el.hidden = false;
    stack.push({ sel, focus: document.activeElement });
    renderCartCount();
    document.body.style.overflow = "hidden";
    setTimeout(() => { const f = el.querySelector("[autofocus], input, button:not([data-close]), [data-close]"); if (f) f.focus({ preventScroll: true }); }, 50);
  }
  function closeLayer(sel, fromUser = true) {
    const el = $(sel);
    if (el.hidden) return;
    el.hidden = true;
    const i = stack.map((x) => x.sel).lastIndexOf(sel);
    const entry = i >= 0 ? stack.splice(i, 1)[0] : null;
    if (!stack.length) document.body.style.overflow = "";
    renderCartCount();
    if (sel === "#productModal" && fromUser && location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search);
    if (entry && entry.focus && entry.focus.focus) entry.focus.focus({ preventScroll: true });
  }

  /* ---------------- Cart ---------------- */
  function saveCart() { writeJSON(CART_KEY, cart); renderCartCount(); }
  function addToCart(pid, vid, qty = 1) {
    const tp = product(pid);
    if (tp) window.SML.track("add_to_cart", { currency: "INR", items: [{ item_id: pid, item_name: tp.nameEn, quantity: qty }] });
    const p = product(pid);
    const v = p && (p.variants || []).find((x) => x.id === vid);
    if (!p || !v || !variantAvailable(v) || p.status !== "active") return;
    const line = cart.find((l) => l.pid === pid && l.vid === vid);
    const max = v.stock !== null && v.stock !== undefined && v.stock !== "" ? Number(v.stock) : 50;
    if (line) line.qty = Math.min(line.qty + qty, max);
    else cart.push({ pid, vid, qty: Math.min(qty, max) });
    saveCart();
    const btn = $("#cartBtn");
    btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
    toast(`Added ${p.nameEn} · ${v.label}`);
  }

  function lines() {
    return cart.map((l) => {
      const p = product(l.pid);
      const v = p && (p.variants || []).find((x) => x.id === l.vid);
      const ok = !!(p && v && p.status === "active" && variantAvailable(v));
      return { ...l, p, v, ok, total: ok ? Number(v.price) * l.qty : 0 };
    });
  }
  function totals(ls = lines()) {
    const subtotal = ls.reduce((s, l) => s + l.total, 0);
    const delivery = deliveryFor(subtotal, S.settings);
    return { subtotal, delivery, total: subtotal + delivery };
  }

  function renderCartCount() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    const el = $("#cartCount");
    el.textContent = n;
    el.hidden = n === 0;
    const bar = $("#mobileBar");
    if (bar) {
      $("#mbCount").textContent = `${n} item${n === 1 ? "" : "s"}`;
      $("#mbTotal").textContent = n ? inr(totals().subtotal) : "";
      bar.classList.toggle("show", n > 0 && !stack.length);
    }
  }

  function renderCart() {
    const ls = lines();
    if (!ls.length) {
      $("#cartItems").innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><button class="btn btn-primary" data-close data-goto="shop">Browse products</button></div>`;
      $("#cartFoot").innerHTML = "";
      return;
    }
    $("#cartItems").innerHTML = ls.map((l, i) => `
      <div class="line">
        <div class="thumb">${l.p ? productVisual(l.p, "", { hover: false, widths: [160, 240], sizes: "72px", ratio: 1 }) : ""}</div>
        <div>
          <h4>${esc(l.p ? l.p.nameEn : "Item no longer available")}</h4>
          <div class="meta">${l.v ? esc(unitPrice(l.v.label, l.v.price)) : ""}</div>
          ${l.ok ? `<div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${l.v && perKg(l.v.label) ? `${l.qty} kg` : l.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div>` : `<div class="warn">Currently unavailable — please remove</div>`}
        </div>
        <div class="right">${l.ok ? inr(l.total) : ""}<br><button class="remove" data-rm="${i}">Remove</button></div>
      </div>`).join("");

    const t = totals(ls);
    const s = S.settings;
    const free = Number(s.freeDeliveryAbove) || 0;
    const bad = ls.some((l) => !l.ok);
    const belowMin = Number(s.minOrder) > 0 && t.subtotal < Number(s.minOrder);
    let bar = "";
    if (free && t.subtotal < free) bar = `<div class="free-bar">Add ${inr(free - t.subtotal)} more for free delivery<div class="bar"><i style="width:${Math.min(100, (t.subtotal / free) * 100)}%"></i></div></div>`;
    else if (free) bar = `<div class="free-bar">🎉 You get free delivery</div>`;

    const open = s.storeOpen && s.upiId;
    $("#cartFoot").innerHTML = `${bar}
      <div class="sum">
        <div><span>Subtotal</span><span>${inr(t.subtotal)}</span></div>
        <div><span>Delivery</span><span>${t.delivery ? inr(t.delivery) : "Free"}</span></div>
        <div class="total"><span>Total</span><span>${inr(t.total)}</span></div>
      </div>
      ${belowMin ? `<p class="note">Minimum order is ${inr(s.minOrder)}.</p>` : ""}
      ${open ? `<button class="btn btn-primary btn-lg btn-block" id="toCheckout" ${bad || belowMin ? "disabled" : ""}>Checkout · ${inr(t.total)}</button>`
        : `<p class="note">Online payment is opening soon. You can place this order on WhatsApp now.</p>
           ${s.whatsapp ? `<a class="btn btn-wa btn-lg btn-block" target="_blank" rel="noopener" href="${waLink(s.whatsapp, cartMessage(ls, t))}">Order on WhatsApp</a>` : ""}`}`;
  }

  function cartMessage(ls, t) {
    return `Namaste SML Foods! I'd like to order:\n\n${ls.filter((l) => l.ok).map((l, i) => `${i + 1}. ${l.p.nameEn} – ${qtyText(l.v.label, l.qty)} = ${inr(l.total)}`).join("\n")}\n\nSubtotal: ${inr(t.subtotal)}\nDelivery: ${t.delivery ? inr(t.delivery) : "Free"}\nTotal: ${inr(t.total)}`;
  }

  /* ---------------- Checkout ---------------- */
  function setStep(n) {
    $$("#coSteps li").forEach((li) => {
      const s = Number(li.dataset.s);
      li.className = s === n ? "on" : s < n ? "done" : "";
    });
  }

  function startCheckout() {
    const ls = lines().filter((l) => l.ok);
    if (!ls.length) return;
    co = { orderNo: genOrderNo(), customer: readJSON(CUSTOMER_KEY, {}) };
    closeLayer("#cartDrawer");
    openLayer("#checkout");
    stepDetails();
  }

  function field(id, label, attrs = "", full = false, opt = false) {
    const v = esc(co.customer[id] || "");
    const input = id === "address"
      ? `<textarea id="f_${id}" rows="2" ${attrs}>${v}</textarea>`
      : id === "state"
        ? `<select id="f_${id}" ${attrs}>${STATES.map((s) => `<option ${s === (co.customer.state || "Andhra Pradesh") ? "selected" : ""}>${s}</option>`).join("")}</select>`
        : `<input id="f_${id}" value="${v}" ${attrs}>`;
    return `<div class="field ${full ? "full" : ""}"><label for="f_${id}">${label}${opt ? ` <span class="opt">(optional)</span>` : ""}</label>${input}<span class="err" id="e_${id}"></span></div>`;
  }

  function stepDetails() {
    setStep(1);
    const t = totals();
    $("#coBody").innerHTML = `
      <form class="form" id="detailsForm" novalidate>
        ${field("name", "Full name", 'autocomplete="name" required maxlength="70"', true)}
        ${field("phone", "Mobile number (WhatsApp)", 'type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10-digit mobile" maxlength="14" required')}
        ${field("email", "Email", 'type="email" autocomplete="email" maxlength="90"', false, true)}
        ${field("address", "House no., street, area, landmark", 'autocomplete="street-address" required maxlength="300"', true)}
        ${field("city", "Town / City", 'autocomplete="address-level2" required maxlength="60"')}
        ${field("pincode", "Pincode", 'inputmode="numeric" autocomplete="postal-code" maxlength="6" required')}
        ${field("state", "State", 'autocomplete="address-level1"')}
        ${field("notes", "Delivery notes", 'maxlength="200" placeholder="Preferred time, gift message…"', false, true)}
      </form>
      <div class="co-summary"><div class="row"><span>${cart.reduce((s, l) => s + l.qty, 0)} items</span><span>${inr(t.subtotal)}</span></div><div class="row"><span>Delivery</span><span>${t.delivery ? inr(t.delivery) : "Free"}</span></div><div class="row" style="font-weight:700;color:var(--ink)"><span>Total</span><span>${inr(t.total)}</span></div></div>
      <div class="co-actions"><button class="btn btn-ghost" data-back-cart>← Back to cart</button><button class="btn btn-primary btn-lg" id="toPay">Continue to payment</button></div>`;
  }

  function validateDetails() {
    const g = (k) => ($("#f_" + k).value || "").trim();
    const c = { name: g("name"), phone: digits(g("phone")).slice(-10), email: g("email"), address: g("address"), city: g("city"), pincode: digits(g("pincode")), state: g("state"), notes: g("notes") };
    const errs = {};
    if (c.name.length < 2) errs.name = "Please enter your name";
    if (!/^[6-9]\d{9}$/.test(c.phone)) errs.phone = "Enter a valid 10-digit mobile number";
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errs.email = "Enter a valid email or leave it empty";
    if (c.address.length < 8) errs.address = "Please enter your full address";
    if (c.city.length < 2) errs.city = "Enter your town or city";
    if (!/^[1-9]\d{5}$/.test(c.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    else {
      const serv = prefixes(S.settings.serviceablePincodes);
      if (!pinMatches(c.pincode, serv)) errs.pincode = "Sorry, we don't deliver to this pincode yet. Message us on WhatsApp.";
      else {
        const local = prefixes(S.settings.localPincodes);
        const fresh = lines().filter((l) => l.ok && l.p.localOnly);
        if (fresh.length && local.length && !pinMatches(c.pincode, local)) errs.pincode = `${fresh.map((l) => l.p.nameEn).join(", ")} can only be delivered to nearby pincodes. Please remove it or use a nearby address.`;
      }
    }
    $$("#detailsForm .field").forEach((f) => f.classList.remove("invalid"));
    $$("#detailsForm .err").forEach((e) => (e.textContent = ""));
    Object.entries(errs).forEach(([k, m]) => { $("#e_" + k).textContent = m; $("#f_" + k).closest(".field").classList.add("invalid"); });
    const first = Object.keys(errs)[0];
    if (first) { $("#f_" + first).focus(); return null; }
    return c;
  }

  function stepPay() {
    const c = validateDetails();
    if (!c) return;
    co.customer = c;
    writeJSON(CUSTOMER_KEY, { ...c, notes: "" });
    const t = totals();
    co.totals = t;
    setStep(2);
    const s = S.settings;
    const link = upiLink(s, t.total, co.orderNo);
    const mobile = matchMedia("(pointer:coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
    $("#coBody").innerHTML = `
      <div class="pay-box">
        <div class="qr" id="qr" aria-label="UPI QR code">Loading QR…</div>
        <div>
          <p class="eyebrow" style="margin:0">Pay with any UPI app</p>
          <div class="pay-amount">${inr(t.total)}</div>
          <p style="margin:0 0 10px">Order <b>${esc(co.orderNo)}</b></p>
          <span class="upi-id">${esc(s.upiId)} <button data-copy="${esc(s.upiId)}">Copy</button></span>
          ${mobile ? `<p style="margin:14px 0 0"><a class="btn btn-primary btn-block" href="${esc(link)}">Open UPI app to pay ${inr(t.total)}</a></p>` : ""}
          <p class="pay-apps">PhonePe · Google Pay · Paytm · BHIM · any bank UPI app. ${mobile ? "Or scan the QR from another phone." : "Scan the QR with your phone."}</p>
        </div>
      </div>
      <form id="utrForm" novalidate>
        <div class="field">
          <label for="f_utr">After paying, enter the 12-digit UPI transaction ID (UTR / reference no.)</label>
          <input id="f_utr" inputmode="numeric" maxlength="16" placeholder="e.g. 412345678901" autocomplete="off">
          <span class="err" id="e_utr"></span>
        </div>
        <p class="muted" style="font-size:13px;margin:8px 0 18px">You can find it in your UPI app under the payment details ("UPI Ref No." / "UTR" / "Transaction ID"). Please pay exactly ${inr(t.total)}.</p>
        <div class="co-actions"><button type="button" class="btn btn-ghost" data-back-details>← Edit details</button><button class="btn btn-primary btn-lg" id="placeOrder">I have paid · Place order</button></div>
      </form>`;
    renderQr(link);
  }

  function renderQr(link, tries = 0) {
    const box = $("#qr");
    if (!box) return;
    if (window.qrcode) {
      const q = window.qrcode(0, "M");
      q.addData(link);
      q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } else if (tries < 20) setTimeout(() => renderQr(link, tries + 1), 250);
    else box.innerHTML = `<p class="muted" style="font-size:13px;text-align:center">QR unavailable. Please pay to the UPI ID shown.</p>`;
  }

  async function placeOrder() {
    const utr = digits($("#f_utr").value);
    const err = $("#e_utr");
    if (!/^\d{12}$/.test(utr)) { err.textContent = "UPI transaction IDs are 12 digits. Please check and enter again."; $("#f_utr").closest(".field").classList.add("invalid"); $("#f_utr").focus(); return; }
    err.textContent = "";
    const btn = $("#placeOrder");
    btn.disabled = true; btn.textContent = "Placing order…";

    const ls = lines().filter((l) => l.ok);
    const t = totals(ls);
    const order = {
      orderNo: co.orderNo,
      customer: { name: co.customer.name, phone: co.customer.phone, email: co.customer.email || "" },
      address: { line: co.customer.address, city: co.customer.city, state: co.customer.state, pincode: co.customer.pincode },
      notes: co.customer.notes || "",
      items: ls.map((l) => ({ productId: l.p.id, variantId: l.v.id, name: l.p.nameEn, nameTe: l.p.nameTe || "", variant: l.v.label, price: Number(l.v.price), qty: l.qty, lineTotal: l.total })),
      subtotal: t.subtotal, deliveryFee: t.delivery, total: t.total,
      payment: { method: "upi", utr, upiId: S.settings.upiId },
      status: "payment_submitted",
      source: "web"
    };
    const d = db();
    try {
      if (!d) throw new Error("offline");
      const ref = d.collection("orders").doc();
      const batch = d.batch();
      const ts = firebase.firestore.FieldValue.serverTimestamp();
      batch.set(ref, { ...order, createdAt: ts, updatedAt: ts });
      batch.set(d.collection("payments").doc(utr), { orderId: ref.id, createdAt: ts });
      await window.SML.withTimeout(batch.commit(), 15000);
      co.orderId = ref.id;
      window.SML.track("purchase", { transaction_id: order.orderNo, currency: "INR", value: order.total, items: order.items.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.qty })) });
      cart = []; saveCart();
      stepDone(order);
    } catch (e) {
      console.error(e);
      btn.disabled = false; btn.textContent = "I have paid · Place order";
      const reused = e && e.code === "permission-denied";
      const msg = reused
        ? "We couldn't place this order. This transaction ID may already be used for another order, or the store is closed right now. Please check the number, or send the order to us on WhatsApp."
        : "We couldn't reach our server. Your payment is safe. Please send this order to us on WhatsApp and we'll confirm it.";
      err.innerHTML = `${esc(msg)}${S.settings.whatsapp ? ` <a href="${waLink(S.settings.whatsapp, orderMessage(order))}" target="_blank" rel="noopener">Send on WhatsApp</a>` : ""}`;
    }
  }

  function orderMessage(o) {
    return `🛒 New order ${o.orderNo}\n\n${o.items.map((it, i) => `${i + 1}. ${it.name} – ${qtyText(it.variant, it.qty)} = ${inr(it.lineTotal)}`).join("\n")}\n\nTotal paid: ${inr(o.total)}\nUPI ref (UTR): ${o.payment.utr}\n\n${o.customer.name}\n${o.customer.phone}\n${o.address.line}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}${o.notes ? `\nNote: ${o.notes}` : ""}`;
  }

  function stepDone(order) {
    setStep(3);
    const s = S.settings;
    const track = `order.html?id=${encodeURIComponent(co.orderId)}`;
    $("#coBody").innerHTML = `
      <div class="done">
        <div class="tick">✓</div>
        <h3>Thank you, ${esc(order.customer.name.split(" ")[0])}!</h3>
        <p>Your order has been placed. We'll verify your UPI payment of <b>${inr(order.total)}</b> and confirm on WhatsApp.</p>
        <div class="order-no">${esc(order.orderNo)}</div>
        <div class="co-actions">
          ${s.whatsapp ? `<a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="${waLink(s.whatsapp, orderMessage(order))}">Send order on WhatsApp</a>` : ""}
          <a class="btn btn-ghost btn-lg" href="${track}">Track order</a>
        </div>
        <p class="muted" style="font-size:13px;margin-top:18px">Save this link to check your order status: <a href="${track}">${esc(location.origin + location.pathname.replace(/[^/]*$/, ""))}${track}</a></p>
      </div>`;
  }

  /* ---------------- Events ---------------- */
  function bindEvents() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button, a");
      if (!t) return;
      const d = t.dataset;

      if (d.close !== undefined) {
        const layer = t.closest(".modal, .drawer");
        if (layer) closeLayer("#" + layer.id);
        if (d.goto) document.getElementById(d.goto).scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (d.cat || d.catLink) {
        e.preventDefault();
        cat = d.cat || d.catLink; renderGrid();
        $("#shop").scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (d.tab) { cat = d.tab; renderGrid(); return; }
      if (d.open) { openProduct(d.open); return; }
      if (d.size) {
        chosen[d.pid] = d.size;
        const p = product(d.pid);
        const v = currentVariant(p);
        $$(`.card[data-pid="${CSS.escape(p.id)}"]`).forEach((card) => {
          $$(".size", card).forEach((b) => b.setAttribute("aria-pressed", b.dataset.size === v.id));
          $("[data-price]", card).innerHTML = priceHtml(v);
        });
        return;
      }
      if (d.add) {
        const p = product(d.add);
        const v = currentVariant(p);
        addToCart(p.id, v.id, 1);
        const was = t.innerHTML;
        t.classList.add("added"); t.textContent = "Added ✓";
        setTimeout(() => { t.classList.remove("added"); t.innerHTML = was; }, 1200);
        return;
      }
      if (d.pmSize) {
        const p = product($("#pmBody").dataset.pid);
        chosen[p.id] = d.pmSize;
        const v = currentVariant(p);
        $$("[data-pm-size]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.pmSize === v.id));
        $("#pmPrice").innerHTML = priceHtml(v);
        renderGrid(); renderFeatured();
        return;
      }
      if (d.pmq) {
        const q = Math.max(1, Math.min(50, Number($("#pmBody").dataset.qty) + Number(d.pmq)));
        $("#pmBody").dataset.qty = q; const pv = currentVariant(product($("#pmBody").dataset.pid)); $("#pmQty").textContent = q + (pv && perKg(pv.label) ? " kg" : "");
        return;
      }
      if (t.id === "pmAdd") {
        const p = product($("#pmBody").dataset.pid);
        addToCart(p.id, currentVariant(p).id, Number($("#pmBody").dataset.qty));
        closeLayer("#productModal");
        openCart();
        return;
      }
      if (d.thumb !== undefined) {
        const p = product($("#pmBody").dataset.pid);
        $("#pmMain").innerHTML = img(p.images[Number(d.thumb)], p.nameEn, { cls: "main", sizes: "(max-width: 980px) 100vw, 480px", widths: [600, 900, 1200], ratio: 1, eager: true });
        $$("[data-thumb]").forEach((b) => b.setAttribute("aria-current", b === t));
        return;
      }
      if (t.id === "cartBtn" || t.id === "mobileBar") { openCart(); return; }
      if (d.q !== undefined) {
        const l = cart[Number(d.q)];
        const v = lines()[Number(d.q)].v;
        const max = v && v.stock !== null && v.stock !== undefined && v.stock !== "" ? Number(v.stock) : 50;
        l.qty = Math.max(0, Math.min(max, l.qty + Number(d.d)));
        if (!l.qty) cart.splice(Number(d.q), 1);
        saveCart(); renderCart();
        return;
      }
      if (d.rm !== undefined) { cart.splice(Number(d.rm), 1); saveCart(); renderCart(); return; }
      if (t.id === "toCheckout") { startCheckout(); return; }
      if (d.backCart !== undefined) { closeLayer("#checkout"); openCart(); return; }
      if (t.id === "toPay") { e.preventDefault(); stepPay(); return; }
      if (d.backDetails !== undefined) { stepDetails(); return; }
      if (t.id === "placeOrder") { e.preventDefault(); placeOrder(); return; }
      if (d.copy) {
        navigator.clipboard && navigator.clipboard.writeText(d.copy).then(() => toast("UPI ID copied"), () => toast(d.copy));
      }
    });

    document.addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.target.id === "detailsForm") stepPay();
      if (e.target.id === "utrForm") placeOrder();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && stack.length) closeLayer(stack[stack.length - 1].sel);
    });

    $("#search").addEventListener("input", (e) => { query = e.target.value.trim(); renderGrid(); });
    window.addEventListener("popstate", routeFromHash);
    window.addEventListener("storage", (e) => { if (e.key === CART_KEY) { cart = readJSON(CART_KEY, []); renderCartCount(); } });
  }

  function openCart() { renderCart(); openLayer("#cartDrawer"); }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
