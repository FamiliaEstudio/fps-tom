# Bastião — FPS Tom

> Este repositório contém o jogo. Para compilar e testar, integre-o com a
> [LinguagemTom](https://github.com/FamiliaEstudio/LinguagemTom) conforme
> [INTEGRACAO.md](INTEGRACAO.md). As APIs de imagem e mouse usadas aqui ainda
> dependem do patch `tom-fps.patch` incluído neste repositório.

Uma fase de FPS retrô com raycasting DDA, texturas, sprites, colisão, tiro instantâneo,
seis sentinelas, saúde, munição, sons e saída. Motor e regras estão em Tom; o runtime
fornece apenas janela, entrada, matemática, imagens e áudio. Geometria em grade,
paredes de altura uniforme; não lê WAD nem contém recursos do Doom.

## Jogar

Na raiz da árvore LinguagemTom integrada, prepare a toolchain conforme
`scripts/README.md` e ative-a com `source scripts/env.sh` (Linux/WSL) ou
`. ./scripts/env.ps1` (Windows).

```text
node tom-lang/tomc.js --run --assets jogos/fps-tom/assets jogos/fps-tom/src/fps-tom.tom
```

| Controle | Ação |
| --- | --- |
| Enter | Começar / retomar após pausa |
| W / S | Avançar / recuar |
| A / D | Deslocar lateralmente |
| Mouse / setas esquerda e direita | Girar |
| Clique esquerdo / Ctrl esquerdo | Atirar; manter para repetir |
| Escape | Pausar e liberar mouse |
| R | Reiniciar a fase |
| Q | Sair nas telas de início, pausa ou resultado |
| F1 | Alternar paredes texturizadas / sólidas |
| F2 | Mostrar milissegundos de projeção (verde) e desenho anterior (âmbar) |

Elimine as seis sentinelas (dois tiros cada) e alcance o portal verde no canto
sudeste. Caixas douradas repõem 20 cargas; kits repõem até 35 de saúde. Itens não
são consumidos quando o respectivo valor está cheio. Sentinelas perseguem ao ver
o jogador e atacam de perto; paredes bloqueiam visão e tiros. Ao perder foco, o
jogo pausa e exige Enter para retomar. As setas funcionam mesmo se o backend não
oferecer captura relativa do mouse.

## Compilar e distribuir

```text
node jogos/fps-tom/scripts/build.js
```

O pacote fica em `jogos/fps-tom/build/linux/package/fps-tom/` ou
`jogos/fps-tom/build/windows/package/fps-tom/`. Copie **toda a pasta**, incluindo
bibliotecas, fonte, licenças e `assets/`. Execute `fps-tom` ou `fps-tom.exe`;
o destinatário não precisa de Node nem LLVM. Recursos são resolvidos em relação
ao executável, independentemente da pasta de trabalho. É necessário dispositivo
de áudio disponível; testes sem áudio físico usam `SDL_AUDIODRIVER=dummy`.

## Organização e limites

- `src/modelo.tom`: tipos, relógio fixo, consulta da grade, colisão e raios.
- `src/fase.tom`: mapa 16 × 16 em armazenamento 32 × 32 e posições iniciais.
- `src/simulacao.tom`: movimento, tiro, inimigos, itens e condições de término.
- `src/render.tom`: projeção e desenho por colunas, profundidade e sprites.
- `src/painel.tom`: texto preparado uma vez, HUD e telas de estado.
- `src/entrada.tom` e `src/fps-tom.tom`: eventos, recursos e laço da aplicação.

A resolução lógica é 320 × 200, com 176 linhas de cena e 24 de HUD; a janela começa
em 960 × 600. Há espaço para 16 inimigos e 16 itens/saídas. Coordenadas usam `Fl64`.
A simulação tem passos de 16.666.667 ns (aproximadamente 60 Hz), independentemente
do desenho. Pausas descartam tempo acumulado e atrasos são limitados a seis passos
por passagem. Mapas maiores, setores, alturas variadas, multiplayer e pathfinding
estão fora desta versão. Para ampliar o mapa até 32 × 32, altere suas constantes
e conteúdo sem aumentar as coleções.

## Verificar e medir

```text
node --test --test-concurrency=1 jogos/fps-tom/tests/*.test.js
node jogos/fps-tom/scripts/benchmark.js
node jogos/fps-tom/scripts/benchmark.js --desktop
node jogos/fps-tom/scripts/verify-desktop.js
node jogos/fps-tom/scripts/verify-desktop.js --package
```

Os testes cobrem O0/O2, raios nos eixos/cantos, colisão, diagonal normalizada,
parede bloqueando tiro, combate, itens, vitória/derrota, reinício, pausa, reprodução
da mesma simulação em 30/60/144 FPS, eventos e oclusão por comparação de pixels.
O runtime também testa PNG, transparência, filtragem, recorte, argumentos inválidos
e limpeza de recursos. Drivers dummy não comprovam janela ou som físicos.

O benchmark separa projeção, desenho e apresentação de 240 quadros após aquecimento,
grava hardware/otimização e percentis em `build/benchmark/`. Por padrão usa SDL
software/dummy. `--desktop` usa uma janela real; a apresentação pode incluir espera
do backend e a execução dos comandos de desenho que a SDL enfileira.
`--stress` mede 16 sentinelas sobrepostas. A meta é 60 FPS, não uma garantia para
qualquer computador. O benchmark mede o renderizador; não inclui espera entre
quadros, entrada, áudio nem os passos de simulação.

A verificação de desktop abre uma janela real e envia entrada somente para ela.
`--package` usa o executável público, sem hooks de teste, a partir de outra pasta.
`TOM_VERIFY_AUDIO_DRIVER=dummy` permite verificar janela sem dispositivo de áudio;
sem essa variável o teste usa o dispositivo do sistema. A percepção do áudio e a
sensação dos controles precisam também de uma sessão manual.

Arte e sons são originais e reproduzíveis, dedicados a CC0. Para regenerar:
`node jogos/fps-tom/scripts/generate-assets.js`. Não requer ferramentas externas.
