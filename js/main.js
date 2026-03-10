/* ═══════════════════════════════════════════════
   AGAPE — Magazine Page-Turn System
   Clean implementation: no conflicting transforms,
   no overlapping pins. Each page peels on scroll.
   ═══════════════════════════════════════════════ */

const PRELOADER_KEY = "agape_issue_visited";
const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── NAV ─── */
function initNav() {
  const nav = document.getElementById("floatingNav");
  const trigger = document.getElementById("navTrigger");
  if (!nav || !trigger) return;

  const close = () => {
    nav.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("[data-nav-link]").forEach((l) =>
    l.addEventListener("click", close)
  );
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) close();
  });
}

/* ─── PRELOADER ─── */
function runPreloader() {
  const el = document.getElementById("preloader");
  if (!el || sessionStorage.getItem(PRELOADER_KEY) || REDUCED()) {
    if (el) el.classList.add("is-hidden");
    document.body.classList.remove("is-locked");
    return Promise.resolve();
  }
  document.body.classList.add("is-locked");
  if (!window.gsap) {
    sessionStorage.setItem(PRELOADER_KEY, "1");
    el.classList.add("is-hidden");
    document.body.classList.remove("is-locked");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        sessionStorage.setItem(PRELOADER_KEY, "1");
        el.classList.add("is-hidden");
        document.body.classList.remove("is-locked");
        resolve();
      },
    });
    tl.from(".preloader__sheet", { y: 40, opacity: 0, duration: 0.7 })
      .from(".preloader__registration span", { y: 14, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.15)
      .from(".preloader__logo", { scale: 0.92, opacity: 0, duration: 0.55 }, 0.25)
      .from(".preloader__title", { yPercent: 100, opacity: 0, duration: 0.8 }, 0.3)
      .from(".preloader__subtitle", { y: 14, opacity: 0, duration: 0.45 }, 0.65)
      .to(".preloader__meter-fill", { width: "100%", duration: 1 }, 0.65)
      .to(".preloader__sheet", { yPercent: -115, duration: 0.95, ease: "power2.inOut" }, 1.85)
      .to(el, { opacity: 0, duration: 0.35 }, 2.1);
  });
}

/* ─── FALLBACK (no GSAP or reduced motion) ─── */
function fallback() {
  document.querySelectorAll("[data-reveal]").forEach((n) => {
    n.style.opacity = "1";
    n.style.transform = "none";
  });
}

/* ═══════════════════════════════════════════════
   MAGAZINE ANIMATION SYSTEM
   ═══════════════════════════════════════════════ */
function initMagazine() {
  if (!window.gsap || !window.ScrollTrigger || REDUCED()) {
    fallback();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // ── Inject fold corners + page numbers into each [data-page] ──
  document.querySelectorAll(".folio[data-page]").forEach((page) => {
    // Fold corner element
    const fold = document.createElement("div");
    fold.className = "folio__fold";
    fold.innerHTML = '<div class="folio__fold-corner"></div><div class="folio__fold-shadow"></div>';
    page.appendChild(fold);

    // Page number
    const num = document.createElement("div");
    num.className = "folio__page-num";
    num.textContent = "pg. " + page.dataset.page;
    page.appendChild(num);
  });

  // ── HERO SECTION ──
  const heroImg = document.querySelector(".hero-folio__backdrop-img");
  if (heroImg) {
    // Intro zoom
    gsap.fromTo(heroImg, { scale: 1.12 }, { scale: 1, duration: 2, ease: "power2.out" });
    // Parallax drift
    gsap.to(heroImg, {
      y: 100,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-folio",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Hero peel-away: pin the hero, then peel it up like lifting a cover
  const hero = document.querySelector(".hero-folio");
  if (hero) {
    const heroTL = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=80%",
        scrub: 0.4,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });
    heroTL.to(hero, {
      yPercent: -12,
      scale: 0.92,
      opacity: 0,
      ease: "power1.in",
    });
  }

  // ── TEXT REVEALS ──
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    gsap.to(node, {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: node, start: "top 88%" },
    });
  });

  // ── FOLIO PAGE-TURN SYSTEM ──
  const pages = gsap.utils.toArray(".folio[data-page]");

  pages.forEach((page, i) => {
    const isLast = i === pages.length - 1;
    const fold = page.querySelector(".folio__fold");
    const foldCorner = page.querySelector(".folio__fold-corner");
    const foldShadow = page.querySelector(".folio__fold-shadow");

    if (isLast) return; // Last page (footer) doesn't peel

    // Create a timeline that peels this page away
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: page,
        start: "bottom 90%",
        end: "bottom 10%",
        scrub: 0.5,
      },
    });

    // Page lifts up and fades — simple Y + opacity, no conflicting rotations
    tl.to(page, {
      yPercent: -6,
      scale: 0.96,
      opacity: 0.15,
      ease: "power2.in",
    }, 0);

    // Fold corner grows from 0 to full size
    if (foldCorner) {
      tl.fromTo(foldCorner,
        { "--fold-size": "0px" },
        { "--fold-size": "140px", ease: "power2.out" },
        0
      );
    }

    // Fold shadow fades in then out
    if (foldShadow) {
      tl.fromTo(foldShadow,
        { opacity: 0 },
        { opacity: 0.8, ease: "power1.out", duration: 0.5 },
        0
      );
      tl.to(foldShadow,
        { opacity: 0, ease: "power1.in", duration: 0.5 },
        0.5
      );
    }
  });

  // ── RESIDENT CARDS ──
  document.querySelectorAll("[data-feature]").forEach((card, i) => {
    gsap.from(card, {
      y: 50, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 86%" },
    });
  });

  // ── TICKET STUBS ──
  document.querySelectorAll("[data-ticket]").forEach((ticket, i) => {
    gsap.from(ticket, {
      x: i % 2 === 0 ? -50 : 50,
      opacity: 0, duration: 0.75, ease: "power2.out",
      scrollTrigger: { trigger: ticket, start: "top 90%" },
    });
  });

  // ── PARALLAX IMAGES ──
  document.querySelectorAll("[data-parallax]").forEach((img) => {
    gsap.to(img, {
      y: -50, ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  // ── ARCHIVE HORIZONTAL SCROLL ──
  const track = document.querySelector(".archive-panorama__track");
  const wrap = document.getElementById("archivePanorama");
  if (track && wrap) {
    const dist = () => Math.max(track.scrollWidth - window.innerWidth + 90, 0);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top 66%",
        end: () => `+=${dist()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  // ── PAGE NUMBERS FADE IN ──
  document.querySelectorAll(".folio__page-num").forEach((num) => {
    gsap.from(num, {
      opacity: 0, x: 20, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: num.closest(".folio"), start: "top 70%" },
    });
  });
}

/* ─── BOOT ─── */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  await runPreloader();
  initMagazine();
});
