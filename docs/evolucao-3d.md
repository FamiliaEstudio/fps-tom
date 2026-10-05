# Evolução 3D de Bastião

Implementação e validações locais de 4 de outubro de 2026. Este documento
descreve os contratos presentes no código e as verificações confirmadas.
A campanha usa um mundo tridimensional comum aos adaptadores SDL e GPU.
Regressões, 12 benchmarks e os quatro pacotes foram executados em Linux e
Windows. A meta de 60 FPS foi atingida parcialmente; qualidade audível e
sensação dos controles exigem avaliação humana, conforme os limites ao final.

## Contratos

- Mundo XYZ com Z para cima; unidades de mapa preservadas. Estado/colisões em Fl64, lista gráfica em Fl32. Câmera com +Z no espaço de visão; clip Y para cima e profundidade 0..w.
- Lista gráfica: 9 Vec4 por triângulo, três por vértice: clip XYZW, UV xy e RGBA. Texturas PNG RGBA com origem superior esquerda. Pixels CPU: bytes RGBA, inteiro little-endian 0xAABBGGRR.
- Modos 0 opaco, 1 máscara alpha>=0,5, 2 alpha e 3 aditivo. Comparação LESS; opaco/máscara escrevem profundidade, alpha/aditivo apenas testam. UV e cores usam interpolação corrigida pela perspectiva.
- Preparação geométrica, clipping, iluminação e rasterização de referência pertencem a Tom. Runtime fornece imagem CPU, streaming SDL, triângulos/depth GPU e panorâmica de áudio.
- Resolução lógica 320×200; cena 320×176 e HUD de 24 linhas. HUD/minimapa são compostos depois dos efeitos da cena. Nunca há download GPU no jogo; os readbacks existem somente em testes de imagem.
- Simulação fixa de 16.666.667 ns, máximo seis passos. Mouse acumulado/pulsos são consumidos uma vez; estado visual interpola poses sem alterar simulação.

A inclinação da câmera é limitada a ±85°. `Fps3DComando` contém `frente`,
`lado`, `giro` e `pitchDelta` em Fl64, os booleanos `correr`, `agachar`, `pular`,
`atirar` e `interagir`, e `arma` (0 sem troca, 1 arma inicial, 2 lançador).
`giro` e `pitchDelta` são deltas em radianos por passo. O leitor de comandos
consome o mouse acumulado, salto, interação e troca de arma no primeiro passo
que os recebe, sem multiplicá-los durante recuperação de passos. Perda de foco
limpa a entrada e pausa jogo e áudio; o mapa ampliado também pausa a partida.

## Operações públicas da linguagem

As APIs anteriores e sua ABI permanecem. As novas operações gerais recebem
tipos, emissão, empréstimos, limpeza lexical, análise do editor, documentação e
exemplos; regras de jogo não entram no runtime C.

| Operação | Contrato implementado |
| --- | --- |
| `ImagemCarregarPNG[Txt] → Imagem` | PNG relativo a `assets/`, independente de janela/GPU; arquivo até 64 MiB e dimensões de 1 a 4096 |
| `ImagemLargura[Imagem]`, `ImagemAltura[Imagem] → InUd32` | Dimensões da imagem residente em CPU |
| `ImagemPixelsCopiar[Imagem, RefBufferInUd32] → Vazio` | Comprimento ativo exato `largura × altura`; aceita vistas e preserva o destino em falhas |
| `VisualPixelsCriar[Janela, InUd32, InUd32] → Visual` | Visual streaming que mantém a janela; começa transparente |
| `VisualPixelsEnviar[RefVisual, BufferInUd32] → Vazio` | Envio síncrono de framebuffer exato; valida antes de alterar e permite reutilizar o buffer depois da cópia |
| `GPUAlvo3DCriar[DispositivoGPU, InUd32, InUd32] → AlvoGPU` | Cor RGBA8 e profundidade D32_FLOAT, inicialmente limpas em zero e 1 |
| `GPUAlvo3DLimpar[RefAlvoGPU, Vec4<Fl32>, Fl32] → TrabalhoGPU` | Limpeza assíncrona; profundidade finita entre 0 e 1 |
| `GPUDesenharTriangulos[RefAlvoGPU, BufferGPUVec4Fl32, MaterialGPU3D] → TrabalhoGPU` | Lista com comprimento múltiplo de nove; preserva início/comprimento de vistas e exige alvo com profundidade |
| `AudioPanoramaCanal[RefAudio, InSd32, Fl64] → Vazio` | Panorama de −1 a 1; centro conserva exatamente o comportamento anterior do mixer |

