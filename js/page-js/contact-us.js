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

/* =========================================================
   CONTACT FORM — success "wow" sequence. Native `required`
   validation runs first; on a valid submit the button shows a
   sending state, the fields fold away, then a ring + checkmark
   draw in, a confetti burst fires from the icon and the thank-you
   copy rises in. "Send another message" plays it in reverse.
   ========================================================= */

(function () {
    var form = document.getElementById("contactForm");
    var success = document.getElementById("contactSuccess");
    if (!form || !success) return;

    var card = form.closest(".contact-form-card");
    var confetti = card.querySelector(".form-confetti");
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.querySelector("span");
    var resetBtn = success.querySelector(".form-success-reset");
    var ring = success.querySelector(".form-success-ring");
    var check = success.querySelector(".form-success-check");
    var originalLabel = submitLabel.textContent;

    var confettiColors = ["#2D85FE", "#FFD84D", "#FF6B6B", "#22C55E", "#000E20", "#FEF9AD"];

    var burstConfetti = function () {
        if (!confetti) return;

        var cardRect = card.getBoundingClientRect();
        var iconRect = success.querySelector(".form-success-icon").getBoundingClientRect();
        var originX = iconRect.left - cardRect.left + iconRect.width / 2;
        var originY = iconRect.top - cardRect.top + iconRect.height / 2;

        for (var i = 0; i < 70; i++) {
            var piece = document.createElement("i");
            var size = gsap.utils.random(6, 12);
            piece.style.width = size + "px";
            piece.style.height = (Math.random() > 0.5 ? size : size * 0.45) + "px";
            piece.style.background = confettiColors[i % confettiColors.length];
            piece.style.borderRadius = Math.random() > 0.6 ? "50%" : "2px";
            confetti.appendChild(piece);

            var angle = gsap.utils.random(0, Math.PI * 2);
            var distance = gsap.utils.random(90, Math.max(cardRect.width, 320) * 0.65);

            gsap.set(piece, { x: originX, y: originY, rotate: gsap.utils.random(0, 360), scale: 0 });

            gsap.timeline({ onComplete: piece.remove.bind(piece) })
                .to(piece, {
                    x: originX + Math.cos(angle) * distance,
                    y: originY + Math.sin(angle) * distance * 0.8,
                    scale: 1,
                    rotate: "+=" + gsap.utils.random(-360, 360),
                    duration: gsap.utils.random(0.6, 0.9),
                    ease: "power3.out",
                })
                .to(piece, {
                    y: "+=" + gsap.utils.random(120, 260),
                    rotate: "+=" + gsap.utils.random(-180, 180),
                    opacity: 0,
                    duration: gsap.utils.random(1, 1.6),
                    ease: "power1.in",
                });
        }
    };

    var showSuccess = function () {
        success.hidden = false;

        if (prefersReducedMotion) {
            form.style.visibility = "hidden";
            return;
        }

        var ringLength = ring.getTotalLength();
        var checkLength = check.getTotalLength();

        gsap.timeline({ defaults: { ease: "power3.out" } })
            // squeeze-and-release on the card, like a button press
            .to(card, { scale: 0.97, duration: 0.18, ease: "power2.in" })
            .to(card, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" })
            .to(form.children, {
                opacity: 0, y: -16, duration: 0.35, stagger: 0.04, ease: "power2.in",
                onComplete: function () { form.style.visibility = "hidden"; },
            }, 0)
            .fromTo(success.querySelector(".form-success-icon"),
                { scale: 0.4, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)" }, 0.45)
            .fromTo(ring,
                { strokeDasharray: ringLength, strokeDashoffset: ringLength },
                { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.5)
            .fromTo(check,
                { strokeDasharray: checkLength, strokeDashoffset: checkLength },
                { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, 1.05)
            .add(burstConfetti, 1.1)
            .fromTo(success.querySelectorAll(".form-success-title, .form-success-desc, .form-success-reset"),
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, 1.15);
    };

    var hideSuccess = function () {
        var restore = function () {
            success.hidden = true;
            form.style.visibility = "";
            form.querySelector("input").focus({ preventScroll: true });
        };

        if (prefersReducedMotion) {
            restore();
            return;
        }

        gsap.timeline()
            .to(success.children, { opacity: 0, y: -12, duration: 0.3, stagger: 0.04, ease: "power2.in" })
            .add(function () {
                restore();
                gsap.set(success.children, { clearProps: "opacity,transform" });
            })
            // fromTo with an explicit end state — the fields were left at
            // opacity 0 by showSuccess, so a plain .from() would tween 0 → 0
            .fromTo(form.children,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out", immediateRender: false, clearProps: "opacity,transform" });
    };

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        submitBtn.classList.add("is-loading");
        submitLabel.textContent = "Sending…";

        // No backend wired up yet — simulate the network round-trip.
        setTimeout(function () {
            submitBtn.classList.remove("is-loading");
            submitLabel.textContent = originalLabel;
            form.reset();
            showSuccess();
            resetBtn.focus({ preventScroll: true });
        }, 700);
    });

    resetBtn.addEventListener("click", function () {
        hideSuccess();
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
