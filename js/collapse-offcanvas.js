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

// The full-screen nav menu (.offcanvas-menu) sits under the header and
// is closed by the header's own toggle, so it skips the backdrop and
// flags <html> for the header's open-state styling.
function isNavMenu(target) {
    return target.classList.contains("offcanvas-menu");
}

function setToggleState(trigger, open) {
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", String(open));
    if (trigger.classList.contains("menu-button")) {
        trigger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
}

function showOffcanvas(target, trigger) {
    if (!target || target.classList.contains("show")) return;
    if (openOffcanvas && openOffcanvas !== target) hideOffcanvas(openOffcanvas);

    openOffcanvas = target;
    openTrigger = trigger || null;
    document.body.style.overflow = "hidden";
    // Lenis drives the page scroll on most pages; overflow:hidden alone
    // wouldn't stop it scrolling the page behind the panel
    if (window.lenis) window.lenis.stop();
    setToggleState(trigger, true);

    if (isNavMenu(target)) {
        document.documentElement.classList.add("menu-open");
        target.classList.add("show");
        target.focus();
        document.addEventListener("keydown", onKeydown);
        return;
    }

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
    document.documentElement.classList.remove("menu-open");
    setToggleState(openTrigger, false);
    if (window.lenis) window.lenis.start();

    // drawers slide (transform); the nav menu wipes (clip-path)
    var onTransformEnd = function (e) {
        if (e.target !== target || (e.propertyName !== "transform" && e.propertyName !== "clip-path")) return;
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

// The menu toggle only exists below lg; don't leave the full-screen menu
// open (with no visible way to close it) after the viewport grows past it.
var navMenuMq = window.matchMedia("(min-width: 992px)");
var onNavMenuMq = function (e) {
    if (e.matches && openOffcanvas && isNavMenu(openOffcanvas)) hideOffcanvas(openOffcanvas);
};
if (navMenuMq.addEventListener) navMenuMq.addEventListener("change", onNavMenuMq);

/* ---------- Menu links: letter scramble on hover ----------
   pririty.com's menu effect: on mouseenter the letters turn to
   random characters and resolve back (last letters first) over
   ~600ms. Hover-capable pointers only. */

(function () {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var POOL = "abcdefghijklmnopqrstvwxyz1234567890";
    var randomChar = function () { return POOL.charAt(Math.floor(Math.random() * POOL.length)); };

    document.querySelectorAll(".offcanvas-menu .menu-link").forEach(function (link) {
        var text = link.textContent.trim();
        link.setAttribute("aria-label", text);
        // inline wrapper: the link itself is a flex box, which would drop
        // the bare spaces between the letter spans
        link.innerHTML = '<span class="menu-link-text" aria-hidden="true">' + text.split("").map(function (c) {
            return c === " " ? " " : '<span class="char">' + c + "</span>";
        }).join("") + "</span>";

        var chars = Array.prototype.slice.call(link.querySelectorAll(".char"));
        var interval, timeout;

        var reset = function () {
            clearInterval(interval);
            clearTimeout(timeout);
            chars.forEach(function (ch, i) { ch.textContent = text.replace(/ /g, "").charAt(i); });
        };

        link.addEventListener("mouseenter", function () {
            reset();
            var remaining = chars.length;
            interval = setInterval(function () {
                chars.forEach(function (ch, i) {
                    ch.textContent = i < remaining ? randomChar() : text.replace(/ /g, "").charAt(i);
                });
                remaining--;
            }, 100);
            timeout = setTimeout(reset, 600);
        });
        link.addEventListener("mouseleave", reset);
    });
})();
