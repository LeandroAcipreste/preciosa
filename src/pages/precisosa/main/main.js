import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initMain() {
    buildOrnamentalPath();

    const isMobile = window.innerWidth <= 768;

    const cards = gsap.utils.toArray(".gem-card");
    const cta = document.querySelector(".services-cta");

    // Estado inicial invisível — GSAP é a única fonte de verdade para transform/opacity
    gsap.set(".services-header > *", { opacity: 0, y: 20 });
    gsap.set(cards, { opacity: 0, y: 25 });
    if (cta) {
        gsap.set(cta, { opacity: 0, y: 15 });
    }

    // 1. CABEÇALHO — entrada via toggleActions (sem scrub)
    gsap.fromTo(".services-header > *",
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "sine.out",
            stagger: 0.08,
            scrollTrigger: {
                trigger: ".services-header",
                start: isMobile ? "top 90%" : "top 80%",
                toggleActions: "play none none reverse"
            }
        }
    );

    // Mobile: revela de cima para baixo; Desktop: da esquerda para direita
    const clipStart = isMobile ? "inset(0% 0% 100% 0%)" : "inset(0% 100% 0% 0%)";
    gsap.set("#ornamental-path", {
        clipPath: clipStart,
        webkitClipPath: clipStart,
        opacity: 1,
    });

    if (isMobile) {
        // ─── MOBILE: scrub simples sem pin ────────────────────────────────
        const gridTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".gems-grid",
                start: "top 90%",
                end:   "bottom 10%",
                scrub: 1.0,
                invalidateOnRefresh: true,
            }
        });

        gridTl.to("#ornamental-path", {
            clipPath: "inset(0% 0% 0% 0%)",
            webkitClipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            duration: 1.40
        }, 0);

        cards.forEach((card, index) => {
            gridTl.fromTo(card,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, ease: "sine.out", duration: 0.50 },
                0.12 + index * 0.28
            );
        });

        if (cta) {
            gridTl.fromTo(cta,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, ease: "sine.out", duration: 0.45 },
                1.15
            );
        }

    } else {
        // ─── DESKTOP: section PINADA RESTAURADA COM FLUIDEZ PREMIUM ───────────
        // Restauramos o pin porque o efeito de construir o caminho com o scroll é muito premium.
        // O "travamento" anterior na saída do pin foi corrigido removendo o 'anticipatePin'
        // e reduzindo o 'scrub' e o 'end' para uma transição amanteigada para a próxima seção.
        const pinnedTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".services-interactive-area",
                start: "top top",
                end: "+=1100", // 1100px: tempo perfeito (nem rápido demais, nem longo demais que pareça travado)
                pin: true,
                pinSpacing: true,
                scrub: 1.2, // Reduzido de 1.5 para 1.2: o caminho segue o scroll de forma mais colada e fluida
                invalidateOnRefresh: true,
            }
        });

        // Caminho das pedras revela da esquerda para a direita (sincronizado com o scroll)
        pinnedTl.to("#ornamental-path", {
            clipPath: "inset(0% 0% 0% 0%)",
            webkitClipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            duration: 1.0 // Usa quase toda a timeline
        }, 0);

        // Cards entram com scale + y + opacity para sensação de "emergência" premium
        const cardStartOffset = 0.05;
        cards.forEach((card, index) => {
            const startAt = cardStartOffset + index * 0.22;

            pinnedTl.fromTo(card,
                { opacity: 0, y: 50, scale: 0.88, transformOrigin: "center bottom" },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: "back.out(1.4)",
                    duration: 0.45,
                },
                startAt
            );

            // Brilho da gema pulsa uma vez após o card aparecer
            const gemGlow = card.querySelector(".gem-glow");
            if (gemGlow) {
                pinnedTl.fromTo(gemGlow,
                    { opacity: 0.3 },
                    { opacity: 1, duration: 0.25, ease: "power2.out" },
                    startAt + 0.25
                );
            }
        });

        // CTA aparece no final de forma majestosa
        if (cta) {
            pinnedTl.fromTo(cta,
                { opacity: 0, y: 24, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, ease: "power3.out", duration: 0.40 },
                0.90
            );
        }
    }

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
}