`MaterialGPU3DxFuncao[gpu, textura, modo, filtro, recorte, parametros...]` cria
o tipo próprio `MaterialGPU3D`, com função pura e parâmetros equivalentes aos
materiais 2D. `MaterialGPU3DRecorte` e os setters
`MaterialGPU3DParametro{Fl32,Vec2Fl32,Vec3Fl32,Vec4Fl32,Bl}` alteram esse recurso.
A amostra é multiplicada pela cor antes da função de material; o modo máscara
descarta alpha inferior a 0,5 depois da função. Alpha usa RGB
`src × a + dst × (1 − a)`; aditivo usa `src × a + dst`, com saturação.
O alpha resultante é `src.a + dst.a × (1 − src.a)` no modo transparente
e `src.a + dst.a` no modo aditivo. Os componentes z/w de UV são reservados
e ignorados pelos renderizadores.

Trabalhos GPU retêm alvo, profundidade, material, textura e buffers/vistas até
concluir, verificam dispositivos, impedem feedback de textura e escritas
conflitantes e conservam snapshots dos parâmetros. Falhas preservam as saídas.
Contratos detalhados: [imagens e pixels CPU](../../../tom-lang/docs/visual-2d.md)
e [triângulos GPU](../../../tom-lang/docs/gpu.md). Exemplos executáveis:
`tom-lang/exemplos/framebuffer-cpu.tom` e `tom-lang/exemplos/triangulos-gpu.tom`.

