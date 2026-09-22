/* =========================================================
   FEATURES — page motion layer. Same Lenis + GSAP + ScrollTrigger
   setup as the other pages (mirrors how-to-start.js), plus two
   new shared helpers this page needs: a synced accordion (click an
   item, the shared image panel crossfades to that item's layered
   composite) and a tab group (click a pill, the active colored
   panel swaps and its layers replay their fly-in).

   Interactivity (accordion/tab switching) is wired unconditionally
   so the page stays fully usable under prefers-reduced-motion —
   only the GSAP entrance/crossfade animation is skipped in that
   case, matching the "provide appropriate fallbacks" requirement.
   ========================================================= */

import { revealHeading, revealSection } from "../text-effects.js";
import { hideCollapse } from "../collapse-offcanvas.js";

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

/* =========================================================
   LAYERED IMAGE REVEAL — the how-to-start "wow" technique,
   generalized: main layer settles first (scale/blur/y), then
   satellite layers fly in staggered, then an idle float loop
   starts. Works on any `.reveal .image-wrap` with `.layer`
   children. Under reduced motion this is never called for
   scroll entrances (the CSS default is already fully visible);
   the synced-accordion/tab-panel crossfade below still calls
   it, but only for its own instant-vs-animated branch.
   ========================================================= */

