import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';
import { initLuxuryServicesSection } from './src/pages/precisosa/services/services.js';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis;

// Detecta se é touch device para desativar smooth touch (evita jank no mobile)
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function start() {
    lenis = new Lenis({
        lerp: 0.035,             // Reduzido (era 0.045): scroll extremamente amanteigado e longo
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,      // CRÍTICO: false evita conflito com scroll nativo touch
        wheelMultiplier: 0.55,   // Mais lento ainda, obrigando navegação contemplativa
        touchMultiplier: 1.0,
        infinite: false,
    });

    // Sincroniza ScrollTrigger ao Lenis via gsap.ticker (evita RAF duplo)
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ScrollTrigger.update);

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
