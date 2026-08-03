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
    // Marcador do painel ?diag=1 — sem ele o painel dizia "initHero: NÃO"
    // mesmo tendo rodado, o que jogaria a investigação para o lado errado.
    if (window.__diag) window.__diag.initHero = Date.now() - window.__diag.inicio;

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
    // CAMINHO SEM 3D — um só, e de último caso
    // ==========================================
    // A referência de designsystem/Site/script.js roda o mesmo diamante no
    // celular sem NENHUMA trava: mesmo import map, mesmo three, mesmo GLTF,
    // mesmo PMREM, antialias ligado e DPR cheio. Ela funciona. Isso prova que
    // o 3D nunca foi o problema — as travas defensivas em volta dele é que
    // estavam desligando o cristal no celular.
    //
    // Ficou só esta: o watchdog do <head> já revelou a página porque os
    // módulos NÃO chegaram a tempo. Nesse caso não há três.js carregado para
    // rodar coisa alguma, então não é uma escolha, é uma constatação.
    if (window.__preciosaSafeMode) {
        triggerFallback(true);
        return;
    }

    // Prazo generoso de propósito: isto é rede de segurança para download que
    // FALHOU, não régua de desempenho. Cortar em 8s tirava o cristal de
    // qualquer celular um pouco mais lento — que é exatamente a reclamação.
    const loadTimeout = setTimeout(() => triggerFallback(false), 20000);

    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    let cena, camera, renderizador, div3d;
    try {
        cena = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;

        // Configuração IDÊNTICA à de designsystem/Site/script.js, que roda
        // este mesmo diamante no celular sem problema. Eu havia desligado o
        // antialias e baixado o DPR no mobile por precaução — mas era palpite
        // meu, e a referência prova que não é necessário.
        renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        if (!renderizador || !renderizador.getContext()) {
            throw new Error("WebGL indisponível.");
        }
        renderizador.setSize(window.innerWidth, window.innerHeight);
        renderizador.outputColorSpace = THREE.SRGBColorSpace;
        renderizador.toneMapping = THREE.ACESFilmicToneMapping;
        renderizador.toneMappingExposure = 1.2;
        // Único desvio da referência (que usa DPR cheio): teto em 2. Acima
        // disso são 4x mais pixels sem diferença visível num diamante pequeno.
        renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
    // Marca se o mapa de ambiente realmente entrou na cena. Sem ele, materiais
    // de vidro/metal renderizam INVISÍVEIS — era o "só o diamante não aparece"
    // no celular (GPUs móveis sem half-float fazem o PMREM falhar).
    let envCarregado = false;

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
                envCarregado = true;
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

        objeto = sceneObject;
        objeto.position.z = startZ;
        objeto.position.y = startY;
        cena.add(objeto);

        // ==========================================
        // ENQUADRAMENTO FINAL — calculado, não chutado
        // ==========================================
        // O valor antigo era fixo: 3.5 no celular contra 3.2 no desktop. Com a
        // câmera em z=4, isso deixa o diamante a 0,5 unidade no celular e a 0,8
        // no desktop — ou seja, MAIS PERTO na tela menor, o oposto do
        // necessário. E o FOV do three é VERTICAL: numa tela estreita e alta a
        // largura visível encolhe junto (40° viram ~21° de horizontal), então a
        // janela fica menor que o próprio diamante. A câmera acabava dentro da
        // malha, e o interior de uma malha com faces viradas para fora não
        // desenha nada: diamante invisível, sem nenhum erro no console.
        //
        // Agora a distância vem do tamanho real do modelo e da proporção real
        // da tela. Funciona em qualquer aparelho, sem número mágico.
        const caixa = new THREE.Box3().setFromObject(objeto);
        const tamanho = caixa.getSize(new THREE.Vector3());
        const raio = Math.max(tamanho.x, tamanho.y, tamanho.z) / 2;

        const fovV = THREE.MathUtils.degToRad(camera.fov);
        const distanciaV = raio / Math.tan(fovV / 2);              // cabe na altura
        const distanciaH = raio / (Math.tan(fovV / 2) * camera.aspect); // cabe na largura

        // 0.85 mantém a intenção original — o diamante fecha a intro tomando a
        // tela, levemente maior que o quadro. O que muda é que agora isso é
        // relativo ao tamanho do modelo (raio 1.0) e à proporção real da tela,
        // então a câmera nunca mais termina DENTRO da malha: no desktop ficava
        // a 0.8 e no celular a 0.5 de um raio 1.0. O segundo termo é o piso de
        // segurança que garante isso em qualquer aparelho.
        const distancia = Math.max(Math.max(distanciaV, distanciaH) * 0.85, raio * 1.6);
        const finalZ = camera.position.z - distancia;

        if (window.__diag) {
            window.__diag.enquadramento =
                `raio=${raio.toFixed(2)} aspect=${camera.aspect.toFixed(2)} ` +
                `dist=${distancia.toFixed(2)} finalZ=${finalZ.toFixed(2)}`;
        }

        // ==========================================
        // FALLBACK DE VISIBILIDADE DO DIAMANTE
        // ==========================================
        // Sem o mapa de ambiente (PMREM falhou ou o hdri.jpg não chegou),
        // o material original de vidro/metal não tem o que refletir e fica
        // invisível. Aqui o diamante troca para um material que funciona com
        // LUZES comuns — menos suntuoso, porém SEMPRE visível.
        if (!envCarregado) {
            if (window.__diag) window.__diag.erros.push('env ausente: usando material de contingência');

            const luzPrincipal = new THREE.DirectionalLight(0xffffff, 2.6);
            luzPrincipal.position.set(2, 4, 5);
            cena.add(luzPrincipal);

            const luzPreenchimento = new THREE.DirectionalLight(0xffe9c9, 1.3);
            luzPreenchimento.position.set(-3, -1, 2);
            cena.add(luzPreenchimento);

            cena.add(new THREE.AmbientLight(0xffffff, 0.65));

            objeto.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xf6f0ff,          // branco-cristal com leve tom frio
                        metalness: 0.15,
                        roughness: 0.08,
                        clearcoat: 1.0,
                        clearcoatRoughness: 0.06,
                        flatShading: true,        // realça as facetas sem depender de reflexo
                    });
                }
            });
        }

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

            // Telemetria do painel ?diag=1: ONDE o diamante está na tela e que
            // tamanho ocupa. Se ele estiver sendo desenhado fora do quadro, ou
            // com tamanho zero, é aqui que aparece — sem isso, "canvas na tela:
            // SIM" não distingue um diamante visível de um invisível.
            if (window.__diag) {
                const p = objeto.position.clone().project(camera);
                const r = renderizador.domElement.getBoundingClientRect();
                const x = Math.round((p.x * 0.5 + 0.5) * r.width);
                const y = Math.round((-p.y * 0.5 + 0.5) * r.height);
                const dist = camera.position.distanceTo(objeto.position);
                const dentro = p.x >= -1 && p.x <= 1 && p.y >= -1 && p.y <= 1 && p.z < 1;
                window.__diag.diamante =
                    `x=${x} y=${y} dist=${dist.toFixed(2)} ` +
                    `${dentro ? 'NO QUADRO' : 'FORA DO QUADRO'}`;
            }
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