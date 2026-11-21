/* SML Foods — order tracking page (order.html?id=<orderId>) */
(async function () {
  const { esc, inr, qtyText, STATUS, FLOW, db, waLink, loadStore, withTimeout } = window.SML;
  const out = document.getElementById("out");
  const id = new URLSearchParams(location.search).get("id");
  const store = await loadStore();
  const s = store.settings;

  const askForm = (msg = "") => {
    out.innerHTML = `
      <h1 style="font-family:var(--serif);font-size:36px;margin-bottom:12px">Track your order</h1>
      ${msg ? `<p class="note red">${esc(msg)}</p>` : ""}
      <p class="muted">Open the tracking link you received after placing your order, or paste it here.</p>
      <form id="f" class="field" style="margin:16px 0"><label for="oid">Tracking link or order ID</label><input id="oid" placeholder="https://…/order.html?id=…"><button class="btn btn-primary" style="margin-top:10px;justify-self:start">Track</button></form>
      ${s.whatsapp ? `<p>Lost your link? <a href="${waLink(s.whatsapp, "Hi SML Foods, I'd like to know the status of my order ")}" target="_blank" rel="noopener">Message us on WhatsApp</a> with your order number (SML-…).</p>` : ""}`;
    document.getElementById("f").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = document.getElementById("oid").value.trim();
      const m = v.match(/[?&]id=([A-Za-z0-9]+)/);
      const oid = m ? m[1] : v.replace(/[^A-Za-z0-9]/g, "");
      if (oid) location.search = "?id=" + encodeURIComponent(oid);
    });
  };

  if (!id) return askForm();
  const d = db();
  if (!d) return askForm("We couldn't connect right now. Please try again in a moment.");

  try {
    const snap = await withTimeout(d.collection("orders").doc(id).get(), 10000);
    if (!snap.exists) return askForm("We couldn't find that order. Please check the link.");
    const o = snap.data();
    const st = STATUS[o.status] || { label: o.status, tone: "", step: 0 };
    const placed = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
    const ship = o.shipping || {};
    out.innerHTML = `
      <p class="eyebrow">Order ${esc(o.orderNo)}</p>
      <h1 style="font-family:var(--serif);font-size:34px;margin-bottom:8px">Hi ${esc((o.customer && o.customer.name || "").split(" ")[0])}, here's your order</h1>
      <p><span class="pill ${st.tone}">${esc(st.label)}</span> ${st.te ? `<span class="te-inline muted" style="margin-left:6px">${esc(st.te)}</span>` : ""}</p>
      ${st.step ? `<ol class="timeline">${FLOW.map((k) => `<li class="${STATUS[k].step <= st.step ? "on" : ""}">${esc(STATUS[k].label)}</li>`).join("")}</ol>` : ""}
      ${o.status === "payment_failed" ? `<p class="note red">We could not find your payment for this order. Please contact us on WhatsApp with your payment screenshot.</p>` : ""}
      ${ship.courier || ship.tracking ? `<p class="note green">Shipped via <b>${esc(ship.courier || "courier")}</b>${ship.tracking ? ` · Tracking no. <b>${esc(ship.tracking)}</b>` : ""}${ship.url ? ` · <a href="${esc(ship.url)}" target="_blank" rel="noopener">Track shipment</a>` : ""}</p>` : ""}
      <div class="co-summary">
        <h3>Items</h3>
        ${(o.items || []).map((it) => `<div class="row"><span>${esc(it.name)} · ${esc(qtyText(it.variant, it.qty))}</span><span>${inr(it.lineTotal)}</span></div>`).join("")}
        <div class="row"><span>Delivery</span><span>${o.deliveryFee ? inr(o.deliveryFee) : "Free"}</span></div>
        <div class="row" style="font-weight:700;color:var(--ink)"><span>Total</span><span>${inr(o.total)}</span></div>
      </div>
      <p class="muted" style="font-size:14px">${placed ? `Placed on ${esc(placed)} · ` : ""}UPI ref ${esc(o.payment && o.payment.utr)}<br>Deliver to: ${esc(o.address && [o.address.line, o.address.city, o.address.state, o.address.pincode].join(", "))}</p>
      ${s.whatsapp ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(s.whatsapp, `Hi SML Foods, about my order ${o.orderNo}: `)}">Need help? WhatsApp us</a>` : ""}`;
  } catch (e) {
    console.error(e);
    askForm("We couldn't load this order right now. Please try again.");
  }
})();
