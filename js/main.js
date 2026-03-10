/* ═══════════════════════════════════════════════
   AGAPE — Magazine Page-Turn Animation System
   Each folio section = a magazine page.
   Scroll peels pages away to reveal the next.
   ═══════════════════════════════════════════════ */

const PRELOADER_KEY = "agape_issue_visited";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ─── NAV ─── */
function initNav() {
  const nav = document.getElementById("floatingNav");
  const trigger = document.getElementById("navTrigger");
  const links = document.querySelectorAll("[data-nav-link]");
  if (!nav || !trigger) return;

  const closeNav = () => {
    nav.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => {
    const nextOpen = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", nextOpen);
    trigger.setAttribute("aria-expanded", String(nextOpen));
  });

  links.forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) closeNav();
  });
}

/* ─── PRELOADER ─── */
function runPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader || sessionStorage.getItem(PRELOADER_KEY) || prefersReducedMotion()) {
    if (preloader) preloader.classList.add("is-hidden");
    document.body.classList.remove("is-locked");
    return Promise.resolve();
  }

  document.body.classList.add("is-locked");

  if (!window.gsap) {
    sessionStorage.setItem(PRELOADER_KEY, "1");
    preloader.classList.add("is-hidden");
    document.body.classList.remove("is-locked");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        sessionStorage.setItem(PRELOADER_KEY, "1");
        preloader.classList.add("is-hidden");
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
      .to(preloader, { opacity: 0, duration: 0.35 }, 2.1);
  });
}

/* ─── FALLBACK ─── */
function revealFallback() {
  document.querySelectorAll("[data-reveal]").forEach((n) => {
    n.style.opacity = "1";
    n.style.transform = "none";
  });
  document.querySelectorAll(".folio__fold").forEach((f) => f.remove());
}

/* ═══════════════════════════════════════════════
   MAGAZINE PAGE-TURN SYSTEM
   ═══════════════════════════════════════════════ */

function injectFoldElements() {
  // Add fold corner + shadow elements to each folio page
  document.querySelectorAll(".folio[data-page]").forEach((folio) => {
    const fold = document.createElement("div");
    fold.className = "folio__fold";
    fold.innerHTML = `
      <div class="folio__fold-corner"></div>
      <div class="folio__fold-shadow"></div>
      <div class="folio__fold-underside"></div>
    `;
    folio.appendChild(fold);

    // Page number indicator
    const pageNum = document.createElement("div");
    pageNum.className = "folio__page-num";
    pageNum.textContent = folio.dataset.page;
    folio.appendChild(pageNum);
  });
}

