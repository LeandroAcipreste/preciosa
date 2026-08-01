import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';
import { initLuxuryServicesSection } from './src/pages/precisosa/services/services.js';
import { createSmoothScroll } from './src/core/smooth-scroll.js';
import { pauseWhenOffscreen } from './src/core/pause-offscreen.js';

let lenis;

function start() {
    // Marca para o diagnóstico (?diag=1): prova que os módulos resolveram.
    if (window.__diag) window.__diag.mainJs = Date.now() - window.__diag.inicio;

    // Cria Lenis + bridge com GSAP ScrollTrigger (lógica compartilhada).
    lenis = createSmoothScroll();

    // O marquee da galeria roda 45s em loop infinito. Fora da tela ele só
    // consome compositor e rouba quadros da rolagem — pausa enquanto não é
    // visível. Independe da intro, por isso fica aqui e não no callback.
    pauseWhenOffscreen('.space-gallery-container');

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
