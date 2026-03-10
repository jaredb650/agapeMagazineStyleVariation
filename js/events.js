function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) closeNav();
  });
}

function revealFallback() {
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    node.style.opacity = "1";
    node.style.transform = "none";
  });
}

function initAnimations() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion()) {
    revealFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const heroBackdrop = document.querySelector(".events-hero__backdrop-img");

  if (heroBackdrop) {
    gsap.fromTo(
      heroBackdrop,
      { scale: 1.08 },
      { scale: 1, duration: 1.6, ease: "power2.out" }
    );

    gsap.to(heroBackdrop, {
      y: 70,
      ease: "none",
      scrollTrigger: {
        trigger: ".events-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  document.querySelectorAll("[data-reveal]").forEach((node) => {
    gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: node,
        start: "top 88%",
      },
    });
  });

  document.querySelectorAll("[data-lift]").forEach((sheet) => {
    gsap.from(sheet, {
      rotateX: -6,
      y: 42,
      opacity: 0.64,
      duration: 1,
      ease: "power3.out",
      transformPerspective: 1100,
      transformOrigin: "bottom center",
      scrollTrigger: {
        trigger: sheet,
        start: "top 84%",
      },
    });
  });

  document.querySelectorAll("[data-featured-card]").forEach((card, index) => {
    gsap.from(card, {
      y: 54,
      rotateZ: index % 2 === 0 ? -1 : 1,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 86%",
      },
    });
  });

  document.querySelectorAll("[data-ledger-row]").forEach((row, index) => {
    gsap.from(row, {
      x: index % 2 === 0 ? -36 : 36,
      opacity: 0,
      duration: 0.65,
      ease: "power2.out",
      scrollTrigger: {
        trigger: row,
        start: "top 92%",
      },
    });
  });

  const footerColumns = document.querySelectorAll(".events-footer__columns > div");

  if (footerColumns.length) {
    gsap.from(footerColumns, {
      y: 36,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".folio--events-footer",
        start: "top 86%",
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initAnimations();
});
