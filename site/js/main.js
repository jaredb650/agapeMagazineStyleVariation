const PRELOADER_KEY = "agape_issue_visited";

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
    if (!nav.contains(event.target)) {
      closeNav();
    }
  });
}

function revealFallback() {
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    node.style.opacity = "1";
    node.style.transform = "none";
  });
}

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
    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        sessionStorage.setItem(PRELOADER_KEY, "1");
        preloader.classList.add("is-hidden");
        document.body.classList.remove("is-locked");
        resolve();
      },
    });

    timeline
      .from(".preloader__sheet", { y: 40, opacity: 0, duration: 0.7 })
      .from(".preloader__registration span", { y: 14, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.15)
      .from(".preloader__logo", { scale: 0.92, opacity: 0, duration: 0.55 }, 0.25)
      .from(".preloader__title", { yPercent: 100, opacity: 0, duration: 0.8 }, 0.3)
      .from(".preloader__subtitle", { y: 14, opacity: 0, duration: 0.45 }, 0.65)
      .to(".preloader__meter-fill", { width: "100%", duration: 1 }, 0.65)
      .to(".preloader__sheet", { yPercent: -115, duration: 0.95, ease: "power2.inOut" }, 1.85)
      .to(preloader, { opacity: 0, duration: 0.35 }, 2.1);
  });
}

function initAnimations() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion()) {
    revealFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const heroBackdrop = document.querySelector(".hero-folio__backdrop-img");

  if (heroBackdrop) {
    gsap.fromTo(
      heroBackdrop,
      { scale: 1.08 },
      {
        scale: 1,
        duration: 1.8,
        ease: "power2.out",
      }
    );

    gsap.to(heroBackdrop, {
      y: 80,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-folio",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  document.querySelectorAll("[data-reveal]").forEach((node, index) => {
    gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: index % 3 === 0 ? 0 : 0.05,
      ease: "power3.out",
      scrollTrigger: {
        trigger: node,
        start: "top 88%",
      },
    });
  });

  document.querySelectorAll("[data-lift]").forEach((folio) => {
    gsap.from(folio, {
      rotateX: -6,
      y: 50,
      opacity: 0.6,
      duration: 1,
      ease: "power3.out",
      transformPerspective: 1100,
      transformOrigin: "bottom center",
      scrollTrigger: {
        trigger: folio,
        start: "top 82%",
      },
    });
  });

  document.querySelectorAll("[data-feature]").forEach((feature, index) => {
    gsap.from(feature, {
      y: 56,
      rotateZ: index % 2 === 0 ? -0.8 : 0.8,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: feature,
        start: "top 86%",
      },
    });
  });

  document.querySelectorAll("[data-ticket]").forEach((ticket, index) => {
    gsap.from(ticket, {
      x: index % 2 === 0 ? -50 : 50,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ticket,
        start: "top 90%",
      },
    });
  });

  document.querySelectorAll("[data-parallax]").forEach((image) => {
    gsap.to(image, {
      y: -42,
      ease: "none",
      scrollTrigger: {
        trigger: image,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  const archiveTrack = document.querySelector(".archive-panorama__track");
  const archiveContainer = document.getElementById("archivePanorama");

  if (archiveTrack && archiveContainer) {
    const getDistance = () => Math.max(archiveTrack.scrollWidth - window.innerWidth + 90, 0);

    gsap.to(archiveTrack, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: archiveContainer,
        start: "top 66%",
        end: () => `+=${getDistance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  await runPreloader();
  initAnimations();
});
