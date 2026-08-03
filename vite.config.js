import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    // Deploy na Vercel a partir da raiz do domínio.
    base: '/',

    // assets/ e assets_debora/ vivem aqui e são copiados PARA A RAIZ do dist
    // sem passar pelo processamento do Vite. É o que mantém as URLs absolutas
    // (/assets/img/..., /assets_debora/...) idênticas às de antes, em HTML,
    // CSS e JS, sem precisar reescrever um único caminho.
    publicDir: 'public',

    build: {
        outDir: 'dist',
        emptyOutDir: true,

        // Safari do iPhone é o alvo desta migração. es2018 cobre iOS 12+ com
        // folga e evita que o esbuild emita sintaxe que o JavaScriptCore de
        // versões mais antigas rejeite no parse — que derruba o módulo INTEIRO
        // antes de executar uma linha.
        target: 'es2018',

        rollupOptions: {
            // Multi-página: cada HTML é um ponto de entrada próprio, e o Vite
            // monta o grafo de módulos de cada um.
            input: {
                index: resolve(__dirname, 'index.html'),
                debora: resolve(__dirname, 'debora.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
            },
        },
    },

    resolve: {
        alias: {
            // O código usa o caminho 'three/addons/', que é o apelido dos
            // exemplos oficiais do three e só existia por causa do import map.
            // No pacote npm eles ficam em examples/jsm.
            'three/addons/': resolve(__dirname, 'node_modules/three/examples/jsm/'),
        },
    },
});
