// ============================================================
// TEXT REVEAL — texto que muda de cor conforme a rolagem
// ------------------------------------------------------------
// Efeito trazido do site de referência (designsystem/norma), em
// assets/ef3e2ca4a2d32ca5_animations.js:
//
//     const split = SplitText.create(elem, { type: "lines, chars" })
//     paragraph_tl.fromTo(split.chars, {opacity:.3}, {opacity:1, stagger:.005})
//     ScrollTrigger.create({ animation: paragraph_tl, trigger: elem,
//                            start: "top 90%", end: "50% 40%", scrub: .5 })
//
// Lá o texto sai de apagado para branco. Aqui cada dobra tem o próprio fundo
// claro, então o efeito se faz pela COR: as palavras começam na cor do fundo
// (praticamente invisíveis) e chegam à cor final, que é a que o CSS já define.
//
// DUAS DIFERENÇAS DELIBERADAS EM RELAÇÃO AO NORMA:
//
// 1. Palavra a palavra, não caractere a caractere. O Norma usa o SplitText,
//    plugin pago do GSAP, que não existe no pacote npm gratuito usado aqui.
//    E mesmo havendo: os parágrafos têm ~50 palavras contra ~330 caracteres,
//    e animar `color` em 330 spans a cada quadro de rolagem é recálculo de
//    estilo demais no celular, justamente onde a página já sofre. Na leitura o
//    resultado é o mesmo — o olho acompanha a onda, não a letra.
//
// 2. A cor inicial é aplicada por JavaScript, nunca no CSS. Se o script falhar
//    ou não rodar, o parágrafo continua na cor final e legível. Se a cor de
//    partida estivesse na folha de estilo, uma falha do JS deixaria o texto
//    invisível na página.
//
// Uso:
//   revealTextOnScroll('.space-desc',       { de: '#ffffff', para: '#c4607e' });
//   revealTextOnScroll('.meet-debora-desc', { de: '#FDFBF7', para: '#5A3A46' });
// ============================================================
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Envolve cada palavra num <span>, preservando os elementos internos
// (destaques como .intro-highlight / .intro-soft continuam intactos).
//
// Vivia em pages/precisosa/main/main.js, que ainda a usa. Passou para cá
// quando uma segunda dobra precisou do mesmo divisor: um módulo de core não
// pode depender de um módulo de página, senão importar este efeito na página
// da Débora arrastaria junto todo o código das "Áreas de Atuação".
// O corpo da função não mudou.
export function splitIntoWords(root) {
    const words = [];

    const walk = (node) => {
        // Cópia da lista: vamos substituir nós durante o percurso
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const parts = child.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();

                parts.forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(" "));
                        return;
                    }
                    const span = document.createElement("span");
                    span.className = "intro-word";
                    span.textContent = part;
                    frag.appendChild(span);
                    words.push(span);
                });

                node.replaceChild(frag, child);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                walk(child);
            }
        });
    };

    walk(root);
    return words;
}

// ============================================================
// SLIDE MASCARADO — o texto entra deslizando de fora do recorte
// ------------------------------------------------------------
// Padrão do Norma (assets/ef3e2ca4a2d32ca5_animations.js:653 e
// assets/f8a8541a92ca19c3_scroll.js:217): a linha vira um wrapper que corta o
// que transborda, e um <span> interno desliza para dentro dele.
//
//     split.lines.forEach(elem => {
//         elem.innerHTML = '<span class="w-100">' + elem.innerHTML + '</span>'
//     })
//     tl.from(elem.querySelectorAll('span'), { y:'100%',  ... })   // sobe
//     tl.from(split_Title.chars,             { y:'-100%', ... })   // desce
//
// Lá o recorte vem do `mask` do SplitText, plugin pago que gera o wrapper com
// estilo inline. Aqui os dois títulos são de UMA linha só, então não há o que
// dividir: o próprio elemento vira o recorte (overflow:hidden pelo CSS) e só
// o <span> interno é criado.
//
// O deslocamento é de 115%, não 100%: 'Great Vibes' é cursiva e as hastes
// passam da caixa da linha; em 100% sobraria um fiapo de letra aparecendo na
// borda antes da hora.
const DESLOCAMENTO = 115;

export function slideTextIntoView(seletor, { de = 'baixo', delay = 0 } = {}) {
    const elementos = document.querySelectorAll(seletor);
    if (!elementos.length) return;

    elementos.forEach((elemento) => {
        // Envolve o conteúdo já existente, preservando qualquer marcação interna.
        const interno = document.createElement('span');
        interno.className = 'slide-mask-inner';
        while (elemento.firstChild) interno.appendChild(elemento.firstChild);
        elemento.appendChild(interno);

        gsap.fromTo(interno,
            { yPercent: de === 'cima' ? -DESLOCAMENTO : DESLOCAMENTO },
            {
                yPercent: 0,
                duration: 1.1,
                delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: elemento,
                    start: 'top 88%',
                    // Sem scrub: o texto entra de uma vez quando a rolagem
                    // chega, no ritmo do ease — é o que "quando o scroll
                    // chegar, desce/sobe" descreve. Com scrub ele ficaria
                    // preso ao dedo, meio dentro e meio fora.
                    toggleActions: 'play none none reverse',
                },
            }
        );
    });
}

export function revealTextOnScroll(seletor, {
    de,
    para,
    start = 'top 85%',
    end = 'bottom 45%',
    scrub = 0.5,
} = {}) {
    const elementos = document.querySelectorAll(seletor);
    if (!elementos.length) return;

    elementos.forEach((paragrafo) => {
        const palavras = splitIntoWords(paragrafo);
        if (!palavras.length) return;

        gsap.set(palavras, { color: de });

        // Cada palavra ocupa uma fatia igual da linha do tempo: a onda percorre
        // o parágrafo do começo ao fim exatamente uma vez durante a rolagem.
        const each = 1 / palavras.length;

        gsap.to(palavras, {
            color: para,
            ease: 'none',
            duration: 0.4,
            stagger: { each },
            scrollTrigger: {
                // Cada parágrafo dispara pelo PRÓPRIO elemento — as duas dobras
                // se revelam de forma independente, cada uma na sua vez.
                trigger: paragrafo,
                // Começa quando o parágrafo entra por baixo e termina com ele
                // ainda bem dentro da tela: a revelação acontece enquanto se
                // lê, não depois de passar.
                start,
                end,
                scrub,
                invalidateOnRefresh: true,
            },
        });
    });
}
