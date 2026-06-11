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
}
