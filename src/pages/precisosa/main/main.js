import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initMain() {

    // ============================================
    // Cria o caminho de joias por trás das gemas
    // ============================================
    buildOrnamentalPath();

    // ============================================
    // Animação de entrada do cabeçalho da seção
    // ============================================
    gsap.from(".services-faixa, .services-subtitle, .services-intro", {
        scrollTrigger: {
            trigger: ".services-header",
            start: "top 80%",
            once: true
        },
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.2
    });

    // ============================================
    // Animação de entrada das pedras (stagger)
    // ============================================
    gsap.from(".gem-card", {
        scrollTrigger: {
            trigger: ".gems-grid",
            start: "top 80%",
            once: true
        },
        opacity: 0,
        y: 50,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out"
    });

    // ============================================
    // Caminho Ornamental
    // ============================================
    gsap.from("#ornamental-path", {
        scrollTrigger: {
            trigger: ".gems-grid",
            start: "top 75%",
            once: true
        },
        opacity: 0,
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.5,
        ease: "power2.out",
        delay: 0.4
    });

    // ============================================
    // Animação de entrada do CTA
    // ============================================
    gsap.from(".services-cta", {
        scrollTrigger: {
            trigger: ".services-cta",
            start: "top 90%",
            once: true
        },
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out"
    });
}

// ============================================
// GERA O CAMINHO DE JOIAS DINAMICAMENTE
// ============================================
function buildOrnamentalPath() {
    const container = document.getElementById('ornamental-path');
    if (!container) return;

    const svgNS   = "http://www.w3.org/2000/svg";
    const xlinkNS = "http://www.w3.org/1999/xlink";
    const GEM_SRC = "/assets/img/caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (4).png";

    // SVG container
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 1335 203");
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

    const totalLen = guide.getTotalLength();

    // ── Tamanhos ──────────────────────────────────────────────────────────────
    const LARGE      = 36;   // tamanho da pedra grande (px no viewBox)
    const SMALL      = 13;   // tamanho da pedra pequena
    const SMALL_STEP = 15;   // distância centro-a-centro entre pedras pequenas
    const LARGE_STEP = 180;  // distância entre centros das pedras grandes

    // Helper: plota imagem centrada em (cx, cy) com tamanho s
    function placeGem(cx, cy, s, opacity) {
        const img = document.createElementNS(svgNS, "image");
        img.setAttributeNS(xlinkNS, "href", GEM_SRC);
        img.setAttribute("x",       String(cx - s / 2));
        img.setAttribute("y",       String(cy - s / 2));
        img.setAttribute("width",   String(s));
        img.setAttribute("height",  String(s));
        img.setAttribute("opacity", String(opacity));
        svg.appendChild(img);
    }

    // ── Percorre o caminho: pedra grande + pequenas preenchendo o espaço ──────
    for (let largeDist = 0; largeDist <= totalLen; largeDist += LARGE_STEP) {

        // Pedra GRANDE
        const lp = guide.getPointAtLength(Math.min(largeDist, totalLen));
        placeGem(lp.x, lp.y, LARGE, 1);

        // Sem próxima grande? Para.
        const nextLarge = largeDist + LARGE_STEP;
        if (nextLarge > totalLen) break;

        // Região para pequenas: da borda da grande atual até a borda da próxima
        const smallStart = largeDist + LARGE / 2 + SMALL / 2 + 2;
        const smallEnd   = nextLarge - LARGE / 2 - SMALL / 2 - 2;
        const available  = smallEnd - smallStart;

        if (available <= 0) continue;

        // Calcula quantas pedrinhas cabem para preencher TODO o espaço
        const count = Math.max(1, Math.round(available / SMALL_STEP));
        const step  = available / count;

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
    const DECOR_N    = 65;
    const decorStep  = totalLen / DECOR_N;

    for (let i = 0; i <= totalLen; i += decorStep) {
        const pt = guide.getPointAtLength(i);

        // Calcula o ângulo tangente para obter a direção perpendicular
        const delta  = 2;
        const p1     = guide.getPointAtLength(Math.max(0, i - delta));
        const p2     = guide.getPointAtLength(Math.min(totalLen, i + delta));
        const tang   = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const perpAng = tang + Math.PI / 2; // 90° da tangente = perpendicular

        // Distância perpendicular: entre 28 e 70px (acima ou abaixo aleatório)
        const side   = Math.random() > 0.5 ? 1 : -1;
        const spread = side * (Math.random() * 42 + 28);

        const dx = Math.cos(perpAng) * spread;
        const dy = Math.sin(perpAng) * spread;

        const finalX = pt.x + dx;
        const finalY = pt.y + dy;

        // Tamanho variado: maioria pequena, algumas médias, raras grandes
        const r    = Math.random();
        const size = r > 0.88 ? 32 : r > 0.55 ? 20 : 12;

        const file = DECOR[Math.floor(Math.random() * DECOR.length)];

        const img = document.createElementNS(svgNS, "image");
        img.setAttributeNS(xlinkNS, "href", file);
        img.setAttribute("x",       String(finalX - size / 2));
        img.setAttribute("y",       String(finalY - size / 2));
        img.setAttribute("width",   String(size));
        img.setAttribute("height",  String(size));
        img.setAttribute("opacity", String(Math.random() * 0.3 + 0.65));
        // Rotação aleatória para parecer natural
        img.setAttribute("transform", `rotate(${Math.random() * 360} ${finalX} ${finalY})`);
        svg.appendChild(img);
    }
}
