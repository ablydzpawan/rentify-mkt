/* =========================================================
   DEMO VIDEOS — page motion layer. Same Lenis + GSAP +
   ScrollTrigger setup as the other pages, plus: scroll reveals
   for each tutorial card (image unveil, copy, then a play
   button pop with a pulsing ring) and a video modal that grows
   out of the clicked thumbnail and shrinks back into it.
   ========================================================= */

import { revealHeading, revealSection } from "../text-effects.js";
import { initHeader } from "../header-effects.js";
import { initFaqEffects } from "../faq-effects.js";

gsap.registerPlugin(ScrollTrigger);

// FAQ accordion: drawn lines, row entrance, single-open (js/faq-effects.js)
initFaqEffects();

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

/* ---------- Header: solid on scroll, hides on scroll down, returns
   on scroll up (shared, see js/header-effects.js) ---------- */

initHeader(window.lenis || null);

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
   VIDEO MODAL — clicking a thumbnail opens the modal with the
   player frame morphing out of that thumbnail's rect (FLIP),
   and closing morphs it back. The video starts inside the click
   handler so browsers treat it as user-initiated playback.
   ========================================================= */

(function () {
    var modal = document.getElementById("videoModal");
    if (!modal) return;

    var backdrop = modal.querySelector(".video-modal-backdrop");
    var head = modal.querySelector(".video-modal-head");
    var frame = modal.querySelector(".video-modal-frame");
    var player = modal.querySelector(".video-modal-player");
    var titleEl = modal.querySelector(".video-modal-title");
    var closeBtn = modal.querySelector(".video-modal-close");

    var activeThumb = null;
    var isOpen = false;

    // transform that makes the frame sit exactly over the thumbnail
    var flipFrom = function (thumb) {
        var from = thumb.getBoundingClientRect();
        var to = frame.getBoundingClientRect();
        return {
            x: from.left - to.left,
            y: from.top - to.top,
            scaleX: from.width / to.width,
            scaleY: from.height / to.height,
        };
    };

    var open = function (thumb) {
        if (isOpen) return;
        isOpen = true;
        activeThumb = thumb;

        var card = thumb.closest(".video-card");
        var title = card && card.querySelector(".video-card-title");
        titleEl.textContent = title ? title.textContent.trim() : "";

        player.src = thumb.getAttribute("data-video");
        modal.hidden = false;
        document.documentElement.classList.add("video-modal-open");
        if (lenis) lenis.stop();

        var playPromise = player.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () { /* user can press play */ });

        closeBtn.focus({ preventScroll: true });

        if (prefersReducedMotion) return;

        gsap.killTweensOf([backdrop, head, frame]);
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
        gsap.fromTo(frame,
            Object.assign({ transformOrigin: "0 0" }, flipFrom(thumb)),
            { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.75, ease: "expo.out", clearProps: "transform" }
        );
        gsap.fromTo(head, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" });
    };

    var finishClose = function () {
        modal.hidden = true;
        player.removeAttribute("src");
        player.load();
        document.documentElement.classList.remove("video-modal-open");
        if (lenis) lenis.start();
        if (activeThumb) activeThumb.focus({ preventScroll: true });
        activeThumb = null;
        isOpen = false;
    };

    var close = function () {
        if (!isOpen) return;
        player.pause();

        if (prefersReducedMotion || !activeThumb) {
            finishClose();
            return;
        }

        gsap.killTweensOf([backdrop, head, frame]);
        gsap.to(head, { opacity: 0, duration: 0.2, ease: "power1.out" });
        gsap.to(frame, Object.assign({ transformOrigin: "0 0", duration: 0.55, ease: "expo.inOut" }, flipFrom(activeThumb)));
        gsap.to(frame, { opacity: 0, duration: 0.2, delay: 0.4 });
        gsap.to(backdrop, {
            opacity: 0, duration: 0.5, delay: 0.1, ease: "power2.inOut",
            onComplete: function () {
                gsap.set(frame, { clearProps: "transform,opacity" });
                finishClose();
            },
        });
    };

    document.querySelectorAll(".video-card-thumb[data-video]").forEach(function (thumb) {
        thumb.addEventListener("click", function () { open(thumb); });
    });

    modal.querySelectorAll("[data-video-close]").forEach(function (el) {
        el.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
        if (!isOpen) return;

        if (e.key === "Escape") {
            e.preventDefault();
            close();
            return;
        }

        // keep Tab cycling between the close button and the player
        if (e.key === "Tab") {
            var focusables = [closeBtn, player];
            var index = focusables.indexOf(document.activeElement);
            e.preventDefault();
            var next = e.shiftKey ? index - 1 : index + 1;
            focusables[(next + focusables.length) % focusables.length].focus();
        }
    });
})();

