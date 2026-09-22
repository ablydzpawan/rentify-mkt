import { revealHeading, revealSection } from "./text-effects.js";

gsap.registerPlugin(ScrollTrigger);

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   LENIS — smooth scroll, wired into GSAP's ticker so
   ScrollTrigger reads the eased scroll position instead of
   the raw (stepped) native one. This is what gives scroll
   reveals that buttery, "Framer site" glide.
   ========================================================= */

var lenis = null;

if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
    });

    // Lenis already smooths the frame timing; let GSAP defer to it.
    gsap.ticker.lagSmoothing(0);
}

/* =========================================================
   STICKY HEADER — smooth shrink/shadow transition once the
   page has scrolled past the top. The CSS transition on
   .site-header does the actual easing; this just flips the
   state class in sync with the (Lenis-smoothed) scroll pos.
   ========================================================= */

ScrollTrigger.create({
    start: "top -80",
    end: 99999,
    toggleClass: { targets: ".site-header", className: "is-scrolled" },
});

/* =========================================================
   DESKTOP NAV — tab-bar hover pill (CSS anchor positioning).
   Each nav link carries a permanent --nav-tab-N anchor-name
   (set in scss/layout/_header.scss); this just tracks which
   one is currently hovered/focused and writes it into the
   --nav-active-tab custom property so the pill (the nav's
   ::before) re-anchors to it. Leaving the nav keeps the last
   anchor in place and only fades the pill out, so it never
   has to snap to an invalid position.
   ========================================================= */

(function () {
    var nav = document.querySelector(".desktop-nav");
    if (!nav) return;

    var links = nav.querySelectorAll("a");

    links.forEach(function (link, i) {
        var activate = function () {
            nav.style.setProperty("--nav-active-tab", "--nav-tab-" + (i + 1));
            nav.classList.add("is-tab-active");
        };
        link.addEventListener("mouseenter", activate);
        link.addEventListener("focus", activate);
    });

    nav.addEventListener("mouseleave", function () {
        nav.classList.remove("is-tab-active");
    });

    nav.addEventListener("focusout", function (e) {
        if (!nav.contains(e.relatedTarget)) nav.classList.remove("is-tab-active");
    });
})();

// A softened expo-out — the signature "ease" behind most Framer-built
// scroll reveals. Falls back to power3 if CustomEase failed to load.
var revealEase = "power3.out";
if (window.CustomEase) {
    CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
    revealEase = "framerReveal";
}

/* =========================================================
   HERO SECTION — headline words, subtext, CTAs
   ========================================================= */

// ---------- Split heading into words ("Fade Up Words") ----------
var heading = document.querySelector("#headline");

var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

// Words rise up from behind their masked wrapper while fading in
revealHeading(heading, { timeline: heroTl, position: 0 });

