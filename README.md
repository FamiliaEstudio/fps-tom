# Bastião — FPS 3D retrô em Tom

Para usar este código no repositório separado do jogo, consulte
[INTEGRACAO.md](INTEGRACAO.md). A publicação de 2026-10-05 acompanha o ponto de
progresso da autonomia gráfica; GA007/C1/C2 ainda não estão concluídos.


Campanha de três mapas com geometria 3D, salto, câmera vertical, rampas,
escadas, passarelas, elevadores, portas e inimigos armados. O mapa técnico separado permite experimentar todos os recursos (F6 na pausa).
Os renderizadores
SDL por software e GPU usam a mesma simulação, malha, iluminação e preparação
de triângulos. Colisões, consultas, navegação e rasterização de referência são
escritos em Tom; o runtime fornece recursos gerais de plataforma.

| Setor | Dimensão | Sentinelas | Novos elementos |
| --- | --- | --- | --- |
| Bastião | 16 × 16 | 6 | Salto, escadas, passarela, minimapa e barris |
| Fundição | 24 × 24 | 10 | Rampas, elevador, lançador, TV e chave azul |
| Núcleo | 32 × 32 | 16 | Percursos sobrepostos, elevador, combate entre alturas e duas chaves |

Elimine as sentinelas e alcance o portal verde. Enter avança entre setores;
a terceira saída conclui a campanha. Cada mapa começa com 100 de vida e 30
cargas. O lançador é encontrado na Fundição e integra o equipamento inicial
do Núcleo. Chaves são reutilizáveis no mapa; reiniciar restaura seus itens,
munição e equipamento. Barris explodem em cadeia, com dano bloqueado por paredes.

## Jogar

Execute da raiz do repositório, após preparar a toolchain conforme
[scripts/README.md](../../scripts/README.md). Ative `source scripts/env.sh`
no Linux/WSL ou `. ./scripts/env.ps1` no PowerShell; no Windows, use `npm.cmd`.

```text
npm --prefix tom-lang run fps
npm --prefix tom-lang run fps:gpu
```

SDL dispensa a toolchain GPU. O segundo comando exige o preparo opcional
`node scripts/setup-gpu.js` e dispositivo Vulkan compatível.

| Controle | Ação |
| --- | --- |
| Enter | Começar, retomar ou avançar de setor |
| W / S, A / D | Avançar/recuar e deslocar lateralmente |
| Mouse / setas | Mirar horizontal e verticalmente |
| Clique esquerdo / Ctrl esquerdo | Atirar; manter para repetir |
| Espaço / C / Shift | Saltar / agachar / correr |
| E | Acionar a porta à frente, até 1,5 unidade |
| 1 / 2 | Arma atual / lançador, se adquirido |
| M / Tab | Alternar minimapa / mapa ampliado com pausa |
| Page Up / Page Down | Consultar andares descobertos no mapa ampliado |
| I / + / − | Inverter eixo vertical / ajustar sensibilidade do mouse |
| Escape | Pausar e liberar mouse |
| R | Reiniciar setor; depois da vitória, reiniciar campanha |
| Q | Sair nas telas de início, pausa ou resultado |
| F1 / F2 | Alternar texturas / mostrar tempos |
| F3 / F | Alternar vinheta / flashes de dano |
| F4 / F5 | Ajustar volume de música / efeitos, incluindo zero |
| F6, na pausa/início | Alternar mapa técnico e campanha |

O HUD indica interação ou chave necessária. Portas abrem/fecham em um segundo,
esperam três segundos abertas e reabrem quando obstruídas. Frestas, alturas e
obstáculos usam a mesma geometria para desenho, tiros e visão. Perder foco
pausa jogo e áudio; Enter é necessário para retomar. O minimapa aponta ao norte,
mostra regiões descobertas por andar e marca inimigos somente quando visíveis.

## Compilar e distribuir

```text
node jogos/fps-tom/scripts/build.js
node jogos/fps-tom/scripts/build.js --renderer gpu
node jogos/fps-tom/scripts/build.js --renderer all
```

