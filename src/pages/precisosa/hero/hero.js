import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
// ❌ IMPORT DO SCROLLTRIGGER REMOVIDO COMPLETAMENTE

// Função auxiliar para dividir o texto (sem opacity: 1, o CSS já as mantém invisíveis)
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
        textureLoader.load("../designsystem/Site/assets/img/hdri.png", function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmrem = new THREE.PMREMGenerator(renderizador);
            const envMap = pmrem.fromEquirectangular(texture).texture;
            cena.environment = envMap;
            texture.dispose();
            pmrem.dispose();
            resolve(); // Avisa que a textura carregou
        });
    });

    let objeto;
    const loadGLTF = new Promise((resolve) => {
        const loader = new GLTFLoader();
        loader.load("../designsystem/Site/assets/img/diamond-compressed.glb", (gltf) => {
            resolve(gltf.scene); // Avisa que o objeto 3D carregou
        });
    });

    // Só inicia a animação e adiciona à cena quando AMBOS estiverem prontos
    Promise.all([loadHDRI, loadGLTF]).then(([_, sceneObject]) => {
        const config = {
            stagger: { each: 0.3, from: "random" },
            duration: 1,
            blur: "20px",
            pauseEntre: 2,
        };

        const h2s = document.querySelectorAll(".hero-title");
        const splits = Array.from(h2s).map((h2) => splitTextChars(h2));

        objeto = sceneObject;
        objeto.position.z = -12;
        objeto.position.y = 2;
        cena.add(objeto);

        // ==========================================
        // 🎬 MASTER TIMELINE - LOGICA DO SCRIPT.JS CONVERTIDA PARA TIME
        // ==========================================

        // 1. TIMELINE DE TEXTOS
        // Reproduz exatamente a mecânica linear do scroll do script.js
        const tlTextos = gsap.timeline();
        splits.forEach((split) => {
            // Aparecer (no script original era "from", aqui usamos "to" porque o CSS já os deixa em 0)
            tlTextos.to(split.chars, {
                opacity: 1,
                filter: "blur(0px)",
                duration: config.duration,
                stagger: config.stagger
            });

            // Pausa
            tlTextos.to({}, { duration: config.pauseEntre });

            // Desaparecer
            tlTextos.to(split.chars, {
                opacity: 0,
                filter: `blur(${config.blur})`,
                duration: config.duration,
                stagger: config.stagger
            });
        });

        // Pegamos o tempo total exato da animação de textos 
        const tempoTotal = tlTextos.duration();

        // 2. TIMELINE DO DIAMANTE
        const tlDiamante = gsap.timeline();
        // A proporção original no GSAP era: 
        // Mover = 1, Rotacionar = 1, ZoomZ = 0.2 (com offset de -0.1). Total virtual = 1.1 "unidades".
        const proporcaoMover = (1 / 1.1) * tempoTotal;
        const proporcaoZoom = (0.2 / 1.1) * tempoTotal;
        const proporcaoOffset = (0.1 / 1.1) * tempoTotal;

        tlDiamante.to(objeto.position, {
            x: 0,
            y: 0,
            duration: proporcaoMover,
            ease: "none" // ScrollTrigger (scrub) é sempre linear (none)
        }, 0);

        tlDiamante.to(objeto.rotation, {
            x: 1.5 * Math.PI,
            duration: proporcaoMover,
            ease: "none"
        }, 0);

        tlDiamante.to(objeto.position, {
            z: 3.2,
            duration: proporcaoZoom,
            ease: "none"
        }, proporcaoMover - proporcaoOffset);

        // 3. ENCAPSULANDO NA TL DE INTRODUÇÃO E COMPRIMINDO PARA 5 SEGUNDOS
        const tlIntro = gsap.timeline();
        tlIntro.add(tlTextos, 0);
        tlIntro.add(tlDiamante, 0);

        // Mágica do GSAP: Isso força toda a animação das palavras e do diamante 
        // a rodar em EXATOS 5 segundos, sem perder as proporções perfeitas!
        tlIntro.duration(5);

        // 4. MASTER TL (Agrupa o delay, a intro e a subida da cortina)
        const masterTl = gsap.timeline({ delay: 0.5 });
        masterTl.add(tlIntro);

        // 5. A DIV SOBE MOSTRANDO O CONTEÚDO DE TRÁS (Com duração elegante de 1.5s)
        masterTl.to(".hero-main", {
            yPercent: -100,
            duration: 1.5,
            ease: "power3.inOut"
        }, "+=0.2"); // Uma pequena pausa de 200ms antes de subir
    });

    function animar() {
        if (objeto) {
            // Rotação contínua e suave no próprio eixo Y (opcional, só para manter vivo)
            objeto.rotation.y += 0.005;
        }
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