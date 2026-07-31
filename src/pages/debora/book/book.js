import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initDeboraBook() {
    const intro = document.querySelector('.book-intro-text p');
    const content = document.querySelector('.book-content'); // nome + subtítulo do livro

    // Texto introdutório discreto ("Conheça a obra escrita por Débora")
    if (intro) {
        gsap.fromTo(intro,
            { opacity: 0, y: 15 },
            {
                opacity: 1, y: 0, duration: 1, ease: 'power2.out',
                scrollTrigger: { trigger: '.book-debora', start: 'top 80%', toggleActions: 'play none none none' }
            }
        );
    }

    // ÚNICO efeito: o NOME do livro (mesma fonte da capa) vem EM DIREÇÃO À TELA
    // — começa pequeno/distante e cresce até o tamanho cheio, como se saísse do livro.
    if (content) {
        gsap.fromTo(content,
            { scale: 0.25, opacity: 0 },
            {
                scale: 1, opacity: 1, duration: 1.8, ease: 'power2.out',
                scrollTrigger: { trigger: '.book-debora', start: 'top 65%', toggleActions: 'play none none none' }
            }
        );
    }
}
