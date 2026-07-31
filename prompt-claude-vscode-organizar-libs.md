# Prompt para o Claude Code (VS Code) — Organizar GSAP, CSS, Three.js e Lenis

Cole o texto abaixo no Claude Code, dentro da pasta do projeto `precisosa`.

---

## Contexto

Este é um site estático (sem framework, sem bundler configurado) com três páginas HTML independentes — `index.html`, `debora.html` e `dashboard.html` — que usam GSAP, ScrollTrigger, Three.js e Lenis para animações e scroll suave. Cada página carrega essas bibliotecas de um jeito diferente, o que já causou pelo menos um bug de build no Vercel e deixa o projeto frágil para manutenção. Preciso que você organize essa camada de bibliotecas de forma consistente, sem quebrar as animações que já existem.

## Diagnóstico atual (já levantado, use como ponto de partida)

1. **Três estratégias de carregamento diferentes coexistem:**
   - `index.html` e `debora.html` usam `<script type="importmap">` apontando para `esm.sh` (three@0.163.0, gsap@3.12.5, lenis@1.1.5) e depois `import gsap from 'gsap'` em módulos ES.
   - `dashboard.html` carrega GSAP 3.12.2 via `<script src="https://cdnjs.../gsap.min.js">` (global, não-módulo) e Chart.js via outro CDN, e o comentário no código (`dashboard.js` linha 1-2) diz que isso foi um workaround para uma "falha de compilação do Vite" — ou seja, existe um resquício de tentativa de migração para Vite que não foi concluída.
   - `package.json` na raiz declara `gsap ^3.15.0`, `three ^0.184.0`, `lenis ^1.3.23` como dependências npm instaladas em `node_modules/`, mas **nenhuma página do site realmente importa desses pacotes locais** — todas usam as versões fixas do import map via CDN. Isso é inútil (infla o repo) e perigoso (as versões declaradas no package.json nunca são as que rodam de fato).

2. **Bug de build no Vercel (causa provável do site não abrir):** como existe `package.json` mas não existia `vercel.json` nem `scripts.build`, o Vercel tenta rodar `npm run build` e falha com "Missing script: build", travando o deploy. Já criei um `vercel.json` na raiz (`buildCommand: null`, `outputDirectory: "."`) e adicionei um `scripts.build` de no-op no `package.json` como rede de segurança. **Confirme que isso resolve o deploy** e ajuste se necessário.

3. **Fonte quebrada em produção:** `style.css` define `@font-face` para a fonte "Clash" apontando para `./designsystem/Site/assets/fonts/ClashDisplay-*.ttf`, mas `.gitignore` ignora a pasta `designsystem/` inteira. Essas fontes nunca vão para o repositório/deploy e caem no fallback (Inter) silenciosamente.

4. **Assets com nomes frágeis:** vários arquivos em `assets/img/` têm espaços, vírgulas, parênteses e acentos (ex.: `caminho das pedras/ChatGPT Image 2_06_2026, 06_32_01 (4).png`, `icones/faixacom diamante.png`). Funcionam hoje porque o Windows local é case-insensitive, mas o Vercel roda em Linux (case-sensitive) — qualquer divergência de maiúsculas/minúsculas entre o nome do arquivo e a referência no código quebra em produção mesmo funcionando local.

## O que preciso que você faça

### 1. Decidir e unificar a estratégia de módulos
Escolha UMA abordagem para as três páginas e documente a decisão em um comentário no topo de cada HTML:
- **Opção A (recomendada, menor risco):** manter import maps + ESM via CDN (`esm.sh`) em todas as páginas, incluindo `dashboard.html`. Remover os `<script>` globais de GSAP/Chart.js do `dashboard.html` e reescrever `dashboard.js` para `import gsap from 'gsap'` e `import Chart from 'chart.js/auto'` (ou o pacote certo), igual às outras páginas.
- **Opção B:** migrar tudo para um bundler real (Vite), movendo os imports para os pacotes locais em `node_modules` (as versões já declaradas no `package.json`), com `npm run build` gerando `dist/`, e atualizando o `vercel.json` para `framework: null` + `outputDirectory: "dist"` (ou framework "vite"). Só escolha essa opção se eu confirmar que quero um passo de build.

