/**
 * Premium motion layer — Lenis + GSAP 3 + ScrollTrigger + SplitText.
 * Vendor libs (gsap, ScrollTrigger, SplitText, Lenis) load as classic
 * global scripts before this module; this file only orchestrates them.
 */

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

/* -------------------------------------------------------------------- */
/* Lenis smooth scroll, synced to GSAP's ticker (single rAF loop)       */
/* -------------------------------------------------------------------- */
function initLenis() {
  if (prefersReducedMotion) return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    syncTouch: false, // keep native touch scrolling on mobile for feel + battery
    touchMultiplier: 2,
    wheelMultiplier: 1,
  });

  // Keep ScrollTrigger's measurements in lockstep with Lenis' virtual scroll.
  lenis.on("scroll", ScrollTrigger.update);

  // Drive Lenis from GSAP's ticker instead of a second requestAnimationFrame loop.
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/* -------------------------------------------------------------------- */
/* Small shared helpers                                                 */
/* -------------------------------------------------------------------- */

// Split a heading into lines, mask each line, and reveal bottom -> top.
// Re-splits responsively on resize but only plays the entrance once.
function splitHeadingReveal(el, { scrollTrigger = true } = {}) {
  let played = false;

  SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit(self) {
      if (played) {
        gsap.set(self.lines, { yPercent: 0, opacity: 1 });
        return;
      }
      played = true;

      const tweenVars = {
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
      };

      if (scrollTrigger) {
        tweenVars.scrollTrigger = { trigger: el, start: "top 85%", once: true };
      }

      return gsap.from(self.lines, { yPercent: 100, opacity: 0, ...tweenVars });
    },
  });
}

// Fade + rise reveal for a group of elements sharing one ScrollTrigger.
function revealGroup(targets, { trigger, start = "top 82%", y = 40, stagger = 0.1, delay = 0, duration = 0.8, ease = "power3.out" } = {}) {
  const els = gsap.utils.toArray(targets);
  if (!els.length) return;

  gsap.from(els, {
    y,
    opacity: 0,
    duration,
    stagger,
    delay,
    ease,
    scrollTrigger: { trigger: trigger || els[0], start, once: true },
  });
}

/* -------------------------------------------------------------------- */
/* Hero: headline, description, CTAs and hero image animate on load     */
/* -------------------------------------------------------------------- */
function initHeroAnimation() {
  const hero = document.querySelector(".hero-content");
  if (!hero) return;

  const title = hero.querySelector(".title");
  const desc = hero.querySelector(".desc");
  const buttons = hero.querySelectorAll(".hero-content-actions .btn");
  const screens = document.querySelector(".hero .screens");

  if (title) splitHeadingReveal(title, { scrollTrigger: false });

  const tl = gsap.timeline({ delay: 0.25, defaults: { ease: "power3.out" } });

  if (desc) {
    tl.from(desc, { y: 30, opacity: 0, duration: 1 }, 0.3);
  }
  if (buttons.length) {
    tl.from(buttons, { y: 24, opacity: 0, scale: 0.94, duration: 0.8, stagger: 0.1 }, 0.5);
  }
  if (screens) {
    tl.fromTo(
      screens,
      { opacity: 0, scale: 1.08, clipPath: "inset(0% 0% 6% 0%)" },
      { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.out" },
      0.35
    );
  }
}

/* -------------------------------------------------------------------- */
/* Hero browser mockup: headline/subtext/CTAs, then browser chrome and  */
/* its floating panels reveal in sequence. Only runs when the mockup    */
/* markup (#browser + panels) is present on the page, so it can coexist */
/* with the .hero-content layout handled by initHeroAnimation() above.  */
/* -------------------------------------------------------------------- */
function initHeroBrowserMockupAnimation() {
  const browser = document.querySelector("#browser");
  if (!browser) return; // Markup not present on this page — safe no-op.

  const headline = document.querySelector("#headline");
  const subtext = document.querySelector("#subtext");
  const btnPrimary = document.querySelector("#btn-primary");
  const btnSecondary = document.querySelector("#btn-secondary");
  const urlBar = document.querySelector("#url-bar");
  const fontPanel = document.querySelector("#font-panel");
  const toolbar = document.querySelector("#toolbar");
  const colorPanel = document.querySelector("#color-panel");
  const templatePanel = document.querySelector("#template-panel");

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // 1. Headline reveals first
  if (headline) {
    tl.fromTo(headline, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 });
  }

  // 2. Subtext
  if (subtext) {
    tl.fromTo(
      subtext,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7 },
      headline ? "-=0.45" : 0
    );
  }

  // 3. CTAs
  if (btnPrimary) {
    tl.fromTo(
      btnPrimary,
      { opacity: 0, y: 18, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55 },
      subtext ? "-=0.35" : 0
    );
  }
  if (btnSecondary) {
    tl.fromTo(
      btnSecondary,
      { opacity: 0, y: 18, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55 },
      btnPrimary ? "-=0.45" : 0
    );
  }

  // 4. Web elements reveal one by one
  tl.fromTo(
    browser,
    { opacity: 0, y: 60, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.9 },
    "-=0.15"
  );
  if (urlBar) {
    tl.fromTo(urlBar, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.6 }, "-=0.55");
  }
  if (fontPanel) {
    tl.fromTo(
      fontPanel,
      { opacity: 0, x: -40, y: 20 },
      { opacity: 1, x: 0, y: 0, duration: 0.6 },
      "-=0.35"
    );
  }
  if (toolbar) {
    tl.fromTo(toolbar, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35");
  }
  if (colorPanel) {
    tl.fromTo(
      colorPanel,
      { opacity: 0, x: 40, y: -20 },
      { opacity: 1, x: 0, y: 0, duration: 0.6 },
      "-=0.4"
    );
  }
  if (templatePanel) {
    tl.fromTo(
      templatePanel,
      { opacity: 0, x: 40, y: 30 },
      { opacity: 1, x: 0, y: 0, duration: 0.6 },
      "-=0.4"
    );
  }

  return tl;
}