Pacotes separados: `build/<linux|windows>/package/fps-tom/` e
`build/<linux|windows>/package/gpu/fps-tom-gpu/`. Copie a pasta completa, com
bibliotecas, licenças e `assets/`; execute `fps-tom` ou `fps-tom-gpu` (`.exe`
no Windows). O destino dispensa Node/LLVM. Recursos são relativos ao executável.
A seleção do renderizador acontece ao iniciar o programa.

## Arquitetura e recursos

A [especificação 3D](docs/evolucao-3d.md) registra convenções e validação.

- `modelo.tom` e `fase.tom`: estado e mapas Tom, preservando a campanha original.
- `mundo3d.tom`: malha, volumes, regiões, objetos móveis e consultas geométricas.
- `tecnico3d.tom`: sala técnica separada da campanha.
- `simulacao3d.tom`: movimento, portas/elevadores, IA, projéteis e explosões.
- `cena3d.tom`: câmera, iluminação, clipping e sprites.
- `malha-visual3d.tom`, `lotes3d.tom`: subdivisão visual na carga e upload GPU compartilhado por quadro.
- `transparencias3d.tom`: ordenação conjunta estável de alpha/aditivo; adaptador GPU em módulo próprio.
- `entrada3d.tom`, `hud3d.tom`, `audio3d.tom`: comandos, interface e vozes espaciais.
- `fps-tom.tom` e `fps-tom-gpu.tom`: adaptadores explícitos de plataforma.
- `tom/camera3d`, `tom/geometria3d`, `tom/raster3d`: bibliotecas reutilizáveis.

Resolução lógica 320 × 200, cena de 320 × 176. XYZ com Z para cima; simulação
Fl64, lista gráfica Fl32, perspectiva, nearest e profundidade por pixel.
Capacidades: 1.024 células, 16.384 triângulos por malha canônica/visual, 2.048 regiões, 16 elevadores,
128 atores, 256 projéteis, 1.024 efeitos, 32 luzes e 64 eventos sonoros.
IDs com geração protegem a reciclagem de entidades. Saturação de projéteis é
tratada explicitamente; efeitos decorativos e sons de menor prioridade podem
ser descartados. A simulação usa 16.666.667 ns, com máximo de seis passos.
Pulsos e deslocamentos de mouse são consumidos uma vez; a apresentação interpola.

Quatro modos de superfície: opaco, máscara alpha≥0,5, alpha e aditivo.
Profundidade normalizada 0..1, comparação LESS; alpha/aditivo não escrevem depth.
Texturas, materiais, buffers e scratch permanecem residentes. GPU recebe só
listas e não baixa pixels durante o jogo; HUD/minimapa são compostos depois
dos efeitos. As listas de geometria e HUD compartilham um upload por quadro,
com vistas para cada material. `ComandosGPU` grava o upload, os três passes e
a apresentação em um trabalho por quadro. Grupos alpha/aditivos usam faixas
internas, preservando sua ordem; há uma espera final. O buffer mantém comprimento
máximo e vistas limitam os dados ativos, evitando zerar expansões a cada quadro.
SDL aproxima a vinheta em blocos. Iluminação estática por vértice
inclui oclusão; até oito luzes temporárias são selecionadas por prioridade e
proximidade. Faces grandes recebem subdivisão visual preparada na carga; a
malha de colisão mantém as mesmas superfícies canônicas. TVs e lâmpadas são emissivas.

Cada mapa tem trilha original em loop; duas vozes permitem transição musical.
TV e ambiente possuem canais reservados e os efeitos usam 22 vozes por
prioridade, distância, panorâmica e atenuação por obstáculos. Clipes com áudio
seguem a posição do mixer; pausa congela som e imagem conjuntamente.

O preparador em Tom aceita sequências PNG RGB/RGBA8 e WAV PCM16 a 48 kHz.
Compile uma vez com a toolchain local ativada; o executável só precisa das
bibliotecas incluídas no pacote, sem Node/LLVM para preparar clipes:

```text
node jogos/fps-tom/scripts/build-tools.js
jogos/fps-tom/build/linux/tools/preparar-clipes/preparar-clipes --frames quadros --output jogos/fps-tom/assets/tv --fps 12 --audio loop.wav
```