Se optar pela A, **alinhe as versões**: ou fixe o import map nas mesmas versões do `package.json` (gsap 3.15.0, three 0.184.0, lenis 1.3.23) e teste se nada quebra (a API do `GLTFLoader`/`three/addons` pode ter mudado entre 0.163 e 0.184), ou remova `gsap`, `three`, `lenis` do `package.json`/`node_modules` já que não são usados localmente.

### 2. Consolidar a inicialização de Lenis + GSAP ScrollTrigger
Hoje a lógica de sincronizar Lenis com `gsap.ticker` e registrar o ScrollTrigger está duplicada quase palavra por palavra em `main.js` (raiz) e no `<script type="module">` inline de `debora.html`. Extraia isso para um módulo compartilhado, por exemplo `src/core/smooth-scroll.js`, exportando algo como `createSmoothScroll(options)` que registra o plugin, cria o Lenis, faz a ponte com `gsap.ticker` e retorna a instância. Use esse módulo nas três páginas.

### 3. Corrigir as fontes quebradas
Copie os 4 arquivos `.ttf` de `designsystem/Site/assets/fonts/` para uma pasta versionada, por exemplo `assets/fonts/`, e atualize os `@font-face` em `style.css` (linhas 41-59) para apontar para o novo caminho. Depois confirme que `designsystem/` pode continuar 100% no `.gitignore` sem quebrar nada mais (rode uma busca por `designsystem` em `*.html`, `*.css`, `*.js` para garantir que não sobrou nenhuma outra referência).

### 4. Auditar e normalizar nomes de assets
Liste todos os arquivos referenciados em `index.html`, `debora.html`, `dashboard.html` e nos módulos de `src/pages/**` que tenham espaço, acento, vírgula ou parênteses no nome (ex.: pasta `caminho das pedras`, `icones/faixacom diamante.png`, `imagens-do-espaco`). Renomeie para `kebab-case` sem acentos (ex.: `caminho-das-pedras/gema-04.png`) e atualize todas as referências no código. Depois confirme que a capitalização de cada caminho no código bate exatamente com o nome real do arquivo no disco (case-sensitive), já que isso funciona sem erro no Windows local mas quebra no Linux do Vercel.

### 5. Auditar assets grandes (vídeos e .glb)
Verifique o tamanho de todos os `.mp4` e `.glb` em `assets/img/` (tem vários vídeos e um modelo 3D). Se algum arquivo passar de 100MB, o push pro GitHub falha silenciosamente ou trava o deploy — nesse caso, sugira mover para um storage externo (Vercel Blob, Cloudinary, S3) e carregar por URL. Independente do tamanho, sugira compressão/otimização dos vídeos de hero (`nova-hero.mp4`, `video-hero.mp4`, `hero_bg_optimized.mp4` etc.) já que várias versões parecidas parecem ter sido geradas em iterações e podem estar sobrando no repo.

### 6. Organizar o CSS
`style.css` na raiz faz `@import` de `hero.css`, `main.css`, `services.css` de dentro de `src/pages/precisosa/`. Audite se `debora.html` e `dashboard.html` também deveriam seguir esse padrão de `@import` central em vez de `<link>` soltos por página (hoje `debora.html` linka 7 arquivos CSS manualmente). Padronize para um único ponto de entrada de CSS por página, e confirme que não há mistura de caminhos `./` (relativos) e `/` (absolutos) apontando pro mesmo tipo de recurso — isso deve ser consistente.

### 7. Checklist final antes de eu fazer redeploy
- [ ] `vercel.json` e `package.json` revisados e funcionando (build local simulando `npm run build` não quebra)
- [ ] Nenhuma referência viva a `designsystem/` fora do `.gitignore`
- [ ] Todas as três páginas carregam GSAP/ScrollTrigger/Lenis/Three pela mesma estratégia
- [ ] Nenhum asset com nome case-sensitive divergente
- [ ] `git clone` limpo do repo (sem `node_modules`) e abertura local via servidor estático (`npx serve`, por exemplo) funcionando igual ao ambiente atual
- [ ] Relatório curto do que foi mudado e por quê

Não precisa perguntar antes de cada mudança pequena (renomear arquivo, mover CSS), mas **pare e me pergunte** antes de migrar para Vite (Opção B) ou de apagar qualquer asset — pode haver coisa em uso que não ficou óbvia na varredura estática.
