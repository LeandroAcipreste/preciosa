import gsap from 'gsap';

// ============================================================
// MODAL DA JORNADA
// Abre pelo botão "Conheça a Jornada". Mostra os cards dos capítulos,
// trocando por SCROLL (PC) e por TOQUE/SWIPE (mobile). Setas e teclas
// como apoio. Os capítulos vêm da seção .chapters-debora (oculta).
// ============================================================

export function initDeboraChapters() {
    const openBtn   = document.getElementById('journey-open');
    const portal    = document.getElementById('journey-portal');
    const track     = document.getElementById('journey-track');
    const closeBtn  = document.getElementById('journey-close');
    const prevBtn   = document.getElementById('journey-prev');
    const nextBtn   = document.getElementById('journey-next');
    const counterEl = document.getElementById('journey-counter');
    const fillEl    = document.getElementById('journey-progress-fill');
    const viewport  = document.getElementById('journey-viewport');
    if (!openBtn || !portal || !track) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Constrói os slides a partir dos capítulos ocultos
    const data = Array.from(document.querySelectorAll('.chapters-debora .chapter-item')).map((it) => ({
        num:   it.querySelector('.chapter-number')?.textContent.trim() || '',
        title: it.querySelector('.chapter-title')?.textContent.trim() || '',
        text:  it.querySelector('.chapter-text')?.textContent.trim() || '',
    }));

    data.forEach((c) => {
        const s = document.createElement('article');
        s.className = 'journey-slide';
        s.innerHTML = `
            <span class="journey-num">${c.num}</span>
            <h3 class="journey-slide-title">${c.title}</h3>
            <p class="journey-slide-text">${c.text}</p>`;
        track.appendChild(s);
    });

    // Slide final: conclusão + assinatura + e-book
    const footer = document.querySelector('.chapters-debora .chapters-footer');
    if (footer) {
        const quote = footer.querySelector('p')?.innerHTML || '';
        const href = footer.querySelector('.ebook-btn')?.getAttribute('href') || '#';
        const s = document.createElement('article');
        s.className = 'journey-slide journey-slide-final';
        s.innerHTML = `
            <p class="journey-final-quote">${quote}</p>
            <div class="journey-signoff">Com carinho e afeto,</div>
            <div class="journey-signature">Débora Bispo Amorim</div>
            <a href="${href}" class="journey-ebook">Adquira seu E-book</a>`;
        track.appendChild(s);
    }

    const slides = Array.from(track.querySelectorAll('.journey-slide'));
    const total = slides.length;
    if (!total) return;

    let index = 0, isOpen = false, busy = false;
    const COOLDOWN = 650;

    // Nasce inerte: nada dentro do modal recebe clique ou foco enquanto fechado.
    portal.inert = true;

    // Avisa em voz alta quando o SO/navegador pede movimento reduzido: nesse
    // modo a coreografia é propositalmente suprimida, e sem esta pista fica
    // parecendo que a animação simplesmente "não funciona".
    if (reduce) {
        console.info(
            'Jornada: "prefers-reduced-motion" está ATIVO neste sistema — a ' +
            'transição cinematográfica foi reduzida a um fade curto de propósito. ' +
            'No Windows: Configurações > Acessibilidade > Efeitos visuais > Efeitos de animação.'
        );
    }

    function render(dir) {
        // Estado explícito em TODOS os slides (evita resíduo de estilo inline
        // do GSAP, que sobrescreve o CSS e corrompe o estado entre aberturas)
        slides.forEach((s) => {
            if (s === slides[index]) return;
            s.classList.remove('is-active');
            gsap.killTweensOf(s);
            gsap.set(s, { opacity: 0, x: 0 });
        });

        const cur = slides[index];
        cur.classList.add('is-active');
        cur.scrollTop = 0;
        gsap.killTweensOf(cur);
        if (!reduce) {
            gsap.fromTo(cur, { opacity: 0, x: dir >= 0 ? 60 : -60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
        } else {
            gsap.set(cur, { opacity: 1, x: 0 });
        }
        // Guardas: um elemento de UI ausente não pode derrubar render() — em go()
        // a exceção escaparia com busy=true e travaria a navegação para sempre.
        if (counterEl) counterEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
        if (fillEl) fillEl.style.width = ((index + 1) / total * 100) + '%';
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === total - 1;
    }

    function go(delta) {
        if (busy) return;
        const next = Math.min(total - 1, Math.max(0, index + delta));
        if (next === index) return;
        busy = true;
        const dir = next > index ? 1 : -1;
        index = next;
        render(dir);
        setTimeout(() => { busy = false; }, COOLDOWN);
    }

    const stage = portal.querySelector('.journey-stage');

    // ============================================================
    // TRANSIÇÃO CINEMATOGRÁFICA 3D — encenada em três tempos que não se
    // atropelam. Nada abre nem fecha "de estalo".
    // Marcações abaixo em tempo de BASE; o tempo real sai da divisão pelo
    // OPEN_SPEED/CLOSE_SPEED logo adiante (hoje, ~5,1s abrindo e ~2,5s fechando).
    //   0,00–1,05  o nome do livro sobe e o subtítulo desce, como cortina;
    //   1,10–2,80  as bordas arredondadas se expandem devagar até a tela cheia
    //              (a câmera mergulha no vídeo, que continua o mesmo do livro);
    //   2,40–3,65  os capítulos vêm do fundo para a frente.
    // ============================================================
    const frame        = document.querySelector('.book-frame');
    const bookTitle    = document.querySelector('.book-title-anim');
    const bookSubtitle = document.querySelector('.book-subtitle');
    const bookVideo    = document.querySelector('.book-video-bg');
    const portalVideo  = portal.querySelector('.journey-portal-video');
    const FULL_CLIP    = 'inset(0px 0px 0px 0px round 0px)';

    // Elementos do livro que a transição desloca — restaurados juntos no fim.
    const bookParts = [bookTitle, bookSubtitle, openBtn].filter(Boolean);

    // RITMO — únicos números a mexer para acelerar/desacelerar a transição
    // inteira. Menor = mais lento; a proporção entre as etapas é preservada.
    const OPEN_SPEED  = 0.72; // abertura:   3,65s de base  ->  ~5,0s (medido)
    const CLOSE_SPEED = 0.80; // fechamento: 2,47s de base  ->  ~3,1s

    let tl = null;        // timeline da transição em curso
    let hideTimer = null; // rede de segurança do fechamento

    // A moldura está na tela e serve de porta de entrada? Se não, a transição
    // degrada para um fade simples em vez de quebrar.
    function canDive() {
        if (!frame) return false;
        const r = frame.getBoundingClientRect();
        return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < window.innerHeight;
    }

    let frameRadius = 0; // raio da moldura, medido uma vez por transição

    // Recorte do portal interpolado entre a moldura do livro (p=0) e a tela
    // cheia (p=1). A moldura é medida a cada frame de propósito: assim o
    // mergulho continua colado nela mesmo se a página rolar, a janela mudar de
    // tamanho ou a própria moldura estiver sendo animada.
    function clipAt(p) {
        if (!frame) return FULL_CLIP;
        const r = frame.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return FULL_CLIP;
        const W = window.innerWidth, H = window.innerHeight;
        const t = Math.min(1, Math.max(0, p));
        const k = 1 - t;
        // O raio tem curva própria: encolhe só no finalzinho, para que as
        // bordas continuem visivelmente arredondadas enquanto se expandem.
        const rk = 1 - t * t * t;
        return `inset(${Math.max(0, r.top) * k}px ${Math.max(0, W - r.right) * k}px ` +
               `${Math.max(0, H - r.bottom) * k}px ${Math.max(0, r.left) * k}px ` +
               `round ${frameRadius * rk}px)`;
    }

    // Anima o recorte entre dois pontos, recalculando a moldura frame a frame.
    function tweenClip(timeline, from, to, duration, at) {
        const c = { p: from };
        timeline.to(c, {
            p: to, duration, ease: 'power2.inOut',
            onUpdate: () => { portal.style.clipPath = clipAt(c.p); },
        }, at);
    }

    // O tempo t já está baixado neste vídeo? Buscar um ponto NÃO bufferizado
    // deixa o elemento em branco durante o seek — justamente o que não pode
    // acontecer no meio da transição.
    function isBuffered(v, t) {
        for (let i = 0; i < v.buffered.length; i++) {
            if (t >= v.buffered.start(i) && t <= v.buffered.end(i)) return true;
        }
        return false;
    }

    // É o mesmo arquivo de vídeo nos dois lugares: alinhar o tempo de
    // reprodução faz a passagem da moldura para a tela cheia ser imperceptível.
    // Fica pausado enquanto o modal está fechado (não faz sentido decodificar
    // duas cópias do mesmo vídeo o tempo todo).
    function startVideo() {
        if (!portalVideo) return;
        try {
            const t = bookVideo && bookVideo.readyState >= 1 ? bookVideo.currentTime : null;
            if (t !== null && portalVideo.readyState >= 2 && isBuffered(portalVideo, t)) {
                portalVideo.currentTime = t;
            }
            portalVideo.play?.().catch(() => {});
        } catch {
            /* vídeo ainda não pronto — abre sem sincronizar, o fade cobre */
        }
    }

    function stopVideo() {
        try { portalVideo?.pause(); } catch { /* nada a fazer */ }
    }

    // Zera TODO o estado visual do modal (classes + estilos inline do GSAP).
    // Chamado no fechamento para que a próxima abertura parta sempre do zero.
    function resetStage() {
        // Não mata tweens do .book-content: aquele pertence à entrada por
        // scroll do livro (book.js), não a esta transição.
        gsap.killTweensOf([portal, stage, slides, portalVideo, frame]);
        slides.forEach((s) => s.classList.remove('is-active'));
        gsap.set(slides, { clearProps: 'all' });
        gsap.set(stage, { clearProps: 'all' });
        gsap.set(portal, { clearProps: 'all' });
        portal.style.clipPath = ''; // escrito à mão em tweenClip; clearProps não alcança
        if (portalVideo) gsap.set(portalVideo, { clearProps: 'all' });
    }

    // Esconde de fato e devolve a cena do livro ao estado original.
    // Idempotente: pode ser chamado quantas vezes for.
    function hardHide() {
        clearTimeout(hideTimer);
        portal.classList.remove('is-open');
        stopVideo();
        resetStage();
        if (bookParts.length) {
            gsap.killTweensOf(bookParts);
            gsap.set(bookParts, { clearProps: 'all' });
        }
        if (frame) gsap.set(frame, { clearProps: 'transform' });
    }

    function open() {
        if (isOpen) return;
        isOpen = true;
        index = 0;
        busy = false; // nunca deixa a trava presa de uma sessão anterior

        clearTimeout(hideTimer);
        if (tl) tl.kill(); // reabrir no meio do fechamento é legítimo

        // Visibilidade é 100% governada pela classe (CSS usa display:none/block).
        // Nada de pointer-events inline aqui: era isso que deixava resíduo entre
        // as aberturas.
        portal.classList.add('is-open');
        portal.setAttribute('aria-hidden', 'false');
        portal.inert = false;

        document.addEventListener('keydown', onKey);

        // Se qualquer coisa aqui falhar, o portal continua aberto e utilizável
        // (antes, um erro deixava isOpen travado em true e o botão morria).
        try {
            render(1);
            startVideo();

            const dive = canDive();
            if (dive) frameRadius = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 0;

            if (reduce) {
                // Movimento reduzido: sem deslocamento, mas ainda com um fade
                // curto — nada aparece de estalo.
                gsap.set(portal, { clipPath: FULL_CLIP });
                tl = gsap.timeline();
                tl.fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0);
                tl.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.25);
                if (bookParts.length) tl.to(bookParts, { opacity: 0, duration: 0.4 }, 0);
            } else {
                gsap.set(portal, { opacity: 0, clipPath: dive ? clipAt(0) : FULL_CLIP });

                // Distância de saída medida na moldura: o texto sai de cena
                // por inteiro, não importa o tamanho da tela.
                const span = (dive ? frame.getBoundingClientRect().height : window.innerHeight) * 0.62;

                tl = gsap.timeline();

                // 1) CORTINA — o nome do livro sobe, o subtítulo (e o botão)
                //    descem. Lento e com opacidade caindo só no fim do curso,
                //    para que o movimento seja percebido, não um sumiço.
                //    'overwrite' assume o controle caso a entrada por scroll do
                //    livro ainda esteja rodando (clique ao chegar na seção).
                if (bookTitle) {
                    tl.to(bookTitle, {
                        y: -span, opacity: 0, duration: 1.05,
                        ease: 'power2.in', overwrite: 'auto',
                    }, 0);
                }
                if (bookSubtitle) {
                    tl.to(bookSubtitle, {
                        y: span * 0.85, opacity: 0, duration: 1.05,
                        ease: 'power2.in', overwrite: 'auto',
                    }, 0);
                }
                tl.to(openBtn, {
                    y: span * 0.95, opacity: 0, duration: 0.95,
                    ease: 'power2.in', overwrite: 'auto',
                }, 0.1);

                // 2) AS BORDAS ARREDONDADAS SE EXPANDEM — coração do efeito.
                //    Só entra depois que a cortina terminou o curso (senão o
                //    portal cobriria justamente o movimento que se quer ver) e
                //    leva 1,7s, com o raio segurando o arredondado até o fim.
                tl.to(portal, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0.95);
                if (dive) {
                    tweenClip(tl, 0, 1, 1.7, 1.1);
                    tl.to(frame, { scale: 1.06, duration: 1.7, ease: 'power2.inOut' }, 1.1);
                }
                // Dolly contínuo sobre o diamante. Nunca desce abaixo de 1: o
                // vídeo não pode descobrir a borda da tela.
                if (portalVideo) {
                    tl.fromTo(portalVideo, { scale: 1 }, { scale: 1.1, duration: 3.5, ease: 'power1.out' }, 0.95);
                }

                // 3) OS CAPÍTULOS VÊM DO FUNDO PARA A FRENTE, entrando quando a
                //    abertura já tomou quase toda a tela — antes disso o recorte
                //    ainda os cortaria pelas bordas.
                tl.fromTo(stage,
                    { opacity: 0, z: -900, rotateX: 9, transformPerspective: 1400 },
                    { opacity: 1, z: 0, rotateX: 0, duration: 1.25, ease: 'power3.out' }, 2.4);

                tl.timeScale(OPEN_SPEED);
            }
        } catch (err) {
            console.warn('Jornada: falha ao montar a exibição —', err);
            gsap.set(portal, { opacity: 1, clipPath: FULL_CLIP });
            gsap.set(stage, { opacity: 1, z: 0, rotateX: 0 });
        }

        if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        busy = false;
        document.removeEventListener('keydown', onKey);

        // O estado lógico cai AGORA, antes de qualquer animação: mesmo durante
        // a saída o modal já não recebe clique nem foco. É o que garante que o
        // botão volte a funcionar mesmo se a animação for interrompida.
        portal.setAttribute('aria-hidden', 'true');
        portal.inert = true;

        clearTimeout(hideTimer);
        if (tl) tl.kill();

        // Devolve o foco ao botão que abriu (acessibilidade + garante que ele
        // volta a ser o elemento ativo da página).
        openBtn.focus({ preventScroll: true });

        if (reduce) { hardHide(); return; }

        // Saída simétrica e igualmente encenada: os capítulos recuam para o
        // fundo, as bordas arredondadas se fecham de volta na moldura e só
        // então a cortina do livro torna a fechar, devagar.
        tl = gsap.timeline({ onComplete: hardHide });
        tl.to(stage, { opacity: 0, z: -700, duration: 0.5, ease: 'power2.in' }, 0);
        if (canDive()) tweenClip(tl, 1, 0, 1.0, 0.25);
        if (frame) tl.to(frame, { scale: 1, duration: 1.0, ease: 'power2.inOut' }, 0.25);
        tl.to(portal, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 1.05);
        // A cortina só volta DEPOIS que o portal ficou transparente. Medido:
        // com ela voltando antes, todo o percurso acontecia atrás de uma camada
        // ainda opaca e o texto simplesmente reaparecia pronto no lugar.
        if (bookParts.length) {
            tl.to(bookParts, {
                y: 0, opacity: 1, duration: 1.1, ease: 'power2.out', stagger: 0.07,
            }, 1.3);
        }

        // Prazo real medido ANTES do timeScale, para não depender de como o
        // GSAP reporta duração já escalonada.
        const realMs = (tl.totalDuration() / CLOSE_SPEED) * 1000 + 400;
        tl.timeScale(CLOSE_SPEED);

        // Rede de segurança: se a timeline for morta ou nunca completar, o
        // portal some assim mesmo — nunca sobra camada invisível sobre a
        // página. O prazo acompanha o ritmo; se fosse fixo, deixar a animação
        // mais lenta faria o timer cortá-la pela metade.
        hideTimer = setTimeout(hardHide, realMs);
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
    }

    // Abrir / fechar
    openBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); });
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); close(); });
    portal.addEventListener('click', (e) => {
        if (e.target === portal ||
            e.target.classList.contains('journey-portal-overlay') ||
            e.target.classList.contains('journey-portal-video')) close();
    });

    // Setas
    if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(1));

    // SCROLL (PC)
    let wheelLock = false;
    portal.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (wheelLock || busy) return;
        if (Math.abs(e.deltaY) < 8) return;
        wheelLock = true;
        go(e.deltaY > 0 ? 1 : -1);
        setTimeout(() => { wheelLock = false; }, COOLDOWN);
    }, { passive: false });

    // TOQUE / SWIPE (mobile)
    let ty = null, tx = null;
    const swipeTarget = viewport || portal;
    swipeTarget.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
    swipeTarget.addEventListener('touchend', (e) => {
        if (ty === null) return;
        const dy = e.changedTouches[0].clientY - ty;
        const dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dy) > 45 || Math.abs(dx) > 45) {
            const primary = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
            go(primary < 0 ? 1 : -1);
        }
        ty = tx = null;
    }, { passive: true });
}
