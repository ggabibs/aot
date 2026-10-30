# Assets

## Personagens

- `sprites.png` — atlas único com os sprites fornecidos pelo usuário:
  - titã do jogador (idle e captura);
  - titãs rivais Bestial e Blindado;
  - 7 variações de humanos.
- `sprites.js` — metadados do atlas (nome, posição e tamanho de cada frame).

Os sprites foram recortados da folha de referência, tiveram o fundo preto removido e foram reunidos em um atlas PNG com paleta compartilhada para reduzir o número de requisições e o tamanho do download.

**Direitos:** os sprites de personagens foram fornecidos pelo usuário e não são cobertos pela licença MIT do código. Antes de publicar o jogo, confirme que você tem permissão para usar esses personagens/sprites. O código, o cenário procedural, a UI e o ícone continuam sob a licença do projeto.

## Cenário e efeitos

Muralhas, cidade, partículas e ícone (`favicon.svg`) são desenhados por código em `script.js` / `favicon.svg`.

Os efeitos sonoros são sintetizados em tempo real com Web Audio em `script.js`; não há arquivos de áudio.

## Fontes locais

- `fonts/barlow-condensed-latin-800-normal.woff2` — Barlow Condensed, SIL OFL 1.1 (`fonts/Barlow-Condensed-LICENSE.txt`).
- `fonts/nunito-sans-latin-wght-normal.woff2` — Nunito Sans, SIL OFL 1.1 (`fonts/Nunito-Sans-LICENSE.txt`).

As fontes são servidas localmente para que o jogo não dependa de Google Fonts ou de outro CDN em tempo de execução.
