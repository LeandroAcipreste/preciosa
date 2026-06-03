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
    
    // Divide por palavras para garantir a quebra de linha correta no mobile
    const words = text.split(' ');
    
    words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap'; // Impede quebra no meio da palavra
        
        for (let char of word) {
            const charSpan = document.createElement('span');
            charSpan.className = 'hero-char';
            charSpan.innerText = char;
            wordSpan.appendChild(charSpan);
            chars.push(charSpan);
        }
        
        element.appendChild(wordSpan);
        
        // Adiciona um espaço real no HTML para o navegador poder quebrar a linha entre as palavras
        if (wordIndex < words.length - 1) {
            element.appendChild(document.createTextNode(" "));
        }
    });
    
    return { chars };
}

export function initHero(onIntroComplete) {
    // ==========================================
    // CRÍTICO: BLOQUEIA A RESTAURAÇÃO DE SCROLL DO BROWSER
    // Sem isso, o browser lembra onde o usuário estava e pula a Hero inteira
    // na próxima vez que a página carregar, indo direto para a main.
    // ==========================================
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'; // Desativa scroll restoration automático
    }
    window.scrollTo(0, 0); // Força posição 0 imediatamente, antes de qualquer animação

    // O vídeo toca sozinho com autoplay/loop — sem scrub
    const bgVideo = document.getElementById("home-video");
    if (bgVideo) {
        bgVideo.loop = true;
        bgVideo.muted = true;
        const p = bgVideo.play();
        if (p !== undefined) {
            p.catch(() => {}); // Ignora bloqueio de autoplay
        }
    }

    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderizador.setSize(window.innerWidth, window.innerHeight);
    renderizador.physicallyCorrectLights = true;
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    renderizador.toneMapping = THREE.ACESFilmicToneMapping;
    renderizador.toneMappingExposure = 1.2;
    renderizador.setPixelRatio(window.devicePixelRatio);

    const div3d = document.querySelector(".hero-div3d");
    if (!div3d) return;
    renderizador.domElement.classList.add('hero-canvas');
    div3d.appendChild(renderizador.domElement);

    // ==========================================
    // ⏳ CARREGAMENTO ASSÍNCRONO (HDRI + GLTF)
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
        });
    });

    let objeto;
    const loadGLTF = new Promise((resolve) => {
        new GLTFLoader().load("/assets/img/diamond-compressed.glb", (gltf) => resolve(gltf.scene));
    });

    Promise.all([loadHDRI, loadGLTF]).then(([_, sceneObject]) => {

        // --- SETUP DO DIAMANTE RESPONSIVO ---
        const h2s = document.querySelectorAll(".hero-title");
        const splits = Array.from(h2s).map((h2) => splitTextChars(h2));

        const isMobile = window.innerWidth < 768;
        const startZ = isMobile ? -20 : -12; // Afasta mais no mobile por conta da proporção da tela
        const startY = isMobile ? 3 : 2;
        const finalZ = isMobile ? 3.5 : 3.2;  // Avança MUITO mais no mobile para preencher toda a tela vertical

        objeto = sceneObject;
        objeto.position.z = startZ;
        objeto.position.y = startY;
        cena.add(objeto);

        // Materiais: opacity 0 → animados via GSAP (Three.js, sem alternativa CSS)
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
        // 🎬 MASTER TIMELINE
        // Lógica perfeitamente organizada em uma única timeline sequencial
        // ==========================================
        const masterTl = gsap.timeline();

        // 1. PRELOADER SOME ("Iniciando sua experiência...")
        masterTl.add(() => {
            document.getElementById("preloader")?.classList.add("is-hidden");
        });
        
        // Aguarda a transição CSS do preloader terminar (1s + 0.2s margem)
        masterTl.to({}, { duration: 1.2 });

        // 2. DIAMANTE SURGE SOZINHO NO CENTRO
        // Opacidade vai de 0 a 1 suavemente e mais rápido
        masterTl.to(materiais, {
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        });

        // Sem pausa longa, vai direto para as palavras
        masterTl.to({}, { duration: 0.1 });

        // A partir daqui, calculamos o tempo absoluto na timeline
        let currentTime = masterTl.duration();

        // 3. PALAVRAS SE FORMAM EM SEQUÊNCIA ("PRECIOSA" -> "CASA DE ACOLHIMENTO" -> "A MULHER")
        splits.forEach((split, index) => {
            const chars = [...split.chars];
            
            // --- ENTRADA (FADE IN) ---
            const shuffledIn = gsap.utils.shuffle([...chars]);
            const staggerIn = Math.min(0.08, 0.8 / chars.length); // Um pouco mais rápido
            
            shuffledIn.forEach((char, i) => {
                masterTl.to(char, {
                    duration: 0,
                    onComplete: () => char.classList.add('is-visible')
                }, currentTime + (i * staggerIn));
            });
            
            // Avança o relógio interno: Stagger + 0.2s margem + 0.9s de tempo de leitura
            currentTime += (chars.length * staggerIn) + 1.1;
            
            // --- SAÍDA (FADE OUT) ---
            const shuffledOut = gsap.utils.shuffle([...chars]);
            const staggerOut = Math.min(0.05, 0.5 / chars.length);
            
            shuffledOut.forEach((char, i) => {
                masterTl.to(char, {
                    duration: 0,
                    onComplete: () => char.classList.remove('is-visible')
                }, currentTime + (i * staggerOut));
            });
            
            // Avança o relógio: Stagger + 0.2s margem antes da próxima frase
            currentTime += (chars.length * staggerOut) + 0.2;
            
            if (index < splits.length - 1) {
                currentTime += 0.1;
            }
        });

        // 4. DIAMANTE DESCE/ZOOM
        // Inicia o movimento cruzando com a saída da última palavra
        const diamondMoveStart = currentTime - 0.5; 
        
        // Movimentos mais ágeis e explosivos
        masterTl.to(objeto.position, { x: 0, y: 0, duration: 1.4, ease: "power2.out" }, diamondMoveStart);
        masterTl.to(objeto.rotation, { x: 1.5 * Math.PI, duration: 1.4, ease: "power2.out" }, diamondMoveStart);
        masterTl.to(objeto.position, { z: finalZ, duration: 0.8, ease: "power3.inOut" }, diamondMoveStart + 1.0);

        const endIntroTime = diamondMoveStart + 1.8; // Movimento total bem mais curto

        // 5. CORTINA SOBE
        masterTl.add(() => {
            document.querySelector(".hero-main")?.classList.add("is-gone");
            if (typeof onIntroComplete === "function") {
                onIntroComplete();
            }
        }, endIntroTime);

        // 6. VÍDEO PRINCIPAL APARECE
        masterTl.add(() => {
            const video = document.getElementById("home-video");
            if (video) {
                // Removemos o video.play() para que o vídeo só se mova no scroll!
                video.classList.add("is-visible");
            }
        }, endIntroTime - 1.0); // O vídeo aparece enquanto a cortina está subindo

        // 7. ANIMAÇÃO DE ENTRADA TIPOGRÁFICA (Efeito Luxo)
        // O texto inicia com espaçamento bem aberto e escala menor, e depois assenta na tela
        const isMobileScreen = window.innerWidth < 768;
        const startSpacing = isMobileScreen ? "20px" : "60px";
        const endSpacing = isMobileScreen ? "8px" : "15px";

        masterTl.set(".mask-brand-text", { 
            opacity: 0, 
            letterSpacing: startSpacing,
            scale: 0.85,
            transformOrigin: "50% 50%"
        }, 0);

        masterTl.to(".mask-brand-text", {
            opacity: 1,
            letterSpacing: endSpacing,
            scale: 1,
            duration: 3.5,
            ease: "power4.out"
        }, endIntroTime + 0.8); // Inicia suavemente após a cortina branca subir

        // Fade-in do indicador de scroll elegante
        masterTl.to(".hero-scroll-indicator", {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        }, endIntroTime + 2.2);

        // Efeito de zoom e fade-out paralaxe no scroll do mouse (Buttery Smooth)
        gsap.to(".home-text-mask-container", {
            scrollTrigger: {
                trigger: ".home-content",
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            scale: 3.5,
            opacity: 0,
            transformOrigin: "50% 50%",
            ease: "power1.inOut"
        });

        // Efeito de fade-out do scroll indicator
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

        // Avança o playhead interno para garantir que a timeline alcance o fim das animações
        const finalTime = endIntroTime + 4.5;
        masterTl.to({}, { duration: 0.1 }, finalTime);

    }); // Fecha Promise.all

    // ==========================================
    // 🔄 LOOP THREE.JS (rotação contínua do eixo Y)
    // ==========================================
    function animar() {
        if (objeto) objeto.rotation.y += 0.005;
        requestAnimationFrame(animar);
        renderizador.render(cena, camera);
    }

    animar();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderizador.setSize(window.innerWidth, window.innerHeight);
    });
}