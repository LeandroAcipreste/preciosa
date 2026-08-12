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
    wheelMultiplier: 0.4,    // Lento e delicado (era 0.55 no original, 0.9 rápido demais)
    touchMultiplier: 1.0,
    infinite: false,
};

// ⚠️ Aqui morava `smoothTouch: false`, comentado como "CRÍTICO: evita conflito
// com scroll nativo touch". Ele NUNCA fez efeito: `smoothTouch` foi removido do
// Lenis na versão 1.0, e o construtor da 1.1.5 (a instalada) só conhece
// `syncTouch`. Opção desconhecida é ignorada em silêncio — o Lenis rodava no
// celular esse tempo todo, acreditando-se desligado.
//
// A opção foi retirada em vez de renomeada porque a resposta certa não é
// ajustar o toque do Lenis: é não ter Lenis no toque. Ver abaixo.

// Aparelho cujo apontador primário é o dedo. É o critério certo aqui — não a
// largura da tela: o que importa não é o layout ser estreito, é a rolagem
// chegar por evento de toque.
function isTouchPrimary() {
    return typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;
}

// Controle de mesma forma que a instância do Lenis, para quem chama não
// precisar saber se há Lenis ou não. main.js usa stop()/start() e debora.html
// usa scrollTo() — os três continuam existindo.
function nativeScrollControl() {
    return {
        // O travamento da intro é feito por CSS (body.intro-active tem
        // overflow:hidden !important), então não há nada a parar aqui.
        stop() {},
        start() {},
        scrollTo(target, options) {
            window.scrollTo(0, typeof target === 'number' ? target : 0);
        },
        on() {},
        off() {},
        raf() {},
        resize() {},
        destroy() {},
    };
}

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

    // ==========================================
    // NO TOQUE: ROLAGEM NATIVA, SEM LENIS
    // ==========================================
    // Este é o padrão do site de referência (designsystem/norma), que tem
    // rolagem impecável no celular: lá o Lenis só é instanciado quando
    // `!is_mobile`.
    //
    // O motivo é mecânico. O Lenis registra os listeners de toque como NÃO
    // passivos:
    //
    //     addEventListener("touchstart", ..., { passive: false })
    //     addEventListener("touchmove",  ..., { passive: false })
    //
    // Um touchmove não passivo obriga o navegador a esperar o JavaScript rodar
    // e retornar ANTES de rolar um pixel — mesmo que o handler nunca chame
    // preventDefault. A rolagem deixa de viver no thread do compositor e passa
    // a depender do thread principal, que aqui está ocupado com timelines em
    // scrub, ScrollTrigger.update e repaint de SVG. Cada arrastar de dedo entra
    // na fila atrás de tudo isso: é a travada.
    //
    // Sem Lenis, o toque volta a ser rolagem nativa do compositor, que não
    // depende do thread principal e não trava nem com a página ocupada. O
    // ScrollTrigger continua funcionando: sem a ponte do Lenis ele usa o
    // listener de scroll nativo dele, que é o comportamento padrão.
    //
    // No desktop nada muda — lá a entrada é a roda do mouse, o `wheel` não
    // bloqueia o compositor do mesmo jeito, e o deslizar do Lenis é justamente
    // o efeito desejado.
    if (isTouchPrimary()) {
        return nativeScrollControl();
    }

    const lenis = new Lenis({ ...DEFAULT_OPTIONS, ...options });

    // Sincroniza ScrollTrigger ao Lenis via gsap.ticker (evita RAF duplo).
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // ⚠️ AQUI MORAVA lagSmoothing(0).
    //
    // É a recomendação da documentação do Lenis, para o scroll não "perder"
    // deslocamento durante um engasgo. Mas lagSmoothing(0) DESLIGA a proteção
    // do GSAP contra saltos: se um frame demora 3s, toda animação avança 3s
    // de uma vez.
    //
    // A intro do hero é uma sequência cronometrada com tweens de duração ZERO
    // em instantes fixos (cada letra é um onComplete). Num salto, todos esses
    // instantes são atravessados no mesmo tick e os onComplete disparam
    // juntos: as palavras aparecem todas de uma vez e a cortina sobe. No
    // Safari do iPhone a travada é certa — inicialização do WebGL com dois
    // vídeos na página e canvas em DPR 3.
    //
    // Reproduzido: travando a thread principal por 10s durante a intro, a
    // cortina subia num único quadro. Com o padrão do GSAP, qualquer frame
    // acima de 500ms passa a contar como 33ms e a intro segue o roteiro.
    gsap.ticker.lagSmoothing(500, 33);

    // Mantém o ScrollTrigger atualizado a cada scroll do Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    return lenis;
}
