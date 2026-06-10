import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Função utilitária de nível sênior para fragmentar textos para animação sem quebrar acessibilidade ou layout
const splitTextToSpans = (selector, type = 'word') => {
    const element = document.querySelector(selector);
    if (!element) return [];
    
    const content = element.textContent.trim();
    element.textContent = '';
    
    // Se for 'word' separa por espaço. Se for 'char' separa letra por letra.
    const items = type === 'word' ? content.split(' ') : content.split('');
    const className = type === 'word' ? 'word' : 'char';
    
    items.forEach((item) => {
        const span = document.createElement('span');
        span.textContent = item; // Coloca apenas a palavra ou letra puramente

        if (type === 'char' && item === ' ') {
            span.innerHTML = '&nbsp;'; // Preserva o espaço entre as letras caso seja caractere
        }
        
        span.classList.add(className);
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity, clip-path'; // Otimização de renderização (GPU)
        element.appendChild(span);

        // O SEGREDO: Inserimos um espaço real (Nó de Texto do DOM) logo após o span da palavra.
        // Isso impede que as palavras grudem umas nas outras e garante que o navegador quebre as linhas naturalmente.
        if (type === 'word') {
            element.appendChild(document.createTextNode(' '));
        }
    });
    
    return element.querySelectorAll(`.${className}`);
};

export function initDeboraBook() {
    // 1. Fragmenta cada elemento em sua partícula ideal para animação fluida
    const introWords = splitTextToSpans('.book-intro-text p', 'word');
    const titleChars = splitTextToSpans('.book-title-anim', 'char');
    const subtitleWords = splitTextToSpans('.book-subtitle', 'word');

    // 2. Timeline Core para Orquestração das Animações
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".book-debora",
            start: "top 95%", // Aciona exatamente no momento em que a seção começa a aparecer na tela
            end: "bottom 15%",
            toggleActions: "play reverse play reverse" 
        }
    });

    // A. Texto Introdutório: revelado com um sutil efeito de blur cinematográfico
    if (introWords.length) {
        tl.fromTo(introWords, 
            { opacity: 0, y: 15, filter: "blur(5px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.05, ease: "power2.out" }
        );
    }

    // B. Título "Preciosas": Caligrafia dinâmica revelada letra por letra
    if (titleChars.length) {
        tl.fromTo(titleChars,
            // Substituímos o Clip-Path (que estava cortando a barriga do P) por Opacidade e Blur
            { opacity: 0, x: -15, filter: "blur(3px)" },
            { 
                opacity: 1, 
                x: 0, 
                filter: "blur(0px)",
                duration: 0.8, 
                stagger: 0.08, 
                ease: "power3.out" 
            },
            "-=0.6" // Entra quase que imediatamente com o início da intro
        );
    }

    // C. Subtítulo: Subindo palavra por palavra
    if (subtitleWords.length) {
        tl.fromTo(subtitleWords,
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "back.out(1.4)" },
            "-=0.5" 
        );
    }
}
