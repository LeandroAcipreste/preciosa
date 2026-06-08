import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';
import { initLuxuryServicesSection } from './src/pages/precisosa/services/services.js';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis;

function start() {
    // Inicializa Lenis para scroll suave de alta performance (Buttery Smooth)
    lenis = new Lenis({
        lerp: 0.06,              // Amortecimento fluido estilo luxo (0.05–0.08)
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: true,       // Suavidade em trackpads e telas touch
        wheelMultiplier: 0.9,    // Consistência em mouses com rodas rápidas
    });

    // Vincula ScrollTrigger ao evento de scroll do Lenis
    lenis.on('scroll', ScrollTrigger.update);

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Trava o scroll do Lenis durante a tela de carregamento/intro
    lenis.stop();
    document.body.classList.add("intro-active");
    window.scrollTo(0, 0);

    initHero(() => {
        // Callback: executado quando o diamante sobe e a cortina abre
        document.body.classList.remove("intro-active");
        window.scrollTo(0, 0);
        
        // Habilita o scroll suave Lenis após o término da intro
        lenis.start();
        
        // Inicializa a segunda dobra agora, evitando disparos precoces
        initMain();
        initLuxuryServicesSection();
    });
}

// Executa imediatamente se o DOM já estiver pronto, caso contrário aguarda o evento
if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start);
} else {
    start();
}
