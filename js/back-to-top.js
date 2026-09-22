/* =========================================================
   BACK TO TOP — common module, loaded via its own <script> tag
   on every page. Shows a fixed button once the page has scrolled
   past SHOW_AFTER, hidden otherwise; clicking it scrolls smoothly
   back to the top.

   Scrolls through window.lenis when the page's own script exposed
   one (see js/page-js/*.js) so the button's scroll goes through
   Lenis's virtual scroll state instead of a plain window.scrollTo,
   which would desync Lenis from the browser's real scroll position
   and cause a jump/stutter on the next wheel scroll. Pages with no
   motion stack loaded (no Lenis, e.g. under prefers-reduced-motion)
   fall back to the native scrollTo.

   Visibility is driven by a rAF poll rather than a "scroll" event
   listener: this file is a plain <script>, loaded (and run) before
   the page's own type="module" script has had a chance to create
   Lenis and set window.lenis, so wiring up window.lenis.on("scroll",
   ...) at setup time would silently miss it — and Lenis's smoothed
   virtual scroll doesn't reliably dispatch native "scroll" events to
   fall back on either. Polling window.lenis fresh every frame sidesteps
   both problems, and is cheap enough that the site already does the
   same thing via GSAP's own ticker.
   ========================================================= */

function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SHOW_AFTER = 400;

    function currentScroll() {
        return window.lenis ? window.lenis.scroll : window.scrollY;
    }

    function tick() {
        btn.classList.toggle("is-visible", currentScroll() > SHOW_AFTER);
        requestAnimationFrame(tick);
    }
    tick();

    btn.addEventListener("click", function () {
        if (window.lenis) {
            window.lenis.scrollTo(0, { duration: prefersReducedMotion ? 0 : 1.2 });
        } else {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        }
    });
}

// This script's own <script> tag sits earlier in the document than
// the .back-to-top button markup (grouped with cursor.js/nav-text-roll.js
// rather than down by </body>), so querying for the button immediately
// would run before it exists in the DOM yet.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackToTop);
} else {
    initBackToTop();
}
