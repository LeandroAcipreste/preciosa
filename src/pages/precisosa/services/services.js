import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLuxuryServicesSection() {
    const isMobile = window.innerWidth <= 768;
    const cards    = gsap.utils.toArray(".luxury-card");

    // Estado inicial
    gsap.set(".luxury-header > *", { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 40 });

    // Timeline de entrada scrub
    const luxuryTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".luxury-services-section",
            start: "top 80%",
            end:   "bottom 60%",
            scrub: isMobile ? 1.0 : 1.6,
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
        }, 0.2 + index * 0.20);
    });

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
