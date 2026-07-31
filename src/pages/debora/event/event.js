import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initDeboraEvent() {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".event-debora",
            start: "top 75%",
            toggleActions: "play reverse play reverse"
        }
    });

    // Anima todos os textos e o botão da esquerda subindo em cascata
    tl.fromTo(".event-content > *",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" }
    );

    // Anima a imagem surgindo da direita com um efeito de escala e blur
    tl.fromTo(".event-image-wrapper",
        { opacity: 0, scale: 0.9, filter: "blur(10px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.5, ease: "power2.out" },
        "-=0.8"
    );

    initMentoriaPortal();
}

// ============================================================
// PORTAL 3D — "ENTRE NÓS"
// Abre a atmosfera do curso APENAS quando o usuário clica no convite
// "Conheça a experiência" sobre a foto (ou aciona pelo teclado).
// ============================================================
function initMentoriaPortal() {
    const trigger  = document.getElementById('mentoria-portal-trigger');
    const portal   = document.getElementById('mentoria-portal');
    const closeBtn = document.getElementById('mentoria-portal-close');
    if (!trigger || !portal) return;

    const bg    = portal.querySelector('.mentoria-portal-bg');
    const panel = portal.querySelector('.mentoria-portal-panel');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let isOpen = false;

    function onKey(e) {
        if (e.key === 'Escape') closePortal();
    }

    function openPortal() {
        if (isOpen) return;
        isOpen = true;
        portal.classList.add('is-open');
        document.addEventListener('keydown', onKey);

        if (reduce) return;

        gsap.killTweensOf([bg, panel]);
        // Efeito de "portal": o fundo mergulha de longe para perto
        gsap.fromTo(bg,
            { scale: 1.45, filter: 'blur(6px)' },
            { scale: 1.18, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }
        );
        // O painel de conteúdo desliza e materializa
        gsap.fromTo(panel,
            { opacity: 0, x: -60 },
            { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 }
        );
        gsap.fromTo('.mp-inner > *',
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.035, ease: 'power2.out', delay: 0.25 }
        );
    }

    function closePortal() {
        if (!isOpen) return;
        isOpen = false;
        document.removeEventListener('keydown', onKey);

        if (reduce) {
            portal.classList.remove('is-open');
            return;
        }

        gsap.killTweensOf([bg, panel]);
        gsap.to(bg, { scale: 1.45, filter: 'blur(6px)', duration: 0.55, ease: 'power2.in' });
        gsap.to(panel, {
            opacity: 0, x: -40, duration: 0.4, ease: 'power2.in',
            onComplete: () => { portal.classList.remove('is-open'); }
        });
    }

    // ── Abertura ─────────────────────────────────────────────
    // SOMENTE por clique/toque no convite "Conheça a experiência". Antes o
    // portal também abria ao passar o mouse, o que disparava a animação sem o
    // usuário pedir — só de rolar a página com o cursor sobre a foto.
    trigger.addEventListener('click', openPortal);
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPortal(); }
    });

    // ── Fechamento ───────────────────────────────────────────
    if (closeBtn) closeBtn.addEventListener('click', closePortal);
    portal.addEventListener('click', (e) => {
        // Fecha ao clicar fora do painel (na área da imagem)
        if (e.target === portal ||
            e.target.classList.contains('mentoria-portal-bg') ||
            e.target.classList.contains('mentoria-portal-scrim')) {
            closePortal();
        }
    });
}
