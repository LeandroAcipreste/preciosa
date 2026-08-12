import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// MOBILE — CADA OBJETO COM VIDA PRÓPRIA
// --------------------------------------------
// No celular o grid vira UMA coluna: os 8 cards ficam empilhados e a seção
// passa de várias telas de altura. Uma timeline só, presa à seção inteira
// (era `trigger: ".luxury-services-section"`), obriga os 8 cards e o cabeçalho
// a dividirem o MESMO progresso de rolagem — todos acendem e apagam juntos,
// como se fossem um bloco único, e a maioria faz isso fora da tela.
//
// Aqui cada objeto ganha o próprio ScrollTrigger, ancorado nele mesmo. O
// cabeçalho é um objeto; cada card é um objeto. Cada um entra quando chega, se
// mantém legível enquanto atravessa a tela, e só então sai — sozinho.
//
// De quebra isto custa MENOS: na timeline única, todo tick de rolagem
// atualizava os 8 cards de uma vez, mesmo os que estavam longe da tela. Agora
// só o objeto que está passando tem tween ativo.
// ============================================

// ⚠️ AQUI MORAVA UM `scrub: 0.6`, E ERA A CAUSA DA TRAVADINHA.
//
// Com scrub, a animação não roda no tempo: ela é uma função da POSIÇÃO da
// rolagem. O quadro só avança quando a página rola, e o quanto ele avança
// depende de quanto o dedo andou. Isso tem duas consequências ruins aqui:
//
//   · Qualquer engasgo no thread principal congela o fade no meio, porque
//     nenhum quadro novo é calculado enquanto o evento de rolagem não chega.
//     Depois vem tudo de uma vez, para alcançar a posição atual — exatamente o
//     "aparece suave, trava alguns segundos, e aparece".
//
//   · Parar o dedo PARA a animação. Um card a meio fade fica parado a meio
//     fade, indefinidamente. Não existe "suave" possível: a suavidade dependia
//     de o usuário rolar num ritmo constante.
//
// Sem scrub, o ScrollTrigger só decide QUANDO começar; o GSAP roda a animação
// no próprio relógio, com duração e ease fixos. Ela termina sempre igual,
// independente de o dedo continuar ou parar, e um engasgo momentâneo apenas
// atrasa a animação em vez de fatiá-la.
//
// De quebra é bem mais barato: em vez de recalcular tweens a cada evento de
// rolagem, só há trabalho durante os ~0,7s de transição de cada objeto.
const DURACAO_ENTRADA = 0.7;

function revelarComVidaPropria({ gatilho, elementos, stagger = 0 }) {
    return gsap.fromTo(elementos,
        { opacity: 0, y: 40 },
        {
            opacity: 1,
            y: 0,
            duration: DURACAO_ENTRADA,
            ease: "power2.out",
            stagger,
            scrollTrigger: {
                trigger: gatilho,
                start: "top 88%",
                end: "bottom 15%",
                // play    ao entrar por baixo      -> aparece
                // reverse ao sair por cima         -> desaparece
                // play    ao reentrar por cima     -> reaparece subindo a página
                // reverse ao sair por baixo        -> desaparece
                //
                // A saída é a MESMA animação tocada de trás para frente, então
                // entrada e saída são simétricas por construção — não há como
                // uma destoar da outra.
                toggleActions: "play reverse play reverse",
                invalidateOnRefresh: true,
            },
        }
    );
}

function revelarIndividualmente() {
    // O cabeçalho conta como UM objeto: rótulo, título e filete pertencem à
    // mesma unidade visual. O stagger interno é só um respiro entre eles.
    if (document.querySelector(".luxury-header")) {
        revelarComVidaPropria({
            gatilho: ".luxury-header",
            elementos: gsap.utils.toArray(".luxury-header > *"),
            stagger: 0.12,
        });
    }

    // Cada card é ancorado em SI MESMO — é isto que os torna independentes.
    gsap.utils.toArray(".luxury-card").forEach((card) => {
        revelarComVidaPropria({ gatilho: card, elementos: card });
    });
}

export function initLuxuryServicesSection() {
    const isMobile = window.innerWidth <= 768;
    const cards    = gsap.utils.toArray(".luxury-card");

    // Estado inicial
    gsap.set(".luxury-header > *", { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 40 });

    if (isMobile) {
        revelarIndividualmente();
    } else {
        // ─── DESKTOP: timeline única para a seção inteira ──────────────────
        // No desktop o grid tem várias colunas e a seção cabe em pouco mais de
        // uma tela: os cards realmente entram em conjunto, e uma timeline só
        // dá a entrada coordenada que se espera ali.
        const luxuryTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".luxury-services-section",
                start: "top 80%",
                end:   "bottom 60%",
                scrub: 1.6,
                invalidateOnRefresh: true,
            }
        });

        luxuryTl.to(".luxury-header > *", {
            opacity: 1,
            y: 0,
            stagger: 0.10,
            ease: "sine.out",
            duration: 0.6
        }, 0);

        cards.forEach((card, index) => {
            luxuryTl.to(card, {
                opacity: 1,
                y: 0,
                ease: "sine.out",
                duration: 0.8
            }, 0.2 + index * 0.12);
        });
    }

    // Paralaxe do fundo apenas no desktop (muito pesado no mobile)
    if (!isMobile) {
        gsap.to(".luxury-bg-parallax", {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
                trigger: ".luxury-services-section",
                start: "top bottom",
                end:   "bottom top",
                scrub: true
            }
        });
    }

    // Micro-interação de brilho — apenas em dispositivos com mouse (hover: hover)
    const supportsHover = window.matchMedia("(hover: hover)").matches;
    if (supportsHover) {
        cards.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
                card.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
            });
            card.addEventListener("mouseleave", () => {
                card.style.setProperty("--mouse-x", "50%");
                card.style.setProperty("--mouse-y", "50%");
            });
        });
    }
}