O envio SDL usa textura streaming, bloqueio e cópia por linha respeitando o
pitch. A SDL recomenda esse caminho para atualizações frequentes; o acesso ao
buffer bloqueado é somente de escrita. Referências oficiais:
[SDL_UpdateTexture](https://wiki.libsdl.org/SDL3/SDL_UpdateTexture) e
[SDL_LockTexture](https://wiki.libsdl.org/SDL3/SDL_LockTexture).
Teste e escrita de profundidade são configurados separadamente nos pipelines,
conforme [SDL_GPUDepthStencilState](https://wiki.libsdl.org/SDL3/SDL_GPUDepthStencilState).

## Organização

O raycaster antigo permanece em `fps-raycaster.tom`/`fps-raycaster-gpu.tom` e conserva suas suítes. Os adaptadores públicos 3D são explícitos; entrada, cena, HUD, áudio e simulação são compartilhados. Os mapas existentes são extrudidos para uma malha triangular e recebem estruturas 3D autoradas. Colisão, tiros, visão e oclusão consultam a mesma malha e as mesmas transformações móveis.

Módulos reutilizáveis: `tom/camera3d`, `tom/geometria3d` e `tom/raster3d`. Scratch buffers, texturas, materiais e capacidades são preparados antes do laço. Não se acrescentam códigos de IA ou combate ao runtime.

| Módulo | Responsabilidade |
| --- | --- |
| `modelo.tom`, `fase.tom` | Estado compartilhado, campanha escrita em Tom e regras legadas preservadas |
| `mundo3d.tom`, `tecnico3d.tom` | Malha, construtores de caixas/rampas/patamares, consultas, regiões e carregamento dos mapas |
| `simulacao3d.tom` | Movimento, portas/elevadores, navegação, combate, pools, efeitos e eventos sonoros |
| `entrada3d.tom`, `hud3d.tom` | Comandos independentes do backend, pausa, opções, minimapa e interface |
| `cena3d.tom`, `transparencias3d.tom` | Câmera, luzes, recorte, billboards, listas de triângulos e composição ordenada |
| `malha-visual3d.tom`, `lotes3d.tom` | Subdivisão visual preparada na carga e empacotamento de listas para um upload GPU por quadro |
| `clipe3d.tom`, `audio3d.tom` | Perfil de clipe preparado, relógio da TV, vozes, música e áudio espacial |
| `fps-tom.tom`, `fps-tom-gpu.tom` | Pequenos adaptadores explícitos de recursos, desenho e apresentação |

### Capacidades e referências

Os adaptadores reservam antes do laço: 1.024 células (32×32), até 32 portas,
128 atores/itens, 16.384 triângulos canônicos, 16.384 triângulos visuais e cores por vértice correspondentes,
16 elevadores, 2.048 regiões, 256 projéteis, 1.024 efeitos, 32 luzes dinâmicas
e 64 eventos sonoros. O grafo armazena até oito vizinhos por região.
O carregamento verifica capacidades e os construtores verificam cada inserção;
referências móveis apontam para células/elevadores preparados, com os acessos
submetidos aos limites das SOAs.

`FpsTriangulo` contém XYZ e UV de cada vértice, limites mínimo/máximo
pré-calculados, material, andar, modo de superfície e flag de colisão.
`movel = 0` identifica geometria estática, `indiceCelula + 1` identifica porta
e `−(indiceElevador + 1)` identifica elevador. `Fps3DTriPosicao` aplica a mesma
transformação, interpolada quando solicitada, para desenho e consultas.
A malha visual é derivada da canônica uma vez na carga. Faces estáticas grandes
marcadas pelos construtores são subdivididas com UV contínuo; TVs, vidro e
objetos móveis conservam os triângulos originais. A iluminação dos novos
vértices consulta a oclusão na malha canônica. A subdivisão não muda a geometria
ou multiplica os candidatos das consultas de física, tiro e visão.
`lotes3d.tom` empacota opacos, TV, máscara, transparências ordenadas e HUD num
buffer CPU residente. Um upload GPU por quadro alimenta vistas por material;
o HUD continua sendo desenhado somente depois dos efeitos.
`Fps3DRaio` devolve distância, ponto, normal, triângulo e objeto móvel;
triângulo −1 significa ausência de impacto. A direção normalizada produz
distâncias em unidades do mundo. As caixas delimitadoras eliminam candidatos
antes da interseção exata com o triângulo.

`Fps3DNivelCarregar` e `Fps3DTecnicoCarregar` recebem nível, referências de
estado, mapa, entidades, mundo, malha, elevadores, regiões, projéteis, efeitos,
luzes, os três pools nativos e a fila de sons. `Fps3DPasso` recebe essas
estruturas, o comando e os pools de projéteis/efeitos; o pool de atores não é
reciclado durante a fase. As assinaturas completas estão nos módulos Tom.
`Fps3DPortaAlvo` oferece ao HUD a mesma consulta de interação do jogo, sem ação.

Atores, projéteis e efeitos guardam IDs nativos com pool, índice e geração.
Projéteis/efeitos devolvem os IDs ao expirar, e recarregar a fase limpa os três
pools sem reutilizar uma geração antiga. Capacidade esgotada de projéteis
impede o disparo sem consumir munição; efeitos decorativos podem ser omitidos.
A fila sonora conserva posição e prioridade de cada evento, inclusive com
vários passos no quadro. Ao encher, substitui o evento de menor prioridade
somente por um de prioridade maior, e registra `somDescartados`.

### Movimento, navegação e andares

Jogador e sentinelas usam cápsulas verticais e varredura contínua contra a
malha. O avanço conservador calcula a separação entre segmento da cápsula e
triângulo; se esgotar iterações, conserva a última posição segura. Deslizamento
considera planos de contato, rampas até 45° e degraus de até 0,22 unidade.
Há gravidade, salto, agachamento com verificação antes de levantar, contato
com teto e transporte por elevadores. Portas e elevadores revertem ao ameaçar
obstruir/esmagar atores. Projéteis fazem varredura entre posições anteriores
e atuais, incluindo o volume dos atores.
Posição anterior e velocidade são mantidas em XYZ. Explosões acumulam impulso
horizontal residual e velocidade vertical para jogador e sentinelas
sobreviventes; o impulso é integrado pela mesma cápsula/CCD, com decaimento
determinístico por passo. Cobertura bloqueia dano e impulso conjuntamente.
O apoio do elevador verifica a distância da calota inferior ao topo, incluindo
as bordas, e rejeita mera sobreposição da projeção XY sem contato.
Durante a subida do salto, proximidade do piso não restaura o estado apoiado.
Quando o raio central não encontra apoio, a calota inferior da cápsula verifica
contato com faces caminháveis. Isso permite subir degraus pelo contato na
borda, sem considerar paredes, faces inferiores ou rampas acima de 45° como
piso. O mesmo procedimento atende jogador e sentinelas.

O andar do minimapa é associado à superfície caminhável abaixo dos pés, pela
consulta de piso e o atributo `andar` do triângulo. A carga e cada passo
atualizam jogador e todas as entidades ativas, incluindo itens elevados.
Saltar no piso inferior continua no andar inferior; passar sob a ponte e ficar
em cima dela produz andares diferentes na mesma XY. Na plataforma do elevador,
o andar acompanha o patamar mais próximo, mudando no meio do curso entre mínimo
e máximo. A região móvel acompanha essa classificação e sua altura real.

Itens e decoração fora do curso de objetos móveis reutilizam a classificação
enquanto a própria pose XYZ permanecer igual. Criação e carga invalidam esse
cache; deslocamento invalida pela comparação da pose, independentemente do
snapshot visual. Jogador e sentinelas continuam consultando o piso em todo
passo. Uma SOA privada residente agrupa até 48 caixas móveis, incluindo o curso
lateral inteiro das portas e o retângulo dos elevadores: entidades nesses
retângulos nunca reutilizam apoio, mesmo com a plataforma parada. Se a malha
exceder 48 objetos móveis, o cache é desativado e todas as consultas permanecem.
`andarConsultas` permite verificar o reuso sem alterar regras ou precisão.

Regiões derivam das células caminháveis convertidas e dos construtores de
superfícies superiores; não há uma segunda descrição manual das paredes para
o minimapa. Descoberta usa distância e visibilidade da mesma malha, distingue
andares e só mostra inimigos visíveis. Os contornos derivam de cortes da malha
na altura do andar e incluem paredes altas, vidro, portas e bordas das
passarelas. Células e linhas do minimapa usam retângulos em pixels inteiros,
mantendo amostragem nearest equivalente nos dois adaptadores.
Adjacência é preparada na carga com os oito vizinhos mais próximos em XYZ e
desempate pelo índice; a busca em largura usa fila e ordem estáveis, com
ligações condicionais para portas e elevadores. A sentinela consulta a porta
no próximo trecho da rota, respeitando chaves e emitindo o som apenas no
início da abertura. A navegação é atualizada a cada 30 passos de simulação.
O carregamento verifica a cápsula final dos atores; se as 36 tentativas de
ajuste de spawn não encontrarem posição livre, o nível é rejeitado.

As sentinelas passam por patrulha, alerta, perseguição, preparação visível,
ataque e morte. Há disparo instantâneo com rastreador e projétil explosivo que
pode ser evitado. O lançador aparece na Fundição e começa disponível no Núcleo.
Explosões usam distância e cobertura da malha, aplicam impulso e dano, geram
luz/som/partículas e processam barris em ordem estável, uma explosão por barril.

### Preparação e desenho

O quadro interpola as poses, prepara a câmera uma vez, rejeita triângulos fora
dos planos antes de calcular UV/luzes, recorta e produz listas por superfície.
Iluminação estática por vértice é preparada na carga com oclusão por raios;
o tema muda por mapa. Até oito luzes dinâmicas relevantes são selecionadas por
superfície/billboard, entre 32 ativas, com prioridade e distância. TVs são
emissivas. Não há sombras móveis detalhadas.
O conjunto visual de até 32 fontes combina clarões com as posições
interpoladas dos projéteis, selecionando por prioridade e distância à câmera
com desempates estáveis. O projétil ilumina seu trajeto nos dois adaptadores.
Partículas guardam poses anteriores XYZ no spawn e antes de cada passo;
a apresentação interpola essas poses sem reconstruir posições pela velocidade.
Itens e saída só aparecem no minimapa depois de descoberta a célula no próprio
andar; ter linha de visão de uma região ainda desconhecida não os revela.

A SDL rasteriza em Tom com profundidade por pixel, nearest e os mesmos modos
de superfície. A GPU reutiliza atlas, materiais, alvos e buffers residentes;
recebe as listas e desenha sem baixar pixels. Opacos, TVs e máscaras precedem
a composição de transparências. Vinheta, pulso de dano e tremor visual são
aplicados antes de HUD/minimapa; F3 e opções de flash reduzem efeitos sem
alterar simulação ou dano.

`transparencias3d.tom` reúne alpha e aditivo em uma lista ordenada do fundo para a frente por profundidade média do triângulo. O merge sort é estável, usa duas reservas de 131072 vetores e custa O(N log N); empates preservam alpha antes de aditivo. UV.z/w transportam modo e chave de ordenação, enquanto os renderizadores amostram UV.xy. Grupos consecutivos do mesmo modo usam vistas; a GPU recebe a lista uma vez e preserva essa ordem ao trocar materiais. Assim, vidro atenua efeitos aditivos posicionados atrás dele. As superfícies continuam sem escrever profundidade.

A ordenação por triângulo não resolve interseções arbitrárias entre superfícies
transparentes. A autoria deve evitar polígonos transparentes que se cruzem.
As listas reservam 262.144 Vec4 para opacos, 65.536 para cada outro modo,
131.072 para mistura e scratch, 4.096 para TVs e 60 para cada scratch de recorte.
O HUD tem sua própria lista de 16.384 Vec4; essas capacidades são vetores,
não contagens de triângulos.

## Campanha implementada

| Mapa | Dimensão e sentinelas | Adaptação 3D |
| --- | --- | --- |
| Bastião | 16×16, seis | Escada, rampa e passarela na sala inicial; barris e tiros armados |
| Fundição | 24×24, dez | Rampa, elevador, passarela, lançador elevado, TV, vidro e ambiente industrial |
| Núcleo | 32×32, dezesseis | Segunda passarela, combate entre alturas e sentinela elevada; tema tecnológico |
| Técnico | 16×16, duas; fora da campanha | Duas orientações de portas/chaves, escada, rampa, passagem sobreposta, elevador, TV, vidro, barris e lançador |

Chaves e saídas da campanha anterior permanecem. E atua à frente em até
1,5 unidade considerando altura, inclinação e obstrução real; portas deslizam
em um segundo, aguardam três segundos abertas e reabrem quando obstruídas.
Cada mapa começa com 100 de vida e 30 cargas; R restaura o equipamento inicial
do mapa. Eliminar as sentinelas e chegar à saída conclui a fase; Enter avança
após o resultado e a terceira saída conclui a campanha. O mapa técnico pode
ser alternado por F6 no início/pausa, sem mudar as contagens da campanha.

## Recursos e compatibilidade

`generate-resources-3d.js` cria atlas adicional, três trilhas, ambiente, explosão e uma TV original. `prepare-clips.js` aceita quadros PNG RGB/RGBA8 sem interlace e WAV PCM16 48000 Hz; produz atlas e metadados e verifica duração exata do loop. Perfil da TV da campanha: 128×96, 12 FPS, 96 quadros, oito segundos. Licença CC0.

O preparador escreve `.png`, `.json` e `.tom` a partir do mesmo perfil validado. Para substituir a TV, use `--output jogos/fps-tom/assets/tv`, com `--fps` e `--audio` opcional, e reconstrua os pacotes. `assets/tv.tom` fornece `FpsClipePreparado`; a inicialização verifica as dimensões do atlas. O jogo aceita quadros até 128×96, taxas inteiras até 30 FPS que dividem 48000 e loops de até oito segundos. Clipes com WAV seguem a posição do mixer; clipes silenciosos seguem os passos da simulação, dispensam `tv.wav` e congelam em pausa ou perda de foco. A troca de quadros altera apenas UV; o atlas permanece residente.

Na carga ou reinício, o mixer fica pausado enquanto a origem da TV e os canais
são preparados. Volumes e panorama são aplicados antes da retomada, impedindo
avanço entre o início do som e sua origem visual. O preparador rejeita chunks
WAV `fmt`/`data` duplicados, cabeçalhos incompletos e padding ausente. A posição
usada é a processada pelo mixer; buffers do dispositivo podem acrescentar
latência audível, conforme o contrato de áudio da linguagem.

Música ocupa canais 0/1 para transição, TV ocupa 2, ambiente ocupa 3 e as
22 vozes de efeitos usam 10..31. Volume por distância, panorâmica relativa ao
ouvinte e atenuação por obstáculos são calculados em Tom. Volumes de música e
efeitos são separados; pausa suspende o relógio do mixer e o jogo juntos.

Os comandos `fps`, `fps:gpu` e `build.js --renderer sdl|gpu|all` permanecem.
SDL é o padrão e dispensa toolchain GPU. O empacotador configura destinos
separados e inclui imagens, WAV, licenças, LEIA-ME e relatórios disponíveis.
A produção e execução dos quatro pacotes finais foram verificadas conforme
os recibos e limites abaixo.

## Critérios de fechamento

### Verificações confirmadas

As contagens abaixo identificam execuções distintas, não uma soma de suítes
sem sobreposição. O0/O2 estão incluídos onde existem casos nativos por nível.

| Execução | Linux | Windows |
| --- | --- | --- |
| Regressão FPS final (`test:fps`), incluindo gameplay26 e renderização/multimídia | 90/90, sem falhas/skips | 90/90, sem falhas/skips |
| Geometria/câmera/rasterização reutilizáveis | 11/11 | 11/11 |
| GPU completa, incluindo imagens e materiais 3D | 139/139 | 139/139 |
| Compilador/editor | 50/50 | 50/50 |
| Análise/editor de projetos | 17/17 | 17/17 |
| Imagem/panorama e multimídia final, também incluídos na regressão FPS | 20 casos distintos aprovados | 20 casos distintos aprovados |
| Exemplos públicos de imagem CPU e áudio | 3/3, incluindo execução O0/O2 dos dois exemplos | 3/3, incluindo execução O0/O2 dos dois exemplos |

Os casos de gameplay cobrem CCD, salto, câmera, teto, rampas/degraus,
passarelas sobrepostas, portas/elevadores, tiros entre alturas, projéteis
rápidos, explosões bloqueadas, cadeias de barris, chaves/saídas, reinício,
capacidade, IDs com geração, fila sonora e classificação de andares. Os testes
de multimídia verificam preparação determinística, PNG/PCM inválidos, duração,
perfil Tom/JSON, grades UV genéricas, loops silenciosos e relógios de reprodução.

O replay inclui portas, chave, mouse, salto, lançador e projéteis. São 120
passos em cada cadência de 30/60/144 FPS, comparados por passo. Linux e Windows
produziram os mesmos 360 estados discretos, incluindo andar, e diferença
numérica máxima 1,92593e−34, abaixo da tolerância de 1e−9. Foram comparados
72.360 campos numéricos e 76.680 discretos. Fonte, hashes e estados
finais estão em [replay-3d-2026-10-04.json](../benchmarks/replay-3d-2026-10-04.json).
Os três casos de exemplos públicos passaram nos dois sistemas, incluindo
execução nativa em O0/O2 de imagem CPU e áudio/multimídia.

Comparações técnica e de campanha SDL/GPU passaram em O0/O2 nos dois sistemas.
A comparação entre backends admite RGB ±2, procura correspondência numa borda
de um pixel e limita pixels sem correspondência a 0,5% do quadro. Oclusão é
verificada exatamente em casos menores dentro de cada backend. Faces
coplanares do piso/elevador foram corrigidas na autoria; a tolerância não foi
ampliada para esconder esse defeito.
O teste de campanha usa o mesmo empacotamento de listas e vistas do adaptador
GPU. Células do minimapa antes colocadas em meios pixels foram alinhadas à
grade lógica, eliminando frestas de atlas sem mudar os recortes de texturas
do mundo ou a tolerância de comparação.

Comandos reproduzíveis, a partir da raiz com a toolchain preparada:

```text
npm --prefix tom-lang run test:fps
node --test jogos/fps-tom/tests/gameplay3d.test.js
node --test jogos/fps-tom/tests/transparencias3d.test.js
node jogos/fps-tom/tests/replay3d-run.js
node jogos/fps-tom/tests/replay3d-run.js --compare jogos/fps-tom/build/replay3d/linux.json jogos/fps-tom/build/replay3d/win32.json
```

### Desempenho medido em 4/10/2026

Os 12 ensaios O2 usaram as mesmas fontes, 20 quadros de aquecimento e 240
amostras por mapa, em execução sequencial e com áudio dummy. Cena 320×176,
resolução lógica 320×200, janela 960×600. Estresse mantém 128 sentinelas
armadas ativas; restaura suas vidas antes da amostra, sem alterar colisão,
simulação, projéteis ou dano. Os grupos de consultas têm custo inclusivo;
carga e bake são medidos separadamente do quadro.

CPU: Intel Core i5-14400F. Linux: WSL2 6.18.40.1, clang 21.1.8; GPU Vulkan
llvmpipe em software. Windows: GPU Vulkan NVIDIA GeForce RTX 5060 Ti. Tempos
abaixo são **p50 / p95 em milissegundos**; a meta usa p95 ≤16,667 ms. Memória
é pico RSS no Linux e WorkingSet amostrado no Windows, portanto não representa
a mesma métrica entre sistemas.

| Sistema e renderizador | Modo | Bastião | Fundição | Núcleo | Pico MiB |
| --- | --- | --- | --- | --- | --- |
| Linux SDL | Sem janela | 9,569 / 10,649 | 10,163 / 11,352 | 13,183 / 14,563 | 47,59 |
| Linux SDL | Estresse | 28,997 / 69,189 | 36,878 / 91,230 | 54,500 / 110,902 | 47,73 |
| Linux SDL | Janela | 13,962 / 15,434 | 14,174 / 15,905 | 17,074 / 19,678 | 51,76 |
| Linux GPU software | Sem janela | 15,760 / 18,425 | 19,297 / 21,958 | 22,270 / 24,745 | 137,40 |
| Linux GPU software | Estresse | 27,180 / 31,956 | 39,830 / 51,527 | 57,489 / 74,539 | 139,09 |
| Linux GPU software | Janela | 19,037 / 21,590 | 22,679 / 25,837 | 25,336 / 28,101 | 157,45 |
| Windows SDL | Sem janela | 10,350 / 13,816 | 16,674 / 28,916 | 22,129 / 42,843 | 50,83 |
| Windows SDL | Estresse | 52,240 / 119,504 | 72,767 / 161,258 | 110,140 / 215,292 | 51,86 |
| Windows SDL | Janela | 10,221 / 11,664 | 10,376 / 12,782 | 13,417 / 14,811 | 88,09 |
| Windows GPU física | Sem janela | 3,051 / 5,796 | 4,549 / 8,526 | 11,108 / 13,409 | 88,46 |
| Windows GPU física | Estresse | 22,427 / 29,688 | 50,558 / 75,378 | 90,456 / 128,854 | 89,89 |
| Windows GPU física | Janela | 16,644 / 17,025 | 16,636 / 21,261 | 16,527 / 33,285 | 157,24 |

A meta foi atingida nos três mapas SDL Linux sem janela, SDL Windows com
janela e GPU Windows sem janela. Não foi atingida no estresse, GPU software
Linux nem em todas as demais combinações. Apresentação pode incluir VSYNC
e compositor; os tempos de submissão GPU são registrados separadamente.
Essas amostras controladas não garantem 60 FPS em todo percurso. O próximo
trabalho de desempenho deve reduzir candidatos das consultas espaciais e
geometria submetida, preservando precisão e regras; a entrega não declara
cumprimento geral da meta nem um ganho universal da GPU.

Estágios, hardware, memória, bytes transferidos, fontes e executáveis estão
em [resultados-3d-2026-10-04.json](../benchmarks/resultados-3d-2026-10-04.json).
O coletor confirmou SHA-256 compartilhado
`543e26e5ef7fbdf1b60b9b47c1bf2196577da140faac29ccb532fa13e3b84513`,
todos os relatórios atuais e zero bytes baixados da GPU. CSVs e pacotes de
medição ficam em `build/benchmark/<linux|windows>/3d-*/`.

### Comandos agrupados: comparação de 5/10/2026

O adaptador GPU passou a gravar upload, cena, pós-processamento, HUD e
apresentação em um gravador, com uma submissão e uma espera final. A referência
imediata foi preservada em
`benchmarks/autonomia-grafica/referencias/fps-gpu-imediato.tom`, na raiz do
repositório. `benchmark.js --renderer gpu --immediate` seleciona essa referência;
ambos os caminhos usam os mesmos módulos atuais de cena/simulação e runtime.
O agrupado mantém o comprimento do buffer GPU e usa vistas para o trecho ativo,
evitando também os uploads de zero que o redimensionamento imediato fazia.

Foram 12 execuções O2 sequenciais, com 240 amostras após 20 quadros de aquecimento
em cada mapa, áudio dummy e as mesmas resoluções anteriores. A comparação cobre
sem janela, janela e estresse sem janela com 128 atores. Linux usa llvmpipe;
Windows usa RTX 5060 Ti, no mesmo i5-14400F. Não há suítes concorrentes nem
download durante o quadro. O benchmark conta diretamente cada submissão SDL,
inclusive zeramentos sem trabalho público, e lê seus timestamps antes de
liberar o fence. Os 8.640 quadros agrupados tiveram uma submissão; no imediato,
o p95 variou entre 9 e 11 conforme configuração/mapa.

Valores abaixo: **p95 do quadro em ms, imediato → agrupado**. p50, fases CPU,
tempo GPU, preparação, bytes e memória estão nos relatórios completos.

| Sistema e modo | Bastião | Fundição | Núcleo |
| --- | --- | --- | --- |
| Linux sem janela | 12,682 → 4,101 | 14,484 → 5,889 | 16,270 → 8,062 |
| Linux janela | 14,723 → 5,696 | 17,209 → 7,084 | 18,860 → 9,546 |
| Linux estresse | 21,862 → 14,251 | 37,288 → 28,881 | 54,686 → 44,426 |
| Windows sem janela | 2,210 → 1,359 | 3,538 → 2,669 | 5,840 → 5,004 |
| Windows janela | 16,820 → 16,814 | 19,474 → 19,805 | 19,962 → 20,539 |
| Windows estresse | 13,128 → 11,343 | 27,755 → 26,907 | 44,840 → 47,808 |

A janela Windows não mostra ganho consistente, e o p95 do Núcleo em estresse
Windows aumentou. Apresentação inclui aquisição/VSYNC; uma rodada por configuração
não separa todas as fontes de variação. As medições comprovam a redução de
submissões, com resultados de tempo restritos a esses percursos. A meta geral
de 60 FPS continua sem comprovação. Os tempos de cada fase host mudaram de
significado: captura/gravação são CPU, e submissão/espera ficam na apresentação;
para comparação, use quadro completo e GPU total.

Buffers/texturas residentes têm o mesmo tamanho entre variantes e o staging
observado nas cargas normais coincide. O gravador acrescenta memória CPU para
descritores, retenções e snapshots de uploads. RSS Linux e WorkingSet amostrado
Windows são métricas distintas; nenhuma delas equivale à memória privada do
driver. A [coleta com hashes](../../../benchmarks/autonomia-grafica/comandos-desempenho-2026-10-05.json)
preserva os 12 JSON/CSV e o hash comum das fontes
`af828b88771644d84fa14c224a83e2384ad911ee4a8a290d72680e293e6f30f5`.
Os relatórios de 4/10 acima continuam históricos, atribuídos às suas fontes.

Cena geral de 768 pixels e campanha com duas poses de 64.000 pixels por mapa
coincidem exatamente entre imediato e agrupado em O0/O2 nas duas plataformas.
Transparências preservam ordem, empates e mistura de vidro/efeitos. SDKs/CMake,
pacotes sem Node/LLVM e replay de 360 estados também passaram; o
[recibo GA003](../../../benchmarks/autonomia-grafica/comandos-2026-10-05.json)
registra logs, casos corrigidos e limites da verificação desktop.

### Desktop e distribuição

Os quatro pacotes O2 passaram na janela real: SDL e GPU em Linux/WSLg e
Windows. Cada executável foi iniciado de um diretório temporário, com PATH
restrito ao sistema e sem `LD_LIBRARY_PATH`, usando bibliotecas e recursos
locais. Foram enviados comandos de início, movimento, salto, agachamento,
câmera, armas, minimapa, mapa/andares, portas, pausa/foco, reinício, opções
e mapa técnico, seguidos de encerramento limpo. O campo `relativeMouse`
registra ausência de erro na solicitação de captura, sem provar a trajetória
do mouse. O recibo de produção verifica janela/entrada/saída; não observa
o estado interno da partida. As respostas da simulação são cobertas pelos
testes nativos e replay.

O adaptador SDL instrumentado registrou 21 quadros no Linux e 343 no Windows,
com capturas `desktop.bmp`. A captura Linux foi inspecionada: cena, menu e
HUD apresentados. Isso confirma o laço gráfico; não é avaliação humana
da jogabilidade. Os dois testes de áudio real rejeitaram dummy/disk e passaram:
PulseAudio com 28.908 frames processados e WASAPI com 28.800. Não houve
avaliação da qualidade audível, panorâmica percebida, música ou sincronismo
percebido da TV; os contratos e pausas foram verificados automaticamente.

| Artefato | Caminho relativo a `jogos/fps-tom/` |
| --- | --- |
| Pacotes SDL | `build/<linux|windows>/package/fps-tom/` |
| Pacotes GPU | `build/<linux|windows>/package/gpu/fps-tom-gpu/` |
| Recibos de produção | `build/<linux|windows>/package/verification.json` e `package/gpu/verification.json` |
| Trace, captura e recibo SDL | `build/<linux|windows>/desktop/` |
| Evidência consolidada | [validacao-3d-2026-10-04.json](../benchmarks/validacao-3d-2026-10-04.json) |

Os manifestos SDL incluem imagem CPU e não requerem runtime/shaders/toolchain
GPU. Os pacotes GPU incluem seus módulos e dependências próprios. Os builds
incluem recursos, licenças, LEIA-ME, documentação e relatórios. CI preserva
SDL e acrescenta GPU/3D Mesa/Xvfb Linux; configuração validada localmente,
sem execução remota nesta entrega. Os testes do editor verificam análise,
realce e diagnósticos; não incluem uma sessão interativa do VS Code.

Precisão de colisão, passo fixo e regras de combate permanecem constantes.

Fora desta entrega: rede, salvamento persistente, editor visual, destruição arbitrária, animação esquelética, codecs em execução e sombras dinâmicas detalhadas.
