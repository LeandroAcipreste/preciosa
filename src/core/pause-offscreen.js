// ============================================================
// PAUSE OFF-SCREEN — desliga animação CSS fora da viewport
// ------------------------------------------------------------
// Uma animação CSS não para de custar quando sai da tela: o compositor
// continua processando as camadas a cada frame. Num marquee com várias
// imagens isso rouba quadros da rolagem no resto da página inteira.
//
// Este helper apenas marca o elemento com .is-visible enquanto ele estiver
// na viewport. Quem decide o que pausar é o CSS, por exemplo:
//
//   .space-gallery-container:not(.is-visible) .track-up {
//       animation-play-state: paused;
//   }
//
// Uso:
//   pauseWhenOffscreen('.space-gallery-container');
// ============================================================

export function pauseWhenOffscreen(selector, { rootMargin = '250px' } = {}) {
    const elementos = document.querySelectorAll(selector);
    if (!elementos.length) return null;

    // Sem IntersectionObserver, marca tudo como visível: a animação roda
    // sempre, que é exatamente o comportamento anterior. Degradar, não quebrar.
    if (!('IntersectionObserver' in window)) {
        elementos.forEach((el) => el.classList.add('is-visible'));
        return null;
    }

    // A margem adianta a retomada: a animação já está rodando quando a seção
    // entra de fato na tela, sem "engatar" na frente do usuário.
    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
            e.target.classList.toggle('is-visible', e.isIntersecting);
        });
    }, { rootMargin });

    elementos.forEach((el) => observador.observe(el));
    return observador;
}