function initMagazineSystem() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion()) {
    revealFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Inject fold elements into each folio
  injectFoldElements();

  // ── Hero intro animation ──
  const heroBackdrop = document.querySelector(".hero-folio__backdrop-img");
  if (heroBackdrop) {
    gsap.fromTo(heroBackdrop, { scale: 1.12 }, {
      scale: 1, duration: 2, ease: "power2.out",
    });
  }

  // ── Reveal animations (text, elements fade in) ──
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: node, start: "top 88%" },
    });
  });

  // ── PAGE-TURN SCROLL SYSTEM ──
  // Each .folio section gets pinned and peels away
  const pages = gsap.utils.toArray(".folio[data-page]");

  pages.forEach((page, i) => {
    const fold = page.querySelector(".folio__fold");
    const foldCorner = page.querySelector(".folio__fold-corner");
    const foldShadow = page.querySelector(".folio__fold-shadow");
    const foldUnderside = page.querySelector(".folio__fold-underside");
    const isLast = i === pages.length - 1;

    // Pin each page during its scroll-through
    ScrollTrigger.create({
      trigger: page,
      start: "top top",
      end: isLast ? "bottom bottom" : `+=${window.innerHeight * 1.2}`,
      pin: !isLast,
      pinSpacing: true,
    });

    if (isLast) return; // Last page doesn't peel

    // Page-peel timeline: as you scroll, the page lifts from bottom-right
    const peelTL = gsap.timeline({
      scrollTrigger: {
        trigger: page,
        start: "bottom bottom",
        end: `+=${window.innerHeight * 0.9}`,
        scrub: 0.6,
        onUpdate: (self) => {
          // Dynamic shadow intensity based on peel progress
          const p = self.progress;
          if (foldShadow) {
            foldShadow.style.opacity = p < 0.1 ? p * 10 : p > 0.8 ? (1 - p) * 5 : 1;
          }
        },
      },
    });

    // The page itself lifts and rotates like turning a page
    peelTL
      .to(page, {
        rotateX: -4,
        rotateY: 3,
        y: "-8%",
        scale: 0.94,
        opacity: 0.3,
        transformPerspective: 1200,
        transformOrigin: "top center",
        ease: "power2.in",
      }, 0)
      // Fold corner peels in from bottom-right
      .fromTo(fold, {
        opacity: 0,
        scale: 0,
      }, {
        opacity: 1,
        scale: 1,
        ease: "power2.out",
      }, 0)
      // Corner triangle grows
      .fromTo(foldCorner, {
        "--fold-size": "0px",
      }, {
        "--fold-size": "180px",
        ease: "power3.out",
      }, 0)
      // The underside (lighter paper) reveals
      .fromTo(foldUnderside, {
        "--fold-size": "0px",
        opacity: 0,
      }, {
        "--fold-size": "160px",
        opacity: 1,
        ease: "power3.out",
      }, 0.05);
  });

  // ── HERO PARALLAX ──
  // Hero backdrop drifts up as you scroll
  if (heroBackdrop) {
    gsap.to(heroBackdrop, {
      y: 100,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-folio",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  // ── HERO PAGE PEEL ──
  // The hero section peels away differently — full cinematic lift
  const hero = document.querySelector(".hero-folio");
  if (hero) {
    gsap.to(hero, {
      rotateX: -8,
      y: "-15%",
      scale: 0.88,
      opacity: 0,
      transformPerspective: 1000,
      transformOrigin: "top center",
      ease: "power2.in",
      scrollTrigger: {
        trigger: hero,
        start: "80% center",
        end: "bottom top",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });
  }

  // ── INNER ELEMENT ANIMATIONS ──
  // Resident cards stagger in
  document.querySelectorAll("[data-feature]").forEach((card, i) => {
    gsap.from(card, {
      y: 60,
      rotateZ: i % 2 === 0 ? -1 : 1,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 86%" },
    });
  });

  // Ticket stubs slide in from sides
  document.querySelectorAll("[data-ticket]").forEach((ticket, i) => {
    gsap.from(ticket, {
      x: i % 2 === 0 ? -60 : 60,
      rotateZ: i % 2 === 0 ? -2 : 2,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      scrollTrigger: { trigger: ticket, start: "top 90%" },
    });
  });

  // Parallax images
  document.querySelectorAll("[data-parallax]").forEach((img) => {
    gsap.to(img, {
      y: -50,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  // ── ARCHIVE HORIZONTAL SCROLL ──
  const archiveTrack = document.querySelector(".archive-panorama__track");
  const archiveWrap = document.getElementById("archivePanorama");
  if (archiveTrack && archiveWrap) {
    const dist = () => Math.max(archiveTrack.scrollWidth - window.innerWidth + 90, 0);
    gsap.to(archiveTrack, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: archiveWrap,
        start: "top 66%",
        end: () => `+=${dist()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  // ── PAGE NUMBER FADE ──
  document.querySelectorAll(".folio__page-num").forEach((num) => {
    gsap.from(num, {
      opacity: 0,
      x: 20,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: num.closest(".folio"), start: "top 70%" },
    });
  });
}

/* ─── BOOT ─── */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  await runPreloader();
  initMagazineSystem();
});
