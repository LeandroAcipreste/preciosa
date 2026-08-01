import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Função auxiliar: quebra texto em <span class="hero-char">, mantendo as palavras unidas
function splitTextChars(element) {
    const text = element.innerText;
    element.innerHTML = '';
    const chars = [];
    
    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';
        
        for (let char of word) {
            const charSpan = document.createElement('span');
            charSpan.className = 'hero-char';
            charSpan.innerText = char;
            wordSpan.appendChild(charSpan);
            chars.push(charSpan);
        }
        
        element.appendChild(wordSpan);
        if (wordIndex < words.length - 1) {
            element.appendChild(document.createTextNode(" "));
        }
    });
    
    return { chars };
}

// =========================================================================
// CONTROLE DE PERFORMANCE DO VÍDEO: Loop Contínuo + Pause na Segunda Dobra
// =========================================================================
function setupVideoScrollControl(video) {
    if (!video) return;

    video.loop = true;  // Loop nativo do navegador — sem delays, acelerado por hardware
    video.muted = true;
    video.play().catch(err => console.warn("Autoplay bloqueado temporariamente:", err));

    // Pausa o vídeo quando o usuário entrar na segunda dobra para economizar CPU/GPU
    ScrollTrigger.create({
        trigger: ".main-preciosa",
        start: "top bottom",
        onEnter: () => {
            video.pause();
        },
        onLeaveBack: () => {
            video.play().catch(() => {});
        }
    });
}

