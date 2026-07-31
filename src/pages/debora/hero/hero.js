import gsap from 'gsap';

// ============================================================
// HERO DÉBORA — ROLO DE FILME ANTIGO
// As fotos passam na horizontal, como um filme sendo desenrolado.
// Um conjunto de quadros é montado e depois clonado, para que o
// loop seja perfeitamente contínuo (sem "salto" ao reiniciar).
// ============================================================

const REEL_COUNT = 20;                         // reel-01.jpg .. reel-20.jpg
const REEL_PATH = './assets_debora/img/reel/';
const SPEED_PX_PER_SEC = 42;                   // velocidade da tira (menor = mais lento/contemplativo)

export function initDeboraHero() {
    const strip = document.getElementById('film-strip');
    if (!strip) return;

    // Evita montar duas vezes (caso a função seja chamada mais de uma vez)
    if (strip.dataset.built === 'true') return;
    strip.dataset.built = 'true';

    // 1. Monta um conjunto de quadros
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= REEL_COUNT; i++) {
        const n = String(i).padStart(2, '0');
        const frame = document.createElement('div');
        frame.className = 'film-frame';

        const img = document.createElement('img');
        img.src = `${REEL_PATH}reel-${n}.jpg`;
        img.alt = `Débora Amorim — foto ${n}`;
        img.loading = 'eager';
        img.decoding = 'async';

        frame.appendChild(img);
        frag.appendChild(frame);
    }
    strip.appendChild(frag);

    // 2. Clona o conjunto para o loop contínuo
    Array.from(strip.children).forEach((node) => {
        strip.appendChild(node.cloneNode(true));
    });

    // 3. Cria/recria a animação medindo a largura real
    let tween;
    function buildLoop() {
        if (tween) tween.kill();
        gsap.set(strip, { x: 0 });

        const half = strip.scrollWidth / 2; // largura de um conjunto completo
        if (half <= 0) return;

        const duration = half / SPEED_PX_PER_SEC;
        tween = gsap.to(strip, {
            x: -half,
            duration,
            ease: 'none',
            repeat: -1,
        });
    }

    // 4. Só mede depois das imagens carregarem (senão scrollWidth vem errado)
    const imgs = Array.from(strip.querySelectorAll('img'));
    let ready = 0;
    const onReady = () => {
        if (++ready >= imgs.length) buildLoop();
    };
    imgs.forEach((img) => {
        if (img.complete) onReady();
        else {
            img.addEventListener('load', onReady, { once: true });
            img.addEventListener('error', onReady, { once: true });
        }
    });
    // Rede de segurança: arranca mesmo se algum onload não disparar
    setTimeout(() => { if (!tween) buildLoop(); }, 3000);

    // 5. Recalcula ao redimensionar (a altura dos quadros muda com a viewport)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildLoop, 250);
    });

    // 6. Micro-interação: desacelera ao passar o mouse (opcional e elegante)
    const reel = strip.closest('.film-reel');
    if (reel && window.matchMedia('(hover: hover)').matches) {
        reel.addEventListener('mouseenter', () => tween && gsap.to(tween, { timeScale: 0.2, duration: 0.6 }));
        reel.addEventListener('mouseleave', () => tween && gsap.to(tween, { timeScale: 1, duration: 0.6 }));
    }
}
