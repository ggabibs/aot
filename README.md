# Attack of Hunger

Um arcade 2D original, inspirado na ideia de “comida que cai” do minigame do Pou e no universo de titãs e muralhas. **Coma humanos para marcar pontos. Coma outro titã e a partida acaba na hora.**

Feito com **HTML5, CSS3, JavaScript puro e Canvas 2D**. Sem backend, sem banco de dados, sem serviços pagos e sem frameworks. O cenário, a UI e os efeitos sonoros são gerados por código; os personagens usam os **sprites fornecidos pelo usuário** em um atlas local.

> Projeto de fã, não oficial. Os sprites de personagens foram fornecidos pelo usuário e não são cobertos pela licença MIT do código. Confirme os direitos de uso antes de publicar.

## Jogar

- **Celular:** arraste o dedo na horizontal dentro da área do jogo, ou segure os botões de esquerda/direita.
- **Computador:** mova o mouse sobre a área do jogo, ou use `←` / `→` (também `A` / `D`).
- **Pausar:** botão de pausa, `P` ou `Esc`. Com o foco na área do jogo, `Espaço` também pausa.
- **Som:** botão de som no menu e no cabeçalho. A preferência fica salva no navegador.
- **Objetivo:** cada humano vale **1 ponto**. Humanos perdidos não tiram pontos. Outro titã encerra a partida imediatamente.
- **Elenco:** o titã de olhos verdes é o jogador; Bestial e Blindado são rivais; há 7 variações de humanos sorteadas como alvos.

A velocidade dos itens que caem aumenta gradualmente com a pontuação **e também com o tempo de partida** (mesmo se você não pontuar). A frequência das ondas aumenta com a pontuação. As ondas são espaçadas e sempre deixam uma rota de desvio possível. O recorde é salvo automaticamente no `localStorage` do navegador.

O link do logo/cabeçalho abre o jogo em uma **nova aba** (`target="_blank"`). Observação: um site não consegue forçar abas externas que apontam para ele a abrir em nova aba; isso depende de quem cria o link de origem.

## Executar localmente

Não há etapa de build. Basta servir a pasta do projeto por HTTP.

### Opção A — Python

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

### Opção B — Node.js

```bash
npx serve .
```

### Opção C — abrir o arquivo

Em muitos navegadores você pode abrir `index.html` diretamente. Para comportamento mais consistente de fontes, áudio e armazenamento, prefira um servidor local como acima.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ou use um existente).
2. Envie **todos os arquivos do projeto**, preservando a estrutura de pastas:
   ```bash
   git init
   git add .
   git commit -m "Attack of Hunger: jogo completo"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
   Se o repositório já existir, apenas adicione/commite os arquivos e faça `git push` na branch desejada.
3. No GitHub, acesse **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch principal (por exemplo `main`) e a pasta **`/ (root)`**. Salve.
6. Aguarde a publicação e abra o link gerado, normalmente:
   `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`
7. Teste no celular e no computador: iniciar, arrastar, pontuar, perder, reiniciar, pausar e alternar o som.

Todos os caminhos de assets/scripts são **relativos** (`./...`), então o jogo funciona tanto na raiz de um domínio quanto em subdiretórios do GitHub Pages. O arquivo `.nojekyll` evita que o Jekyll ignore arquivos/pastas iniciados por underscore.

### Se a página não aparecer

- Confirme que `index.html` está na **raiz** da branch/pasta selecionada.
- Aguarde alguns minutos após o primeiro deploy.
- Verifique a aba **Actions** ou o status do deploy em **Settings → Pages**.
- Faça um refresh forçado (`Ctrl+F5` / `Cmd+Shift+R`) para evitar cache antigo.

## Estrutura

```text
.
├── index.html              # Telas, HUD, diálogos e ícones SVG inline
├── style.css               # Layout responsivo, tema e animações de UI
├── game.js                 # Regras puras: ondas, colisão contínua, pausa, pontuação
├── script.js               # Renderização Canvas, sprites, áudio, input e telas
├── assets/
│   ├── favicon.svg         # Ícone original
│   ├── sprites.png         # Atlas dos personagens fornecidos pelo usuário
│   ├── sprites.js          # Metadados dos frames do atlas
│   └── fonts/              # Fontes locais + licenças OFL
├── tests/
│   ├── engine.test.cjs     # Testes automatizados das regras (Node.js)
│   └── sprites.test.cjs    # Testes do atlas/metadados dos sprites
├── .nojekyll               # Compatibilidade com GitHub Pages
├── LICENSE                 # MIT
└── README.md
```

## Testes

As regras do jogo são independentes do DOM e podem ser testadas com o test runner nativo do Node.js 18+:

```bash
node --test tests/*.test.cjs
```

A suíte cobre pontuação, derrota imediata, colisão contínua, quase-acidentes, pausa/retomada, limites de movimento, dificuldade progressiva, redimensionamento, deltas inválidos, 100 reinícios e sessões longas com seeds determinísticas para verificar espaçamento justo e memória limitada.

Durante o desenvolvimento também foi validado em Chromium com simulação mobile: arraste por toque, botões direcionais, mouse, teclado, pausa por aba em segundo plano, persistência de som/recorde, armazenamento bloqueado/corrompido, reinícios repetidos e layouts de 320 px a desktop, incluindo modo paisagem.

## Personalização rápida

- **Cores e tipografia:** variáveis CSS em `:root` no `style.css`.
- **Velocidade/dificuldade:** getters `fallSpeed`, `spawnInterval` e `level` em `game.js`.
- **Probabilidade de titãs e espaçamento:** método `spawn()` em `game.js`.
- **Arte dos personagens:** atlas `assets/sprites.png` + frames em `assets/sprites.js`; wrappers `drawPlayer`, `drawHuman` e `drawEnemy` em `script.js`.
- **Cenário:** `Scenery.paintBackground()` em `script.js` (cacheado em um canvas offscreen e redesenhado apenas no resize).
- **Sons:** `SoundBank.play()` em `script.js`.
- **Textos/telas:** `index.html`.

## Desempenho e comportamento mobile

- Um único loop `requestAnimationFrame` para a vida da página; reiniciar **não** cria novo loop nem duplica listeners.
- Simulação com passo fixo de até 1/120 s e colisão varrida (swept) para não “atravessar” alvos em frames rápidos.
- Canvas com DPR limitado a 2 para equilibrar nitidez e desempenho.
- Cenário estático cacheado; partículas e rótulos usam pools de tamanho fixo.
- `touch-action: none` na área de partida evita scroll/zoom acidental durante o jogo; diálogos permitem rolagem vertical.
- Aba em segundo plano ou perda de foco pausa a partida; ela só retoma por ação explícita do jogador.
- Respeita `prefers-reduced-motion` para animações não essenciais.
- Se o `localStorage` estiver bloqueado, o jogo continua funcionando e o recorde vale apenas para a sessão.

## Licenças

- Código, cenário procedural, UI e ícone: [MIT](LICENSE).
- Sprites de personagens: fornecidos pelo usuário; **não** são relicenciados pelo MIT do código. Verifique os direitos antes de distribuir.
- Fontes **Barlow Condensed** e **Nunito Sans**: SIL Open Font License 1.1. Textos completos em `assets/fonts/*-LICENSE.txt`.