function initLayerReveals(scope, opts) {
    opts = opts || {};
    scope.forEach(function (block) {
        if (!block) return;
        var wrap = block.querySelector(".reveal .image-wrap") || (block.matches && block.matches(".image-wrap") ? block : null);
        if (!wrap) return;

        var layers = wrap.querySelectorAll(".layer");
        if (!layers.length) return;

        var mainLayer = wrap.querySelector(".layer-main") || layers[0];
        var satelliteLayers = Array.prototype.filter.call(layers, function (l) { return l !== mainLayer; });

        var tl = gsap.timeline(opts.scrollTrigger === false ? {} : {
            scrollTrigger: {
                trigger: block,
                start: "top 78%",
                toggleActions: "play none none reverse",
            },
        });

        if (opts.clip) {
            tl.fromTo(mainLayer,
                { clipPath: "inset(0% 100% 0% 0%)", opacity: 1 },
                { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power4.out" },
                0
            );
        } else {
            tl.from(mainLayer, { opacity: 0, scale: 0.92, y: 30, filter: "blur(12px)", duration: 0.9, ease: "power3.out" }, 0);
        }

        if (satelliteLayers.length) {
            tl.from(satelliteLayers, {
                opacity: 0, y: 20, scale: 0.85, filter: "blur(8px)", duration: 0.7, stagger: 0.1, ease: "back.out(1.6)"
            }, "-=0.5");
        }

        tl.eventCallback("onComplete", function () {
            satelliteLayers.forEach(function (layer, i) {
                gsap.timeline({
                    repeat: -1, yoyo: true, delay: i * 0.15,
                    defaults: { duration: 2.4 + (i % 3) * 0.4, ease: "sine.inOut" },
                }).to(layer, { y: i % 2 === 0 ? "-=8" : "+=8" });
            });
        });
    });
}

/* =========================================================
   SYNCED ACCORDION — "Simplify Your Order Management" and
   "SEO and Marketing". Bootstrap's native single-open collapse
   (same show.bs.collapse pattern as faq.js) drives which
   `.state` is visible in the shared image panel. Wired
   unconditionally; the crossfade itself is skipped under
   reduced motion (the newly active state just appears).
   ========================================================= */

function initSyncedAccordion(rootSelector) {
    document.querySelectorAll(rootSelector).forEach(function (root) {
        var list = root.querySelector(".faq-list-numbered");
        var visual = root.querySelector(".sync-accordion-visual");
        if (!list || !visual) return;

        var states = {};
        visual.querySelectorAll(".state").forEach(function (state) {
            states[state.getAttribute("data-state")] = state;
        });

        function playState(key) {
            var state = states[key];
            if (!state || state.classList.contains("is-active")) return;

            Object.keys(states).forEach(function (k) {
                states[k].classList.remove("is-active");
            });
            state.classList.add("is-active");

            if (prefersReducedMotion) return;

            var wrap = state.querySelector(".image-wrap");
            var layers = wrap.querySelectorAll(".layer");
            var mainLayer = wrap.querySelector(".layer-main") || layers[0];
            var satelliteLayers = Array.prototype.filter.call(layers, function (l) { return l !== mainLayer; });

            gsap.killTweensOf(layers);
            gsap.timeline()
                .from(mainLayer, { opacity: 0, scale: 0.94, y: 20, filter: "blur(10px)", duration: 0.6, ease: "power3.out" }, 0)
                .from(satelliteLayers, { opacity: 0, y: 16, scale: 0.85, filter: "blur(6px)", duration: 0.5, stagger: 0.08, ease: "back.out(1.7)" }, "-=0.35");
        }

        list.addEventListener("collapse:show", function (e) {
            list.querySelectorAll(".collapse.show").forEach(function (open) {
                if (open !== e.target) hideCollapse(open);
            });

            var item = e.target.closest(".faq-list-item");
            list.querySelectorAll(".faq-list-item.active").forEach(function (i) { i.classList.remove("active"); });
            if (item) item.classList.add("active");

            var trigger = item ? item.querySelector(".faq-list-link") : null;
            var key = trigger ? trigger.getAttribute("data-image-state") : null;
            if (key) playState(key);

            if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });
}

/* =========================================================
   TAB PANELS — "Checkout and Pricing". Same pill-tabs +
   fade-in pattern faq.js uses for its category tabs, plus a
   layer-reveal replay on the newly active panel (skipped
   under reduced motion — the panel just appears).
   ========================================================= */

function initTabPanels(tabsSelector, panelSelector) {
    var tabs = document.querySelectorAll(tabsSelector + " button");
    var panels = document.querySelectorAll(panelSelector);
    if (!tabs.length || !panels.length) return;

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            if (tab.classList.contains("active")) return;

            tabs.forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");

            var targetId = tab.getAttribute("data-target");
            var nextPanel = document.getElementById(targetId);

            panels.forEach(function (panel) {
                if (panel !== nextPanel) panel.classList.remove("is-active");
            });

            if (nextPanel) {
                nextPanel.classList.add("is-active");

                if (prefersReducedMotion) {
                    // no GSAP involvement at all — the panel is already
                    // fully visible via .is-active { display: flex }, so
                    // touching it here would only risk clobbering its
                    // authored inline background-color for no benefit.
                } else {
                    gsap.fromTo(nextPanel, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
                    initLayerReveals([nextPanel.querySelector(".checkout-panel-visual")], { scrollTrigger: false });
                }
            }

            if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });
}

initSyncedAccordion("#order-mgmt-accordion");
initSyncedAccordion("#seo-accordion");
initTabPanels(".checkout-tabs .pill-tabs", ".checkout-panel");

if (prefersReducedMotion) {
    // Leave every scroll-entrance animation off — content is already
    // fully visible in its natural state. Interactivity above still
    // works fully; only the GSAP flourish is skipped.
} else {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* =========================================================
       HERO — heading ("Fade Up Words"), subtext, CTA, floating
       panel scene. Text reveals fully first, then the image
       scene starts — no overlap between the two groups.
       ========================================================= */

    var heroHeading = document.querySelector(".first-fold-content .title");

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    revealHeading(heroHeading, { timeline: heroTl, position: 0 });
    heroTl.from(".first-fold-content .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");
    heroTl.from(".first-fold-content .cta-btn", { y: 16, opacity: 0, scale: 0.92, duration: 0.6, ease: "back.out(1.7)" }, "-=0.35");

    // Image scene only starts once the text above has fully finished.
    heroTl.fromTo("#hero-phone img",
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.3, ease: "power4.out" },
        ">"
    );

    heroTl.from("#hero-total-spent", { opacity: 0, y: -30, x: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85 }, "-=0.75");
    heroTl.from("#hero-pie-chart", { opacity: 0, y: 30, x: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85 }, "-=0.7");
    heroTl.from("#hero-daily-traffic", { opacity: 0, y: -24, x: 30, scale: 0.9, filter: "blur(10px)", duration: 0.85 }, "-=0.75");
    heroTl.from("#hero-date-picker", { opacity: 0, y: 24, x: 30, scale: 0.9, filter: "blur(10px)", duration: 0.85 }, "-=0.7");

    heroTl.to(".features-hero-canvas .panel", { filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out" }, "-=0.2");

    heroTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".features-hero-canvas .panel:not(#hero-phone)").forEach(function (panel, i) {
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
       SECTION HEADINGS — every .section heading + description
       animates in as it enters the viewport.
       ========================================================= */

    document.querySelectorAll(".section").forEach(revealSection);

    /* =========================================================
       GENERIC STAGGER REVEAL — logo strip, buyer-feature icon
       grid, customization intro blurbs, system-feature cards.
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

    revealGroup(".bussinesses", ".bussinesses-item", { y: 20, stagger: 0.06 });
    revealGroup(".buyer-grid", ".buyer-grid-item", { y: 24, stagger: 0.06 });
    revealGroup(".customization-intro", "div", { y: 20, stagger: 0.08 });
    revealGroup(".system-grid", ".system-grid-item", { y: 30, stagger: 0.1 });

    initLayerReveals(document.querySelectorAll(".listing-block-media"), { clip: true });
    initLayerReveals(document.querySelectorAll(".customization-panel"));
    initLayerReveals(document.querySelectorAll(".system-grid-media"), { clip: true });

    // initial entrance for the default-active state/panel in each
    // synced accordion and the tab group — subsequent states replay
    // their own reveal on click/activation (see initSyncedAccordion
    // and initTabPanels above).
    initLayerReveals(document.querySelectorAll(".sync-accordion-visual .state.is-active"));
    initLayerReveals(document.querySelectorAll(".checkout-panel.is-active .checkout-panel-visual"));

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
