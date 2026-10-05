# FPS Tom

- Regras, geometria, projeção, colisão e simulação pertencem aos módulos de `src/` em Tom. O DDA legado permanece para regressão.
- Runtime C deve continuar fornecendo operações gerais; leia suas instruções antes de alterá-lo.
- Preserve relógio explícito, passo fixo, raios sem divisão por zero e limites da SOA.
- Imagens/sons são preparados antes do laço por `ferramentas/gerar-recursos.tom` e `gerar-recursos-3d.tom`; clipes/atlas e metadados Tom/JSON por `ferramentas/preparar-clipes.tom`. Compile as três ferramentas com `scripts/build-tools.js`; os geradores JavaScript e `prepare-clips.js` permanecem referências de equivalência. Regenere o perfil antes de compilar.
- Da raiz do repositório: `npm --prefix tom-lang run test:fps`; comandos de desktop,
  benchmark e pacote no README. Dummy não substitui janela ou áudio reais.

- O jogo 3D usa adaptadores explícitos em `fps-tom.tom`/`fps-tom-gpu.tom` e
  entrada, preparação da cena, HUD e áudio comuns em módulos `*3d.tom`.
- O gerador de adaptadores preserva apenas o raycaster legado para regressões:
  `entrada-gpu.tom` e `fps-raycaster-gpu.tom` derivam dos módulos legados.
- `test:fps` inclui testes GPU quando a toolchain opcional está preparada.
  Compare oclusão exatamente dentro de cada backend; para imagens entre
  SDL software/Vulkan, respeite a tolerância de nearest documentada no README.