No Windows, use `build/windows/tools/preparar-clipes/preparar-clipes.exe` dentro
da pasta do FPS. O build informa o caminho produzido. Omita `--audio` para clipe
silencioso; `--fps` tem padrão 12. Opções desconhecidas, repetidas ou sem valor
são recusadas. Os fontes estão em `ferramentas/`; `scripts/prepare-clips.js`
permanece referência de equivalência. Teste: `npm --prefix tom-lang run test:clip-tools`.

A seleção usa arquivos com extensão PNG sem distinguir caixa. A ordem natural
é definida em [`tom/texto_ordem`](../../tom-lang/docs/entradas-ferramentas.md):
dígitos por valor, empate por menos zeros, ASCII sem caixa, demais caracteres
por ponto de código. Casos com acentos/zeros não dependem mais do locale inglês
do Node. Limites: 4096 entradas/1 MiB de nomes na pasta; PNG/WAV até 65 MiB cada,
quadros iguais até 128×96, fps divisor de 48000 entre 1 e 30, até oito segundos.
Caminhos aceitam `/` e o preparador também reconhece `\` ao criar a pasta de saída.
Todos os inputs são validados antes da publicação; cada arquivo é publicado
individualmente, portanto erro de IO não garante rollback do conjunto inteiro.

Os geradores de conteúdo original também são executáveis Tom, produzidos pelo
mesmo `build-tools.js`. Não precisam de assets de entrada:

```text
jogos/fps-tom/build/linux/tools/gerar-recursos/gerar-recursos --output jogos/fps-tom/assets
jogos/fps-tom/build/linux/tools/gerar-recursos-3d/gerar-recursos-3d --output jogos/fps-tom/assets
```

No Windows, os caminhos correspondentes usam `build/windows/tools/` e `.exe`.
`--output pasta` é obrigatório; a pasta é criada recursivamente. Desenho,
glifos, animação, síntese e cabeçalho WAV estão nos módulos `recursos-*.tom`.
Os scripts JavaScript permanecem referências para os testes de pixels, PCM e
metadados; PNGs podem ter compressão diferente. Teste:
`npm --prefix tom-lang run test:resource-tools`.

O preparador valida imagens e duração exata antes de empacotar atlas, JSON e
metadados Tom compiláveis. Prepare `jogos/fps-tom/assets/tv` e reconstrua o pacote para trocar o clipe;
startup valida dimensões contra o perfil. A TV incluída usa 128 × 96, 12 FPS,
96 quadros e oito segundos. Outros perfis preparados e clipes silenciosos são
aceitos: os silenciosos seguem os passos da simulação, e os que têm WAV seguem
o mixer. Não há decodificação de vídeo comprimido em execução. Arte, clipes,
trilhas e efeitos são originais e CC0, conforme `assets/LICENSE.txt`.
`gerar-recursos-3d` restaura a TV e os demais recursos originais;
execute-o antes de preparar um clipe personalizado, para não sobrescrever o clipe.

O raycaster anterior permanece em `fps-raycaster.tom`/`fps-raycaster-gpu.tom`
para regressões de regras e progressão. `generate-renderers.js` reproduz
somente seus adaptadores legados; os adaptadores 3D são editados diretamente.

## Verificar e medir

```text
npm --prefix tom-lang run test:fps
npm --prefix tom-lang run test:graphics-3d
npm --prefix tom-lang run test:audio-spatial
npm --prefix tom-lang run test:gpu
node jogos/fps-tom/scripts/benchmark.js
node jogos/fps-tom/scripts/benchmark.js --renderer gpu
node jogos/fps-tom/scripts/benchmark.js --renderer gpu --desktop
node jogos/fps-tom/scripts/benchmark.js --renderer gpu --immediate
node jogos/fps-tom/scripts/benchmark.js --renderer gpu --immediate --desktop
node jogos/fps-tom/scripts/benchmark.js --renderer sdl --stress
node jogos/fps-tom/scripts/benchmark.js --renderer gpu --stress
node jogos/fps-tom/scripts/benchmark.js --renderer gpu --stress --immediate
node jogos/fps-tom/scripts/collect-benchmarks-3d.js
node jogos/fps-tom/scripts/verify-desktop.js
node jogos/fps-tom/scripts/verify-desktop.js --package
node jogos/fps-tom/scripts/verify-desktop.js --renderer gpu --package
```

O benchmark 3D mede três mapas, com 20 quadros de aquecimento e 240 amostras
por mapa; `--frames`/`--warmup` permitem ensaios curtos. `--stress` amplia atores.
Registra carga, bake, movimento/consultas, navegação/IA, combate/consultas,
efeitos, preparação/iluminação, HUD, áudio, transferências, desenho e apresentação.
Grupos com consultas registram custo inclusivo; não some esses grupos novamente
ao total de simulação. CSV/JSON em `build/benchmark/` incluem hardware, p50/p95,
metadados GPU, bytes de recursos/transferências, pico RSS no Linux e pico de
working set no Windows.
`--immediate` compara a sequência anterior de desenho com os mesmos módulos
atuais de cena/simulação. A referência está em
`benchmarks/autonomia-grafica/referencias/fps-gpu-imediato.tom`, a partir da raiz
do repositório. `benchmark-gpu.c` instrumenta somente o executável de medição:
conta todas as submissões SDL e lê timestamps antes de liberar fences, incluindo
inicialização/redimensionamento. O CSV distingue contagem nativa de trabalhos
públicos, memória nominal do gravador e staging observado. No caminho agrupado,
transferência host mede a captura; desenho mede gravação; apresentação inclui
submissão/aquisição/espera. Compare o quadro completo e o tempo GPU total, pois
as fases host têm divisões diferentes. Nenhuma regra de simulação é alterada.
O coletor reúne os 12 relatórios dos dois sistemas (SDL/GPU, campanha/estresse/
desktop), verifica que todos correspondem às fontes atuais e publica o JSON
em `benchmarks/`. Ele rejeita misturas de versões e medições GPU com download.
Timestamps de submissões GPU são separados dos tempos observados pelo host.
Execute medições sem outras suítes concorrentes. A [comparação GA003 de comandos agrupados](../../benchmarks/autonomia-grafica/comandos-desempenho-2026-10-05.json)
preserva 12 novas rodadas com uma submissão por quadro, incluindo estresse;
desktop Windows e o terceiro mapa em estresse não mostram ganho consistente.
Consulte a [interpretação e os valores](docs/evolucao-3d.md#comandos-agrupados-comparação-de-5102026).
Os [12 resultados anteriores](benchmarks/resultados-3d-2026-10-04.json)
e a [tabela com p50/p95 e limites](docs/evolucao-3d.md#desempenho-medido) registram
os dois sistemas: a meta de 60 FPS foi atingida em algumas combinações, mas
não no estresse nem em todas as apresentações. Linux usa GPU por software;
Windows usa RTX 5060 Ti. O benchmark legado está em `benchmark-raycaster.js`.

SDL sem `--desktop` usa software/dummy em 320 × 200; GPU usa textura offscreen.
`--desktop` usa janela 960 × 600, inclui apresentação e pode incluir VSYNC.
`TOM_VERIFY_AUDIO_DRIVER=dummy`
permite verificar janela real sem dispositivo de som. Driver dummy não comprova
qualidade audível; percepção do áudio e sensação dos controles exigem sessão manual.
O recibo de produção identifica seu escopo como abertura de janela, envio de
entrada e encerramento limpo. Ele não observa o estado interno da partida;
os testes de comandos/simulação verificam as respostas da partida. O adaptador
com trace confirma a execução do laço gráfico após a entrada nativa.

Testes O0/O2 cobrem geometria, recorte, UV em perspectiva, profundidade, mistura,
falhas e retenções, movimento vertical, portas/elevadores, combate, reinício,
progressão, input/replay 30/60/144 FPS, clips e comparação dos mapas. Entre
renderizadores: RGB±2, vizinhança de um pixel e até 0,5% de texels divergentes;
oclusão em fixtures menores é exata por backend. Valores discretos do replay
são iguais; diferenças numéricas entre plataformas têm tolerância de 1e−9.

Fora desta entrega: multiplayer, salvamento persistente, editor visual, destruição
arbitrária, modelos esqueléticos, codecs em execução e sombras móveis detalhadas.
