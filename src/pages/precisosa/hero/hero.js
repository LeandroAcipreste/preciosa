import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Função auxiliar: quebra texto em <span class="hero-char">
function splitTextChars(element) {
    const text = element.innerText;
    element.innerHTML = '';
    const chars = [];
    for (let char of text) {
        const span = document.createElement('span');
        span.className = 'hero-char';
        span.innerText = char === ' ' ? '\u00A0' : char;
        element.appendChild(span);
        chars.push(span);
    }
    return { chars };
}

export function initHero() {
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
        // CSS cuida do visual. GSAP só aciona classes e anima Three.js.
        // ==========================================
        const config = {
            stagger: { each: 0.3, from: "random" },
            duration: 1,
            blur: "20px",
            pauseEntre: 2,
        };

        const masterTl = gsap.timeline();

        // 1. PRELOADER SOME → GSAP aciona classe CSS "is-hidden"
        masterTl.add(() => {
            document.getElementById("preloader")?.classList.add("is-hidden");
        });
        // Aguarda a transição CSS do preloader (2s definidos no CSS)
        masterTl.to({}, { duration: 2.2 });

        // 2. DIAMANTE SURGE → único ponto onde GSAP anima propriedade Three.js (sem alternativa)
        masterTl.to(materiais, {
            opacity: 1,
            duration: 2,
            ease: "power2.inOut"
        });

        // 3. PALAVRAS — GSAP anima opacity/filter dos chars (Three.js context: letras sincronizadas com 3D)
        const tlTextos = gsap.timeline();
        splits.forEach((split) => {
            tlTextos.to(split.chars, {
                opacity: 1,
                filter: "blur(0px)",
                duration: config.duration,
                stagger: config.stagger
            });
            tlTextos.to({}, { duration: config.pauseEntre });
            tlTextos.to(split.chars, {
                opacity: 0,
                filter: `blur(${config.blur})`,
                duration: config.duration,
                stagger: config.stagger
            });
        });
        tlTextos.duration(5); // força exatos 5s

        // 4. DIAMANTE DESCE/ZOOM — Three.js responsivo
        const tlDiamante = gsap.timeline();
        tlDiamante.to(objeto.position, { x: 0, y: 0, duration: 2, ease: "power2.out" }, 0);
        tlDiamante.to(objeto.rotation, { x: 1.5 * Math.PI, duration: 2, ease: "power2.out" }, 0);
        tlDiamante.to(objeto.position, { z: finalZ, duration: 1.2, ease: "power3.inOut" }, 1.8);
        tlDiamante.duration(3); // força exatos 3s

        const tlIntro = gsap.timeline();
        tlIntro.add(tlTextos, 0);   // t=0  → palavras por 5s
        tlIntro.add(tlDiamante, 5); // t=5  → diamante por 3s

        masterTl.add(tlIntro, "+=0.3");

        // 5. CORTINA SOBE → GSAP aciona classe CSS "is-gone"
        masterTl.add(() => {
            document.querySelector(".hero-main")?.classList.add("is-gone");
        }, "+=0.3");

        // 6. VÍDEO APARECE → GSAP aciona classe CSS "is-visible"
        //    O vídeo só começa a tocar aqui (não desperdiça banda durante a intro)
        masterTl.add(() => {
            const video = document.getElementById("home-video");
            if (video) {
                video.play().catch(() => { }); // catch para silenciar erros de autoplay
                video.classList.add("is-visible");
            }
        }, "-=1"); // começa 1s antes da cortina terminar de subir

        // ==========================================
        // 🖱️ SCROLL → VÍDEO SCRUBBING
        // requestAnimationFrame leve: GSAP ScrollTrigger lê o progresso,
        // JS atualiza apenas video.currentTime (não pode ser CSS)
        // ==========================================
        masterTl.add(() => {
            const video = document.getElementById("home-video");
            if (!video) return;

            // Pausa o autoplay para o scroll assumir o controle
            video.pause();

            ScrollTrigger.create({
                trigger: ".home-content",
                start: "top top",
                end: "+=2000", // A tela fica travada (pinned) por 2000px de scroll
                pin: true,     // Essencial: prende a tela enquanto o scroll avança o vídeo
                scrub: 1,    // suavização leve (evita jank)
                onUpdate: (self) => {
                    if (video.readyState >= 2) {
                        // Calcula o tempo do vídeo baseado no progresso (0 a 1)
                        video.currentTime = self.progress * video.duration;
                    }
                }
            });
        });
    });

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