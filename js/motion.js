
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

    spaceBetween: 30,

    speed: 700,

    grabCursor: true,

    watchSlidesProgress: true,

    breakpoints: {
        0: {
            spaceBetween: 10
        },

        768: {
            spaceBetween: 20
        },

        1200: {
            spaceBetween: 30
        }
    }
});


//



const expoSwiper = new Swiper('.swiper-expo', {
    direction: 'horizontal',
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 30,
    loop: true,
    speed: 750,
    parallax: true,
    grabCursor: true,

    navigation: {
        nextEl: '.btn-next',
        prevEl: '.btn-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },

    /* 3D Dynamic Transformation Logic */
    on: {
        progress(s) {
            s.slides.forEach((slide) => {
                const progress = slide.progress; // Offset from active slide: -1 (left), 0 (center), 1 (right)
                const absProgress = Math.abs(progress);

                // 1. Perspective 3D rotation around Y axis
                const rotateY = progress * -25;

                // 2. Scale & translateZ depth matrix calculation
                const scale = 1 - Math.min(absProgress * 0.15, 0.35);
                const translateZ = -absProgress * 150;
                const translateX = progress * -30;

                // 3. Opacity & depth blur curve
                const opacity = 1 - Math.min(absProgress * 0.45, 0.7);

                // Apply calculated 3D Matrix
                slide.style.transform = `
              translate3d(${translateX}px, 0px, ${translateZ}px) 
              rotateY(${rotateY}deg) 
              scale(${scale})
            `;
                slide.style.opacity = opacity;
                slide.style.zIndex = 10 - Math.round(absProgress * 5);
            });
        },
        setTransition(s, duration) {
            s.slides.forEach((slide) => {
                slide.style.transitionDuration = `${duration}ms`;
            });
        }
    }
});

//


const cards = document.querySelectorAll('.accordion-card');

cards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        cards.forEach(c => c.classList.remove('active'));

        // Add active class to clicked card
        card.classList.add('active');
    });
});


//

document.addEventListener("DOMContentLoaded", () => {
    const svg = document.querySelector(".svg-draw");

    if (!svg) return;

    const paths = svg.querySelectorAll("path");

    // Calculate each path's length
    paths.forEach((path) => {
        try {
            const length = path.getTotalLength();

            path.style.setProperty("--path-length", `${length}`);
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        } catch (error) {
            // Ignore paths that don't support getTotalLength()
        }
    });

    // Observe SVG entering viewport
    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    svg.classList.add("is-visible");

                    // Run only once
                    observer.unobserve(svg);
                }
            });
        },
        {
            threshold: 0.2
        }
    );

    observer.observe(svg);
});