/* =========================================================
   DESKTOP NAV — text-roll hover effect.
   Splits each nav label into per-word masked windows, each
   holding two stacked copies of the word (see scss/layout/
   _header.scss for the mask/translate styling): on hover both
   copies slide up a full line, so the original word scrolls
   out the top while a brand-colored duplicate scrolls in from
   the bottom, cascading word-by-word across the label.

   Self-contained (no GSAP/SplitText dependency) so it can run
   on every page, including the ones that don't load the motion
   stack. The duplicated word markup is purely decorative — the
   link itself gets an aria-label with the real text so screen
   readers hear the label once, not once per copy.
   ========================================================= */

(function () {
    var links = document.querySelectorAll(".desktop-nav a");

    links.forEach(function (link) {
        var label = link.querySelector(":scope > span");
        if (!label) return;

        var text = label.textContent.trim();
        if (!text) return;

        link.setAttribute("aria-label", text);
        label.setAttribute("aria-hidden", "true");
        label.classList.add("nav-roll");

        var html = "";
        var wordIndex = 0;

        text.split(/(\s+)/).forEach(function (chunk) {
            if (!chunk) return;

            // Whitespace runs pass through untouched so word spacing stays
            // exactly what the font would render naturally.
            if (/^\s+$/.test(chunk)) {
                html += chunk;
                return;
            }

            html += '<span class="nav-roll-word" style="--i:' + wordIndex + '">' +
                '<span class="nav-roll-copy nav-roll-before">' + chunk + "</span>" +
                '<span class="nav-roll-copy nav-roll-after">' + chunk + "</span>" +
                "</span>";
            wordIndex++;
        });

        label.innerHTML = html;
    });
})();
