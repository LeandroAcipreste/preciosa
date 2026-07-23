import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initDeboraAbout() {
    // 1. Separa o nome "Débora Bispo Amorim" letra por letra no HTML
    const title = document.querySelector('.about-title');
    if (title) {
        const text = title.textContent;
        title.textContent = ''; 
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            if (char === ' ') span.innerHTML = '&nbsp;'; 
            span.classList.add('char');
            span.style.display = 'inline-block'; 
            title.appendChild(span);
        });
    }

    // 2. Separa os parágrafos palavra por palavra para criar um efeito de revelação incrivelmente elegante e fluido
    const paragraphs = document.querySelectorAll('.about-text-body p');
    paragraphs.forEach(p => {
        const words = p.textContent.split(' ');
        p.textContent = '';
        words.forEach(word => {
            const span = document.createElement('span');
            span.textContent = word; // Apenas a palavra puramente
            span.classList.add('word');
            span.style.display = 'inline-block'; // Permite animação de eixo Y enquanto mantém a quebra de linha natural
            p.appendChild(span);
            // Insere um espaço real no DOM para evitar que as palavras grudem e permitir o Word Wrap nativo
            p.appendChild(document.createTextNode(' '));
        });
    });

    // 3. Cria uma TIMELINE MESTRA para ordenar os eventos em sequência 
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".about-debora",
            start: "top 65%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse"
        }
    });

    // A. Primeiro surge o Nome (Letra por Letra)
    tl.fromTo(".about-title .char",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.03, ease: "power2.out" }
    );

    // B. Em seguida, surgem os subtítulos (Especialista e o Cargo)
    tl.fromTo([".about-subtitle", ".about-role"],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power2.out" },
        "-=0.1" // Inicia ligeiramente antes de terminar o nome
    );

    // C. Por último, o texto é desenhado como uma cachoeira suave
    tl.fromTo(".about-text-body .word",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.015, ease: "power1.out" },
        "-=0.4"
    );

    // 4. Efeito de parallax na moldura de foto (Roda independente da timeline dos textos)
    gsap.fromTo(".about-image-placeholder",
        { opacity: 0, y: 80, scale: 0.95 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".about-debora",
                start: "top 70%",
                end: "bottom 20%",
                toggleActions: "play reverse play reverse" 
            }
        }
    );
}