export function initHero(onIntroComplete) {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const isMobileScreen = window.innerWidth < 768;

    function initHeroScrollAnimations() {
        gsap.to(".home-text-mask-container", {
            scrollTrigger: {
                trigger: ".home-content",
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            opacity: 0,
            scale: 1.5,
            transformOrigin: "50% 50%",
            ease: "power1.inOut"
        });

        gsap.to(".hero-scroll-indicator", {
            scrollTrigger: {
                trigger: ".home-content",
                start: "top top",
                end: "30% top",
                scrub: true
            },
            opacity: 0,
            y: -50,
            ease: "power1.in"
        });
    }

    // ==========================================
    // MECANISMO DE FALLBACK
    // ==========================================
    // Definido ANTES de qualquer decisão: os caminhos de "conexão fraca" e de
    // "watchdog já disparou" também precisam dele.
    let fallbackTriggered = false;

    // `instant`: a página já foi revelada pela rede de segurança em CSS, então
    // reanimar do zero causaria um piscar. Nesse caso só fixa o estado final.
    function triggerFallback(instant) {
        if (fallbackTriggered) return;
        fallbackTriggered = true;

        document.getElementById("preloader")?.classList.add("is-hidden");

        const heroMain = document.querySelector(".hero-main");
        if (heroMain) heroMain.classList.add("is-gone");

        document.body.classList.remove("intro-active");

        const video = document.getElementById("home-video");
        if (video) {
            if (!video.src) {
                video.src = "/assets/img/nova-hero.mp4";
                video.load();
            }
            setupVideoScrollControl(video);
        }

        const maskContainer = document.querySelector(".home-text-mask-container");
        const maskText = document.querySelector(".mask-brand-text");
        const scrollIndicator = document.querySelector(".hero-scroll-indicator");
        const endSpacing = isMobileScreen ? "4px" : "15px";

        if (maskContainer) {
            if (instant) {
                gsap.set(maskContainer, { opacity: 1 });
            } else {
                gsap.set(maskContainer, { opacity: 0 });
                gsap.to(maskContainer, { opacity: 1, duration: 2.0, ease: "power2.out", delay: 0.1 });
            }
        }

        if (maskText) {
            if (instant) {
                gsap.set(maskText, { opacity: 1, scale: 1, letterSpacing: endSpacing });
            } else {
                gsap.set(maskText, { opacity: 0, scale: 0.85, letterSpacing: isMobileScreen ? "10px" : "60px" });
                gsap.to(maskText, {
                    opacity: 1, scale: 1, letterSpacing: endSpacing,
                    duration: 2.5, ease: "power3.out", delay: 0.2
                });
            }
        }

        if (scrollIndicator) {
            if (instant) gsap.set(scrollIndicator, { opacity: 1 });
            else gsap.to(scrollIndicator, { opacity: 1, duration: 1.5, ease: "power2.out", delay: 1.0 });
        }

        setTimeout(() => initHeroScrollAnimations(), instant ? 0 : 2200);

        if (typeof onIntroComplete === "function") onIntroComplete();
    }

    // A aplicação assumiu: o watchdog do <head> não precisa mais agir. A partir
    // daqui quem protege é o loadTimeout desta função.
    clearTimeout(window.__preciosaWatchdog);

    // ==========================================
    // PULAR PRELOADER SE JÁ ESTIVER NAVEGANDO
    // ==========================================
    // Se o usuário já carregou essa aba antes e só está voltando da página da Débora, pulamos o carregamento 3D inteiro.
    if (sessionStorage.getItem('preciosaVisited')) {
        document.getElementById("preloader")?.classList.add("is-hidden");
        document.querySelector(".hero-main")?.classList.add("is-gone");
        document.body.classList.remove("intro-active");

        const video = document.getElementById("home-video");
        if (video) {
            video.play().catch(() => {});
            setupVideoScrollControl(video);
        }

        const endSpacing = isMobileScreen ? "4px" : "15px";
        gsap.set(".home-text-mask-container", { opacity: 1 });
        gsap.set(".mask-brand-text", { opacity: 1, scale: 1, letterSpacing: endSpacing });
        gsap.set(".hero-scroll-indicator", { opacity: 1 });

        initHeroScrollAnimations();
        if (typeof onIntroComplete === "function") onIntroComplete();
        return; // Aborta todo o restante (download do modelo 3D, HDRI, etc) economizando banda
    }

    // Grava no cache da sessão que o site já foi acessado
    sessionStorage.setItem('preciosaVisited', 'true');

    // ==========================================
    // CAMINHOS SEM 3D
    // ==========================================
    // 1) O watchdog já revelou a página: o módulo chegou tarde demais e não há
    //    mais intro a tocar — só ligar o que a página precisa para funcionar.
    if (window.__preciosaSafeMode) {
        triggerFallback(true);
        return;
    }

    // 2) Conexão fraca / economia de dados: baixar mapa de ambiente + modelo 3D
    //    é o que fazia o preloader se arrastar no celular. Entra com a intro
    //    leve, que não custa nenhum download extra.
    if (window.__preciosaLightMode) {
        triggerFallback(false);
        return;
    }

    const loadTimeout = setTimeout(() => triggerFallback(false), 8000);

    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    let cena, camera, renderizador, div3d;
    try {
        cena = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;

        renderizador = new THREE.WebGLRenderer({
            // No iPhone o antialias multiplica o custo de memória do buffer, e
            // o iOS derruba o contexto WebGL sob pressão de memória — com dois
            // vídeos decodificando na mesma página, isso é real. Num diamante
            // pequeno em tela de alta densidade a diferença não se vê.
            antialias: !isMobileScreen,
            alpha: true,
            powerPreference: 'default',
        });
        if (!renderizador || !renderizador.getContext()) {
            throw new Error("WebGL indisponível.");
        }
        renderizador.setSize(window.innerWidth, window.innerHeight);
        renderizador.outputColorSpace = THREE.SRGBColorSpace;
        renderizador.toneMapping = THREE.ACESFilmicToneMapping;
        renderizador.toneMappingExposure = 1.2;
        // Clamp do pixel ratio: em telas 2x/3x renderizar em DPR cheio é brutal
        // para a GPU e não agrega qualidade visível num diamante pequeno.
        // No mobile o teto cai para 1.5 — o iPhone chega a DPR 3.
        renderizador.setPixelRatio(Math.min(window.devicePixelRatio, isMobileScreen ? 1.5 : 2));

        div3d = document.querySelector(".hero-div3d");
        if (!div3d) { triggerFallback(); return; }
        renderizador.domElement.classList.add('hero-canvas');
        div3d.appendChild(renderizador.domElement);

        // O iOS pode derrubar o contexto a qualquer momento. Sem tratar, a
        // tela fica num canvas morto e a intro nunca termina.
        renderizador.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            if (window.__diag) window.__diag.erros.push('WebGL: contexto perdido');
            triggerFallback(false);
        });

        if (window.__diag) window.__diag.renderer = 'ok';
    } catch (error) {
        // Antes este catch engolia o erro em silêncio — era por isso que uma
        // falha no iPhone ficava invisível.
        console.error('Intro 3D indisponível:', error);
        if (window.__diag) window.__diag.erros.push('renderer: ' + error.message);
        triggerFallback();
        return;
    }

    // ==========================================
    // CARREGAMENTO ASSÍNCRONO (HDRI + GLTF)
    // ==========================================
    const loadHDRI = new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        // hdri.jpg (136 KB) no lugar do hdri.png (5 MB). É um mapa de ambiente
        // usado só para o reflexo do diamante — JPEG não deixa artefato visível
        // aí, e o PNG sozinho era metade do peso da página.
        textureLoader.load("/assets/img/hdri.jpg", (texture) => {
            try {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                const pmrem = new THREE.PMREMGenerator(renderizador);
                cena.environment = pmrem.fromEquirectangular(texture).texture;
                texture.dispose();
                pmrem.dispose();
                if (window.__diag) window.__diag.hdri = 'ok';
            } catch (err) {
                // PMREM usa render target de half-float. Em WebGL1 sem a
                // extensão (aparelhos antigos) isso lança. O diamante fica sem
                // reflexo do ambiente, mas a intro continua — melhor que nada.
                console.warn('Mapa de ambiente indisponível:', err);
                if (window.__diag) window.__diag.hdri = 'falhou: ' + err.message;
            }
            resolve();
        }, undefined, () => {
            if (window.__diag) window.__diag.hdri = 'nao carregou';
            resolve();
        });
    });

    let objeto;
    const loadGLTF = new Promise((resolve) => {
        new GLTFLoader().load("/assets/img/diamond-compressed.glb", (gltf) => {
            if (window.__diag) window.__diag.glb = 'ok';
            resolve(gltf.scene);
        }, undefined, (err) => {
            if (window.__diag) window.__diag.glb = 'falhou';
            console.warn('Modelo 3D não carregou:', err);
            resolve(null);
        });
    });

    Promise.all([loadHDRI, loadGLTF]).then(([_, sceneObject]) => {
        clearTimeout(loadTimeout);

        if (fallbackTriggered) return;
        if (!sceneObject) { triggerFallback(); return; }

        const h2s = document.querySelectorAll(".hero-title");
        const splits = Array.from(h2s).map((h2) => splitTextChars(h2));

        const isMobile = window.innerWidth < 768;
        const startZ = isMobile ? -20 : -12;
        const startY = isMobile ? 3 : 2;
        const finalZ = isMobile ? 3.5 : 3.2;

        objeto = sceneObject;
        objeto.position.z = startZ;
        objeto.position.y = startY;
        cena.add(objeto);

        const materiais = [];
        objeto.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                    mat.transparent = true;
                    mat.opacity = 0;
                    materiais.push(mat);
                });
            }
        });

        // ==========================================
        // MASTER TIMELINE
        // ==========================================
        const masterTl = gsap.timeline();

        // 1. PRELOADER SOME + VÍDEO COMEÇA A RODAR DEBAIXO DA CORTINA
        masterTl.add(() => {
            document.getElementById("preloader")?.classList.add("is-hidden");

            const video = document.getElementById("home-video");
            if (video) {
                video.loop = true;
                video.muted = true;
                video.play().catch(e => console.log("Aguardando interação:", e));
            }
        });

        masterTl.to({}, { duration: 1.2 });

        // 2. DIAMANTE SURGE
        masterTl.to(materiais, {
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        });

        masterTl.to({}, { duration: 0.1 });

        let currentTime = masterTl.duration();

        // 3. TIPOGRAFIA INTRO
        splits.forEach((split, index) => {
            const chars = [...split.chars];

            const shuffledIn = gsap.utils.shuffle([...chars]);
            const staggerIn = Math.min(0.08, 0.8 / chars.length);
            shuffledIn.forEach((char, i) => {
                masterTl.to(char, {
                    duration: 0,
                    onComplete: () => char.classList.add('is-visible')
                }, currentTime + (i * staggerIn));
            });

            currentTime += (chars.length * staggerIn) + 1.1;

            const shuffledOut = gsap.utils.shuffle([...chars]);
            const staggerOut = Math.min(0.05, 0.5 / chars.length);
            shuffledOut.forEach((char, i) => {
                masterTl.to(char, {
                    duration: 0,
                    onComplete: () => char.classList.remove('is-visible')
                }, currentTime + (i * staggerOut));
            });

            currentTime += (chars.length * staggerOut) + 0.2;
            if (index < splits.length - 1) currentTime += 0.1;
        });

        // 4. MOVIMENTO DO DIAMANTE
        const diamondMoveStart = currentTime - 0.5;

        masterTl.to(objeto.position, { x: 0, y: 0, duration: 1.4, ease: "power2.out" }, diamondMoveStart);
        masterTl.to(objeto.rotation, { x: 1.5 * Math.PI, duration: 1.4, ease: "power2.out" }, diamondMoveStart);
        masterTl.to(objeto.position, { z: finalZ, duration: 0.8, ease: "power3.inOut" }, diamondMoveStart + 1.0);

        const endIntroTime = diamondMoveStart + 1.8;

        // 5. CORTINA SOBE — vídeo já está rodando continuamente no fundo
        masterTl.add(() => {
            document.querySelector(".hero-main")?.classList.add("is-gone");
            if (typeof onIntroComplete === "function") onIntroComplete();
        }, endIntroTime);

        // 6. ANIMAÇÕES DA MÁSCARA PRINCIPAL
        const startSpacing = isMobileScreen ? "10px" : "60px";
        const endSpacing   = isMobileScreen ? "4px"  : "15px";

        masterTl.set(".home-text-mask-container", { opacity: 0 }, 0);
        masterTl.set(".mask-brand-text", {
            opacity: 0,
            letterSpacing: startSpacing,
            scale: 0.85,
            transformOrigin: "50% 50%"
        }, 0);

        masterTl.to(".home-text-mask-container", {
            opacity: 1, duration: 2.0, ease: "power2.out"
        }, endIntroTime + 0.2);

        masterTl.to(".mask-brand-text", {
            opacity: 1, letterSpacing: endSpacing, scale: 1,
            duration: 3.5, ease: "power4.out"
        }, endIntroTime + 0.8);

        masterTl.to(".hero-scroll-indicator", {
            opacity: 1, duration: 1.5, ease: "power2.out"
        }, endIntroTime + 2.2);

        const finalTime = endIntroTime + 4.5;
        masterTl.to({}, { duration: 0.1 }, finalTime);

        // 7. SCROLL ANIMATIONS + PAUSE INTELIGENTE DO VÍDEO NA SEGUNDA DOBRA
        masterTl.add(() => {
            initHeroScrollAnimations();
            const video = document.getElementById("home-video");
            setupVideoScrollControl(video);
        }, finalTime + 0.1);
    });

    // ==========================================
    // LOOP ROTATIVO THREE.JS
    // ==========================================
    // Só renderiza enquanto o herói está visível. Ao entrar na segunda dobra,
    // pausamos o render (a GPU fica livre para o scroll das dobras seguintes) e
    // retomamos se o usuário voltar ao topo. Este era o principal gargalo que
    // fazia a página "travar" ao rolar entre as seções.
    let heroVisible = true;
    ScrollTrigger.create({
        trigger: ".main-preciosa",
        start: "top bottom",
        onEnter: () => { heroVisible = false; },
        onLeaveBack: () => { heroVisible = true; },
    });

    function animar() {
        requestAnimationFrame(animar);
        if (!heroVisible) return;              // Fora de tela: não gasta GPU
        if (objeto && renderizador && cena && camera) {
            objeto.rotation.y += 0.005;
            renderizador.render(cena, camera);
        }
    }
    animar();

    window.addEventListener("resize", () => {
        if (camera && renderizador) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderizador.setSize(window.innerWidth, window.innerHeight);
        }
    });
}