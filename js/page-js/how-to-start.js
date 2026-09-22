/* =========================================================
   HOW TO START — page motion layer.
   Mirrors js/page-js/index.js (Lenis + GSAP + ScrollTrigger
   setup, sticky header, nav pill, scroll reveals) but scoped to
   the elements that actually exist on this page, so it doesn't
   depend on homepage-only markup (#headline, .calendar-stage,
   Swiper instances, ...).
   ========================================================= */

import { revealHeading, revealSection } from "../text-effects.js";

gsap.registerPlugin(ScrollTrigger);

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll, wired into GSAP's ticker ---------- */

if (!prefersReducedMotion && window.Lenis) {
    var lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

/* ---------- Sticky header ---------- */

ScrollTrigger.create({
    start: "top -80",
    end: 99999,
    toggleClass: { targets: ".site-header", className: "is-scrolled" },
});

/* ---------- Desktop nav hover pill ---------- */

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

if (prefersReducedMotion) {
    // Leave everything in its natural, fully-visible state.
} else {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* =========================================================
       HERO — heading ("Fade Up Words"), subtext, floating panel
       scene. Text reveals fully first, then the image scene
       starts — no overlap between the two groups.
       ========================================================= */

    var heroHeading = document.querySelector(".first-fold-content .title");

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    revealHeading(heroHeading, { timeline: heroTl, position: 0 });
    heroTl.from(".first-fold-content .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

    // 1. Main artboard reveals through a clip-path wipe — the mask rises
    //    to uncover the image (paired with a slight zoom-settle) instead
    //    of a plain fade, so it reads as a deliberate "unveil". It only
    //    starts once the text above has fully finished revealing.
    heroTl.fromTo("#browser img",
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.3, ease: "power4.out" },
        ">"
    );

    // 2. Satellite panels fly in from the direction of their resting corner.
    heroTl.from("#sales-panel", {
        opacity: 0, y: -30, x: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85
    }, "-=0.75");

    heroTl.from("#product-panel", {
        opacity: 0, y: 30, x: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85
    }, "-=0.7");

    heroTl.from("#social-panel", {
        opacity: 0, y: -24, x: 30, scale: 0.9, filter: "blur(10px)", duration: 0.85
    }, "-=0.75");

    heroTl.from("#url-bar", {
        opacity: 0, y: 24, x: 30, scale: 0.9, filter: "blur(10px)", duration: 0.85
    }, "-=0.7");

    // 3. Tiny settle — kills any residual blur/scale.
    heroTl.to(".first-fold-canvas .panel", {
        filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out"
    }, "-=0.2");

    // 4. Idle float once everything has settled.
    heroTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".first-fold-canvas .panel:not(#browser)").forEach(function (panel, i) {
            gsap.timeline({
                repeat: -1,
                yoyo: true,
                delay: i * 0.2,
                defaults: { duration: 2.6 + (i % 3) * 0.45, ease: "sine.inOut" },
            }).to(panel, {
                y: i % 2 === 0 ? "-=10" : "+=10",
                x: i % 2 === 0 ? "+=4" : "-=4",
                rotate: i % 2 === 0 ? 0.5 : -0.5,
            });
        });
    });

    /* =========================================================
       SCROLL-TRIGGERED SECTION REVEALS
       Every .section heading + description animates in as it
       enters the viewport.
       ========================================================= */

    document.querySelectorAll(".section").forEach(revealSection);

    /* =========================================================
       4-STEP PROCESS — each content-block gets its own scene:
       the main product visual settles first, then its floating
       UI cards fly in from their resting corner (same language
       as the hero canvas), while the copy rises in alongside.
       ========================================================= */

    document.querySelectorAll(".content-wrap .content-block").forEach(function (block, index) {
        var mainLayer = block.querySelector(".image-wrap .layer:first-child");
        var satelliteLayers = block.querySelectorAll(".image-wrap .layer:not(:first-child)");
        var cms = block.querySelector(".content-block-cms .cms");

        var blockTl = gsap.timeline({
            scrollTrigger: {
                trigger: block,
                start: "top 78%",
                toggleActions: "play none none reverse",
            },
        });

        var fromLeft = index % 2 === 0;

        if (mainLayer) {
            blockTl.from(mainLayer, {
                opacity: 0, scale: 0.92, y: 30, filter: "blur(12px)", duration: 0.9, ease: "power3.out"
            }, 0);
        }

        if (cms) {
            blockTl.from(cms.children, {
                opacity: 0, x: fromLeft ? 24 : -24, y: 16, duration: 0.7, stagger: 0.08, ease: "power2.out"
            }, "-=0.65");
        }

        if (satelliteLayers.length) {
            blockTl.from(satelliteLayers, {
                opacity: 0,
                y: 20,
                scale: 0.85,
                filter: "blur(8px)",
                duration: 0.7,
                stagger: 0.1,
                ease: "back.out(1.6)",
            }, "-=0.5");
        }

        blockTl.eventCallback("onComplete", function () {
            satelliteLayers.forEach(function (layer, i) {
                gsap.timeline({
                    repeat: -1,
                    yoyo: true,
                    delay: i * 0.15,
                    defaults: { duration: 2.4 + (i % 3) * 0.4, ease: "sine.inOut" },
                }).to(layer, {
                    y: i % 2 === 0 ? "-=8" : "+=8",
                });
            });
        });
    });

    /* =========================================================
       GENERIC LIST REVEALS — FAQ rows and footer columns.
       ========================================================= */

    var revealGroup = function (containerSelector, itemSelector, vars) {
        document.querySelectorAll(containerSelector).forEach(function (container) {
            var items = container.querySelectorAll(itemSelector);
            if (!items.length) return;

            gsap.from(items, Object.assign({
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: revealEase,
                stagger: 0.08,
                scrollTrigger: {
                    trigger: container,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                },
            }, vars || {}));
        });
    };

    revealGroup(".faq-list", ".faq-list-item", { y: 20, stagger: 0.1 });
    revealGroup(".footer-top .row", ".col-auto", { y: 25, stagger: 0.1 });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
