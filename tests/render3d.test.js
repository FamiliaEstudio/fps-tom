'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {run}=require('./helpers');
const {gpuReady}=require('../../../scripts/setup-gpu');
const skip=!gpuReady()&&'Toolchain GPU opcional não preparada.';
const eq=(t,a,b)=>`CompararIgualxy${t}x${a}y${b}\nExigir[@ULTIMO]`;
const emit=(p0,p1,p2,color,uv0='[0.0,0.0,0.0,0.0]',uv1='[1.0,0.0,0.0,0.0]',uv2='[0.0,1.0,0.0,0.0]')=>`ChamarxClip3DTrianguloComScratch[${p0},${uv0},${color},${p1},${uv1},${color},${p2},${uv2},${color},@Lista,@ScratchA,@ScratchB]`;
const quad=(x0,y0,x1,y1,z,c)=>emit(`[${x0},${y0},${z},1.0]`,`[${x1},${y0},${z},1.0]`,`[${x1},${y1},${z},1.0]`,c,'[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]')+'\n'+emit(`[${x0},${y0},${z},1.0]`,`[${x1},${y1},${z},1.0]`,`[${x0},${y1},${z},1.0]`,c,'[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]');
const submit=(mode,material)=>`BufferVec4Fl32Comprimento[@Lista]
BufferGPUVec4Fl32Redimensionar[@GPULista,@ULTIMO]
EscopoInixTransferencia
DefRecursoxEnviar yBufferGPUVec4Fl32Enviar[@GPULista,@Lista]
GPUTrabalhoAguardar[@Enviar]
EscopoFimxTransferencia
ChamarxRaster3DTriangulos[@Lista,@AtlasCPU,2,2,@Software,@Profundidade,320,176,${mode}]
EscopoInixDesenho
DefRecursoxDyGPUDesenharTriangulos[@Cena,@GPULista,@${material}]
GPUTrabalhoAguardar[@D]
EscopoFimxDesenho`.replace('xEnviar y','xEnviary');
for(const optimize of ['-O0','-O2']) test(`3D SDL/GPU: camera vertical, near, passarela, profundidade e HUD ${optimize}`,{skip},()=>{
 const {builtins}=require('../../../tom-lang/core/builtins');
 builtins.CompararCena3D={c:'fps_3d_compare',args:['BufferInUd32','BufferInUd32','InUd32','InUd32'],result:'Vazio',lib:'numeric_buffer'};
 try {
 const source=`Importar[l'tom/camera3d']
Importar[l'tom/raster3d']
Importar[l'tom/gpu2d']
DefRecursoxGyGPUCriar[Falso]
DefRecursoxAtlasCPUyBufferInUd32Criar[4,4]
BufferInUd32Gravar[@AtlasCPU,0,4294967295]
BufferInUd32Gravar[@AtlasCPU,1,4278255360]
BufferInUd32Gravar[@AtlasCPU,2,4294901760]
BufferInUd32Gravar[@AtlasCPU,3,2147483903]
DefRecursoxAtlasyGPUAlvoCriar[@G,2,2]
EscopoInixTextura
DefRecursoxEyGPUAlvoEnviar[@Atlas,@AtlasCPU]
GPUTrabalhoAguardar[@E]
EscopoFimxTextura
DefRecursoxOpacoyMaterialGPU3DxGPUSpriteOriginal[@G,@Atlas,0,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxRecortadoyMaterialGPU3DxGPUSpriteOriginal[@G,@Atlas,1,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxAlphayMaterialGPU3DxGPUSpriteOriginal[@G,@Atlas,2,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxAditivoyMaterialGPU3DxGPUSpriteOriginal[@G,@Atlas,3,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxCenayGPUAlvo3DCriar[@G,320,176]
DefRecursoxFinalyGPUAlvoCriar[@G,320,200]
DefRecursoxLista yBufferVec4Fl32Criar[1024,0]
DefRecursoxScratchAyBufferVec4Fl32Criar[60,0]
DefRecursoxScratchByBufferVec4Fl32Criar[60,0]
DefRecursoxGPULista yBufferGPUVec4Fl32Criar[@G,1024,0]
DefRecursoxSoftwareyBufferInUd32Criar[56320,56320]
DefRecursoxProfundidadeyBufferFl32Criar[56320,56320]
DefRecursoxReadbackyBufferInUd32Criar[56320,56320]
DefRecursoxAntesCPUyBufferInUd32Criar[56320,56320]
DefRecursoxAntesGPUyBufferInUd32Criar[56320,56320]
DefRecursoxFinalCPUyBufferInUd32Criar[64000,64000]
DefRecursoxFinalGPUyBufferInUd32Criar[64000,64000]
DefRecursoxCompositoryMaterialGPUxGPUSpriteOriginal[@G,@Cena,2,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxHudMaterialyMaterialGPUxGPUSpriteOriginal[@G,@Atlas,2,Falso,[0.0,0.0,0.5,0.5]]
DefRecursoxRectyBufferVec4Fl32Criar[1,1]
BufferVec4Fl32Gravar[@Rect,0,[160.0,88.0,320.0,176.0]]
DefRecursoxGPUComposicaoyBufferGPUVec4Fl32Criar[@G,1,1]
EscopoInixRectUpload
DefRecursoxEyBufferGPUVec4Fl32Enviar[@GPUComposicao,@Rect]
GPUTrabalhoAguardar[@E]
EscopoFimxRectUpload
DefRecursoxHudyBufferVec4Fl32Criar[3,3]
BufferVec4Fl32Gravar[@Hud,0,[160.0,188.0,320.0,24.0]]
BufferVec4Fl32Gravar[@Hud,1,[0.0,0.0,1.0,1.0]]
BufferVec4Fl32Gravar[@Hud,2,[0.25,0.5,0.75,1.0]]
DefRecursoxGPUHudyBufferGPUVec4Fl32Criar[@G,3,3]
EscopoInixHudUpload
DefRecursoxEyBufferGPUVec4Fl32Enviar[@GPUHud,@Hud]
GPUTrabalhoAguardar[@E]
EscopoFimxHudUpload
ParaxCaso[0,3,1]
ChamarxRaster3DLimpar[@Software,@Profundidade,4280161290]
EscopoInixLimpeza
DefRecursoxLyGPUAlvo3DLimpar[@Cena,[0.039215686,0.078431372,0.117647059,1.0],1.0]
GPUTrabalhoAguardar[@L]
FimFuncao
EscopoFimxLimpeza
BufferVec4Fl32Redimensionar[@Lista,0]
// Passarela sobre piso visivel: a superficie superior oclui somente sua area.
${quad('-0.75','-0.65','0.75','0.65','0.8','[0.2,0.5,0.3,1.0]')}
${quad('-0.85','0.2','0.85','0.5','0.25','[0.8,0.55,0.2,1.0]')}
// Triangulo que cruza o near plane; clipping interpola UV e cor.
${emit('[-0.95,-0.6,-0.2,1.0]','[-0.15,-0.75,0.45,1.0]','[-0.2,0.7,0.3,1.0]','[1.0,1.0,1.0,1.0]')}
// W distintos detectam o erro de UV affine.
${emit('[0.2,-0.8,0.5,1.0]','[1.9,-1.6,1.0,2.0]','[0.5,2.8,2.0,4.0]','[1.0,1.0,1.0,1.0]')}
// Camera Z-up: tres inclinacoes projetam a mesma parede.
DefVarFl32xPitchy0.0
CompararIgualxyInSd64x@Casoy1
Sex@ULTIMO
SetVarFl32xPitchy0.4
FimSe
CompararIgualxyInSd64x@Casoy2
Sex@ULTIMO
SetVarFl32xPitchy-0.4
FimSe
DefVarVec3<Fl32>xDirecaoy[0.0,0.0,0.0]
ChamarxCamera3DFl32Direcao[0.0,@Pitch]yDirecao
DefVarRegistro<Matriz4Fl32>xViewyPadrao
DefVarRegistro<Matriz4Fl32>xProj yPadrao
DefVarRegistro<Matriz4Fl32>xVPyPadrao
ChamarxCamera3DFl32Olhar[[0.0,0.0,0.0],@Direcao,[0.0,0.0,1.0]]yView
ChamarxCamera3DFl32Perspectiva[1.57079632679,1.818181818,0.05,100.0]yProj
ChamarxMatriz4Fl32Multiplicar[@Proj,@View]yVP
DefVarVec4<Fl32>xP0y[0.0,0.0,0.0,0.0]
DefVarVec4<Fl32>xP1y[0.0,0.0,0.0,0.0]
DefVarVec4<Fl32>xP2y[0.0,0.0,0.0,0.0]
ChamarxMatriz4Fl32Aplicar[@VP,[3.0,1.0,1.0,1.0]]yP0
ChamarxMatriz4Fl32Aplicar[@VP,[3.0,1.0,-1.0,1.0]]yP1
ChamarxMatriz4Fl32Aplicar[@VP,[3.0,-1.0,1.0,1.0]]yP2
${emit('@P0','@P1','@P2','[0.3,0.7,0.9,1.0]')}
${submit(0,'Opaco')}
BufferVec4Fl32Redimensionar[@Lista,0]
${emit('[-0.9,-0.9,0.2,1.0]','[-0.4,-0.9,0.2,1.0]','[-0.9,-0.3,0.2,1.0]','[1.0,1.0,1.0,0.4]','[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]','[0.0,0.0,0.0,0.0]')}
${submit(1,'Recortado')}
BufferVec4Fl32Redimensionar[@Lista,0]
${quad('-0.7','-0.3','0.4','0.1','0.1','[0.8,0.2,0.6,0.25]')}
${submit(2,'Alpha')}
BufferVec4Fl32Redimensionar[@Lista,0]
${quad('-0.2','-0.2','0.7','0.3','0.05','[0.0,0.6,0.2,0.15]')}
${submit(3,'Aditivo')}
EscopoInixReadback
DefRecursoxRyGPUAlvoReceber[@Cena,@Readback]
GPUTrabalhoAguardar[@R]
EscopoFimxReadback
CompararCena3D[@Software,@Readback,320,176]
// Uma parede atras de tudo nao pode alterar nenhum pixel no backend.
BufferInUd32Copiar[@Software,0,@AntesCPU,0,56320]
BufferInUd32Copiar[@Readback,0,@AntesGPU,0,56320]
BufferVec4Fl32Redimensionar[@Lista,0]
${quad('-0.5','0.25','0.5','0.4','0.9','[1.0,0.0,0.0,1.0]')}
${submit(0,'Opaco')}
EscopoInixReadbackExato
DefRecursoxRyGPUAlvoReceber[@Cena,@Readback]
GPUTrabalhoAguardar[@R]
EscopoFimxReadbackExato
ParaxI[0,56320,1]
InSd64ParaInUd64[@I]
DefVarInUd64xIdy@ULTIMO
BufferInUd32Ler[@Software,@Id]
DefVarInUd32xAy@ULTIMO
BufferInUd32Ler[@AntesCPU,@Id]
${eq('InUd32','@A','@ULTIMO')}
BufferInUd32Ler[@Readback,@Id]yA
BufferInUd32Ler[@AntesGPU,@Id]
${eq('InUd32','@A','@ULTIMO')}
FimPara
// HUD desenhado depois da cena: barra opaca preservada nos dois caminhos.
BufferInUd32Preencher[@FinalCPU,4290740288]
BufferInUd32Copiar[@Software,0,@FinalCPU,0,56320]
EscopoInixCompor
DefRecursoxCyGPUDesenharSprites[@Final,@GPUComposicao,@Compositor]
GPUTrabalhoAguardar[@C]
DefRecursoxHyGPUDesenharSpritesAtlas[@Final,@GPUHud,@HudMaterial]
GPUTrabalhoAguardar[@H]
DefRecursoxRyGPUAlvoReceber[@Final,@FinalGPU]
GPUTrabalhoAguardar[@R]
EscopoFimxCompor
CompararCena3D[@FinalCPU,@FinalGPU,320,200]
BufferInUd32Ler[@FinalGPU,63000]
DefVarVec4<Fl32>xHudPixely[0.0,0.0,0.0,0.0]
ChamarxRaster3DPixelLer[@ULTIMO]yHudPixel
CompararMaiorxyFl32x@HudPixel.xy0.24
Exigir[@ULTIMO]
CompararMenorxyFl32x@HudPixel.xy0.26
Exigir[@ULTIMO]
CompararMaiorxyFl32x@HudPixel.yy0.49
Exigir[@ULTIMO]
CompararMenorxyFl32x@HudPixel.yy0.51
Exigir[@ULTIMO]
CompararMaiorxyFl32x@HudPixel.zy0.74
Exigir[@ULTIMO]
CompararMenorxyFl32x@HudPixel.zy0.76
Exigir[@ULTIMO]
${eq('Fl32','@HudPixel.w','1.0')}
FimPara
GerarTxtxl'cenas3d-ok'`.replace('xLista y','xListay').replace('xGPULista y','xGPUListay').replace('xProj y','xProjy').replace('GPUTrabalhoAguardar[@L]\nFimFuncao','GPUTrabalhoAguardar[@L]');
 const r=run(source,optimize,{environment:{SDL_VIDEODRIVER:'offscreen'},nativeSources:[path.join(__dirname,'render3d-compare.c')],buildTimeout:120000,maximumLiveObjects:128});
 assert.equal(r.stdout,'cenas3d-ok');
 } finally {delete builtins.CompararCena3D;}
});
