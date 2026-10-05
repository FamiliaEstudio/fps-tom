'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,root}=require('./helpers');
const {gpuReady}=require('../../../scripts/setup-gpu');
const ready=gpuReady(),skip=!ready&&'Toolchain GPU opcional nao preparada.';
for(const optimize of ['-O0','-O2'])test(`SDL e GPU preservam os mapas, portas e HUD ${optimize}`,{skip},()=>{
  const {builtins}=require('../../../tom-lang/core/builtins');
  builtins.CompararQuadroFPS={c:'fps_compare_frame',args:['Janela','BufferInUd32'],result:'Vazio',lib:'ui'};
  try {
    const source=`Importar[l'../src/simulacao.tom']
Importar[l'../src/hud.tom']
Importar[l'../src/render-gpu.tom']
DefRecursoxJyJanelaCriar[l'Comparacao',320,200]
JanelaAreaLogica[@J,320,200]
DefRecursoxAyVisualImagemCarregar[@J,l'atlas.png']
DefRecursoxGyGPUCriar[Falso]
DefRecursoxTyGPUImagemCarregar[@G,l'atlas.png']
GPUAlvoLargura[@T]
CompararIgualxyInUd32x@ULTIMOy1024
Exigir[@ULTIMO]
GPUAlvoAltura[@T]
CompararIgualxyInUd32x@ULTIMOy512
Exigir[@ULTIMO]
DefRecursoxMyMaterialGPUxGPUSpriteOriginal[@G,@T,0,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxCenayGPUAlvoCriar[@G,320,176]
DefRecursoxFinalyGPUAlvoCriar[@G,320,200]
DefRecursoxCompositoryMaterialGPUxGPUSpriteOriginal[@G,@Cena,2,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxRectCPUyBufferVec4Fl32Criar[1,1]
BufferVec4Fl32Gravar[@RectCPU,0,[160.0,88.0,320.0,176.0]]
DefRecursoxRectGPUyBufferGPUVec4Fl32Criar[@G,1,1]
ChamarxFpsEnviarLista[@RectGPU,@RectCPU]
DefRecursoxListayBufferVec4Fl32Criar[65536,0]
DefRecursoxHudyBufferVec4Fl32Criar[4096,0]
DefRecursoxBufferGPUyBufferGPUVec4Fl32Criar[@G,65536,0]
DefRecursoxPixelsyBufferInUd32Criar[64000,64000]
DefArraySoAxMapaxFpsCelulax1024
DefArraySoAxEntidadesxFpsEntidadex64
DefArraySoAxColunasxFpsColunax320
DefArraySoAxSpritesxFpsSpritex64
DefVarRegistro<FpsEstado>xEstadoyPadrao
ParaxN[0,3,1]
InSd64ParaInSd32[@N]
ChamarxFpsNivelCarregar[@ULTIMO,@Estado,@Mapa,@Entidades]
// Camera voltada para uma porta parcialmente aberta, nos tres temas.
SetVarFl64xEstado.pxy6.0
SetVarFl64xEstado.pyy3.5
CompararIgualxyInSd64x@Ny1
Sex@ULTIMO
SetVarFl64xEstado.pxy11.0
SetVarFl64xEstado.pyy5.5
FimSe
CompararIgualxyInSd64x@Ny2
Sex@ULTIMO
SetVarFl64xEstado.pxy9.0
SetVarFl64xEstado.pyy5.5
FimSe
ParaIndiceSOAxI[@Mapa]
SexMapa@@I.porta
SetVarFl64xMapa@@I.aberturay0.5
FimSe
FimPara
SetVarBlxEstado.chaveAzulyVerdadeiro
SetVarBlxEstado.chaveVermelhayVerdadeiro
ChamarxFpsProjetar[@Mapa,@Estado,@Entidades,@Colunas,@Sprites]
ChamarxFpsCenaLista[@Lista,@Colunas,@Sprites,@Estado,Verdadeiro]
ChamarxFpsHudLista[@Hud,@Mapa,@Estado,Falso,0,0]
JanelaRecorte[@J,0,0,320,176]
ChamarxFpsListaSDL[@J,@A,@Lista]
JanelaSemRecorte[@J]
ChamarxFpsListaSDL[@J,@A,@Hud]
ChamarxFpsEnviarLista[@BufferGPU,@Lista]
EscopoInixCena
DefRecursoxDyGPUDesenharSpritesAtlas[@Cena,@BufferGPU,@M]
GPUTrabalhoAguardar[@D]
DefRecursoxCyGPUDesenharSprites[@Final,@RectGPU,@Compositor]
GPUTrabalhoAguardar[@C]
EscopoFimxCena
ChamarxFpsEnviarLista[@BufferGPU,@Hud]
EscopoInixHud
DefRecursoxDyGPUDesenharSpritesAtlas[@Final,@BufferGPU,@M]
GPUTrabalhoAguardar[@D]
DefRecursoxRyGPUAlvoReceber[@Final,@Pixels]
GPUTrabalhoAguardar[@R]
CompararQuadroFPS[@J,@Pixels]
EscopoFimxHud
FimPara
// Oclusao e abertura sao comparadas exatamente dentro do mesmo backend.
ChamarxFpsNivelCarregar[0,@Estado,@Mapa,@Entidades]
SetVarFl64xEstado.pxy6.0
SetVarFl64xEstado.pyy3.5
SetVarFl64xEstado.anguloy0.0
ParaIndiceSOAxI[@Entidades]
SetVarBlxEntidades@@I.ativayFalso
FimPara
DefRecursoxAnteriorPixelsyBufferInUd32Criar[56320,56320]
DefRecursoxAtualPixelsyBufferInUd32Criar[56320,56320]
ParaxCaso[0,4,1]
SetVarFl64xMapa@103.aberturay0.0
CompararMaiorIgualxyInSd64x@Casoy2
Sex@ULTIMO
SetVarFl64xMapa@103.aberturay0.75
FimSe
SetVarBlxEntidades@0.ativayFalso
CompararIgualxyInSd64x@Casoy1
DefVarBlxComInimigoy@ULTIMO
CompararIgualxyInSd64x@Casoy3
OuxyBlx@ULTIMOy@ComInimigo
SetVarBlxComInimigoy@ULTIMO
Sex@ComInimigo
ChamarxFpsEntidadeCriar[@Entidades,0,1,8.5,3.5]
FimSe
ChamarxFpsProjetar[@Mapa,@Estado,@Entidades,@Colunas,@Sprites]
ChamarxFpsCenaLista[@Lista,@Colunas,@Sprites,@Estado,Verdadeiro]
ChamarxFpsEnviarLista[@BufferGPU,@Lista]
EscopoInixOclusao
DefRecursoxDyGPUDesenharSpritesAtlas[@Cena,@BufferGPU,@M]
GPUTrabalhoAguardar[@D]
DefRecursoxRyGPUAlvoReceber[@Cena,@AtualPixels]
GPUTrabalhoAguardar[@R]
EscopoFimxOclusao
Sex@ComInimigo
DefVarBlxIgualyVerdadeiro
ParaxI[0,56320,1]
InSd64ParaInUd64[@I]
DefVarInUd64xIndicePixely@ULTIMO
BufferInUd32Ler[@AnteriorPixels,@IndicePixel]
DefVarInUd32xPixelAntesy@ULTIMO
BufferInUd32Ler[@AtualPixels,@IndicePixel]
CompararDiferentexyInUd32x@PixelAntesy@ULTIMO
Sex@ULTIMO
SetVarBlxIgualyFalso
FimSe
FimPara
CompararIgualxyInSd64x@Casoy1
CompararIgualxyBlx@Igualy@ULTIMO
Exigir[@ULTIMO]
Senao
BufferInUd32Copiar[@AtualPixels,0,@AnteriorPixels,0,56320]
FimSe
FimPara
GerarTxtxl'quadros-ok'`;
    assert.equal(run(source,optimize,{environment:{SDL_VIDEODRIVER:'offscreen',SDL_RENDER_DRIVER:'software'},nativeSources:[path.join(__dirname,'render-compare.c')],buildTimeout:120000}).stdout,'quadros-ok');
  }finally{delete builtins.CompararQuadroFPS;}
});
for(const optimize of ['-O0','-O2'])test(`aplicacao GPU: entrada, pausa e limpeza ${optimize}`,{skip:skip||(!(process.env.DISPLAY||process.platform==='win32')&&'Sem display real para JanelaGPU.')},()=>{
  const file=path.join(root,'src/fps-tom-gpu.tom');
  const r=run(fs.readFileSync(file,'utf8'),optimize,{file,environment:{SDL_VIDEODRIVER:process.platform==='win32'?'windows':'x11',SDL_AUDIODRIVER:'dummy'},events:'key 13\nwait 100\nkey 32\nrelative 480 300 15 -20\nkey 101\nwait 100\nkey 9\nkey 9\nkey 1073741884\nkey 27\nfocuslost\nfocusgain\nkey 13\nkey 114\nquit\n',buildTimeout:120000,maximumLiveObjects:256});
  assert.doesNotMatch(r.stdout,/Erro|Falha|RESOURCE/);
});
