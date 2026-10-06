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

    /* ---------- Hero heading ("Fade Up Words") + subtext ---------- */

    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    revealHeading(document.querySelector(".first-fold-content .title"), { timeline: heroTl, position: 0 });
    heroTl.from(".first-fold-content .desc", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

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
