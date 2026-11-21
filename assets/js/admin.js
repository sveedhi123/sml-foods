/* SML Foods — Admin dashboard: orders, products, categories, reviews, settings */
(function () {
  const { esc, inr, qtyText, unitPrice, STATUS, productVisual, productArt, variantAvailable, upiLink, waLink, digits, db, DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } = window.SML;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const d = db();
  const auth = firebase.auth();
  const FV = firebase.firestore.FieldValue;
  const TS = firebase.firestore.Timestamp;

  const A = {
    user: null, view: "overview",
    settings: { ...DEFAULT_SETTINGS }, categories: DEFAULT_CATEGORIES.slice(),
    products: [], reviews: [], orders: [],
    loaded: { products: false, orders: false },
    orderFilter: "payment_submitted", orderQuery: "", productFilter: "all",
    unsubs: [], knownOrders: null
  };

  const TITLES = { overview: "Overview", orders: "Orders", products: "Products", categories: "Categories", reviews: "Reviews", settings: "Settings" };

  /* ---------------- Auth ---------------- */
  function show(id) { ["login", "denied", "app"].forEach((x) => ($("#" + x).hidden = x !== id)); }

  auth.onAuthStateChanged(async (user) => {
    A.unsubs.forEach((u) => u()); A.unsubs = []; A.knownOrders = null;
    if (!user) { A.user = null; show("login"); return; }
    A.user = user;
    try {
      const adm = await d.collection("admins").doc(user.uid).get();
      if (!adm.exists) { $("#dEmail").textContent = user.email; $("#dUid").textContent = user.uid; show("denied"); return; }
    } catch (e) {
      $("#dEmail").textContent = user.email; $("#dUid").textContent = user.uid; show("denied"); return;
    }
    $("#who").textContent = user.email;
    show("app");
    subscribe();
    go(location.hash.replace("#", "") || "overview");
  });

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#lErr").textContent = ""; $("#lBtn").disabled = true;
    try { await auth.signInWithEmailAndPassword($("#lEmail").value.trim(), $("#lPass").value); }
    catch (err) { $("#lErr").textContent = friendlyAuth(err); }
    $("#lBtn").disabled = false;
  });
  $("#lForgot").addEventListener("click", async () => {
    const email = $("#lEmail").value.trim();
    if (!email) { $("#lErr").textContent = "Enter your email above first."; return; }
    try { await auth.sendPasswordResetEmail(email); $("#lErr").textContent = "Password reset email sent."; }
    catch (err) { $("#lErr").textContent = friendlyAuth(err); }
  });
  $("#dRetry").addEventListener("click", () => location.reload());
  document.addEventListener("click", (e) => { if (e.target.closest("[data-logout]")) auth.signOut(); });

  function friendlyAuth(err) {
    const c = (err && err.code) || "";
    if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Email or password is incorrect.";
    if (c.includes("too-many-requests")) return "Too many attempts. Please wait a few minutes.";
    if (c.includes("network")) return "No internet connection.";
    return err.message || "Sign-in failed.";
  }

  /* ---------------- Live data ---------------- */
  function subscribe() {
    A.unsubs.push(d.collection("settings").doc("store").onSnapshot((s) => { A.settings = { ...DEFAULT_SETTINGS, ...(s.exists ? s.data() : {}) }; A.settingsSaved = s.exists; renderTop(); refresh(["overview", "settings"]); }));
    A.unsubs.push(d.collection("settings").doc("categories").onSnapshot((s) => { A.categories = s.exists && (s.data().list || []).length ? s.data().list.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0)) : DEFAULT_CATEGORIES.slice(); refresh(["categories", "products"]); }));
    A.unsubs.push(d.collection("products").onSnapshot((s) => { A.products = s.docs.map((x) => ({ ...x.data(), id: x.id })).sort((a, b) => (a.sort || 0) - (b.sort || 0)); A.loaded.products = true; refresh(["products", "overview"]); }));
    A.unsubs.push(d.collection("reviews").onSnapshot((s) => { A.reviews = s.docs.map((x) => ({ ...x.data(), id: x.id })).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)); refresh(["reviews"]); }));
    A.unsubs.push(d.collection("orders").orderBy("createdAt", "desc").limit(500).onSnapshot((s) => {
      A.orders = s.docs.map((x) => ({ ...x.data(), id: x.id }));
      A.loaded.orders = true;
      const ids = new Set(A.orders.map((o) => o.id));
      if (A.knownOrders) {
        const fresh = A.orders.filter((o) => !A.knownOrders.has(o.id));
        if (fresh.length) notifyNew(fresh);
      }
      A.knownOrders = ids;
      renderNavCount();
      refresh(["orders", "overview"]);
      if (A.openOrder && !$("#aModal").hidden) {
        const o = A.orders.find((x) => x.id === A.openOrder);
        const stamp = o && JSON.stringify([o.status, o.history, o.shipping, o.adminNote]);
        if (o && stamp !== A.openStamp) orderModal(o, true);
      }
    }, (err) => toast("Orders: " + err.message)));
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }

  function notifyNew(list) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach((t) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.12); });
    } catch { /* audio blocked */ }
    list.forEach((o) => {
      toast(`New order ${o.orderNo} · ${inr(o.total)}`);
      if ("Notification" in window && Notification.permission === "granted") new Notification("New SML order", { body: `${o.orderNo} · ${inr(o.total)} · ${o.customer && o.customer.name}`, icon: "assets/img/favicon.svg" });
    });
  }

  const pendingCount = () => A.orders.filter((o) => o.status === "payment_submitted").length;
  function renderNavCount() {
    const n = pendingCount();
    $("#navPending").hidden = !n; $("#navPending").textContent = n;
    document.title = (n ? `(${n}) ` : "") + "Admin — SML Foods";
  }
  function renderTop() {
    const open = !!A.settings.storeOpen;
    const el = $("#storeState");
    el.className = "store-state " + (open ? "open" : "closed");
    el.textContent = open ? "● Store open" : "● Online orders closed";
  }

  /* ---------------- Navigation ---------------- */
  function go(view) {
    if (!TITLES[view]) view = "overview";
    A.view = view;
    A.editing = false;
    history.replaceState(null, "", "#" + view);
    $$("#sideNav button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
    $("#viewTitle").textContent = TITLES[view];
    render();
  }
  $("#sideNav").addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) go(b.dataset.view); });
  function refresh(views) { if (views.includes(A.view) && !A.editing) render(); }
  function render() {
    const v = A.view;
    const html = { overview: viewOverview, orders: viewOrders, products: viewProducts, categories: viewCategories, reviews: viewReviews, settings: viewSettings }[v]();
    $("#view").innerHTML = html;
    if (v === "settings") afterSettings();
  }

  /* ---------------- Overview ---------------- */
  const tsDate = (t) => (t && t.toDate ? t.toDate() : t ? new Date(t) : null);
  const fmtDate = (t) => { const x = tsDate(t); return x ? x.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "just now"; };
  const PAID = ["confirmed", "packed", "shipped", "delivered"];

  function viewOverview() {
    const s = A.settings;
    const now = new Date();
    const today = A.orders.filter((o) => { const x = tsDate(o.createdAt); return x && x.toDateString() === now.toDateString(); });
    const month = A.orders.filter((o) => { const x = tsDate(o.createdAt); return x && x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear() && PAID.includes(o.status); });
    const by = (st) => A.orders.filter((o) => o.status === st).length;
    const low = [];
    A.products.forEach((p) => (p.variants || []).forEach((v) => { if (v.stock !== null && v.stock !== undefined && v.stock !== "" && Number(v.stock) <= 5) low.push({ p, v }); }));
    const sample = A.products.length && A.products.every((p) => DEFAULT_PRODUCTS.some((dp) => dp.id === p.id && JSON.stringify(dp.variants.map((x) => x.price)) === JSON.stringify((p.variants || []).map((x) => x.price))));
    const checks = [
      [A.products.length > 0, "Products added to the database", "products"],
      [A.products.length > 0 && !sample, "Real prices entered (starter prices are samples)", "products"],
      [!!s.upiId, "UPI ID for payments", "settings"],
      [!!s.whatsapp, "WhatsApp number", "settings"],
      [!!s.fssai, "FSSAI licence number", "settings"],
      [A.products.some((p) => (p.images || []).length), "Product photos uploaded", "products"],
      [!!s.storeOpen, "Store switched on for online orders", "settings"]
    ];
    const recent = A.orders.slice(0, 6);
    return `
      ${!A.products.length && A.loaded.products ? seedBanner() : ""}
      <div class="stats">
        <button class="stat ${by("payment_submitted") ? "hot" : ""}" data-goto-orders="payment_submitted"><div class="k">Verify payment</div><div class="v">${by("payment_submitted")}</div></button>
        <button class="stat" data-goto-orders="confirmed"><div class="k">To pack</div><div class="v">${by("confirmed")}</div></button>
        <button class="stat" data-goto-orders="packed"><div class="k">To ship</div><div class="v">${by("packed")}</div></button>
        <div class="stat"><div class="k">Orders today</div><div class="v">${today.length}</div></div>
        <div class="stat"><div class="k">Sales this month</div><div class="v">${inr(month.reduce((a, o) => a + (o.total || 0), 0))}</div></div>
      </div>
      <div class="two">
        <div class="panel"><h2>Recent orders</h2>${recent.length ? ordersTable(recent) : `<p class="empty-state">No orders yet.</p>`}</div>
        <div>
          <div class="panel"><h2>Launch checklist</h2><ul class="checklist">${checks.map(([ok, t, v]) => `<li><span class="${ok ? "ok" : "no"}">${ok ? "✓" : "!"}</span><span>${t}</span>${ok ? "" : `<button class="btn btn-ghost btn-sm" style="margin-left:auto" data-go="${v}">Fix</button>`}</li>`).join("")}</ul></div>
          <div class="panel"><h2>Low stock <small>5 or fewer left</small></h2>${low.length ? `<ul class="checklist">${low.map(({ p, v }) => `<li><span class="${Number(v.stock) ? "no" : "ok"}" style="color:${Number(v.stock) ? "var(--amber)" : "var(--red)"}">${Number(v.stock)}</span>${esc(p.nameEn)} · ${esc(v.label)}<button class="btn btn-ghost btn-sm" style="margin-left:auto" data-edit="${esc(p.id)}">Update</button></li>`).join("")}</ul>` : `<p class="muted" style="margin:0">All good. (Leave stock blank on a size for unlimited.)</p>`}</div>
        </div>
      </div>`;
  }

  function seedBanner() {
    return `<div class="banner"><span><b>Your product list is empty.</b> Load the starter catalogue — buffalo ghee, cow ghee (coming soon), 9 pickles and paneer — then edit prices and descriptions.</span><button class="btn btn-primary" id="seedBtn">Load starter catalogue</button></div>`;
  }

  async function seed() {
    if (!confirm("Add the starter catalogue (12 products), default categories and settings?")) return;
    const b = d.batch();
    DEFAULT_PRODUCTS.forEach((p) => { const { id, ...rest } = p; b.set(d.collection("products").doc(id), { ...rest, updatedAt: FV.serverTimestamp() }); });
    b.set(d.collection("settings").doc("categories"), { list: DEFAULT_CATEGORIES });
    if (!A.settingsSaved) b.set(d.collection("settings").doc("store"), DEFAULT_SETTINGS);
    await b.commit();
    toast("Starter catalogue added. Now update prices in Products.");
  }

  /* ---------------- Orders ---------------- */
  function ordersTable(list) {
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th class="hide-sm">Placed</th><th>Status</th><th class="num">Total</th></tr></thead><tbody>
      ${list.map((o) => { const st = STATUS[o.status] || { label: o.status, tone: "" }; return `<tr class="click" data-order="${esc(o.id)}"><td class="mono">${esc(o.orderNo)}</td><td>${esc(o.customer && o.customer.name)}<div class="muted" style="font-size:12.5px">${esc(o.address && o.address.city)} · ${esc(o.address && o.address.pincode)}</div></td><td class="hide-sm">${esc(fmtDate(o.createdAt))}</td><td><span class="pill ${st.tone}">${esc(st.label)}</span></td><td class="num">${inr(o.total)}</td></tr>`; }).join("")}
    </tbody></table></div>`;
  }

  function filteredOrders() {
    const q = A.orderQuery.toLowerCase();
    return A.orders.filter((o) => (A.orderFilter === "all" || o.status === A.orderFilter) &&
      (!q || [o.orderNo, o.customer && o.customer.name, o.customer && o.customer.phone, o.payment && o.payment.utr, o.address && o.address.pincode].join(" ").toLowerCase().includes(q)));
  }

  function viewOrders() {
    const keys = ["payment_submitted", "confirmed", "packed", "shipped", "delivered", "payment_failed", "cancelled", "all"];
    const count = (k) => (k === "all" ? A.orders.length : A.orders.filter((o) => o.status === k).length);
    const list = filteredOrders();
    return `
      <div class="toolbar">
        <div class="chips">${keys.map((k) => `<button class="chip" data-ofilter="${k}" aria-pressed="${A.orderFilter === k}">${k === "all" ? "All" : esc(STATUS[k].label)}<b>${count(k)}</b></button>`).join("")}</div>
      </div>
      <div class="toolbar">
        <label class="search"><input type="search" id="oSearch" placeholder="Search order no., name, phone, UTR, pincode" value="${esc(A.orderQuery)}"></label>
        <span class="spacer"></span>
        <button class="btn btn-ghost" id="exportCsv">Export CSV</button>
      </div>
      ${!A.loaded.orders ? `<p class="empty-state">Loading orders…</p>` : list.length ? ordersTable(list) : `<p class="empty-state">No orders here.</p>`}`;
  }

  function exportCsv() {
    const rows = [["Order no", "Date", "Status", "Name", "Phone", "Email", "Address", "City", "State", "Pincode", "Items", "Subtotal", "Delivery", "Total", "UTR", "Courier", "Tracking"]];
    filteredOrders().forEach((o) => rows.push([o.orderNo, (tsDate(o.createdAt) || new Date()).toISOString(), o.status, o.customer.name, o.customer.phone, o.customer.email, o.address.line, o.address.city, o.address.state, o.address.pincode,
      (o.items || []).map((i) => `${i.name} ${qtyText(i.variant, i.qty)}`).join("; "), o.subtotal, o.deliveryFee, o.total, o.payment && o.payment.utr, o.shipping && o.shipping.courier, o.shipping && o.shipping.tracking]));
    const csv = rows.map((r) => r.map((c) => `"${String(c === undefined || c === null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `sml-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function priceCheck(o) {
    const issues = [];
    let sum = 0;
    (o.items || []).forEach((it) => {
      sum += Number(it.price) * Number(it.qty);
      if (Number(it.lineTotal) !== Number(it.price) * Number(it.qty)) issues.push(`${it.name}: line total doesn't match price × qty`);
      const p = A.products.find((x) => x.id === it.productId);
      const v = p && (p.variants || []).find((x) => x.id === it.variantId);
      if (!v) issues.push(`${it.name} (${it.variant}) is not in your current product list`);
      else if (Number(v.price) !== Number(it.price)) issues.push(`${it.name} (${it.variant}) was ordered at ${inr(it.price)}, current price is ${inr(v.price)}`);
    });
    if (sum !== Number(o.subtotal)) issues.push(`Items add up to ${inr(sum)} but subtotal says ${inr(o.subtotal)}`);
    return issues;
  }

  function orderModal(o, keepScroll = false) {
    A.openOrder = o.id;
    A.openStamp = JSON.stringify([o.status, o.history, o.shipping, o.adminNote]);
    const st = STATUS[o.status] || { label: o.status, tone: "" };
    const issues = priceCheck(o);
    const ship = o.shipping || {};
    const addr = [o.address.line, o.address.city, o.address.state, o.address.pincode].join(", ");
    const act = [];
    if (o.status === "payment_submitted") {
      act.push(`<button class="btn btn-danger" data-ostatus="payment_failed">Payment not received</button>`);
      act.push(`<button class="btn btn-primary" data-ostatus="confirmed">✓ Payment received — confirm order</button>`);
    }
    if (o.status === "confirmed") act.push(`<button class="btn btn-primary" data-ostatus="packed">Mark packed</button>`);
    if (o.status === "packed") act.push(`<button class="btn btn-primary" data-ostatus="shipped">Mark shipped</button>`);
    if (o.status === "shipped") act.push(`<button class="btn btn-primary" data-ostatus="delivered">Mark delivered</button>`);
    if (!["delivered", "cancelled"].includes(o.status)) act.unshift(`<button class="btn btn-ghost left" data-ostatus="cancelled">Cancel order</button>`);
    if (["payment_failed", "cancelled"].includes(o.status)) act.push(`<button class="btn btn-ghost" data-ostatus="payment_submitted">Re-open</button>`);

    const scroll = keepScroll ? $("#aModalBody").scrollTop : 0;
    openModal(`
      <div class="am-head"><h2>${esc(o.orderNo)}</h2><span class="pill ${st.tone}">${esc(st.label)}</span><button class="icon-btn" data-mclose aria-label="Close">✕</button></div>
      <div class="am-body">
        ${o.status === "payment_submitted" ? `<div class="alert warn">Open your UPI / bank app and check that <b>${inr(o.total)}</b> was received with UPI reference <b>${esc(o.payment.utr)}</b>. Then confirm.</div>` : ""}
        ${issues.length ? `<div class="alert bad"><b>Check this order carefully:</b><br>${issues.map(esc).join("<br>")}</div>` : ""}
        <div class="two">
          <div>
            <p class="section-label">Customer</p>
            <dl class="kv">
              <dt>Name</dt><dd>${esc(o.customer.name)}</dd>
              <dt>Phone</dt><dd><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a> <a class="copy" href="${waLink(o.customer.phone, "")}" target="_blank" rel="noopener">WhatsApp</a></dd>
              ${o.customer.email ? `<dt>Email</dt><dd>${esc(o.customer.email)}</dd>` : ""}
              <dt>Address</dt><dd>${esc(addr)} <button class="copy" data-copy="${esc(o.customer.name + "\n" + o.customer.phone + "\n" + addr)}">Copy</button></dd>
              ${o.notes ? `<dt>Notes</dt><dd>${esc(o.notes)}</dd>` : ""}
              <dt>Placed</dt><dd>${esc(fmtDate(o.createdAt))}</dd>
            </dl>
          </div>
          <div>
            <p class="section-label">Payment</p>
            <dl class="kv">
              <dt>Amount</dt><dd><b>${inr(o.total)}</b></dd>
              <dt>UPI ref (UTR)</dt><dd class="mono">${esc(o.payment.utr)} <button class="copy" data-copy="${esc(o.payment.utr)}">Copy</button></dd>
              <dt>Paid to</dt><dd>${esc(o.payment.upiId || "")}</dd>
            </dl>
          </div>
        </div>
        <p class="section-label">Items</p>
        <table class="table"><tbody>
          ${(o.items || []).map((it) => `<tr><td>${esc(it.name)} <span class="te-inline muted">${esc(it.nameTe || "")}</span><div class="muted" style="font-size:12.5px">${esc(unitPrice(it.variant, it.price))}</div></td><td class="num">${esc(qtyText(it.variant, it.qty))}</td><td class="num">${inr(it.lineTotal)}</td></tr>`).join("")}
          <tr><td>Delivery</td><td></td><td class="num">${o.deliveryFee ? inr(o.deliveryFee) : "Free"}</td></tr>
          <tr><td><b>Total</b></td><td></td><td class="num"><b>${inr(o.total)}</b></td></tr>
        </tbody></table>
        <p class="section-label">Shipping</p>
        <div class="grid3">
          <div class="field"><label>Courier</label><input id="shCourier" value="${esc(ship.courier || "")}" placeholder="DTDC, India Post, own delivery…"></div>
          <div class="field"><label>Tracking no.</label><input id="shTracking" value="${esc(ship.tracking || "")}"></div>
          <div class="field"><label>Tracking link <span class="opt">(optional)</span></label><input id="shUrl" value="${esc(ship.url || "")}" placeholder="https://"></div>
        </div>
        <div class="field" style="margin-top:12px"><label>Internal note <span class="opt">(only you see this)</span></label><input id="shNote" value="${esc(o.adminNote || "")}"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn btn-ghost btn-sm" id="saveShip">Save shipping & note</button>
          <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(o.customer.phone, customerMessage(o))}">Send status on WhatsApp</a>
          <button class="btn btn-ghost btn-sm" id="printSlipBtn">Print packing slip</button>
          <a class="btn btn-ghost btn-sm" href="order.html?id=${esc(o.id)}" target="_blank" rel="noopener">Customer view ↗</a>
        </div>
        ${(o.history || []).length ? `<p class="section-label">History</p><ul class="history">${o.history.map((h) => `<li>${esc(fmtDate(h.at))} — ${esc((STATUS[h.status] || {}).label || h.status)} ${h.by ? `· ${esc(h.by)}` : ""}</li>`).join("")}</ul>` : ""}
        <div id="printSlip" hidden></div>
      </div>
      <div class="am-foot">${act.join("")}</div>`);
    $("#aModalBody").scrollTop = scroll;
  }

  function customerMessage(o) {
    const name = o.customer.name.split(" ")[0];
    const link = location.origin + location.pathname.replace(/admin\.html$/, "") + "order.html?id=" + o.id;
    const ship = o.shipping || {};
    const m = {
      payment_submitted: `Namaste ${name}! We received your SML Foods order ${o.orderNo} (${inr(o.total)}). We are verifying your payment and will confirm shortly.`,
      confirmed: `Namaste ${name}! Your payment of ${inr(o.total)} is confirmed for order ${o.orderNo}. We are preparing your order 🙏`,
      packed: `Namaste ${name}! Your SML Foods order ${o.orderNo} is packed and will be shipped soon.`,
      shipped: `Namaste ${name}! Your SML Foods order ${o.orderNo} has been shipped${ship.courier ? ` via ${ship.courier}` : ""}${ship.tracking ? ` (tracking no. ${ship.tracking})` : ""}.`,
      delivered: `Namaste ${name}! Your SML Foods order ${o.orderNo} has been delivered. Thank you for choosing us — we'd love to hear how you liked it!`,
      payment_failed: `Namaste ${name}, we could not find a payment of ${inr(o.total)} with UPI ref ${o.payment.utr} for order ${o.orderNo}. Could you please share a screenshot of the payment?`,
      cancelled: `Namaste ${name}, your SML Foods order ${o.orderNo} has been cancelled. Please reply if you have any questions.`
    }[o.status] || `Update on your order ${o.orderNo}`;
    return `${m}\n\nTrack: ${link}`;
  }

  async function setOrderStatus(o, status) {
    const labels = { confirmed: "Confirm payment received? Stock will be reduced.", payment_failed: "Mark payment as NOT received?", cancelled: "Cancel this order?" };
    if (labels[status] && !confirm(labels[status])) return;
    const ref = d.collection("orders").doc(o.id);
    const entry = { status, at: TS.now(), by: A.user.email };
    try {
      if (status === "confirmed" && !o.stockApplied) {
        await adjustStock(ref, o, -1, { status, updatedAt: FV.serverTimestamp(), history: FV.arrayUnion(entry), stockApplied: true });
      } else if (["cancelled", "payment_failed"].includes(status) && o.stockApplied) {
        await adjustStock(ref, o, +1, { status, updatedAt: FV.serverTimestamp(), history: FV.arrayUnion(entry), stockApplied: false });
      } else {
        await ref.update({ status, updatedAt: FV.serverTimestamp(), history: FV.arrayUnion(entry) });
      }
      toast(`Order ${o.orderNo}: ${STATUS[status].label}`);
    } catch (e) { toast("Could not update: " + e.message); }
  }

  /* Reduce (dir=-1) or restore (dir=+1) tracked stock for an order, atomically with the order update */
  function adjustStock(orderRef, o, dir, orderUpdate) {
    const pids = [...new Set((o.items || []).map((i) => i.productId))];
    return d.runTransaction(async (tx) => {
      const snaps = await Promise.all(pids.map((id) => tx.get(d.collection("products").doc(id))));
      snaps.forEach((snap) => {
        if (!snap.exists) return;
        const p = snap.data();
        let changed = false;
        const variants = (p.variants || []).map((v) => {
          const qty = (o.items || []).filter((i) => i.productId === snap.id && i.variantId === v.id).reduce((a, i) => a + Number(i.qty), 0);
          if (!qty || v.stock === null || v.stock === undefined || v.stock === "") return v;
          changed = true;
          return { ...v, stock: Math.max(0, Number(v.stock) + dir * qty) };
        });
        if (changed) tx.update(snap.ref, { variants, updatedAt: FV.serverTimestamp() });
      });
      tx.update(orderRef, orderUpdate);
    });
  }

  function printSlip(o) {
    const s = A.settings;
    const el = $("#printSlip");
    el.hidden = false;
    el.innerHTML = `<div style="font-family:Inter,sans-serif;max-width:640px">
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:30px;margin:0">SML Foods</h2>
      <p style="margin:0 0 12px;color:#555">Seetha Maha Lakshmi Foods · ${esc(s.address || "")}${s.fssai ? ` · FSSAI ${esc(s.fssai)}` : ""}</p>
      <p><b>Order ${esc(o.orderNo)}</b> · ${esc(fmtDate(o.createdAt))}</p>
      <p><b>Ship to:</b><br>${esc(o.customer.name)}<br>${esc(o.address.line)}<br>${esc(o.address.city)}, ${esc(o.address.state)} - ${esc(o.address.pincode)}<br>📞 ${esc(o.customer.phone)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${(o.items || []).map((i) => `<tr><td style="border-bottom:1px solid #ddd;padding:6px 0">${esc(i.name)}</td><td style="border-bottom:1px solid #ddd;text-align:right">${esc(qtyText(i.variant, i.qty))}</td><td style="border-bottom:1px solid #ddd;text-align:right">${inr(i.lineTotal)}</td></tr>`).join("")}
      <tr><td style="padding:6px 0">Delivery</td><td></td><td style="text-align:right">${o.deliveryFee ? inr(o.deliveryFee) : "Free"}</td></tr>
      <tr><td><b>Total (paid by UPI ${esc(o.payment.utr)})</b></td><td></td><td style="text-align:right"><b>${inr(o.total)}</b></td></tr></table>
      ${o.notes ? `<p><b>Note:</b> ${esc(o.notes)}</p>` : ""}
      <p style="margin-top:18px;color:#555">Thank you for your order! 🙏</p></div>`;
    window.print();
    setTimeout(() => { el.hidden = true; }, 500);
  }

  /* ---------------- Products ---------------- */
  function viewProducts() {
    const cats = [{ id: "all", name: "All" }, ...A.categories];
    const list = A.products.filter((p) => A.productFilter === "all" || p.category === A.productFilter);
    const statusPill = (p) => p.status === "active" ? `<span class="pill green">Live</span>` : p.status === "coming_soon" ? `<span class="pill amber">Coming soon</span>` : `<span class="pill">Hidden</span>`;
    const stockText = (p) => (p.variants || []).map((v) => `${esc(v.label)}: ${!variantAvailable(v) ? `<b style="color:var(--red)">out</b>` : v.stock === null || v.stock === undefined || v.stock === "" ? "∞" : Number(v.stock)}`).join(" · ");
    const prices = (p) => { const ps = (p.variants || []).map((v) => Number(v.price)); return ps.length ? (Math.min(...ps) === Math.max(...ps) ? inr(ps[0]) : `${inr(Math.min(...ps))} – ${inr(Math.max(...ps))}`) : "—"; };
    return `
      ${!A.products.length && A.loaded.products ? seedBanner() : ""}
      <div class="toolbar">
        <div class="chips">${cats.map((c) => `<button class="chip" data-pfilter="${esc(c.id)}" aria-pressed="${A.productFilter === c.id}">${esc(c.name)}</button>`).join("")}</div>
        <span class="spacer"></span>
        <button class="btn btn-primary" data-edit="">+ Add product</button>
      </div>
      ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th class="hide-sm">Category</th><th>Price</th><th class="hide-sm">Stock</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((p) => `<tr>
          <td><div class="pcell"><div class="thumb-sm">${productVisual(p, "", { hover: false, widths: [100, 160], sizes: "46px", ratio: 1 })}</div><div><b>${esc(p.nameEn)}</b><div class="te-inline">${esc(p.nameTe)}</div></div></div></td>
          <td class="hide-sm">${esc((A.categories.find((c) => c.id === p.category) || {}).name || p.category)}</td>
          <td>${prices(p)}</td>
          <td class="hide-sm" style="font-size:13px">${stockText(p)}</td>
          <td>${statusPill(p)}</td>
          <td><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${esc(p.id)}">Edit</button><button class="btn btn-ghost btn-sm" data-dup="${esc(p.id)}" title="Duplicate">Copy</button></div></td>
        </tr>`).join("")}</tbody></table></div>` : A.loaded.products ? `<p class="empty-state">No products in this category.</p>` : `<p class="empty-state">Loading…</p>`}`;
  }

  const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 50) || "product";

  let draft = null;
  function productModal(id, dupFrom) {
    const src = id ? A.products.find((p) => p.id === id) : dupFrom ? A.products.find((p) => p.id === dupFrom) : null;
    draft = src ? JSON.parse(JSON.stringify(src)) : {
      nameEn: "", nameTe: "", category: A.productFilter !== "all" ? A.productFilter : (A.categories[0] || {}).id || "pickles", color: "#B5341F",
      shortDesc: "", description: "", ingredients: "", shelfLife: "", storage: "", badges: [], images: [],
      variants: [{ id: "1kg", label: "1 kg", price: 0, mrp: null, stock: null, inStock: true }],
      status: "active", localOnly: false, featured: false, sort: (A.products.reduce((m, p) => Math.max(m, p.sort || 0), 0) || 0) + 1
    };
    if (dupFrom) { delete draft.id; draft.nameEn += " (copy)"; draft.status = "hidden"; }
    draft._isNew = !id;
    A.editing = true;
    renderProductModal();
  }

  function renderProductModal() {
    const p = draft;
    const catOpts = A.categories.map((c) => `<option value="${esc(c.id)}" ${c.id === p.category ? "selected" : ""}>${esc(c.name)} · ${esc(c.te || "")}</option>`).join("");
    openModal(`
      <div class="am-head"><h2>${p._isNew ? "Add product" : "Edit product"}</h2><button class="icon-btn" data-mclose aria-label="Close">✕</button></div>
      <form class="am-body" id="pForm" novalidate>
        <p class="section-label">Basic details</p>
        <div class="grid2">
          <div class="field"><label>Name (English)</label><input name="nameEn" required value="${esc(p.nameEn)}" placeholder="Avakaya (Mango Pickle)"></div>
          <div class="field"><label>Name (Telugu)</label><input name="nameTe" value="${esc(p.nameTe)}" placeholder="ఆవకాయ" style="font-family:var(--te)"></div>
          <div class="field"><label>Category</label><select name="category">${catOpts}</select></div>
          <div class="field"><label>Status</label><select name="status">
            <option value="active" ${p.status === "active" ? "selected" : ""}>Live — customers can buy</option>
            <option value="coming_soon" ${p.status === "coming_soon" ? "selected" : ""}>Coming soon — shown, can't buy</option>
            <option value="hidden" ${p.status === "hidden" ? "selected" : ""}>Hidden — not shown</option></select></div>
        </div>
        <div class="grid3" style="margin-top:14px">
          <label class="check"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Feature on homepage</label>
          <label class="check"><input type="checkbox" name="localOnly" ${p.localOnly ? "checked" : ""}> Fresh — local delivery only</label>
          <div class="field"><label>Display order</label><input name="sort" type="number" value="${esc(p.sort || 0)}"></div>
        </div>

        <p class="section-label">Sizes, prices & stock</p>
        <table class="vtable"><thead><tr><th>Size label</th><th>Price ₹</th><th>MRP ₹ <span class="muted">(optional)</span></th><th>Stock <span class="muted">(blank = unlimited)</span></th><th>In stock</th><th></th></tr></thead><tbody id="vRows">
          ${(p.variants || []).map((v, i) => `<tr data-vi="${i}">
            <td><input data-v="label" value="${esc(v.label)}" placeholder="500 g"></td>
            <td><input data-v="price" type="number" min="0" step="1" value="${esc(v.price)}"></td>
            <td><input data-v="mrp" type="number" min="0" step="1" value="${esc(v.mrp ?? "")}"></td>
            <td><input data-v="stock" type="number" min="0" step="1" value="${esc(v.stock ?? "")}"></td>
            <td style="text-align:center"><input data-v="inStock" type="checkbox" ${v.inStock !== false ? "checked" : ""}></td>
            <td><button type="button" class="btn btn-ghost btn-sm" data-vdel="${i}" ${p.variants.length < 2 ? "disabled" : ""}>Remove</button></td></tr>`).join("")}
        </tbody></table>
        <button type="button" class="btn btn-ghost btn-sm" id="vAdd" style="margin-top:8px">+ Add size</button>

        <p class="section-label">Photos</p>
        <div class="imgs" id="imgs">
          ${(p.images || []).map((src, i) => `<div class="img-tile">${i === 0 ? `<span class="first">Main</span>` : ""}<img src="${esc(window.SML.imgUrl(src, 240, 240))}" alt=""><div class="tools"><button type="button" data-imove="${i}" ${i === 0 ? "disabled" : ""}>◀</button><button type="button" data-idel="${i}">Remove</button></div></div>`).join("")}
          ${(p.images || []).length < 4 ? `<label class="img-add">+ Upload<br>photo<input type="file" accept="image/*" id="imgFile" hidden multiple></label>` : ""}
          ${!(p.images || []).length ? `<div class="img-tile" title="Shown until you add a photo">${`<div class="art">${productArt(p)}</div>`}</div>` : ""}
        </div>
        <p class="hint muted" style="font-size:12.5px;margin-top:8px">Square photos look best. They are compressed automatically and stored free in your database (up to 4). Or paste an image link: <input id="imgUrl" placeholder="https://…/photo.jpg" style="border:1px solid var(--line);border-radius:8px;padding:5px 8px;width:260px"> <button type="button" class="btn btn-ghost btn-sm" id="imgUrlAdd">Add</button></p>
        <div class="field" style="max-width:260px;margin-top:6px"><label>Illustration colour <span class="opt">(used when no photo)</span></label><input type="color" name="color" value="${esc(p.color || "#B5341F")}" style="height:42px;padding:4px"></div>

        <p class="section-label">Description</p>
        <div class="field"><label>Short line <span class="opt">(shown on the product card, ~80 characters)</span></label><input name="shortDesc" maxlength="140" value="${esc(p.shortDesc)}"></div>
        <div class="field" style="margin-top:12px"><label>Full description</label><textarea name="description" rows="5">${esc(p.description)}</textarea></div>
        <div class="grid2" style="margin-top:12px">
          <div class="field"><label>Ingredients</label><textarea name="ingredients" rows="3" placeholder="Raw mango, groundnut oil, red chilli powder, mustard, salt…">${esc(p.ingredients)}</textarea></div>
          <div class="field"><label>Shelf life</label><textarea name="shelfLife" rows="3" placeholder="e.g. 6 months from packing">${esc(p.shelfLife)}</textarea></div>
          <div class="field"><label>Storage instructions</label><textarea name="storage" rows="3">${esc(p.storage)}</textarea></div>
          <div class="field"><label>Badges <span class="opt">(comma separated)</span></label><input name="badges" value="${esc((p.badges || []).join(", "))}" placeholder="Bestseller, Andhra special"></div>
        </div>
      </form>
      <div class="am-foot">
        ${!p._isNew ? `<button class="btn btn-danger left" id="pDelete">Delete</button>` : ""}
        <button class="btn btn-ghost" data-mclose>Cancel</button>
        <button class="btn btn-primary" id="pSave">Save product</button>
      </div>`);
  }

  function readProductForm() {
    const f = $("#pForm");
    const g = (n) => f.elements[n];
    Object.assign(draft, {
      nameEn: g("nameEn").value.trim(), nameTe: g("nameTe").value.trim(), category: g("category").value, status: g("status").value,
      featured: g("featured").checked, localOnly: g("localOnly").checked, sort: Number(g("sort").value) || 0,
      color: g("color").value, shortDesc: g("shortDesc").value.trim(), description: g("description").value.trim(),
      ingredients: g("ingredients").value.trim(), shelfLife: g("shelfLife").value.trim(), storage: g("storage").value.trim(),
      badges: g("badges").value.split(",").map((x) => x.trim()).filter(Boolean)
    });
    draft.variants = $$("#vRows tr").map((tr) => {
      const v = (k) => $(`[data-v="${k}"]`, tr);
      const label = v("label").value.trim();
      const num = (x) => (x.value === "" ? null : Number(x.value));
      return { id: slug(label).replace(/-/g, "") || "size", label, price: Number(v("price").value) || 0, mrp: num(v("mrp")), stock: num(v("stock")), inStock: v("inStock").checked };
    });
    const seen = {};
    draft.variants.forEach((v) => { seen[v.id] = (seen[v.id] || 0) + 1; if (seen[v.id] > 1) v.id += "-" + seen[v.id]; });
  }

  async function saveProduct() {
    readProductForm();
    const p = draft;
    const errs = [];
    if (!p.nameEn) errs.push("Enter the English name.");
    if (!p.variants.length) errs.push("Add at least one size.");
    p.variants.forEach((v) => { if (!v.label) errs.push("Every size needs a label (e.g. 500 g)."); if (!(v.price > 0)) errs.push(`Enter a price for ${v.label || "each size"}.`); });
    if (errs.length) { alert([...new Set(errs)].join("\n")); return; }
    const { _isNew, id, ...data } = p;
    const size = JSON.stringify(data).length;
    if (size > 950000) { alert("Photos are too large together. Remove one photo and try again."); return; }
    let docId = id;
    if (!docId) { docId = slug(p.nameEn); let n = 2; while (A.products.some((x) => x.id === docId)) docId = slug(p.nameEn) + "-" + n++; }
    $("#pSave").disabled = true; $("#pSave").textContent = "Saving…";
    try {
      await d.collection("products").doc(docId).set({ ...data, updatedAt: FV.serverTimestamp() });
      toast("Saved " + p.nameEn);
      closeModal();
    } catch (e) { alert("Could not save: " + e.message); $("#pSave").disabled = false; $("#pSave").textContent = "Save product"; }
  }

  async function compressImage(file) {
    const bmp = await createImageBitmap(file);
    const max = 1000;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    let q = 0.82, url = c.toDataURL("image/webp", q);
    const type = url.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
    if (type === "image/jpeg") url = c.toDataURL(type, q);
    while (url.length > 200000 && q > 0.45) { q -= 0.08; url = c.toDataURL(type, q); }
    return url;
  }

  /* ---------------- Categories ---------------- */
  function viewCategories() {
    return `<div class="panel">
      <h2>Categories <small>shown as tabs and cards on the shop</small></h2>
      <table class="vtable" id="catTable"><thead><tr><th>Name (English)</th><th>Name (Telugu)</th><th>Short line</th><th>Photo link</th><th>Order</th><th>Products</th><th></th></tr></thead><tbody>
        ${A.categories.map((c, i) => { const n = A.products.filter((p) => p.category === c.id).length; return `<tr data-ci="${i}" data-id="${esc(c.id)}">
          <td><input data-c="name" value="${esc(c.name)}"></td><td><input data-c="te" value="${esc(c.te || "")}" style="font-family:var(--te)"></td>
          <td><input data-c="blurb" value="${esc(c.blurb || "")}"></td><td><input data-c="image" value="${esc(c.image || "")}" placeholder="https://"></td><td style="width:80px"><input data-c="sort" type="number" value="${esc(c.sort || i + 1)}"></td>
          <td style="text-align:center">${n}</td><td><button class="btn btn-ghost btn-sm" data-cdel="${i}" ${n ? "disabled title='Move or delete its products first'" : ""}>Remove</button></td></tr>`; }).join("")}
      </tbody></table>
      <div style="display:flex;gap:10px;margin-top:14px"><button class="btn btn-ghost" id="catAdd">+ Add category</button><span class="spacer"></span><button class="btn btn-primary" id="catSave">Save categories</button></div>
      <p class="muted" style="font-size:13px;margin-top:12px">Example: add "Podis · పొడులు" or "Sweets · స్వీట్లు" when you start selling them.</p>
    </div>`;
  }
  function readCategories() {
    return $$("#catTable tbody tr").map((tr, i) => {
      const g = (k) => $(`[data-c="${k}"]`, tr).value.trim();
      return { id: tr.dataset.id || slug(g("name")), name: g("name"), te: g("te"), blurb: g("blurb"), image: g("image"), sort: Number(g("sort")) || i + 1 };
    }).filter((c) => c.name);
  }

  /* ---------------- Reviews ---------------- */
  function viewReviews() {
    return `<div class="banner" style="background:#F5F1E8;border-color:var(--line)"><span>Add only <b>real</b> reviews from your customers (from WhatsApp messages, Google reviews, or your shop). Reviews appear on the homepage when "Show on site" is ticked.</span><button class="btn btn-primary" id="rAdd">+ Add review</button></div>
      ${A.reviews.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Review</th><th>Rating</th><th>Shown</th><th></th></tr></thead><tbody>
        ${A.reviews.map((r) => `<tr><td><b>${esc(r.name)}</b><div class="muted" style="font-size:12.5px">${esc(r.city || "")}</div></td><td style="max-width:420px">${esc(r.text)}</td><td>${"★".repeat(Number(r.rating) || 5)}</td>
          <td><label class="toggle"><input type="checkbox" data-rvis="${esc(r.id)}" ${r.visible ? "checked" : ""}></label></td>
          <td><div class="row-actions"><button class="btn btn-ghost btn-sm" data-redit="${esc(r.id)}">Edit</button><button class="btn btn-danger btn-sm" data-rdel="${esc(r.id)}">Delete</button></div></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty-state">No reviews yet.</p>`}`;
  }
  function reviewModal(r) {
    r = r || { name: "", city: "", rating: 5, text: "", visible: true };
    openModal(`<div class="am-head"><h2>${r.id ? "Edit review" : "Add review"}</h2><button class="icon-btn" data-mclose aria-label="Close">✕</button></div>
      <form class="am-body" id="rForm" data-id="${esc(r.id || "")}">
        <div class="grid3"><div class="field"><label>Customer name</label><input name="name" required value="${esc(r.name)}" placeholder="Lakshmi R."></div>
        <div class="field"><label>City</label><input name="city" value="${esc(r.city || "")}" placeholder="Hyderabad"></div>
        <div class="field"><label>Rating</label><select name="rating">${[5, 4, 3, 2, 1].map((n) => `<option ${Number(r.rating) === n ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
        <div class="field" style="margin-top:12px"><label>Review</label><textarea name="text" rows="4" required>${esc(r.text)}</textarea></div>
        <label class="check" style="margin-top:12px"><input type="checkbox" name="visible" ${r.visible ? "checked" : ""}> Show on site</label>
      </form>
      <div class="am-foot"><button class="btn btn-ghost" data-mclose>Cancel</button><button class="btn btn-primary" id="rSave">Save review</button></div>`);
  }

  /* ---------------- Settings ---------------- */
  function viewSettings() {
    const s = A.settings;
    const f = (k, label, hint = "", attrs = "") => `<div class="field"><label for="s_${k}">${label}</label><input id="s_${k}" name="${k}" value="${esc(s[k] ?? "")}" ${attrs}>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
    const t = (k, label, hint = "") => `<div class="field"><label for="s_${k}">${label}</label><textarea id="s_${k}" name="${k}" rows="2">${esc(s[k] ?? "")}</textarea>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
    return `<form id="sForm">
      <div class="panel">
        <h2>Online orders</h2>
        <label class="toggle"><input type="checkbox" name="storeOpen" ${s.storeOpen ? "checked" : ""}> Accept online orders with UPI payment</label>
        <p class="muted" style="font-size:13.5px;margin:10px 0 0">When off, customers can still browse and send their cart to you on WhatsApp. Turn on after you add your UPI ID and real prices.</p>
      </div>
      <div class="panel">
        <h2>UPI payment <small>₹0 fees — money goes straight to your bank</small></h2>
        <div class="two">
          <div>
            ${f("upiId", "Your UPI ID", "Best: a free merchant UPI ID from PhonePe Business, Google Pay for Business or Paytm for Business, linked to your bank account. Example: smlfoods@ybl", 'placeholder="yourname@bank"')}
            <div style="margin-top:12px">${f("upiPayee", "Name shown in UPI app")}</div>
          </div>
          <div><p class="muted" style="font-size:13px;margin:0 0 6px">Test QR for ₹1 (scan with your phone to check the UPI ID works):</p><div class="qr qr-preview" id="testQr"></div></div>
        </div>
      </div>
      <div class="panel">
        <h2>Contact & legal</h2>
        <div class="grid2">
          ${f("whatsapp", "WhatsApp number", "10-digit mobile. Used for order messages and the WhatsApp buttons.", 'inputmode="numeric"')}
          ${f("phone", "Phone (shown on site)")}
          ${f("email", "Email")}
          ${f("address", "Kitchen / shop address")}
          ${f("fssai", "FSSAI licence / registration no.", "Required by law on food sale websites.")}
          ${f("gstin", "GSTIN (if registered)")}
        </div>
      </div>
      <div class="panel">
        <h2>Delivery</h2>
        <div class="grid3">
          ${f("deliveryFee", "Delivery charge ₹", "", 'type="number" min="0"')}
          ${f("freeDeliveryAbove", "Free delivery above ₹", "0 = never free", 'type="number" min="0"')}
          ${f("minOrder", "Minimum order ₹", "0 = no minimum", 'type="number" min="0"')}
        </div>
        <div class="grid2" style="margin-top:12px">
          ${f("serviceablePincodes", "Deliver to pincodes starting with", "Comma separated. 50 = Telangana, 51/52/53 = Andhra Pradesh. Leave empty for all India.")}
          ${f("localPincodes", "Fresh items (paneer) only to pincodes starting with", "Example: 533 (Konaseema / East Godavari), 500 (Hyderabad).")}
        </div>
        <div style="margin-top:12px">${f("dispatchNote", "Dispatch note (shown on homepage)")}</div>
      </div>
      <div class="panel">
        <h2>Homepage text</h2>
        <div class="grid2">
          ${f("announcement", "Top announcement bar", "Leave empty to hide.")}
          ${f("heroTitleTe", "Headline (Telugu)", "", 'style="font-family:var(--te)"')}
          ${f("heroTitle", "Headline (English)")}
          ${t("heroText", "Intro line")}
        </div>
        <p class="section-label">Homepage photos <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:400">(paste an image link — Unsplash links are resized automatically)</span></p>
        <div class="grid2">
          ${f("heroImage", "Top banner photo")}
        </div>
      </div>
      <div class="panel">
        <h2>Social links</h2>
        <div class="grid3">${f("instagram", "Instagram URL")}${f("facebook", "Facebook URL")}${f("youtube", "YouTube URL")}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:12px"><button class="btn btn-primary btn-lg" id="sSave">Save settings</button></div>
    </form>`;
  }
  function afterSettings() {
    const draw = (tries = 0) => {
      const box = $("#testQr");
      if (!box) return;
      const id = $("#s_upiId").value.trim();
      if (!id) { box.innerHTML = `<span class="muted" style="font-size:12px;text-align:center">Enter UPI ID</span>`; return; }
      if (!window.qrcode) { if (tries < 20) setTimeout(() => draw(tries + 1), 250); return; }
      const q = window.qrcode(0, "M");
      q.addData(upiLink({ upiId: id, upiPayee: $("#s_upiPayee").value }, 1, "SML-TEST"));
      q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    };
    draw();
    $("#s_upiId").addEventListener("input", () => draw());
  }
  async function saveSettings() {
    const f = $("#sForm");
    const num = ["deliveryFee", "freeDeliveryAbove", "minOrder"];
    const data = {};
    Object.keys(DEFAULT_SETTINGS).forEach((k) => {
      const el = f.elements[k];
      if (!el) return;
      data[k] = el.type === "checkbox" ? el.checked : num.includes(k) ? Number(el.value) || 0 : el.value.trim();
    });
    data.whatsapp = digits(data.whatsapp).slice(-10);
    if (data.upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(data.upiId)) { alert("UPI ID looks wrong. It should look like name@bank"); return; }
    if (data.storeOpen && !data.upiId) { alert("Add your UPI ID before opening the store for online orders."); return; }
    $("#sSave").disabled = true;
    try { await d.collection("settings").doc("store").set(data, { merge: true }); toast("Settings saved"); }
    catch (e) { alert("Could not save: " + e.message); }
    $("#sSave").disabled = false;
  }

  /* ---------------- Modal + toast ---------------- */
  function openModal(html) { $("#aModalBody").innerHTML = html; $("#aModal").hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { $("#aModal").hidden = true; document.body.style.overflow = ""; A.openOrder = null; A.editing = false; draft = null; render(); }
  let tt;
  function toast(m) { const el = $("#toast"); el.textContent = m; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2600); }

  /* ---------------- Events ---------------- */
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("button, a, tr[data-order], label.img-add");
    if (!t) return;
    const ds = t.dataset;
    if (ds.mclose !== undefined) { if (!A.editing || confirm("Close without saving?")) closeModal(); return; }
    if (t.id === "seedBtn") { seed().catch((er) => alert(er.message)); return; }
    if (ds.go) { go(ds.go); return; }
    if (ds.gotoOrders) { A.orderFilter = ds.gotoOrders; go("orders"); return; }
    if (ds.order) { const o = A.orders.find((x) => x.id === ds.order); if (o) orderModal(o); return; }
    if (ds.ofilter) { A.orderFilter = ds.ofilter; render(); return; }
    if (t.id === "exportCsv") { exportCsv(); return; }
    if (ds.ostatus) { const o = A.orders.find((x) => x.id === A.openOrder); if (o) await setOrderStatus(o, ds.ostatus); return; }
    if (t.id === "saveShip") {
      const o = A.orders.find((x) => x.id === A.openOrder);
      await d.collection("orders").doc(o.id).update({ shipping: { courier: $("#shCourier").value.trim(), tracking: $("#shTracking").value.trim(), url: $("#shUrl").value.trim() }, adminNote: $("#shNote").value.trim(), updatedAt: FV.serverTimestamp() });
      toast("Saved"); return;
    }
    if (t.id === "printSlipBtn") { printSlip(A.orders.find((x) => x.id === A.openOrder)); return; }
    if (ds.copy) { navigator.clipboard && navigator.clipboard.writeText(ds.copy).then(() => toast("Copied")); return; }

    if (ds.pfilter) { A.productFilter = ds.pfilter; render(); return; }
    if (ds.edit !== undefined) { productModal(ds.edit || null); return; }
    if (ds.dup) { productModal(null, ds.dup); return; }
    if (t.id === "vAdd") { readProductForm(); draft.variants.push({ id: "", label: "", price: 0, mrp: null, stock: null, inStock: true }); renderProductModal(); return; }
    if (ds.vdel) { readProductForm(); draft.variants.splice(Number(ds.vdel), 1); renderProductModal(); return; }
    if (ds.idel) { readProductForm(); draft.images.splice(Number(ds.idel), 1); renderProductModal(); return; }
    if (ds.imove) { readProductForm(); const i = Number(ds.imove); const [x] = draft.images.splice(i, 1); draft.images.splice(i - 1, 0, x); renderProductModal(); return; }
    if (t.id === "imgUrlAdd") { const u = $("#imgUrl").value.trim(); if (!/^https?:\/\//.test(u)) { alert("Paste a full link starting with https://"); return; } readProductForm(); draft.images.push(u); renderProductModal(); return; }
    if (t.id === "pSave") { saveProduct(); return; }
    if (t.id === "pDelete") {
      if (!confirm(`Delete "${draft.nameEn}" permanently? (Tip: set status to Hidden instead to keep it.)`)) return;
      await d.collection("products").doc(draft.id).delete(); toast("Deleted"); closeModal(); return;
    }

    if (t.id === "catAdd") { A.categories = readCategories(); A.categories.push({ id: "", name: "", te: "", blurb: "", image: "", sort: A.categories.length + 1 }); A.editing = false; render(); $$("#catTable tbody tr").pop().querySelector("input").focus(); A.editing = true; return; }
    if (ds.cdel) { A.categories = readCategories(); A.categories.splice(Number(ds.cdel), 1); render(); A.editing = true; return; }
    if (t.id === "catSave") {
      const list = readCategories();
      const ids = list.map((c) => c.id);
      if (new Set(ids).size !== ids.length) { alert("Two categories have the same name."); return; }
      await d.collection("settings").doc("categories").set({ list }); A.editing = false; toast("Categories saved"); return;
    }

    if (t.id === "rAdd") { reviewModal(); return; }
    if (ds.redit) { reviewModal(A.reviews.find((r) => r.id === ds.redit)); return; }
    if (ds.rdel) { if (confirm("Delete this review?")) await d.collection("reviews").doc(ds.rdel).delete(); return; }
    if (t.id === "rSave") {
      const f = $("#rForm");
      const data = { name: f.elements.name.value.trim(), city: f.elements.city.value.trim(), rating: Number(f.elements.rating.value), text: f.elements.text.value.trim(), visible: f.elements.visible.checked };
      if (!data.name || !data.text) { alert("Enter the customer's name and review."); return; }
      const id = f.dataset.id;
      if (id) await d.collection("reviews").doc(id).update(data);
      else await d.collection("reviews").add({ ...data, createdAtMs: Date.now() });
      toast("Review saved"); closeModal(); return;
    }
    if (t.id === "sSave") { e.preventDefault(); saveSettings(); return; }
  });

  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "imgFile") {
      readProductForm();
      const files = Array.from(t.files || []).slice(0, 4 - draft.images.length);
      toast("Compressing photo…");
      for (const file of files) {
        try { draft.images.push(await compressImage(file)); } catch (er) { alert("Could not read that image: " + er.message); }
      }
      renderProductModal();
    }
    if (t.dataset.rvis) await d.collection("reviews").doc(t.dataset.rvis).update({ visible: t.checked });
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "oSearch") {
      A.orderQuery = e.target.value; const pos = e.target.selectionStart; render(); const el = $("#oSearch"); el.focus(); el.setSelectionRange(pos, pos);
    }
    if (e.target.closest("#catTable")) A.editing = true;
  });
  document.addEventListener("submit", (e) => { if (e.target.id === "sForm") { e.preventDefault(); saveSettings(); } if (e.target.id === "pForm" || e.target.id === "rForm") e.preventDefault(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#aModal").hidden && (!A.editing || confirm("Close without saving?"))) closeModal(); });
})();
