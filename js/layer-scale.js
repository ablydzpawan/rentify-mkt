/* =========================================================
   LAYERED SCENES — scale-to-fit. Common module, loaded via
   its own <script> tag on pages with .image-wrap.layers-desktop
   compositions (how-to-start, features).
   Every .layer renders at its native pixel size, laid out for
   the box's full desktop width. Between $flyer-breakpoint
   (1280px) and that full width the box is narrower, so the
   layers got cropped. This sets --layer-scale on each box to
   (current width / design width), capped at 1, and the layers
   apply it as zoom (see scss/components/_layer-reveal.scss) so
   the whole composition shrinks together instead.
   The design width is the paired .layers-mobile image's width
   attribute — that image is captured at the box's full size.
   ========================================================= */

(function () {
    var wraps = document.querySelectorAll(".image-wrap.layers-desktop");
    if (!wraps.length) return;

    function designWidth(wrap) {
        var node = wrap.parentElement;
        while (node) {
            var mobile = node.querySelector(".layers-mobile");
            if (mobile) return parseFloat(mobile.getAttribute("width")) || 0;
            node = node.parentElement;
        }
        return 0;
    }

    var items = Array.prototype.map.call(wraps, function (wrap) {
        return { wrap: wrap, width: designWidth(wrap) };
    }).filter(function (item) {
        return item.width > 0;
    });

    function update() {
        items.forEach(function (item) {
            // hidden (below the breakpoint) boxes measure 0 — leave them
            var current = item.wrap.clientWidth;
            if (!current) return;
            var scale = Math.min(1, current / item.width);
            item.wrap.style.setProperty("--layer-scale", scale.toFixed(4));
        });
    }

    update();

    if ("ResizeObserver" in window) {
        var observer = new ResizeObserver(update);
        items.forEach(function (item) {
            observer.observe(item.wrap);
        });
    } else {
        window.addEventListener("resize", update);
    }
})();
