/* ═══════════════════════════════════════════════
   AGAPE — Magazine Page-Turn System
   Bidirectional: works scrolling up AND down.
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

/* ─── FALLBACK ─── */
function fallback() {
  document.querySelectorAll("[data-reveal]").forEach((n) => {
    n.style.opacity = "1";
    n.style.transform = "none";
  });
}

/* ═══════════════════════════════════════════════
   MAGAZINE SYSTEM
   ═══════════════════════════════════════════════ */
function initMagazine() {
  if (!window.gsap || !window.ScrollTrigger || REDUCED()) {
    fallback();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // ── Inject fold corners + page numbers ──
  document.querySelectorAll(".folio[data-page]").forEach((page) => {
    const fold = document.createElement("div");
    fold.className = "folio__fold";
    page.appendChild(fold);

    const shadow = document.createElement("div");
    shadow.className = "folio__fold-shadow";
    page.appendChild(shadow);

    const num = document.createElement("div");
    num.className = "folio__page-num";
    num.textContent = "pg. " + page.dataset.page;
    page.appendChild(num);
  });

  // ── HERO ──
  const heroImg = document.querySelector(".hero-folio__backdrop-img");
  if (heroImg) {
    gsap.fromTo(heroImg, { scale: 1.12 }, { scale: 1, duration: 2, ease: "power2.out" });

    // Parallax
    gsap.to(heroImg, {
      y: 100, ease: "none",
      scrollTrigger: {
        trigger: ".hero-folio",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Hero fades as you scroll down — NO pin, just scrubbed opacity/scale
  const hero = document.querySelector(".hero-folio");
  if (hero) {
    gsap.to(hero, {
      scale: 0.93,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // ── TEXT REVEALS — use toggleActions so they reverse on scroll up ──
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    gsap.fromTo(node,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: {
          trigger: node,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  // ── PAGE-TURN: each folio peels as it scrolls out of view ──
  const pages = gsap.utils.toArray(".folio[data-page]");

  pages.forEach((page, i) => {
    const isLast = i === pages.length - 1;
    const fold = page.querySelector(".folio__fold");
    const shadow = page.querySelector(".folio__fold-shadow");

    if (isLast) return;

    // Peel timeline — scrubbed, naturally reverses on scroll up
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: page,
        start: "bottom 85%",
        end: "bottom 15%",
        scrub: 0.3,
      },
    });

    // Page lifts and fades
    tl.to(page, {
      yPercent: -4,
      scale: 0.97,
      opacity: 0.2,
      ease: "none",
    }, 0);

    // Fold corner scales up from nothing
    if (fold) {
      tl.fromTo(fold,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, ease: "power2.out" },
        0
      );
    }

    // Shadow appears under fold
    if (shadow) {
      tl.fromTo(shadow,
        { opacity: 0 },
        { opacity: 0.6, ease: "none" },
        0
      );
    }
  });

  // ── RESIDENT CARDS — toggleActions for reversibility ──
  document.querySelectorAll("[data-feature]").forEach((card) => {
    gsap.fromTo(card,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: {
          trigger: card, start: "top 86%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  // ── TICKET STUBS ──
  document.querySelectorAll("[data-ticket]").forEach((ticket, i) => {
    gsap.fromTo(ticket,
      { x: i % 2 === 0 ? -50 : 50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.75, ease: "power2.out",
        scrollTrigger: {
          trigger: ticket, start: "top 90%",
          toggleActions: "play none none reverse",
        },
      }
    );
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

  // ── PAGE NUMBER FADE ──
  document.querySelectorAll(".folio__page-num").forEach((num) => {
    gsap.fromTo(num,
      { opacity: 0, x: 20 },
      {
        opacity: 1, x: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: {
          trigger: num.closest(".folio"),
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });
}

/* ─── BOOT ─── */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  await runPreloader();
  initMagazine();
});
