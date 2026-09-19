/* =========================================================
   PRICING — page motion layer. Same Lenis + GSAP + ScrollTrigger
   setup as js/motion.js and js/page-js/how-to-start.js, scoped to
   this page's own markup (pricing cards, comparison table).
   ========================================================= */

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

    /* ---------- Hero heading + subtext ---------- */

    gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".first-fold-content .title", { y: 30, opacity: 0, filter: "blur(10px)", duration: 0.9 }, 0)
        .from(".first-fold-content .desc", { y: 20, opacity: 0, duration: 0.7 }, "-=0.55");

    /* ---------- Section heading + description reveals ---------- */

    document.querySelectorAll(".section").forEach(function (section) {
        var heading = section.querySelector(".section-heading");
        var descs = section.querySelectorAll(".section-text-desc");

        var tl = gsap.timeline({
            scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none reverse" }
        });

        if (heading) {
            tl.from(heading, { opacity: 0, filter: "blur(20px)", y: 20, duration: 1, ease: "power2.out" });
        }
        if (descs.length) {
            tl.from(descs, { y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power2.out" }, "-=0.8");
        }
    });

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
       the two rotated tags fly in from opposite angles and settle
       with a bouncy overshoot, instead of a flat fade. ---------- */

    document.querySelectorAll(".section-num").forEach(function (badge) {
        var num = badge.querySelector(".num");
        var caption = badge.querySelector(".caption");
        if (!num || !caption) return;

        gsap.timeline({
            scrollTrigger: { trigger: badge, start: "top 88%", toggleActions: "play none none reverse" },
        })
            .from(num, {
                opacity: 0, scale: 0.4, rotate: -60,
                duration: 0.7, ease: "back.out(1.9)",
            }, 0)
            .from(caption, {
                opacity: 0, scale: 0.4, rotate: 60, x: -20,
                duration: 0.7, ease: "back.out(1.9)",
            }, 0.12);
    });

    /* ---------- Billing toggle row ---------- */

    revealGroup(".bg-pricing-page .text-center", ".billing-toggle", { y: 16, duration: 0.6, stagger: 0 });

    /* ---------- Pricing cards — the four cards already overlap in a
       fanned stack (each one shifted left, rising z-index). The
       entrance plays that up: they fly in from below at alternating
       angles and settle into the stack. A second, continuous
       scroll-scrubbed tween then gently fans them further apart the
       whole time the section is in view, and pulls them back together
       as it leaves — using `x`, so it never fights the entrance
       tween's y/rotate/scale. ---------- */

    document.querySelectorAll(".plans").forEach(function (plans) {
        var cards = plans.querySelectorAll(".card");
        if (!cards.length) return;

        gsap.from(cards, {
            opacity: 0, y: 60, scale: 0.94,
            rotate: function (i) { return i % 2 === 0 ? -6 : 6; },
            duration: 0.8, stagger: 0.12, ease: "back.out(1.4)",
            scrollTrigger: { trigger: plans, start: "top 85%", toggleActions: "play none none reverse" },
        });

        cards.forEach(function (card, i) {
            // each card already sits at its own translateX(...) offset
            // in CSS (the overlapping stack) — "+=" adds this spread
            // relative to that base instead of replacing it, so the
            // stack fans out further without snapping back together
            var spread = (i - (cards.length - 1) / 2) * 26;
            gsap.to(card, {
                x: "+=" + spread, ease: "none",
                scrollTrigger: { trigger: plans, start: "top bottom", end: "bottom top", scrub: 0.8 },
            });
        });
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
