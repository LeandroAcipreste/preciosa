import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLuxuryServicesSection() {
    const isMobile = window.innerWidth <= 768;
    const cards    = gsap.utils.toArray(".luxury-card");

    // ── Estado inicial ──────────────────────────────────────────────────────
    gsap.set(".luxury-header > *", { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 40 });

    // ── Timeline de entrada com scrub silk-smooth ───────────────────────────
    const luxuryTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".luxury-services-section",
            start: "top 80%",
            end:   "bottom 60%",
            scrub: 1.6,
            invalidateOnRefresh: true
        }
    });

    // Cabeçalho (subtitle → title → divider em stagger)
    luxuryTl.to(".luxury-header > *", {
        opacity: 1,
        y: 0,
        stagger: 0.10,
        ease: "sine.out",
        duration: 0.6
    }, 0);

    // Cards em cascata orgânica
    cards.forEach((card, index) => {
        luxuryTl.to(card, {
            opacity: 1,
            y: 0,
            ease: "sine.out",
            duration: 0.8
        }, 0.2 + index * 0.20);
    });

    // ── Paralaxe do fundo de diamante ──────────────────────────────────────
    // O background desliza a 15% do percurso do scroll → ilusão de profundidade 3D
    gsap.to(".luxury-bg-parallax", {
        yPercent: isMobile ? 10 : 15,
        ease: "none",
        scrollTrigger: {
            trigger: ".luxury-services-section",
            start: "top bottom",
            end:   "bottom top",
            scrub: true
        }
    });

    // ── Micro-interação: brilho que segue o mouse dentro do vidro ───────────
    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width)  * 100;
            const y = ((e.clientY - rect.top)  / rect.height) * 100;
            card.style.setProperty("--mouse-x", `${x}%`);
            card.style.setProperty("--mouse-y", `${y}%`);
        });

        // Reseta ao sair para não congelar o brilho em posição estranha
        card.addEventListener("mouseleave", () => {
            card.style.setProperty("--mouse-x", "50%");
            card.style.setProperty("--mouse-y", "50%");
        });
    });
}