if (!prefersReducedMotion) {

    var revealEase = "power3.out";
    if (window.CustomEase) {
        CustomEase.create("framerReveal", "0.16, 1, 0.3, 1");
        revealEase = "framerReveal";
    }

    /* ---------- Card scene: image unveil -> copy -> play pop ----------
       The thumbnail opens outward from its centre (where the play
       button sits) as a rounded window, while it tilts forward out
       of a slight 3D angle and pulls into focus. `tilt` (-1, 0, 1)
       swings the card in from the side it sits on, so the two
       cards of a pair lean in towards each other. The copy fades
       up alongside, and the play button springs in last; once it
       lands, the CSS ripple ring starts. */

    var cardScene = function (card, timeline, position, tilt) {
        var img = card.querySelector(".video-card-thumb img");
        var copy = card.querySelectorAll(".video-card-content > *");
        var play = card.querySelector(".play-btn");

        timeline.fromTo(img,
            {
                clipPath: "inset(38% 38% 38% 38% round 48px)",
                rotateX: 14,
                rotateY: (tilt || 0) * 12,
                y: 40,
                scale: 0.94,
                filter: "blur(10px)",
                transformPerspective: 1100,
                transformOrigin: "50% 100%",
            },
            {
                clipPath: "inset(0% 0% 0% 0% round 20px)",
                rotateX: 0,
                rotateY: 0,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: 1.25,
                ease: "expo.out",
            },
            position
        );

        timeline.from(copy, { opacity: 0, y: 24, duration: 0.8, stagger: 0.08, ease: revealEase }, "<0.15");

        timeline.fromTo(play,
            { scale: 0, rotate: -90, opacity: 0 },
            {
                scale: 1, rotate: 0, opacity: 1, duration: 0.7, ease: "back.out(2.2)",
                onStart: function () { card.classList.remove("is-revealed"); },
                onComplete: function () { card.classList.add("is-revealed"); },
                onReverseComplete: function () { card.classList.remove("is-revealed"); },
            },
            "<0.35"
        );

        return timeline;
    };

    /* ---------- Hero heading + featured tutorial ---------- */

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    revealHeading(document.querySelector(".video-hero .title"), { timeline: heroTl, position: 0 });
    heroTl.from(".video-hero .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

    var featureCard = document.querySelector(".video-card-feature");
    // image sits on the right of the feature band
    if (featureCard) cardScene(featureCard, heroTl, "-=0.2", -1);

    /* ---------- Tutorial cards ---------- */

    document.querySelectorAll(".video-library .video-card").forEach(function (card) {
        // the second card of a pair trails the first slightly
        var inGrid = card.parentElement.classList.contains("video-grid");
        var delay = inGrid && card.previousElementSibling ? 0.12 : 0;

        var tl = gsap.timeline({
            delay: delay,
            scrollTrigger: {
                trigger: card,
                start: "top 82%",
                toggleActions: "play none none reverse",
            },
        });

        if (card.classList.contains("video-card-wide")) {
            tl.from(card, { opacity: 0, y: 40, duration: 0.9, ease: revealEase }, 0);
            cardScene(card, tl, 0.1, 0);
        } else {
            cardScene(card, tl, 0, card.previousElementSibling ? -1 : 1);
        }
    });

    /* ---------- Section heading + description reveals ---------- */

    document.querySelectorAll(".section").forEach(revealSection);

    /* ---------- FAQ rows and footer columns ---------- */

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

    revealGroup(".footer-top .row", ".col-auto", { y: 25, stagger: 0.1 });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
