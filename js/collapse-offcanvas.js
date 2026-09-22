/* =========================================================
   COLLAPSE + OFFCANVAS — common module, loaded via its own
   <script type="module"> tag on every page. Vanilla replacements
   for the two Bootstrap JS components this site actually used
   (the FAQ/footer accordions and the mobile nav drawer), so the
   ~70KB Bootstrap bundle can be dropped entirely.

   Reads the same data-bs-toggle / data-bs-target / data-bs-dismiss
   markup Bootstrap's own JS auto-wired, and drives the same
   .collapse / .collapsing / .show / .offcanvas-backdrop CSS
   classes already defined in scss/bootstrap, so no styles need
   to change — only the behavior behind them.

   Self-initializes on import (wires up every matching element
   already in the page), and also exports hideCollapse for pages
   (faq.js, features.js) that need to close sibling accordion
   items programmatically.
   ========================================================= */

function resolveTarget(trigger) {
    var sel = trigger.getAttribute("data-bs-target");
    if (!sel) {
        var href = trigger.getAttribute("href");
        if (href && href.charAt(0) === "#") sel = href;
    }
    return sel ? document.querySelector(sel) : null;
}

/* ---------- Collapse ---------- */

function isCollapseShown(target) {
    // Mirrors Bootstrap: an element only counts as "collapsed" once it
    // carries the .collapse class — some targets here (footer groups)
    // start without it, i.e. already open, same as Bootstrap treated them.
    return target.classList.contains("show") ||
        (!target.classList.contains("collapse") && !target.classList.contains("collapsing"));
}

function syncTriggers(target, expanded) {
    if (!target.id) return;
    document.querySelectorAll(
        '[data-bs-toggle="collapse"][data-bs-target="#' + target.id + '"], ' +
        '[data-bs-toggle="collapse"][href="#' + target.id + '"]'
    ).forEach(function (trigger) {
        trigger.setAttribute("aria-expanded", String(expanded));
    });
}

function onHeightTransitionEnd(target, cb) {
    var handler = function (e) {
        if (e.target !== target || e.propertyName !== "height") return;
        target.removeEventListener("transitionend", handler);
        cb();
    };
    target.addEventListener("transitionend", handler);
}

function showCollapse(target) {
    if (!target || target.classList.contains("collapsing") || isCollapseShown(target)) return;

    target.classList.remove("collapse");
    target.classList.add("collapsing");
    target.style.height = "0px";
    target.dispatchEvent(new CustomEvent("collapse:show", { bubbles: true }));
    syncTriggers(target, true);

    target.offsetHeight; // force reflow so the height tween below actually runs
    target.style.height = target.scrollHeight + "px";

    onHeightTransitionEnd(target, function () {
        target.style.height = "";
        target.classList.remove("collapsing");
        target.classList.add("collapse", "show");
        target.dispatchEvent(new CustomEvent("collapse:shown", { bubbles: true }));
    });
}

export function hideCollapse(target) {
    if (!target || target.classList.contains("collapsing") || !isCollapseShown(target)) return;

    target.style.height = target.scrollHeight + "px";
    target.offsetHeight; // force reflow

    target.classList.remove("collapse", "show");
    target.classList.add("collapsing");
    target.dispatchEvent(new CustomEvent("collapse:hide", { bubbles: true }));
    syncTriggers(target, false);

    target.style.height = "0px";

    onHeightTransitionEnd(target, function () {
        target.style.height = "";
        target.classList.remove("collapsing");
        target.classList.add("collapse");
        target.dispatchEvent(new CustomEvent("collapse:hidden", { bubbles: true }));
    });
}

document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
        if (trigger.tagName === "A") e.preventDefault();
        var target = resolveTarget(trigger);
        if (!target) return;
        if (isCollapseShown(target)) hideCollapse(target); else showCollapse(target);
    });
});

/* ---------- Offcanvas ---------- */

var openOffcanvas = null;
var openTrigger = null;
var backdropEl = null;

function onKeydown(e) {
    if (e.key === "Escape" && openOffcanvas) hideOffcanvas(openOffcanvas);
}

function showOffcanvas(target, trigger) {
    if (!target || target.classList.contains("show")) return;
    if (openOffcanvas && openOffcanvas !== target) hideOffcanvas(openOffcanvas);

    openOffcanvas = target;
    openTrigger = trigger || null;
    document.body.style.overflow = "hidden";

    var backdrop = document.createElement("div");
    backdrop.className = "offcanvas-backdrop fade";
    backdrop.addEventListener("click", function () {
        if (openOffcanvas) hideOffcanvas(openOffcanvas);
    });
    document.body.appendChild(backdrop);
    backdropEl = backdrop;

    backdrop.offsetHeight; // force reflow so the fade-in transition runs
    requestAnimationFrame(function () { backdrop.classList.add("show"); });

    target.classList.add("show");
    target.focus();

    document.addEventListener("keydown", onKeydown);
}

function hideOffcanvas(target) {
    if (!target || !target.classList.contains("show")) return;

    target.classList.add("hiding");
    target.classList.remove("show");

    var onTransformEnd = function (e) {
        if (e.target !== target || e.propertyName !== "transform") return;
        target.removeEventListener("transitionend", onTransformEnd);
        target.classList.remove("hiding");
    };
    target.addEventListener("transitionend", onTransformEnd);

    // Detach the shared reference immediately so a fast reopen gets a
    // fresh backdrop; this one still fades itself out via its own
    // captured reference regardless of what happens after.
    var thisBackdrop = backdropEl;
    backdropEl = null;
    if (thisBackdrop) {
        thisBackdrop.classList.remove("show");
        thisBackdrop.addEventListener("transitionend", function onFadeEnd(e) {
            if (e.target !== thisBackdrop) return;
            thisBackdrop.removeEventListener("transitionend", onFadeEnd);
            if (thisBackdrop.parentNode) thisBackdrop.parentNode.removeChild(thisBackdrop);
        });
    }

    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);

    if (openTrigger) openTrigger.focus();
    openOffcanvas = null;
    openTrigger = null;
}

document.querySelectorAll('[data-bs-toggle="offcanvas"]').forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
        e.preventDefault();
        var target = resolveTarget(trigger);
        if (!target) return;
        if (target.classList.contains("show")) hideOffcanvas(target); else showOffcanvas(target, trigger);
    });
});

document.querySelectorAll('[data-bs-dismiss="offcanvas"]').forEach(function (dismiss) {
    dismiss.addEventListener("click", function () {
        var target = dismiss.closest(".offcanvas");
        if (target) hideOffcanvas(target);
    });
});