// ============================================
// GERA O CAMINHO DE JOIAS DINAMICAMENTE
// ============================================
function buildOrnamentalPath() {
    const container = document.getElementById('ornamental-path');
    if (!container) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const xlinkNS = "http://www.w3.org/1999/xlink";
    const GEM_SRC = "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (4).png";

    const isMobile = window.innerWidth <= 768;

    // SVG container
    const svg = document.createElementNS(svgNS, "svg");
    if (isMobile) {
        svg.setAttribute("viewBox", "0 0 203 1335");
    } else {
        svg.setAttribute("viewBox", "0 0 1335 203");
    }
    svg.setAttribute("fill", "none");
    svg.setAttribute("overflow", "visible");
    container.appendChild(svg);

    // Caminho guia invisível — "Vector certo.svg"
    const pathD = "M0.0939331 200.498C56.293 211.248 146.048 145.55 177.594 99.5C249.465 81.4748 263.094 0.499928 360.594 0.5C458.094 0.500072 564.094 164.5 511.094 114.998C511.094 114.998 594.594 200.498 683.594 200.498C772.594 200.498 840.594 135.498 840.594 135.498C840.594 135.498 916.094 35.9984 1006.59 38.0001C1097.09 40.0017 1162.09 125.498 1162.09 125.498C1162.09 125.498 1211.59 168 1256.09 164.5C1300.59 161 1334.59 114.998 1334.59 114.998";

    const guide = document.createElementNS(svgNS, "path");
    guide.setAttribute("d", pathD);
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "none");
    svg.appendChild(guide);

    let totalLen = 1335; // Fallback para evitar travamentos offline/headless
    try {
        const pathLen = guide.getTotalLength();
        if (pathLen > 0) {
            totalLen = pathLen;
        }
    } catch (e) {
        console.warn("Falha ao obter comprimento do path. Usando fallback.", e);
    }

    // ── Tamanhos ──────────────────────────────────────────────────────────────
    const LARGE = 36;   // tamanho da pedra grande (px no viewBox)
    const SMALL = 13;   // tamanho da pedra pequena
    const SMALL_STEP = 15;   // distância centro-a-centro entre pedras pequenas
    const LARGE_STEP = 180;  // distância entre centros das pedras grandes

    // Helper: plota imagem centrada em (cx, cy) com tamanho s
    function placeGem(cx, cy, s, opacity) {
        let finalX = cx;
        let finalY = cy;
        if (isMobile) {
            finalX = cy;
            finalY = cx;
        }

        const img = document.createElementNS(svgNS, "image");
        img.setAttributeNS(xlinkNS, "href", GEM_SRC);
        img.setAttribute("x", String(finalX - s / 2));
        img.setAttribute("y", String(finalY - s / 2));
        img.setAttribute("width", String(s));
        img.setAttribute("height", String(s));
        img.setAttribute("opacity", String(opacity));
        svg.appendChild(img);
    }

    // ── Percorre o caminho: pedra grande + pequenas preenchendo o espaço ──────
    for (let largeDist = 0; largeDist <= totalLen; largeDist += LARGE_STEP) {

        // Pedra GRANDE
        const lp = guide.getPointAtLength(Math.min(largeDist, totalLen));
        placeGem(lp.x, lp.y, LARGE, 1);

        // Sem próxima grande? Preenche o restante com pequenas e para.
        const nextLarge = largeDist + LARGE_STEP;
        if (nextLarge > totalLen) {
            const smallStart = largeDist + LARGE / 2 + SMALL / 2 + 2;
            const smallEnd = totalLen - SMALL / 2; // Vai até o fim do caminho
            const available = smallEnd - smallStart;

            if (available > 0) {
                const count = Math.max(1, Math.round(available / SMALL_STEP));
                const step = available / count;

                for (let i = 0; i <= count; i++) {
                    const dist = smallStart + i * step;
                    if (dist > totalLen) break;
                    const sp = guide.getPointAtLength(dist);
                    placeGem(sp.x, sp.y, SMALL, 0.88);
                }
            }
            break;
        }

        // Região para pequenas: da borda da grande atual até a borda da próxima
        const smallStart = largeDist + LARGE / 2 + SMALL / 2 + 2;
        const smallEnd = nextLarge - LARGE / 2 - SMALL / 2 - 2;
        const available = smallEnd - smallStart;

        if (available <= 0) continue;

        // Calcula quantas pedrinhas cabem para preencher TODO o espaço
        const count = Math.max(1, Math.round(available / SMALL_STEP));
        const step = available / count;

        for (let i = 0; i <= count; i++) {
            const dist = smallStart + i * step;
            if (dist >= totalLen) break;
            const sp = guide.getPointAtLength(dist);
            placeGem(sp.x, sp.y, SMALL, 0.88);
        }
    }

    // ── 2. ELEMENTOS DECORATIVOS ao redor da corrente ─────────────────────────
    const DECOR = [
        "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (1).png",
        "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (2).png",
        "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (3).png",
        "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_06 (9).png",
    ];

    // Espalha ~65 elementos ao longo do vetor, perpendiculares à curva
    const DECOR_N = 65;
    const decorStep = Math.max(10, totalLen / DECOR_N); // Garante incremento de no mínimo 10px para evitar loops infinitos

    for (let i = 0; i <= totalLen; i += decorStep) {
        const pt = guide.getPointAtLength(i);

        // Calcula o ângulo tangente para obter a direção perpendicular
        const delta = 2;
        const p1 = guide.getPointAtLength(Math.max(0, i - delta));
        const p2 = guide.getPointAtLength(Math.min(totalLen, i + delta));
        const tang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const perpAng = tang + Math.PI / 2; // 90° da tangente = perpendicular

        // Distância perpendicular: entre 28 e 70px (acima ou abaixo aleatório)
        const side = Math.random() > 0.5 ? 1 : -1;
        const spread = side * (Math.random() * 42 + 28);

        const dx = Math.cos(perpAng) * spread;
        const dy = Math.sin(perpAng) * spread;

        let finalX = pt.x + dx;
        let finalY = pt.y + dy;

        if (isMobile) {
            const tempX = finalX;
            finalX = finalY;
            finalY = tempX;
        }

        // Tamanho variado: maioria pequena, algumas médias, raras grandes
        const r = Math.random();
        const size = r > 0.88 ? 32 : r > 0.55 ? 20 : 12;

        const file = DECOR[Math.floor(Math.random() * DECOR.length)];

        const img = document.createElementNS(svgNS, "image");
        img.setAttributeNS(xlinkNS, "href", file);
        img.setAttribute("x", String(finalX - size / 2));
        img.setAttribute("y", String(finalY - size / 2));
        img.setAttribute("width", String(size));
        img.setAttribute("height", String(size));
        img.setAttribute("opacity", String(Math.random() * 0.3 + 0.65));
        // Rotação aleatória para parecer natural
        img.setAttribute("transform", `rotate(${Math.random() * 360} ${finalX} ${finalY})`);
        svg.appendChild(img);
    }
}
