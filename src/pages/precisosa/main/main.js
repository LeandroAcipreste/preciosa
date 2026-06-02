import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initMain() {

    // ============================================
    // Animação de entrada do cabeçalho da seção
    // ============================================
    gsap.from(".services-title", {
        scrollTrigger: {
            trigger: ".services-header",
            start: "top 85%",
            once: true
        },
        opacity: 0,
        y: 40,
        duration: 1.0,
        ease: "power3.out"
    });

    gsap.from(".services-subtitle, .services-divider, .services-intro", {
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
        delay: 0.3
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

    gsap.from(".gem-connector", {
        scrollTrigger: {
            trigger: ".gems-grid",
            start: "top 75%",
            once: true
        },
        opacity: 0,
        scaleX: 0,
        duration: 0.6,
        stagger: 0.15,
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