// Subtitle
heroTl.from("#subtext", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

// CTAs
heroTl.from(".btn-hero-cta", {
    y: 16, opacity: 0, scale: 0.9, duration: 0.5, ease: "back.out(1.7)", stagger: 0.08
}, "-=0.35");

/* =========================================================
   PANEL GROUP #1 — Browser / editor scene
   Held on its own timeline so it can be dropped into heroTl
   AFTER the text has fully finished revealing (see heroTl.add
   below) — text reveal, then image, never overlapping.
   ========================================================= */

var browserTl = gsap.timeline({ defaults: { ease: "power3.out" } });

// 1. Browser (the main artboard) settles in first — it anchors the whole scene.
browserTl.from("#browser", {
    opacity: 0,
    scale: 0.94,
    y: 40,
    filter: "blur(14px)",
    duration: 1.1,
    ease: "power3.out"
}, 0);

// 2. Satellite panels fly to their exact resting position from a slight
//    outward offset, softly blurred, staggered so they feel orchestrated
//    rather than simultaneous.
browserTl.from("#url-bar", {
    opacity: 0, y: -24, x: -10, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

browserTl.from("#toolbar", {
    opacity: 0, x: -36, scale: 0.92, filter: "blur(10px)", duration: 0.85
}, "-=0.7");

browserTl.from("#font-panel", {
    opacity: 0, x: -40, y: 20, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

browserTl.from("#color-panel", {
    opacity: 0, x: 40, y: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

browserTl.from("#template-panel", {
    opacity: 0, x: 36, y: 24, scale: 0.9, filter: "blur(10px)", duration: 0.9
}, "-=0.7");

// 3. Tiny settle — kills any residual blur/scale
browserTl.to(".panel", {
    filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out"
}, "-=0.2");

/* =========================================================
   BROWSER PANEL FLOATING EFFECT
   Same idle float treatment as the calendar scene, applied to
   every satellite panel around the browser once it's settled.
   The browser itself is the main artboard, so it stays anchored
   and is excluded here.
   ========================================================= */

if (!prefersReducedMotion) {
    browserTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".panel:not(#browser)").forEach(function (panel, i) {
            gsap.timeline({
                repeat: -1,
                yoyo: true,
                delay: i * 0.2,
                defaults: { duration: 2.6 + (i % 3) * 0.45, ease: "sine.inOut" },
            }).to(panel, {
                y: i % 2 === 0 ? "-=12" : "+=12",
                x: i % 2 === 0 ? "+=4" : "-=4",
                rotate: i % 2 === 0 ? 0.6 : -0.6,
            });
        });
    });
}

// Text reveal, then image: the browser scene only starts once every
// hero text tween (headline words, subtext, CTA) has fully finished.
heroTl.add(browserTl, ">");

/* =========================================================
   PANEL GROUP #2 — Calendar / product scene
   ========================================================= */

var calendarFloatTweens = [];

var calendarTl = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: {
        trigger: ".calendar-stage",
        start: "top 80%",
        toggleActions: "play none none reverse",
        // markers: true, // uncomment while debugging trigger points
        onLeaveBack: function () {
            calendarFloatTweens.forEach(function (tw) { tw.kill(); });
            calendarFloatTweens = [];
        },
    },
});

// 1. Calendar panel (the main artboard) settles in first — it anchors the scene.
calendarTl.from("#calendar-panel", {
    opacity: 0,
    scale: 0.94,
    y: 40,
    filter: "blur(14px)",
    duration: 1.1,
    ease: "power3.out"
}, 0);

// 2. Satellite panels fly to their exact resting position, offset direction
//    matching each panel's side of the canvas so it feels like "settling in".
calendarTl.from("#product-card", {
    opacity: 0, x: -30, y: -24, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

calendarTl.from("#toggle", {
    opacity: 0, y: -20, scale: 0.9, filter: "blur(8px)", duration: 0.7
}, "-=0.7");

calendarTl.from("#shoe-image", {
    opacity: 0, x: -36, y: 24, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.65");

calendarTl.from("#model-image", {
    opacity: 0, x: 40, y: 20, scale: 0.9, filter: "blur(10px)", duration: 0.9
}, "-=0.7");

// 3. Tiny settle — kills any residual blur/scale so everything lands crisp
calendarTl.to(".cal-panel", {
    filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out"
}, "-=0.2");

/* =========================================================
   CAL-PANEL FLOATING EFFECT
   Once each panel has settled into place, give it a gentle,
   perpetual bob so the calendar scene reads as if it's
   floating rather than sitting static. Amplitude/duration are
   varied per panel so they drift out of phase with each other.
   The calendar panel itself is the main artboard, so it stays
   anchored and is excluded here.
   ========================================================= */

if (!prefersReducedMotion) {
    calendarTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".cal-panel:not(#calendar-panel)").forEach(function (panel, i) {
            // Alternate direction per panel and drift a touch horizontally +
            // rotate a fraction of a degree so the group floats out of sync
            // and doesn't read as a uniform, mechanical bob.
            var floatTl = gsap.timeline({
                repeat: -1,
                yoyo: true,
                delay: i * 0.2,
                defaults: { duration: 2.6 + (i % 3) * 0.45, ease: "sine.inOut" },
            }).to(panel, {
                y: i % 2 === 0 ? "-=12" : "+=12",
                x: i % 2 === 0 ? "+=4" : "-=4",
                rotate: i % 2 === 0 ? 0.6 : -0.6,
            });

            calendarFloatTweens.push(floatTl);
        });
    });
}

/* =========================================================
   SCROLL-TRIGGERED SECTION REVEALS
   Each .section (heading + its description text) gets its
   own ScrollTrigger so multiple sections down the page all
   animate independently as they enter the viewport.
   ========================================================= */

if (!prefersReducedMotion) {
    document.querySelectorAll(".section").forEach(revealSection);

    /* =====================================================
       GENERIC GRID / LIST REVEALS
       Every repeating card group on the page (logo strip,
       "why us" tiles, pricing cards, FAQ rows, get-started
       steps, footer columns, ...) fades + rises into place,
       staggered, the moment its container crosses into view.
       Swiper-driven carousels and elements that already have
       a bespoke entrance timeline (hero panels, calendar
       panels, the integrations SVG draw) are intentionally
       left out so they aren't double-animated.
       ===================================================== */

    const revealGroup = (containerSelector, itemSelector, vars = {}) => {
        document.querySelectorAll(containerSelector).forEach((container) => {
            const items = container.querySelectorAll(itemSelector);
            if (!items.length) return;

            gsap.from(items, Object.assign({
                opacity: 0,
                y: 40,
                duration: 0.9,
                ease: revealEase,
                stagger: 0.08,
                scrollTrigger: {
                    trigger: container,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                },
            }, vars));
        });
    };

    revealGroup(".bussinesses", ".bussinesses-item", { y: 20, scale: 0.9, duration: 0.7, stagger: 0.05 });
    revealGroup(".why-us", ".why-us-item", { y: 50 });

    // Why-us icons get their own bouncy pop on top of the item's fade/rise,
    // so the icon reads as a distinct little flourish rather than just
    // riding along with the card.
    revealGroup(".why-us", ".why-us-icon svg", {
        opacity: 0,
        y: 0,
        scale: 0.4,
        rotate: -18,
        transformOrigin: "50% 50%",
        duration: 0.75,
        delay: 0.15,
        ease: "back.out(2.2)",
        stagger: 0.12,
    });
    revealGroup(".pricings", ".pricings-item", { y: 50, scale: 0.95 });
    revealGroup(".calendar-check", "li", { x: -30, y: 0, stagger: 0.1 });
    revealGroup(".accordion-container", ".accordion-card", { y: 50, stagger: 0.12 });
    revealGroup(".faq-list", ".faq-list-item", { y: 25, stagger: 0.1 });
    revealGroup(".footer-top .row", ".col-auto", { y: 30, stagger: 0.12 });
    revealGroup(".black-cta", ":scope > *", { y: 30, stagger: 0.1, duration: 0.8 });

    // Layout-affecting widgets (Swiper, footer collapses, images loading)
    // shift section positions after their own setup runs, so re-measure
    // the trigger points once everything has settled.
    window.addEventListener("load", () => ScrollTrigger.refresh());
}

// Swiper

const featuresSwiper = new Swiper(".featuresSwiper", {
    slidesPerView: "auto",
    centeredSlides: true,
    loop: true,

    spaceBetween: 30,

    speed: 700,

    grabCursor: true,

    watchSlidesProgress: true,

    breakpoints: {
        0: {
            spaceBetween: 10
        },

        768: {
            spaceBetween: 20
        },

        1200: {
            spaceBetween: 30
        }
    }
});


//Swiper

const expoSwiper = new Swiper('.swiper-expo', {
    direction: 'horizontal',
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: -200,
    loop: true,
    speed: 750,
    parallax: true,
    grabCursor: true,

    navigation: {
        nextEl: '.btn-next',
        prevEl: '.btn-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },

    /* 3D Dynamic Transformation Logic */
    on: {
        progress(s) {
            s.slides.forEach((slide) => {
                const progress = slide.progress; // Offset from active slide: -1 (left), 0 (center), 1 (right)
                const absProgress = Math.abs(progress);

                // 1. Perspective 3D rotation around Y axis
                const rotateY = progress * 80;

                // 2. Scale & translateZ depth matrix calculation
                const scale = 1 - Math.min(absProgress * 0.0, 1);
                const translateZ = -absProgress * 50;
                const translateX = progress * -80;

                // 3. Opacity & depth blur curve
                const opacity = 1 - Math.min(absProgress * 0, 1);

                // Apply calculated 3D Matrix
                slide.style.transform = `
              translate3d(${translateX}px, 0px, ${translateZ}px) 
              rotateY(${rotateY}deg) 
              scale(${scale})
            `;
                slide.style.opacity = opacity;
                slide.style.zIndex = 10 - Math.round(absProgress * 5);
            });
        },
        setTransition(s, duration) {
            s.slides.forEach((slide) => {
                slide.style.transitionDuration = `${duration}ms`;
            });
        }
    }
});

/* =========================================================
   SWIPER PREV/NEXT-ON-CLICK
   With centeredSlides, the not-quite-active slides peeking in
   on either side of the active one carry Swiper's own
   "swiper-slide-prev" / "swiper-slide-next" classes. Clicking
   the left-side peek steps back a slide, clicking the
   right-side peek steps forward — no extra nav buttons needed.
   ========================================================= */

function bindAdjacentSlideNav(swiperInstance) {
    swiperInstance.on("click", function (s, event) {
        const slide = event.target.closest(".swiper-slide");
        if (!slide) return;

        if (slide.classList.contains("swiper-slide-prev")) {
            s.slidePrev();
        } else if (slide.classList.contains("swiper-slide-next")) {
            s.slideNext();
        }
    });
}

bindAdjacentSlideNav(featuresSwiper);
bindAdjacentSlideNav(expoSwiper);

//accordion


const cards = document.querySelectorAll('.accordion-card');

cards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        cards.forEach(c => c.classList.remove('active'));

        // Add active class to clicked card
        card.classList.add('active');
    });
});


