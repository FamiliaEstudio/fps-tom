# FPS Tom

- Regras, DDA, projeção, colisão e simulação pertencem aos módulos de `src/` em Tom.
- Runtime C deve continuar fornecendo operações gerais; leia suas instruções antes de alterá-lo.
- Preserve relógio explícito, passo fixo, raios sem divisão por zero e limites da SOA.
- Imagens/sons são preparados antes do laço; arte procedural e áudio têm gerador em `scripts/generate-assets.js`.
- Da raiz do repositório: `npm --prefix tom-lang run test:fps`; comandos de desktop,
  benchmark e pacote no README. Dummy não substitui janela ou áudio reais.
