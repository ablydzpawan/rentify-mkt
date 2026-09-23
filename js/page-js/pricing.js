/* =========================================================
   PRICING — page motion layer. Same Lenis + GSAP + ScrollTrigger
   setup as js/page-js/index.js and js/page-js/how-to-start.js,
   scoped to this page's own markup (pricing cards, comparison
   table).
   ========================================================= */

import { revealHeading, revealSection } from "../text-effects.js";

gsap.registerPlugin(ScrollTrigger);

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll ---------- */

if (!prefersReducedMotion && window.Lenis) {
    var lenis = new Lenis({
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
   BILLING TOGGLE — swaps every [data-monthly]/[data-yearly]
   price on the page (cards + comparison table) between the two
   cycles, animating the digit change with a quick GSAP flip.
   ========================================================= */

(function () {
    var toggle = document.querySelector(".toggle-switch");
    var labels = document.querySelectorAll(".cycle-label");
    var prices = document.querySelectorAll(".price[data-monthly]");
    if (!toggle) return;

    var setCycle = function (yearly) {
        toggle.setAttribute("aria-checked", yearly ? "true" : "false");

        labels.forEach(function (label) {
            var isYearly = label.getAttribute("data-cycle") === "yearly";
            label.classList.toggle("active", isYearly === yearly);
        });

        prices.forEach(function (price) {
            var next = price.getAttribute(yearly ? "data-yearly" : "data-monthly");
            if (!next) return;

            if (window.gsap && !prefersReducedMotion) {
                gsap.fromTo(price, { y: -6, opacity: 0 }, {
                    y: 0, opacity: 1, duration: 0.35, ease: "power2.out",
                    onStart: function () { price.textContent = "$" + next; },
                });
            } else {
                price.textContent = "$" + next;
            }
        });
    };

    toggle.addEventListener("click", function () {
        setCycle(toggle.getAttribute("aria-checked") !== "true");
    });

    labels.forEach(function (label) {
        label.addEventListener("click", function () {
            setCycle(label.getAttribute("data-cycle") === "yearly");
        });
    });
})();

if (!prefersReducedMotion) {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* ---------- Hero heading ("Fade Up Words") + subtext ---------- */

    var heroHeading = document.querySelector(".first-fold-content .title");

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    revealHeading(heroHeading, { timeline: heroTl, position: 0 });
    heroTl.from(".first-fold-content .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

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

    /* ---------- Section badge ("01 pricing" / "02 plan compare") —
       the caption unrolls left-to-right like a strip of tape being
       pulled, then the number tag is stamped down on top of it (drops
       in oversized, lands with a small squash). clearProps hands the
       transform back to the stylesheet once the tween is done. ---------- */

    document.querySelectorAll(".section-num").forEach(function (badge) {
        var num = badge.querySelector(".num");
        var caption = badge.querySelector(".caption");
        if (!num || !caption) return;

        gsap.timeline({
            scrollTrigger: { trigger: badge, start: "top 88%", toggleActions: "play none none reverse" },
        })
            .fromTo(caption, { clipPath: "inset(0 100% 0 0 round 20px)" }, {
                clipPath: "inset(0 0% 0 0 round 20px)",
                duration: 0.6, ease: "power3.inOut", clearProps: "clipPath",
            }, 0)
            .from(num, {
                opacity: 0, scale: 2.2, yPercent: -120,
                duration: 0.45, ease: "power4.in",
            }, 0.4)
            .to(num, {
                keyframes: [
                    { scaleX: 1.15, scaleY: 0.85, duration: 0.08 },
                    { scaleX: 1, scaleY: 1, duration: 0.3, ease: "back.out(3)" },
                ],
                clearProps: "transform",
            });
    });

    /* ---------- Billing toggle row ---------- */

    revealGroup(".bg-pricing-page .text-center", ".billing-toggle", { y: 16, duration: 0.6, stagger: 0 });

    /* ---------- Pricing cards — dealt out like a hand of cards: all
       four start collapsed onto the first card's spot as one deck,
       then slide out to their places in the overlapping stack, top
       card (Enterprise) first. Offsets are measured from the live layout, so it works
       for the 4-up row and the stacked mobile column alike. ---------- */

    document.querySelectorAll(".plans").forEach(function (plans) {
        var cards = plans.querySelectorAll(".card");
        if (!cards.length) return;

        var offset = function (card, axis) {
            var first = cards[0].getBoundingClientRect();
            var rect = card.getBoundingClientRect();
            return axis === "x" ? first.left - rect.left : first.top - rect.top;
        };

        gsap.timeline({
            scrollTrigger: {
                trigger: plans, start: "top 80%",
                toggleActions: "play none none reverse", invalidateOnRefresh: true,
            },
        })
            .from(cards, {
                opacity: 0, duration: 0.4, ease: "power1.out",
            })
            .from(cards, {
                // relative "+=" keeps each card's CSS translateX(...)
                // stack offset as the resting value and animates in
                // from the deck spot
                x: function (i, card) { return "+=" + offset(card, "x"); },
                y: function (i, card) { return "+=" + offset(card, "y"); },
                rotate: function (i) { return (i - 1.5) * -3; },
                duration: 0.9, stagger: { each: 0.1, from: "end" }, ease: "power4.out",
            }, 0.35);
    });

    /* ---------- Comparison table: header cards, category rows, and
       each row of the body stagger in as the table scrolls into view. ---------- */

    revealGroup(".compareTable thead", ".tier-col", { y: -20, duration: 0.6, stagger: 0.08 });
    revealGroup(".compareTable tbody", ".cat-row", { x: -20, y: 0, duration: 0.6, stagger: 0.15 });

    document.querySelectorAll(".compareTable tbody").forEach(function (body) {
        var rows = body.querySelectorAll("tr:not(.cat-row)");
        if (!rows.length) return;

        gsap.from(rows, {
            opacity: 0, y: 14, duration: 0.5, stagger: 0.03, ease: revealEase,
            scrollTrigger: { trigger: body, start: "top 80%", toggleActions: "play none none reverse" },
        });
    });

    revealGroup(".compareTable tfoot", ".btn", { y: 16, duration: 0.6, stagger: 0.08 });

    /* ---------- Featured column: one-time light sweep across the
       "Business Pro" header as it scrolls into view. ---------- */

    document.querySelectorAll(".compareTable .shine").forEach(function (shine) {
        gsap.fromTo(shine, { xPercent: -120 }, {
            xPercent: 120, duration: 1.1, ease: "power2.inOut",
            scrollTrigger: { trigger: shine, start: "top 80%", toggleActions: "play none none none" },
        });
    });

    /* ---------- Comparison table: hovering any cell highlights the
       whole column (header, body and footer) it belongs to. ---------- */

    document.querySelectorAll(".compareTable").forEach(function (table) {
        var rows = table.querySelectorAll("tr");

        rows.forEach(function (row) {
            var cells = row.querySelectorAll(".tier-col");
            cells.forEach(function (cell) {
                var colIndex = Array.prototype.indexOf.call(row.children, cell);

                cell.addEventListener("mouseenter", function () {
                    rows.forEach(function (r) {
                        var match = r.children[colIndex];
                        if (match && match.classList.contains("tier-col")) match.classList.add("is-col-hover");
                    });
                });

                cell.addEventListener("mouseleave", function () {
                    rows.forEach(function (r) {
                        var match = r.children[colIndex];
                        if (match) match.classList.remove("is-col-hover");
                    });
                });
            });
        });
    });

    /* ---------- FAQ + footer ---------- */

    revealGroup(".faq-list", ".faq-list-item", { y: 20, stagger: 0.1 });
    revealGroup(".footer-top .row", ".col-auto", { y: 25, stagger: 0.1 });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
