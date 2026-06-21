import gsap from 'gsap';

export function initDeboraPreloader(onComplete) {
    const preloader = document.getElementById('debora-preloader');
    const words     = document.querySelectorAll('.debora-preloader-text .word');
    const gem       = document.querySelector('.preloader-gem');
    const line      = document.querySelector('.preloader-line');

    if (!preloader || words.length === 0) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
        onComplete: () => {
            preloader.style.display = 'none';
            document.body.style.overflow = '';
            if (typeof onComplete === 'function') onComplete();
        }
    });

    // ── 1. Joia surge do nada com escala + opacidade ──────────────────────
    if (gem) {
        tl.fromTo(gem,
            { opacity: 0, scale: 0, rotation: 45 },
            { opacity: 1, scale: 1, rotation: 0,
              duration: 0.9, ease: "back.out(2.0)" }
        );
    }

    // ── 2. Breve pausa contemplativa antes da escrita ─────────────────────
    tl.to({}, { duration: 0.4 });

    // ── 3. Nome escrito palavra por palavra (wipe left→right) ─────────────
    tl.to(words, {
        clipPath: 'inset(-20% -10% -20% -10%)',
        webkitClipPath: 'inset(-20% -10% -20% -10%)',
        duration: 1.3,
        stagger: 0.45,
        ease: 'power2.inOut'
    });

    // ── 4. Linha ornamental aparece suavemente ────────────────────────────
    if (line) {
        tl.to(line, {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out'
        }, '-=0.3');
    }

    // ── 5. Contemplação — deixa a tela respirar ───────────────────────────
    tl.to({}, { duration: 1.8 });

    // ── 6. Dissolve: texto e joia evaporam com blur ───────────────────────
    tl.to([...words, gem, line].filter(Boolean), {
        opacity: 0,
        filter: 'blur(6px)',
        y: -10,
        duration: 0.9,
        stagger: 0.06,
        ease: 'power2.in'
    });

    // ── 7. Cortina sobe — preloader some com elegância ────────────────────
    tl.to(preloader, {
        opacity: 0,
        yPercent: -4,
        duration: 1.1,
        ease: 'power3.inOut'
    }, '-=0.35');
}
