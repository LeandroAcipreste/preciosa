import { initHero } from './src/pages/precisosa/hero/hero.js';
import { initMain } from './src/pages/precisosa/main/main.js';

window.addEventListener("DOMContentLoaded", () => {
    // Adiciona trava no body para impedir scroll durante a intro
    document.body.classList.add("intro-active");
    window.scrollTo(0, 0);

    initHero(() => {
        // Callback: executado quando o diamante sobe e a cortina abre
        document.body.classList.remove("intro-active");
        window.scrollTo(0, 0);
        
        // Inicializa a segunda dobra agora, evitando disparos precoces
        initMain();
    });
});
