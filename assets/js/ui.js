/* SML Foods — homepage motion: hero slider, header on scroll, moving strips, parallax. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: solid + compact after scrolling ---------- */
  const header = $("#header");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", scrollY > 40);
    const bg = $("#storyImg");
    if (bg && !calm) {
      const r = bg.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) bg.style.transform = `translate3d(0, ${(r.top * -0.18).toFixed(1)}px, 0) scale(1.15)`;
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Moving strips: repeat content so the loop is seamless ---------- */
  $$(".ticker-track, .words-track").forEach((t) => { t.innerHTML = t.innerHTML + t.innerHTML; });

  /* ---------- Hero slider ---------- */
  const hero = $("#hero");
  if (!hero) return;
  const slides = $$(".slide", hero);
  const dots = $$("#heroDots button");
  const DELAY = 6500;
  let at = 0, timer = null, paused = false;

  function show(i) {
    at = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("is-on", k === at); s.setAttribute("aria-hidden", k === at ? "false" : "true"); });
    dots.forEach((d, k) => { d.setAttribute("aria-selected", k === at); d.classList.remove("run"); });
    if (!calm && !paused) { void dots[at].offsetWidth; dots[at].classList.add("run"); }
    restart();
  }
  function restart() {
    clearTimeout(timer);
    if (!calm && !paused) timer = setTimeout(() => show(at + 1), DELAY);
  }
  $("#heroPrev").addEventListener("click", () => show(at - 1));
  $("#heroNext").addEventListener("click", () => show(at + 1));
  dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
  hero.addEventListener("mouseenter", () => { paused = true; clearTimeout(timer); dots[at].classList.remove("run"); });
  hero.addEventListener("mouseleave", () => { paused = false; show(at); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else restart(); });

  // swipe on phones
  let x0 = null;
  hero.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(at + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  show(0);
})();
