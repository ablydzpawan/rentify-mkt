/* =========================================================
   LEGAL — Privacy Policy + Terms of Use motion layer.
   Same Lenis + GSAP + ScrollTrigger setup as the other pages,
   plus a hero heading reveal and a fade-up for each policy
   block as it scrolls in.
   ========================================================= */

import { revealHeading } from "../text-effects.js";

gsap.registerPlugin(ScrollTrigger);

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var lenis = null;

if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // exposed so js/back-to-top.js can scroll through Lenis's virtual
    // scroll instead of a plain window.scrollTo (which would desync it)
    window.lenis = lenis;
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

    nav.addEventListener("mouseleave", function () { nav.classList.remove("is-tab-active"); });
    nav.addEventListener("focusout", function (e) {
        if (!nav.contains(e.relatedTarget)) nav.classList.remove("is-tab-active");
    });
})();

if (!prefersReducedMotion) {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* ---------- Hero: eyebrow, heading, intro ---------- */

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTl.from(".legal-eyebrow", { y: 12, opacity: 0, duration: 0.5 }, 0);
    revealHeading(document.querySelector(".legal-hero .title"), { timeline: heroTl, position: 0.1 });
    heroTl.from(".legal-hero .desc, .legal-updated", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5");

    /* ---------- Policy blocks ---------- */

    gsap.utils.toArray(".legal-block").forEach(function (block) {
        gsap.from(block, {
            opacity: 0, y: 24, duration: 0.8, ease: revealEase,
            scrollTrigger: { trigger: block, start: "top 88%", toggleActions: "play none none reverse" },
        });
    });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
