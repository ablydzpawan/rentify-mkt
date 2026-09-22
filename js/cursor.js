/* =========================================================
   CUSTOM CURSOR — a small dot plus a trailing ring that follows
   the pointer, growing into a soft highlight over links, buttons
   and hero imagery for a tactile hover affordance.

   Self-contained (no GSAP dependency) so it can run on every
   page, including the lightweight ones that don't load the
   motion stack. Skipped entirely on touch/coarse-pointer devices
   and under prefers-reduced-motion, leaving the native cursor
   untouched in both cases.
   ========================================================= */

(function () {
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || prefersReducedMotion) return;

    var dot = document.createElement("div");
    dot.className = "custom-cursor-dot";

    var ring = document.createElement("div");
    ring.className = "custom-cursor-ring";

    var dragLabel = document.createElement("span");
    dragLabel.className = "custom-cursor-label";
    dragLabel.textContent = "Drag";
    ring.appendChild(dragLabel);

    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add("has-custom-cursor");

    var mouseX = 0, mouseY = 0;
    var ringX = 0, ringY = 0;
    var started = false;

    window.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0) translate(-50%,-50%)";

        if (!started) {
            started = true;
            ringX = mouseX;
            ringY = mouseY;
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        }
    });

    document.addEventListener("mouseleave", function () {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
    });

    document.addEventListener("mouseenter", function () {
        if (started) {
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        }
    });

    // The ring eases toward the dot's position every frame, so it trails
    // behind with a soft lag instead of snapping to the pointer.
    (function raf() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0) translate(-50%,-50%)";
        requestAnimationFrame(raf);
    })();

    var hoverSelector = [
        "a", "button", "input", "textarea", "select", "label",
        "[role='button']", ".panel", ".word-wrap", ".accordion-card",
        ".faq-list-link", ".toggle-switch", ".cycle-label"
    ].join(", ");

    // Swiper carousels get their own "Drag" cursor instead of the plain
    // hover ring, so the draggable strip reads as draggable at a glance.
    var dragSelector = ".swiper, .swiper-slide";

    var activeHoverEl = null;
    var activeDragEl = null;

    document.addEventListener("mouseover", function (e) {
        if (!e.target.closest) return;

        var hoverEl = e.target.closest(hoverSelector);
        if (hoverEl) {
            if (hoverEl === activeHoverEl) return;
            activeHoverEl = hoverEl;
            ring.classList.add("is-hover");
            if (hoverEl.matches("input, textarea")) ring.classList.add("is-text");
            return;
        }

        var dragEl = e.target.closest(dragSelector);
        if (dragEl && dragEl !== activeDragEl) {
            activeDragEl = dragEl;
            ring.classList.add("is-drag");
            dot.classList.add("is-hidden");
        }
    });

    document.addEventListener("mouseout", function (e) {
        var related = e.relatedTarget;

        // Moving between nested children of the same hoverable/draggable
        // element shouldn't flicker the state off and back on.
        if (activeHoverEl && !(related && activeHoverEl.contains(related))) {
            ring.classList.remove("is-hover", "is-text");
            activeHoverEl = null;
        }

        if (activeDragEl && !(related && activeDragEl.contains(related))) {
            ring.classList.remove("is-drag");
            dot.classList.remove("is-hidden");
            activeDragEl = null;
        }
    });

    document.addEventListener("mousedown", function () { ring.classList.add("is-active"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("is-active"); });
})();
