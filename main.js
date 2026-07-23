import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';
import { initLuxuryServicesSection } from './src/pages/precisosa/services/services.js';
import { createSmoothScroll } from './src/core/smooth-scroll.js';

let lenis;

function start() {
    // Cria Lenis + bridge com GSAP ScrollTrigger (lógica compartilhada).
    lenis = createSmoothScroll();

    // Trava o scroll durante a intro
    lenis.stop();
    document.body.classList.add("intro-active");
    window.scrollTo(0, 0);

    initHero(() => {
        document.body.classList.remove("intro-active");
        window.scrollTo(0, 0);
        lenis.start();

        // Aguarda um frame para o layout estabilizar antes de criar ScrollTriggers
        requestAnimationFrame(() => {
            initMain();
            initLuxuryServicesSection();
        });
    });
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start);
} else {
    start();
}
