/* =========================================================
   FAQ EFFECTS — common helper module (imported by the page
   scripts that have an FAQ accordion, like text-effects.js).
   The pririty.com accordion language, shared by the FAQ page
   and every page's "Frequently asked questions" section:

   - row divider lines draw in (scaleX 0 -> 1, 1s outQuart,
     staggered) when the list scrolls into view — the lines
     are CSS pseudo-elements (_faq-list.scss), JS only flips
     the .is-line-ready / .is-line-drawn classes
   - row content slides in 1em from the right while fading
   - single-open: opening a row closes its siblings
   - the opening answer slides in from the right
   (height tween 0.4s ease + plus -> x turn are CSS)
   ========================================================= */

import { hideCollapse } from "./collapse-offcanvas.js";

var LIST_SELECTOR = ".faq-list, .faq-section .faq-list-numbered, .faq-list-chevron";

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function drawLines(list) {
    list.classList.remove("is-line-drawn");
    list.offsetWidth; // restart from 0 when a list is shown again
    list.classList.add("is-line-drawn");
}

function rowParts(list) {
    return list.querySelectorAll(".faq-list-link, .faq-list-item .collapse.show");
}

/* Row entrance: lines draw, content slides in from the right. Also
   called by faq.js when a category tab reveals another list. */
export function playRows(list) {
    if (prefersReducedMotion) return;
    gsap.fromTo(rowParts(list),
        { opacity: 0, x: "1em" },
        { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", stagger: { amount: 0.3 }, overwrite: true, clearProps: "transform" }
    );
    drawLines(list);
}

function wireAccordion(list) {
    list.addEventListener("collapse:show", function (e) {
        list.querySelectorAll(".collapse.show").forEach(function (open) {
            if (open !== e.target) hideCollapse(open);
        });

        var item = e.target.closest(".faq-list-item");
        list.querySelectorAll(".faq-list-item.active").forEach(function (i) { i.classList.remove("active"); });
        if (item) item.classList.add("active");

        var answer = e.target.querySelector(".faq_data");
        if (answer && !prefersReducedMotion) {
            gsap.fromTo(answer,
                { opacity: 0, x: "1em" },
                { opacity: 1, x: 0, duration: 0.6, delay: 0.08, ease: "power2.out", clearProps: "transform" }
            );
        }
    });
}

/* Wires every FAQ list on the page. Lists inside a hidden container
   (the FAQ page's inactive category tabs) get their entrance from
   playRows() when shown, so only visible ones are scroll-triggered.
   opts.after: a timeline (e.g. the page's hero intro) to wait for
   before the rows may play, so they don't race ahead of it. */
export function initFaqEffects(opts) {
    opts = opts || {};
    document.querySelectorAll(LIST_SELECTOR).forEach(function (list) {
        wireAccordion(list);
        if (prefersReducedMotion) return;

        list.querySelectorAll(".faq-list-item").forEach(function (item, i) {
            item.style.setProperty("--i", i);
        });
        list.classList.add("is-line-ready");

        if (!list.offsetParent) return; // hidden tab

        gsap.set(rowParts(list), { opacity: 0 });
        var watch = function () {
            ScrollTrigger.create({
                trigger: list,
                start: "top 80%",
                once: true,
                onEnter: function () { playRows(list); },
            });
        };
        if (opts.after) opts.after.then(watch);
        else watch();
    });
}
