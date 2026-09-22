/* =========================================================
   CONTACT US — page motion layer. Same Lenis + GSAP +
   ScrollTrigger setup as the other pages, plus a scroll-velocity
   linked hero marquee (speeds up/slows down with how fast you
   scroll, inspired by wearemotto.com/contact).
   ========================================================= */

import { revealSection } from "../text-effects.js";

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

/* =========================================================
   SCROLL-VELOCITY MARQUEE — "CONTACT * CONTACT * ..." drifts at
   a gentle base speed and accelerates (in whichever direction
   you're scrolling) the faster you scroll, easing back to the
   base speed once you stop.
   ========================================================= */

(function () {
    var track = document.querySelector("#contact-marquee .marquee-track");
    if (!track) return;

    if (prefersReducedMotion) return; // CSS keyframe stays disabled; track holds still, fully readable.

    var baseSpeed = 40; // px/sec, constant drift
    var x = 0;
    var trackWidth = 0;
    var lastScroll = window.scrollY;
    var velocity = 0; // smoothed scroll speed, px/frame

    var measure = function () { trackWidth = track.scrollWidth / 2; };
    measure();
    window.addEventListener("resize", measure);

    var readScroll = function () {
        var current = lenis ? lenis.scroll : window.scrollY;
        var delta = current - lastScroll;
        lastScroll = current;
        return delta;
    };

    gsap.ticker.add(function () {
        var delta = readScroll();
        // Smooth the raw per-frame scroll delta so the marquee eases
        // rather than jittering with every tiny scroll event.
        velocity += (delta - velocity) * 0.15;

        var speed = baseSpeed / 60 + velocity * 1.8;
        x -= speed;

        if (trackWidth) {
            if (x <= -trackWidth) x += trackWidth;
            if (x > 0) x -= trackWidth;
        }

        gsap.set(track, { x: x });
    });
})();

/* ---------- Contact form: lightweight client-side feedback ---------- */

(function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = form.querySelector(".btn-theme span");
        if (!btn) return;
        var original = btn.textContent;
        btn.textContent = "Thank you!";
        form.reset();
        setTimeout(function () { btn.textContent = original; }, 2200);
    });
})();

if (!prefersReducedMotion) {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* ---------- Section heading + description reveals ---------- */

    document.querySelectorAll(".section").forEach(revealSection);

    var revealGroup = function (containerSelector, itemSelector, vars) {
        document.querySelectorAll(containerSelector).forEach(function (container) {
            var items = container.querySelectorAll(itemSelector);
            if (!items.length) return;

            gsap.from(items, Object.assign({
                opacity: 0, y: 30, duration: 0.8, ease: revealEase, stagger: 0.08,
                scrollTrigger: { trigger: container, start: "top 85%", toggleActions: "play none none reverse" },
            }, vars || {}));
        });
    };

    /* ---------- Contact details + form card ---------- */

    revealGroup("#get-in-touch .contact-info", ".contact-details li", { x: -20, y: 0, stagger: 0.08 });
    revealGroup("#get-in-touch", ".contact-form-card", { y: 40, scale: 0.97, duration: 0.9, stagger: 0 });

    /* ---------- Map ---------- */

    revealGroup("#contact-map", ".map-frame", { y: 40, duration: 0.9, stagger: 0 });
    revealGroup("#contact-map", ".map-card", { x: 24, y: -10, duration: 0.7, stagger: 0 });

    /* ---------- Why choose cards ---------- */

    revealGroup(".why-choose-grid", ".why-choose-card", { y: 50, scale: 0.95, stagger: 0.1 });

    /* ---------- FAQ + footer ---------- */

    revealGroup(".faq-list", ".faq-list-item", { y: 20, stagger: 0.1 });
    revealGroup(".footer-top .row", ".col-auto", { y: 25, stagger: 0.1 });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
