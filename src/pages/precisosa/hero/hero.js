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
    let fallbackTriggered = false;
    function triggerFallback() {
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

        if (maskContainer) {
            gsap.set(maskContainer, { opacity: 0 });
            gsap.to(maskContainer, { opacity: 1, duration: 2.0, ease: "power2.out", delay: 0.1 });
        }

        if (maskText) {
            gsap.set(maskText, { opacity: 0, scale: 0.85, letterSpacing: isMobileScreen ? "10px" : "60px" });
            gsap.to(maskText, {
                opacity: 1, scale: 1,
                letterSpacing: isMobileScreen ? "4px" : "15px",
                duration: 2.5, ease: "power3.out", delay: 0.2
            });
        }

        if (scrollIndicator) {
            gsap.to(scrollIndicator, { opacity: 1, duration: 1.5, ease: "power2.out", delay: 1.0 });
        }

        setTimeout(() => initHeroScrollAnimations(), 2200);

        if (typeof onIntroComplete === "function") onIntroComplete();
    }

    const loadTimeout = setTimeout(() => triggerFallback(), 8000);

    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    let cena, camera, renderizador, div3d;
    try {
        cena = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;

        renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        if (!renderizador || !renderizador.getContext()) {
            throw new Error("WebGL indisponível.");
        }
        renderizador.setSize(window.innerWidth, window.innerHeight);
        renderizador.physicallyCorrectLights = true;
        renderizador.outputColorSpace = THREE.SRGBColorSpace;
        renderizador.toneMapping = THREE.ACESFilmicToneMapping;
        renderizador.toneMappingExposure = 1.2;
        renderizador.setPixelRatio(window.devicePixelRatio);

        div3d = document.querySelector(".hero-div3d");
        if (!div3d) { triggerFallback(); return; }
        renderizador.domElement.classList.add('hero-canvas');
        div3d.appendChild(renderizador.domElement);
    } catch (error) {
        triggerFallback();
        return;
    }

    // ==========================================
    // CARREGAMENTO ASSÍNCRONO (HDRI + GLTF)
    // ==========================================
    const loadHDRI = new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load("/assets/img/hdri.png", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmrem = new THREE.PMREMGenerator(renderizador);
            cena.environment = pmrem.fromEquirectangular(texture).texture;
            texture.dispose();
            pmrem.dispose();
            resolve();
        }, undefined, () => resolve());
    });

    let objeto;
    const loadGLTF = new Promise((resolve) => {
        new GLTFLoader().load("/assets/img/diamond-compressed.glb", (gltf) => {
            resolve(gltf.scene);
        }, undefined, () => resolve(null));
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
    function animar() {
        if (objeto && renderizador && cena && camera) {
            objeto.rotation.y += 0.005;
            renderizador.render(cena, camera);
        }
        requestAnimationFrame(animar);
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