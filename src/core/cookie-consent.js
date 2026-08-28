// ============================================================
// CONSENTIMENTO DE COOKIES (LGPD — Lei 13.709/2018)
// ============================================================
// Sem dependência de biblioteca: este banner precisa aparecer mesmo que o
// GSAP ou o Three falhem em carregar. É por isso que a animação é CSS e o
// módulo não importa nada.
//
// Estado atual do site: não há Analytics, Pixel ou qualquer rastreador. O
// único armazenamento é funcional (sessionStorage do pular-intro e a escolha
// registrada aqui). O banner cumpre o dever de informar e deixa o mecanismo
// de consentimento pronto — se um dia entrar Analytics ou Pixel, ele deve ser
// carregado apenas quando consentimentoConcedido() for true.
// ============================================================

const CHAVE = 'preciosa:consentimento-cookies';

/** 'aceito' | 'recusado' | null (ainda não respondeu) */
export function consentimentoRegistrado() {
    try {
        return localStorage.getItem(CHAVE);
    } catch {
        // Navegação anônima com storage bloqueado: trata como sem resposta.
        return null;
    }
}

/** Use isto para condicionar qualquer script de terceiro no futuro. */
export function consentimentoConcedido() {
    return consentimentoRegistrado() === 'aceito';
}

function registrar(valor) {
    try {
        localStorage.setItem(CHAVE, valor);
    } catch {
        // Sem storage a escolha não persiste; o banner reaparece na próxima
        // visita. É o comportamento correto: não dá para presumir consentimento.
    }
}

function montarBanner(urlPolitica) {
    const wrap = document.createElement('div');
    wrap.className = 'cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'cookie-banner-titulo');
    wrap.setAttribute('aria-describedby', 'cookie-banner-texto');

    wrap.innerHTML = `
        <div class="cookie-banner-conteudo">
            <div class="cookie-banner-texto-bloco">
                <h2 class="cookie-banner-titulo" id="cookie-banner-titulo">Privacidade</h2>
                <p class="cookie-banner-texto" id="cookie-banner-texto">
                    Usamos apenas armazenamento essencial para o funcionamento do site.
                    Não utilizamos cookies de publicidade nem rastreamento de terceiros.
                    Saiba mais na nossa <a href="${urlPolitica}">Política de Privacidade</a>.
                </p>
            </div>
            <div class="cookie-banner-acoes">
                <button type="button" class="cookie-btn cookie-btn-recusar" data-acao="recusado">Recusar</button>
                <button type="button" class="cookie-btn cookie-btn-aceitar" data-acao="aceito">Aceitar</button>
            </div>
        </div>
    `;

    return wrap;
}

function fechar(banner) {
    banner.classList.remove('is-visivel');
    // Espera a transição terminar para remover do DOM sem cortar a animação.
    banner.addEventListener('transitionend', () => banner.remove(), { once: true });
    // Rede de segurança: se a transição não disparar (prefers-reduced-motion,
    // aba em segundo plano), remove mesmo assim.
    setTimeout(() => banner.remove(), 600);
}

/**
 * @param {object} opcoes
 * @param {string} [opcoes.urlPolitica]  caminho da política de privacidade
 * @param {string} [opcoes.aguardarEvento]  nome de um evento em window que
 *        adia a exibição (usado na home para esperar o fim da intro)
 * @param {number} [opcoes.esperaMaxima]  ms até exibir mesmo sem o evento
 */
export function initCookieConsent({
    urlPolitica = '/politica-de-privacidade.html',
    aguardarEvento = null,
    esperaMaxima = 12000,
    atraso = 1200,
} = {}) {
    if (consentimentoRegistrado() !== null) return;
    if (document.querySelector('.cookie-banner')) return;

    let exibido = false;

    function exibir() {
        if (exibido) return;
        exibido = true;

        const banner = montarBanner(urlPolitica);
        document.body.appendChild(banner);

        banner.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-acao]');
            if (!btn) return;
            registrar(btn.dataset.acao);
            fechar(banner);
        });

        // Dois frames: o primeiro insere no DOM com o estado inicial, o segundo
        // aplica a classe. Sem isso o navegador agrupa as duas mudancas e a
        // transicao de entrada nao acontece.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            banner.classList.add('is-visivel');
        }));
    }

    if (aguardarEvento) {
        window.addEventListener(aguardarEvento, exibir, { once: true });
        // O banner nao pode depender de a intro terminar: se o 3D falhar, o
        // evento nunca dispara e o aviso legal nunca apareceria.
        setTimeout(exibir, esperaMaxima);
    } else {
        setTimeout(exibir, atraso);
    }
}
