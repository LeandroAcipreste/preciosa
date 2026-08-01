// ============================================================
// SMOOTH SCROLL — núcleo compartilhado (Lenis + GSAP ScrollTrigger)
// ------------------------------------------------------------
// Antes, a lógica de sincronizar o Lenis com o gsap.ticker e registrar
// o ScrollTrigger estava duplicada em main.js e no <script> inline de
// debora.html. Este módulo centraliza isso.
//
// Uso:
//   import { createSmoothScroll } from './src/core/smooth-scroll.js';
//   const lenis = createSmoothScroll();          // config padrão (cinematic)
//   const lenis = createSmoothScroll({ lerp: 0.05 }); // override pontual
//
// Retorna a instância do Lenis para que a página controle stop()/start().
// ============================================================
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

let pluginRegistered = false;

// Configuração "cinematic" compartilhada pelas páginas.
// A sensação de "travado" era causada pelo gargalo de GPU (loop 3D infinito),
// já corrigido — então aqui priorizamos um scroll LENTO E DELICADO:
//   - wheelMultiplier baixo  -> cada giro da roda avança pouco (delicado)
//   - lerp moderado          -> deslizar macio, sem a cauda longa que dava lag
const DEFAULT_OPTIONS = {
    lerp: 0.07,              // Deslizar macio e gentil (sem flutuar demais)
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,      // CRÍTICO: evita conflito com scroll nativo touch
    wheelMultiplier: 0.4,    // Lento e delicado (era 0.55 no original, 0.9 rápido demais)
    touchMultiplier: 1.0,
    infinite: false,
};

export function createSmoothScroll(options = {}) {
    // Registra o plugin uma única vez por página.
    if (!pluginRegistered) {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.config({
            // No celular, esconder/mostrar a barra de endereço dispara um
            // 'resize', e cada resize faz o ScrollTrigger recalcular TODOS os
            // gatilhos — relayout da página inteira no meio da rolagem. É a
            // recomendação da própria documentação do GSAP para mobile.
            ignoreMobileResize: true,
            // Em rolagem muito rápida, não dispara os callbacks mais de uma vez
            // por tick. Menos trabalho redundante justamente no pior momento.
            limitCallbacks: true,
        });

        pluginRegistered = true;
    }

    const lenis = new Lenis({ ...DEFAULT_OPTIONS, ...options });

    // Sincroniza ScrollTrigger ao Lenis via gsap.ticker (evita RAF duplo).
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Mantém o ScrollTrigger atualizado a cada scroll do Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    return lenis;
}
