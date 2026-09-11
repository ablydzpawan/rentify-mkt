
gsap.registerPlugin();

// ---------- Split heading letters ----------
var heading = document.querySelector("#headline");
var html = heading.innerHTML;
heading.innerHTML = html.replace(/(<[^>]+>)|([^<\s])/g, function (m, tag, ch) {
    if (tag) return tag;
    return '<span class="letter">' + ch + '</span>';
});
var letters = document.querySelectorAll(".letter");

var master = gsap.timeline({ defaults: { ease: "power3.out" } });

// Letters cascade in with a soft 3D rotation + blur
master.from(letters, {
    y: 60, opacity: 0, rotateX: -90, filter: "blur(8px)",
    duration: 1, ease: "power2.out",
    stagger: { each: 0.025, from: "start" }
}, 0);

// Subtitle
master.from("#subtext", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5");

// CTAs
master.from(".btn-calypso", {
    y: 16, opacity: 0, scale: 0.9, duration: 0.5, ease: "back.out(1.7)", stagger: 0.08
}, "-=0.35");

// ---------- Panel group reveal ----------
// 1. Browser (the main artboard) settles in first — it anchors the whole scene.
master.from("#browser", {
    opacity: 0,
    scale: 0.94,
    y: 40,
    filter: "blur(14px)",
    duration: 1.1,
    ease: "power3.out"
}, "-=0.2");

// 2. Satellite panels fly to their exact resting position from a slight
//    outward offset, softly blurred, staggered so they feel orchestrated
//    rather than simultaneous. Direction of the offset is toward the
//    panel's own side of the canvas, so the motion reads as "settling in".
master.from("#url-bar", {
    opacity: 0, y: -24, x: -10, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

master.from("#toolbar", {
    opacity: 0, x: -36, scale: 0.92, filter: "blur(10px)", duration: 0.85
}, "-=0.7");

master.from("#font-panel", {
    opacity: 0, x: -40, y: 20, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

master.from("#color-panel", {
    opacity: 0, x: 40, y: -20, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

master.from("#template-panel", {
    opacity: 0, x: 36, y: 24, scale: 0.9, filter: "blur(10px)", duration: 0.9
}, "-=0.7");

// 3. Tiny settle — everything nudges to rest, killing any residual blur/scale
master.to(".panel", {
    filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out"
}, "-=0.2");



var master = gsap.timeline({ defaults: { ease: "power3.out" } });

// 1. Calendar panel (the main artboard) settles in first — it anchors the scene.
master.from("#calendar-panel", {
    opacity: 0,
    scale: 0.94,
    y: 40,
    filter: "blur(14px)",
    duration: 1.1,
    ease: "power3.out"
}, 0);

// 2. Satellite panels fly to their exact resting position from a slight
//    outward offset, softly blurred, staggered so it reads as one
//    orchestrated moment. Offset direction matches each panel's side
//    of the canvas so the motion feels like it's "settling in".
master.from("#product-card", {
    opacity: 0, x: -30, y: -24, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.75");

master.from("#toggle", {
    opacity: 0, y: -20, scale: 0.9, filter: "blur(8px)", duration: 0.7
}, "-=0.7");

master.from("#shoe-image", {
    opacity: 0, x: -36, y: 24, scale: 0.9, filter: "blur(10px)", duration: 0.85
}, "-=0.65");

master.from("#model-image", {
    opacity: 0, x: 40, y: 20, scale: 0.9, filter: "blur(10px)", duration: 0.9
}, "-=0.7");

// 3. Tiny settle — kills any residual blur/scale so everything lands crisp
master.to(".cal-panel", {
    filter: "blur(0px)", scale: 1, duration: 0.4, ease: "power1.out"
}, "-=0.2");


// 

const featuresSwiper = new Swiper(".featuresSwiper", {
    slidesPerView: "auto",
    centeredSlides: true,
    loop: true,

    spaceBetween: 60,

    speed: 700,

    grabCursor: true,

    watchSlidesProgress: true,

    breakpoints: {
        0: {
            spaceBetween: 20
        },

        768: {
            spaceBetween: 35
        },

        1200: {
            spaceBetween: 60
        }
    }
});