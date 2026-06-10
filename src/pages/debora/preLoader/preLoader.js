import gsap from 'gsap';

export function initDeboraPreloader(onComplete) {
    const preloader = document.getElementById('debora-preloader');
    const words = document.querySelectorAll('.debora-preloader-text .word');
    
    // Se o preloader não existir, segue em frente
    if (!preloader || words.length === 0) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    // Trava o scroll do body enquanto o preloader de tela cheia está ativo
    document.body.style.overflow = 'hidden';

    // Cria a Master Timeline para o Preloader e Entrada do Hero
    const tl = gsap.timeline({
        onComplete: () => {
            // Esconde definitivamente o preloader do DOM e destrava o scroll
            preloader.style.display = 'none';
            document.body.style.overflow = '';
            
            // Callback opcional ao final
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }
    });

    // 1. Efeito de escrita à mão (wipe left-to-right em cada palavra)
    tl.to(words, {
        clipPath: "inset(-20% -10% -20% -10%)", // Revela a palavra inteira
        webkitClipPath: "inset(-20% -10% -20% -10%)",
        duration: 1.4,
        stagger: 0.5, // Demora 0.5s para começar a escrever a próxima palavra
        ease: "power2.inOut" // Acelera e desacelera como uma mão escrevendo
    });

    // 2. Tempo de respiro/contemplação com a tela cheia e o nome exposto
    tl.to({}, { duration: 1.5 });

    // 3. Fade-out muito sutil do texto (como se as palavras dissolvessem)
    tl.to(words, {
        opacity: 0,
        filter: "blur(4px)", // Dissolve com um leve esfumaçado
        duration: 1.0,
        stagger: 0.1,
        ease: "power2.in"
    });

    // 4. Abertura do preloader (sobe a cortina de cor escura)
    tl.to(preloader, {
        opacity: 0,
        yPercent: -5, // Levíssimo deslocamento para cima para sensação de alívio e leveza
        duration: 1.2,
        ease: "power3.inOut"
    }, "-=0.2"); // Começa um pouco antes do fade do texto terminar
}
