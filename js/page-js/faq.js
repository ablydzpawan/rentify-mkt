/* =========================================================
   FAQ — page motion layer. Same Lenis + GSAP + ScrollTrigger
   setup as the other pages, plus: category tab switching,
   single-open accordion, and a scroll-velocity linked curved
   text marquee.
   ========================================================= */

import { revealHeading, revealSection } from "../text-effects.js";

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
   CATEGORY TABS — click a pill, show that category's group,
   hide the rest. Keyboard-accessible (native <button>s, so
   Tab/Enter/Space already work with no extra wiring).
   ========================================================= */

(function () {
    var tabs = document.querySelectorAll(".pill-tabs button");
    var groups = document.querySelectorAll(".faq-group");
    if (!tabs.length || !groups.length) return;

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            if (tab.classList.contains("active")) return;

            tabs.forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");

            var targetId = tab.getAttribute("data-target");
            var nextGroup = document.getElementById(targetId);

            groups.forEach(function (group) {
                if (group === nextGroup) return;
                group.classList.remove("active");
            });

            if (nextGroup) {
                if (!prefersReducedMotion && window.gsap) {
                    gsap.fromTo(nextGroup, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
                }
                nextGroup.classList.add("active");
            }

            if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });
})();

/* ---------- Single-open accordion within each category ---------- */

(function () {
    document.querySelectorAll(".faq-list-numbered").forEach(function (list) {
        list.addEventListener("show.bs.collapse", function (e) {
            list.querySelectorAll(".collapse.show").forEach(function (open) {
                if (open !== e.target && window.bootstrap) {
                    bootstrap.Collapse.getOrCreateInstance(open).hide();
                }
            });

            var item = e.target.closest(".faq-list-item");
            list.querySelectorAll(".faq-list-item.active").forEach(function (i) { i.classList.remove("active"); });
            if (item) item.classList.add("active");
        });
    });
})();

/* =========================================================
   CURVED MARQUEE — text drifts continuously along the arc,
   accelerating with scroll velocity (same language as the
   contact page's hero marquee).
   ========================================================= */

(function () {
    var path = document.getElementById("curvedMarqueePath");
    var textPath = document.getElementById("curvedMarqueeTextPath");
    if (!path || !textPath || prefersReducedMotion) return;

    var pathLength = path.getTotalLength();
    var offset = 0;
    var lastScroll = window.scrollY;
    var velocity = 0;

    gsap.ticker.add(function () {
        var current = lenis ? lenis.scroll : window.scrollY;
        var delta = current - lastScroll;
        lastScroll = current;
        velocity += (delta - velocity) * 0.15;

        offset -= 0.9 + Math.abs(velocity) * 0.6;
        if (offset < -pathLength) offset += pathLength;
        if (offset > 0) offset -= pathLength;

        textPath.setAttribute("startOffset", offset);
    });
})();

if (!prefersReducedMotion) {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* ---------- Hero heading ("Fade Up Words") + floating images ----------
       Text reveals fully first, then the floating product images start —
       no overlap between the two groups. */

    var heroHeading = document.querySelector(".faq-hero-content .title");

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    revealHeading(heroHeading, { timeline: heroTl, position: 0 });
    heroTl.from(".faq-hero-content .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

    // Floating product images clip-reveal in (mask rises to uncover each
    // one, paired with a zoom-settle) instead of a plain fade. Only starts
    // once the text above has fully finished revealing.
    heroTl.fromTo(".faq-hero-float img",
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.9, stagger: 0.1, ease: "power3.out" },
        ">"
    );

    heroTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".faq-hero-float").forEach(function (float, i) {
            gsap.timeline({
                repeat: -1,
                yoyo: true,
                delay: i * 0.2,
                defaults: { duration: 2.8 + (i % 3) * 0.5, ease: "sine.inOut" },
            }).to(float, {
                y: i % 2 === 0 ? "-=10" : "+=10",
                rotate: i % 2 === 0 ? 0.8 : -0.8,
            });
        });
    });

    /* ---------- Section heading + description reveals ---------- */

    document.querySelectorAll(".section").forEach(revealSection);

    /* ---------- FAQ tabs + first category's items ---------- */

    gsap.from(".pill-tabs li", {
        opacity: 0, y: 12, duration: 0.6, stagger: 0.05, ease: revealEase,
        scrollTrigger: { trigger: ".faq-tabs", start: "top 85%", toggleActions: "play none none reverse" },
    });

    gsap.from("#Rentify .faq-list-item", {
        opacity: 0, y: 20, duration: 0.7, stagger: 0.06, ease: revealEase,
        scrollTrigger: { trigger: ".faq-contents", start: "top 80%", toggleActions: "play none none reverse" },
    });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