/* -------------------------------------------------------------------- */
/* Heading reveal: split every major heading into masked lines          */
/* -------------------------------------------------------------------- */
function initHeadingReveal() {
  const headings = document.querySelectorAll(
    ".section-text-h2, .section-head h3.h3, .section-cta h3, .footer-cta h3"
  );
  headings.forEach((el) => splitHeadingReveal(el));
}

/* -------------------------------------------------------------------- */
/* Section reveal: badge/paragraph/CTA content around each heading      */
/* -------------------------------------------------------------------- */
function initSectionReveal() {
  // Paragraph copy next to section headings.
  document.querySelectorAll(".section-head").forEach((head) => {
    revealGroup(head.querySelectorAll("p"), { trigger: head, delay: 0.15 });
  });

  // CTA blocks: heading (via initHeadingReveal) then button, offset later.
  document.querySelectorAll(".section-cta, .footer-cta").forEach((cta) => {
    revealGroup(cta.querySelectorAll("a.btn"), { trigger: cta, y: 20, delay: 0.3, duration: 0.7 });
  });

  // Feature checklist inside the calendar/inventory content block.
  document.querySelectorAll(".content-block-cms .check").forEach((list) => {
    revealGroup(list.querySelectorAll("li"), { trigger: list, y: 16, stagger: 0.08, start: "top 85%" });
  });

  // Logo strip.
  revealGroup(".bussinesses-item", { trigger: ".bussinesses", start: "top 90%", y: 20, stagger: 0.06 });

  // Footer columns reveal sequentially, then social/nav links stagger in.
  const footerTop = document.querySelector(".footer-top");
  if (footerTop) {
    revealGroup(footerTop.querySelectorAll(".row > div"), { trigger: footerTop, start: "top 90%", y: 30, stagger: 0.15 });
    revealGroup("#Follow .footer-nav-item", { trigger: footerTop, start: "top 90%", y: 14, stagger: 0.06, delay: 0.35 });
  }
}

/* -------------------------------------------------------------------- */
/* Card animations: feature/step/pricing/why-us/faq groups               */
/* -------------------------------------------------------------------- */
function initCardsAnimation() {
  const groups = [
    { container: ".features", items: ".features-item" },
    { container: ".get-started", items: ".get-started-item" },
    { container: ".pricings", items: ".pricings-item" },
    { container: ".why-us", items: ".why-us-item" },
    { container: ".faq-list", items: ".faq-list-item" },
  ];

  groups.forEach(({ container, items }) => {
    const els = gsap.utils.toArray(items);
    if (!els.length) return;

    gsap.from(els, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: container, start: "top 80%", once: true },
    });
  });
  // Hover lift/scale/shadow for these same groups lives in css/motion.css,
  // since a CSS transition is cheaper than a JS-driven hover tween.
}

