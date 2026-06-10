import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initDeboraChapters() {
    // 1. Anima a Linha Dourada crescendo de acordo com o Scroll do usuário (Efeito de Jornada)
    gsap.to(".chapters-line-fill", {
        height: "100%",
        ease: "none",
        scrollTrigger: {
            trigger: ".chapters-list",
            start: "top 50%",  // Começa a preencher quando o topo da lista chega no meio da tela
            end: "bottom 50%", // Termina quando o fim da lista chega no meio da tela
            scrub: 1 // O 1 adiciona um atraso de 1 segundo para a linha seguir o scroll suavemente
        }
    });

    // 2. Anima os cartões de Capítulos surgindo dinamicamente
    const chapters = document.querySelectorAll('.chapter-item');
    
    chapters.forEach((chapter, index) => {
        const content = chapter.querySelector('.chapter-content');
        
        // Define de qual lado o cartão deve surgir (zig-zag no desktop)
        const isEven = index % 2 !== 0; // nth-child(even) in CSS maps to odd indices in JS (0-indexed)
        const xOffsetDesktop = isEven ? 60 : -60;
        
        // Usamos MatchMedia do GSAP para ter um comportamento perfeito no celular
        let mm = gsap.matchMedia();
        
        // Desktop: Cartões surgem de lados opostos
        mm.add("(min-width: 769px)", () => {
            gsap.fromTo(content, 
                { opacity: 0, x: xOffsetDesktop, y: 40 },
                { 
                    opacity: 1, x: 0, y: 0, duration: 1.2, ease: "power3.out",
                    scrollTrigger: {
                        trigger: chapter,
                        start: "top 80%",
                        toggleActions: "play reverse play reverse"
                    }
                }
            );
        });

        // Mobile: Cartões sempre surgem da direita para a esquerda
        mm.add("(max-width: 768px)", () => {
            gsap.fromTo(content, 
                { opacity: 0, x: 40, y: 30 },
                { 
                    opacity: 1, x: 0, y: 0, duration: 1, ease: "power3.out",
                    scrollTrigger: {
                        trigger: chapter,
                        start: "top 85%",
                        toggleActions: "play reverse play reverse"
                    }
                }
            );
        });

        // 3. Efeito Interativo: Acende o ponto dourado da timeline quando o usuário está lendo aquele capítulo
        ScrollTrigger.create({
            trigger: chapter,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => chapter.classList.add('is-active'),
            onEnterBack: () => chapter.classList.add('is-active'),
            onLeave: () => chapter.classList.remove('is-active'),
            onLeaveBack: () => chapter.classList.remove('is-active')
        });
    });

    // 4. Animação Final: A Conclusão e a Assinatura
    gsap.fromTo(".chapters-footer > *",
        { opacity: 0, y: 30 },
        { 
            opacity: 1, y: 0, duration: 1.2, stagger: 0.3, ease: "power2.out",
            scrollTrigger: {
                trigger: ".chapters-footer",
                start: "top 85%",
                toggleActions: "play reverse play reverse"
            }
        }
    );
}
