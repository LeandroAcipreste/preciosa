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

// Proporção das três fases dentro da passagem do objeto pela tela.
// A permanência é a mais longa de propósito: o texto precisa ficar parado e
// legível a maior parte do tempo — o fade é moldura, não o efeito principal.
const ENTRADA    = 1;
const PERMANENCIA = 1.8;
const SAIDA      = 1;

function revelarComVidaPropria({ gatilho, elementos, stagger = 0 }) {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: gatilho,
            // Começa logo abaixo da borda inferior e termina perto da superior:
            // a animação acompanha a travessia do objeto pela tela.
            start: "top 88%",
            end: "bottom 18%",
            scrub: 0.6,
            invalidateOnRefresh: true,
        }
    });

    tl.to(elementos, {
        opacity: 1,
        y: 0,
        duration: ENTRADA,
        ease: "sine.out",
        stagger,
    }, 0);

    // Espaço vazio na timeline = objeto parado e totalmente visível.
    tl.to({}, { duration: PERMANENCIA });

    tl.to(elementos, {
        opacity: 0,
        y: -24,
        duration: SAIDA,
        ease: "sine.in",
        stagger,
    });

    return tl;
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
