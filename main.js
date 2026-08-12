import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';
import { initLuxuryServicesSection } from './src/pages/precisosa/services/services.js';
import { revealTextOnScroll, slideTextIntoView } from './src/core/text-reveal.js';
import { createSmoothScroll } from './src/core/smooth-scroll.js';
import { pauseWhenOffscreen } from './src/core/pause-offscreen.js';

let lenis;

function start() {
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

            // Títulos das dobras "Nosso Espaço" e "Débora Amorim": o subtítulo
            // está escondido ACIMA do recorte e desce; o título está ABAIXO e
            // sobe. O pequeno atraso no título faz um seguir o outro em vez de
            // chegarem juntos. Cada elemento dispara pelo próprio gatilho, então
            // as duas dobras se revelam independentes, cada uma na sua vez.
            slideTextIntoView('.space-subtitle, .meet-debora-subtitle', { de: 'cima' });
            slideTextIntoView('.space-title, .meet-debora-title', { de: 'baixo', delay: 0.12 });

            // Texto que se revela com a rolagem. Cada dobra parte da cor do
            // PRÓPRIO fundo — é o que faz a palavra nascer invisível — e chega
            // à cor que o CSS já define para ela.
            revealTextOnScroll('.space-desc', {
                de: '#ffffff',   // fundo da dobra: #fdf2f5
                para: '#c4607e',
            });
            revealTextOnScroll('.meet-debora-desc', {
                de: '#FDFBF7',   // fundo da dobra: #FDFBF7 (creme)
                para: '#5A3A46',
            });
        });
    });
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start);
} else {
    start();
}
