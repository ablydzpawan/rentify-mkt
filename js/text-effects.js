/* =========================================================
   TEXT EFFECTS — common helper module (imported by every
   js/page-js/*.js page script, not loaded via its own <script>
   tag). Shared heading/paragraph reveal helpers so headings and
   paragraphs animate identically site-wide:

   - Headings ("Fade Up Words"): the hero title treatment —
     split into words, each rising up from behind a masked
     wrapper while fading in, staggered start-to-end.

   - Paragraphs ("Scroll Highlight"): split into words that sit
     dimmed until the scroll position sweeps a highlight across
     them, tied directly to scroll (scrub) rather than a
     one-shot entrance.
   ========================================================= */

// Replaces every word in `el` via `wordFn(word)`, leaving tags
// (e.g. <br>) and whitespace between words untouched.
function splitTokens(el, wordFn) {
    var html = el.innerHTML;
    el.innerHTML = html.replace(/(<[^>]+>)|([^<\s]+)/g, function (m, tag, word) {
        return tag ? tag : wordFn(word);
    });
}

function headingWords(el) {
    if (!el) return [];
    if (!el.dataset.wordSplit) {
        el.dataset.wordSplit = "1";
        splitTokens(el, function (word) {
            return '<span class="word-wrap"><span class="word">' + word + "</span></span>";
        });
    }
    return el.querySelectorAll(".word");
}

function highlightWords(el) {
    if (!el) return [];
    if (!el.dataset.hlSplit) {
        el.dataset.hlSplit = "1";
        splitTokens(el, function (word) {
            return '<span class="hl-word">' + word + "</span>";
        });
    }
    return el.querySelectorAll(".hl-word");
}

/* ---------- "Fade Up Words" ----------
   opts.timeline + opts.position: splice into an existing timeline
   (the hero pattern — plays immediately as part of the page's
   intro sequence). Omit them for an independent, scroll-triggered
   reveal (the pattern every in-page heading now uses). */
export function revealHeading(el, opts) {
    var words = headingWords(el);
    if (!words.length) return null;
    opts = opts || {};

    var vars = Object.assign({
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: { each: 0.08, from: "start" },
    }, opts.vars || {});

    if (opts.timeline) {
        return opts.timeline.from(words, vars, opts.position != null ? opts.position : 0);
    }

    vars.scrollTrigger = Object.assign({
        trigger: opts.trigger || el,
        start: "top 80%",
        toggleActions: "play none none reverse",
    }, opts.scrollTrigger || {});

    return gsap.from(words, vars);
}

/* ---------- "Scroll Highlight" ----------
   Words sit dimmed, then brighten in sequence as the paragraph
   scrolls through the trigger range — scrubbed to scroll position,
   not a one-shot play-on-enter. */
function revealParagraph(el, opts) {
    var words = highlightWords(el);
    if (!words.length) return null;
    opts = opts || {};

    gsap.set(words, { opacity: 0.35 });

    return gsap.to(words, Object.assign({
        opacity: 1,
        ease: "none",
        stagger: 0.05,
        scrollTrigger: Object.assign({
            trigger: opts.trigger || el,
            start: "top 85%",
            end: "bottom 60%",
            scrub: 0.4,
        }, opts.scrollTrigger || {}),
    }, opts.vars || {}));
}

/* ---------- Section convenience ----------
   The block every page repeats: a `.section-heading` that fades
   up word-by-word, plus any `.section-text-desc` paragraph(s)
   that scroll-highlight underneath it. */
export function revealSection(section) {
    var heading = section.querySelector(".section-heading");
    if (heading) revealHeading(heading, { trigger: section });

    section.querySelectorAll(".section-text-desc").forEach(function (desc) {
        revealParagraph(desc);
    });
}

/* ---------- Play once in view ----------
   Holds `tl` paused until `trigger` scrolls into view, then plays it
   once. opts.after: a timeline (the page's hero text intro) to wait
   for first, so a hero's image scene still lands after its text but
   never plays off-screen (e.g. below the fold on short viewports). */
export function playInView(tl, trigger, opts) {
    if (!tl) return null;
    opts = opts || {};
    tl.pause();

    var watch = function () {
        ScrollTrigger.create({
            trigger: trigger,
            start: opts.start || "top 90%",
            once: true,
            onEnter: function () { tl.play(); },
        });
    };

    if (opts.after) opts.after.then(watch);
    else watch();
    return tl;
}

/* ---------- Mobile hero image ----------
   Small screens swap the layered hero canvas for one flat image
   (.hero-mobile / .features-hero-mobile / .first-fold-mobile), which
   gets this simpler rise + unblur, played in view after the text. */
export function revealHeroImage(img, after) {
    if (!img || !img.offsetParent) return null;
    var tl = gsap.timeline().from(img, {
        opacity: 0, y: 40, scale: 0.96, filter: "blur(12px)",
        duration: 1, ease: "power3.out", clearProps: "filter,transform",
    });
    return playInView(tl, img, { after: after });
}
