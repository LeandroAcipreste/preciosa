import gsap from 'gsap';

export function initDeboraHero() {
    const video = document.querySelector('.debora-hero-video-bg');
    
    // Garante que o vídeo toque (fallback extra caso o autoplay falhe no html)
    // Se o navegador barrar o autoplay no carregamento, garantimos no JS
    if (video) {
        video.play().catch(err => console.log("Video autoplay prevented by browser:", err));
    }
}