/* =========================================================
   INTEGRATIONS SVG — draw the connector lines first, then pop
   the icon bubbles into place once the lines have (mostly)
   finished drawing, so the diagram "populates" outward from
   the center the way an SVGator scroll-reveal would.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const svg = document.querySelector(".svg-draw");

    if (!svg) return;

    const connectors = svg.querySelectorAll(".connector path");
    const hub = svg.querySelector(".hub");
    const bubbles = svg.querySelectorAll(".icon-bubble:not(.hub)");

    if (prefersReducedMotion) return; // leave the diagram fully visible, no animation

    // Calculate each connector path's length so it can be drawn via dash-offset.
    connectors.forEach((path) => {
        try {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        } catch (error) {
            // Ignore paths that don't support getTotalLength()
        }
    });

    gsap.set(bubbles, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" });
    if (hub) gsap.set(hub, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });

    const svgTl = gsap.timeline({
        scrollTrigger: {
            trigger: svg,
            start: "top 75%",
            toggleActions: "play none none reverse",
        },
    });

    // 1. The center hub appears first — everything else radiates from it.
    if (hub) {
        svgTl.to(hub, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" });
    }

    // 2. Connector lines draw outward from the hub.
    svgTl.to(connectors, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: "power2.inOut",
        stagger: 0.08,
    }, hub ? "-=0.15" : 0);

    // 3. Icon bubbles pop in at the end of each line, staggered, once the
    //    drawing is nearly complete.
    svgTl.to(bubbles, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(2.4)",
        stagger: 0.08,
    }, "-=0.35");
});