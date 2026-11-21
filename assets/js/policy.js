/* Fills contact details on policy pages from store settings */
(async function () {
  const { esc, waLink, digits, loadStore } = window.SML;
  const s = (await loadStore()).settings;
  document.querySelectorAll('[data-s="address"]').forEach((el) => (el.textContent = s.address || ""));
  const parts = [];
  if (s.whatsapp) parts.push(`WhatsApp: <a href="${waLink(s.whatsapp, "Hi SML Foods")}" target="_blank" rel="noopener">+91 ${esc(digits(s.whatsapp).slice(-10))}</a>`);
  if (s.phone) parts.push(`Phone: ${esc(s.phone)}`);
  if (s.email) parts.push(`Email: <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
  if (s.fssai) parts.push(`FSSAI Lic. No.: ${esc(s.fssai)}`);
  document.querySelectorAll('[data-s="contact"]').forEach((el) => (el.innerHTML = parts.join("<br>")));
})();
