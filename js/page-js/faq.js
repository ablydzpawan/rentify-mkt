/* =========================================================
   FAQ — page motion layer. Same Lenis + GSAP + ScrollTrigger
   setup as the other pages, plus: category tab switching,
   single-open accordion, a seamless curved text marquee, and
   the pririty.com motion language (text-split slide/fade
   effects, blur-scale image reveals, drawn divider lines,
   scroll parallax).
   ========================================================= */

import { revealHeading } from "../text-effects.js";
import { initHeader } from "../header-effects.js";
import { initFaqEffects, playRows } from "../faq-effects.js";

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

/* ---------- Accordion: drawn lines, row entrance, single-open
   (shared with every page's FAQ section, see js/faq-effects.js) ---------- */

initFaqEffects();

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
                nextGroup.classList.add("active");
                nextGroup.querySelectorAll(".faq-list-numbered").forEach(playRows);
            }

            if (window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });
})();

/* =========================================================
   CURVED MARQUEE — text drifts continuously along the arc,
   accelerating with scroll velocity. The offset wraps by the
   length of exactly one "Frequently Asked Questions " unit, so
   the wrap lands on an identical frame: no visible jump.
   ========================================================= */

(function () {
    var textPath = document.getElementById("curvedMarqueeTextPath");
    if (!textPath || prefersReducedMotion) return;

    var UNITS = 5; // repetitions in the markup
    var unitLength = 0;
    var offset = 0;
    var lastScroll = window.scrollY;
    var velocity = 0;

    function measure() {
        unitLength = textPath.getComputedTextLength() / UNITS;
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    gsap.ticker.add(function () {
        if (!unitLength) return;
        var current = lenis ? lenis.scroll : window.scrollY;
        var delta = current - lastScroll;
        lastScroll = current;
        velocity += (delta - velocity) * 0.15;

        offset -= 0.9 + Math.abs(velocity) * 0.6;
        offset %= unitLength; // stays in (-unitLength, 0]

        textPath.setAttribute("startOffset", offset);
    });
})();

/* ---------- Split an element's text into chars (keeps <br>) ---------- */

// Works on text nodes (not innerHTML) so an entity like &amp; stays
// one character.
function splitChars(el) {
    if (el.dataset.charSplit) return el.querySelectorAll(".char");
    el.dataset.charSplit = "1";
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var word = document.createElement("span");
            word.className = "char-word";
            part.split("").forEach(function (c) {
                var ch = document.createElement("span");
                ch.className = "char";
                ch.textContent = c;
                word.appendChild(ch);
            });
            frag.appendChild(word);
        });
        node.parentNode.replaceChild(frag, node);
    });
    return el.querySelectorAll(".char");
}

/* ---------- Play on enter (top at 60%), reset once scrolled back
   below the viewport — the reference's createScrollTrigger. ---------- */

function playOnScroll(trigger, tl) {
    ScrollTrigger.create({
        trigger: trigger,
        start: "top bottom",
        onLeaveBack: function () { tl.progress(0).pause(); },
    });
    ScrollTrigger.create({
        trigger: trigger,
        start: "top 60%",
        onEnter: function () { tl.play(); },
    });
}

if (!prefersReducedMotion) {

    /* ---------- Header drops in from the top ---------- */

    gsap.from(".site-header", { y: -100, opacity: 0, duration: 1, ease: "power3.out", clearProps: "opacity" });

    /* ---------- Hero ----------
       Title words slide up with a slight overshoot, the line under
       it slides in from the right, then the product images resolve
       from a blurred, oversized state (the reference's image reveal:
       scale 1.5 -> 1, blur 40px -> 0, fade in). */

    var heroTl = gsap.timeline({ delay: 0.2 });

    revealHeading(document.querySelector(".faq-hero-content .title"), {
        timeline: heroTl,
        position: 0,
        vars: { yPercent: 100, opacity: 0, duration: 0.5, ease: "back.out(2)", stagger: { amount: 0.5 } },
    });

    heroTl.from(".faq-hero-content .desc", { opacity: 0, x: "1em", duration: 0.6, ease: "power2.out" }, 0.45);

    heroTl.fromTo(".faq-hero-float img",
        { scale: 1.5, opacity: 0, filter: "blur(40px)" },
        {
            scale: 1, opacity: 1, filter: "blur(0px)",
            duration: 1, ease: "power3.out", stagger: 0.12,
            clearProps: "filter",
        },
        0.5
    );

    // gentle idle bob once the reveal has settled
    heroTl.eventCallback("onComplete", function () {
        document.querySelectorAll(".faq-hero-float").forEach(function (float, i) {
            gsap.to(float, {
                y: i % 2 === 0 ? "-=10" : "+=10",
                rotate: i % 2 === 0 ? 0.8 : -0.8,
                duration: 2.8 + (i % 3) * 0.5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: i * 0.2,
            });
        });
    });

    // scroll parallax: each image drifts up at its own rate as the
    // hero scrolls away (yPercent, so it composes with the idle bob's y)
    document.querySelectorAll(".faq-hero-float").forEach(function (float, i) {
        gsap.to(float, {
            yPercent: -[35, 60, 25, 50, 40][i % 5],
            ease: "none",
            scrollTrigger: { trigger: ".faq-hero", start: "top top", end: "bottom top", scrub: true },
        });
    });

    /* ---------- Category tabs ---------- */

    var tabsTl = gsap.timeline({ paused: true });
    tabsTl.from(".pill-tabs li", { opacity: 0, x: "1em", duration: 0.6, ease: "power2.out", stagger: { amount: 0.2 } });
    playOnScroll(".faq-tabs", tabsTl);

    /* ---------- CTA heading: letters fade in, random order ---------- */

    var ctaTitle = document.querySelector("#cta .cta-gradient-title");
    if (ctaTitle) {
        var ctaTl = gsap.timeline({ paused: true });
        ctaTl.from(splitChars(ctaTitle), { opacity: 0, duration: 0.05, ease: "power1.out", stagger: { amount: 0.4, from: "random" } });
        playOnScroll(ctaTitle, ctaTl);
    }

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
}
