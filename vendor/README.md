# vendor/ — bibliotecas hospedadas no próprio domínio

Bundles ESM minificados do `three`, `gsap`, `lenis` e `chart.js`, **commitados
no repositório de propósito**. Os import maps de `index.html`, `debora.html` e
`dashboard.html` apontam para cá.

## Por que existe

Antes as bibliotecas vinham da CDN externa **esm.sh**. Medido em celular
emulado (Chrome headless, viewport 390x844, rede limitada via CDP):

| rede | cristal 3D da home | quando aparecia |
|---|---|---|
| sem limite | aparecia | 4.180 ms |
| 4G lento | aparecia | 7.938 ms |
| 3G regular | **não aparecia** | watchdog de 9 s disparava antes |

A esm.sh exige DNS + TLS para um terceiro e serve o `three` como vários
arquivos ESM encadeados — cada um é um round-trip novo. Em rede móvel isso
estourava o watchdog do preloader e a intro 3D era descartada.

Servindo do mesmo domínio, tudo vem pela conexão HTTP/2 já aberta com a Vercel,
multiplexado, e fica no cache do CDN.

## Como regerar

Necessário só quando for **atualizar a versão** de alguma biblioteca. As
versões abaixo são as mesmas que estavam fixadas nos import maps antigos —
não troque sem testar, o site foi desenvolvido contra elas.

```bash
# num diretório temporário, fora do projeto
npm install three@0.163.0 gsap@3.12.5 lenis@1.1.5 chart.js@4.4.1

npx esbuild node_modules/three/build/three.module.js \
  --bundle --format=esm --minify --outfile=vendor/three.js

npx esbuild node_modules/three/examples/jsm/loaders/GLTFLoader.js \
  --bundle --format=esm --minify --external:three --outfile=vendor/GLTFLoader.js

npx esbuild node_modules/gsap/index.js \
  --bundle --format=esm --minify --outfile=vendor/gsap.js

npx esbuild node_modules/gsap/ScrollTrigger.js \
  --bundle --format=esm --minify --external:gsap --outfile=vendor/ScrollTrigger.js

npx esbuild node_modules/lenis/dist/lenis.mjs \
  --bundle --format=esm --minify --outfile=vendor/lenis.js

npx esbuild node_modules/chart.js/auto/auto.js \
  --bundle --format=esm --minify --outfile=vendor/chart.js
```

O `--external` importa: sem ele o `GLTFLoader` e o `ScrollTrigger` embutiriam
uma segunda cópia do `three` e do `gsap`. Com ele, o `import` interno continua
resolvendo pelo import map, apontando para o mesmo arquivo.

**Atenção:** o `node_modules/` do projeto está com versões mais novas
(three 0.184, gsap 3.15, lenis 1.3) do que as declaradas em `package.json`.
Instale as versões exatas num diretório separado antes de gerar os bundles.

## Deploy

Continua sem passo de build: os arquivos são estáticos e versionados. O
`vercel.json` usa `outputDirectory: "."`, então `/vendor/` é publicado como
está. `cleanUrls` afeta apenas `.html` e não interfere aqui.