/* -------------------------------------------------------------------- */
/* Image reveal: clip-path + scale-down + fade for standalone imagery   */
/* -------------------------------------------------------------------- */
function initImageReveal() {
  document.querySelectorAll(".content-block-img .image-wrap img").forEach((img) => {
    gsap.fromTo(
      img,
      { opacity: 0, scale: 1.1, clipPath: "inset(0% 0% 8% 0%)" },
      {
        opacity: 1,
        scale: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: img, start: "top 85%", once: true },
      }
    );
  });

  const nichesSwiper = document.querySelector(".niches-swiper");
  if (nichesSwiper) {
    gsap.fromTo(
      nichesSwiper,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: nichesSwiper, start: "top 88%", once: true } }
    );
  }
}

/* -------------------------------------------------------------------- */
/* Parallax: a handful of tasteful, scrub-linked depth cues              */
/* -------------------------------------------------------------------- */
function initParallax() {
  const heroSection = document.querySelector(".hero");
  const screens = document.querySelector(".hero .screens");
  if (heroSection && screens) {
    gsap.to(screens, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { trigger: heroSection, start: "top top", end: "bottom top", scrub: true },
    });
  }

  document.querySelectorAll(".content-block-img .image-wrap img").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -6 },
      { yPercent: 6, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } }
    );
  });

  const pricingBg = document.querySelector(".bg-pricing");
  if (pricingBg) {
    gsap.to(pricingBg, {
      backgroundPositionY: "8%",
      ease: "none",
      scrollTrigger: { trigger: pricingBg, start: "top bottom", end: "bottom top", scrub: true },
    });
  }
}

/* -------------------------------------------------------------------- */
/* Counters: ready for numeric stats, safe no-op on today's markup      */
/* -------------------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return; // No stat blocks exist in the current markup yet.

  counters.forEach((el) => {
    const target = parseFloat(el.dataset.counter) || 0;
    const decimals = (el.dataset.counter.split(".")[1] || "").length;

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter() {
        if (prefersReducedMotion) {
          el.textContent = target.toFixed(decimals);
          return;
        }
        gsap.fromTo(
          el,
          { textContent: 0 },
          {
            textContent: target,
            duration: 1.6,
            ease: "power2.out",
            snap: { textContent: decimals ? 1 / Math.pow(10, decimals) : 1 },
            onUpdate() {
              el.textContent = Number(el.textContent).toFixed(decimals);
            },
          }
        );
      },
    });
  });
}

/* -------------------------------------------------------------------- */
/* Back-to-top button: progress ring + smooth scroll-to-top             */
/* -------------------------------------------------------------------- */
function initBackToTop(lenis) {
  const backTop = document.querySelector(".back-top");
  const circle = document.querySelector(".back-top svg circle:nth-child(2)");
  if (!backTop || !circle) return;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = circumference;

  const update = (scrollTop, limit) => {
    const percent = limit ? scrollTop / limit : 0;
    circle.style.strokeDashoffset = circumference * (1 - percent);
    backTop.classList.toggle("back-top-show", scrollTop > 50);
  };

  if (lenis) {
    lenis.on("scroll", ({ scroll, limit }) => update(scroll, limit));
  } else {
    window.addEventListener("scroll", () => {
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      update(window.scrollY, limit);
    });
  }

  // Native smooth-scroll here rather than lenis.scrollTo(): this bundled
  // Lenis build (0.2.x) can drop its internal scrollTo tween partway when
  // the native "scroll" event it listens for resyncs targetScroll mid-flight.
  // Lenis passively syncs to the resulting native scroll either way.
  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* -------------------------------------------------------------------- */
/* Boot                                                                  */
/* -------------------------------------------------------------------- */
function boot() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const lenis = initLenis();
  initBackToTop(lenis);

  // The head-inline script pre-hides hero content via the .js-anim class
  // (see index.html) so it can fade/rise in instead of popping in. Whatever
  // else happens below, that class must come off so content is never stuck
  // invisible.
  document.documentElement.classList.remove("js-anim");

  if (prefersReducedMotion) return; // Skip entrance/scroll motion; content stays static.

  initHeroAnimation();
  initHeroBrowserMockupAnimation();

  fontsReady.then(() => {
    initHeadingReveal();
    initSectionReveal();
    initCardsAnimation();
    initImageReveal();
    initParallax();
    initCounters();
    ScrollTrigger.refresh();
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

try {
  boot();
} catch (err) {
  document.documentElement.classList.remove("js-anim");
  console.error("[motion] initialization failed, falling back to static content:", err);
}