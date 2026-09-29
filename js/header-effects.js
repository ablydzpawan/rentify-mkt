/* =========================================================
   HEADER EFFECTS — common helper module (imported by every
   js/page-js/*.js page script). The header motion from
   trustedconnectivity.valid.com:

   - past 10px of scroll the header switches to its solid
     .is-scrolled state (styled in _header.scss)
   - scrolling down slides it up out of view (0.6s power2.out)
   - it comes back once the reader has scrolled back up 200px
     from where they turned around, or is near the top again

   It stays put while the mobile menu is open or while keyboard
   focus is inside it, and under reduced motion it never hides.
   ========================================================= */

var TOP_ZONE = 10;
var REVEAL_AFTER = 200;

export function initHeader(lenis) {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var root = document.documentElement;
    var canHide = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var hidden = false;
    var last = currentScroll();
    var way = 0;         // 1 = scrolling down, 0 = up
    var turnedAt = last; // scroll position of the last change of direction

    function currentScroll() {
        return lenis ? lenis.scroll : window.scrollY;
    }

    function slide(toHidden) {
        if (hidden === toHidden) return;
        hidden = toHidden;
        header.classList.toggle("is-hidden", toHidden);
        gsap.to(header, { yPercent: toHidden ? -100 : 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
    }

    function update() {
        var y = currentScroll();
        header.classList.toggle("is-scrolled", y > TOP_ZONE);

        if (y === last) return;
        var nextWay = y > last ? 1 : 0;
        if (nextWay !== way) turnedAt = last; // where the reader turned around
        way = nextWay;
        last = y;

        if (!canHide) return;

        var keepShown = root.classList.contains("menu-open") || header.contains(document.activeElement);
        if (y < TOP_ZONE || y < turnedAt - REVEAL_AFTER || keepShown) slide(false);
        else if (way === 1) slide(true);
    }

    if (lenis) lenis.on("scroll", update);
    else window.addEventListener("scroll", update, { passive: true });
    update();

    // tabbing into a hidden header brings it back
    header.addEventListener("focusin", function () { slide(false); });
}
