'use strict';
// SDL e a fonte dos adaptadores; simulacao/projecao/listas/HUD sao modulos comuns.
// Reproduzir este arquivo evita divergencia entre entrada e lacos dos backends.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src');
function gpuInput(source){
  return source.replaceAll('RefJanela','RefJanelaGPU').replaceAll('Janelax','JanelaGPUx')
    .replaceAll('JanelaMouseRelativo[','JanelaGPUMouseRelativo[')
    .replaceAll('JanelaEventosCompletos[','JanelaGPUEventosCompletos[')
    .replaceAll('TeclaMantida[','JanelaGPUTeclaMantida[');
}
function gpuApplication(source){
  let s=source.replace("Importar[l'./entrada.tom']","Importar[l'./entrada-gpu.tom']\nImportar[l'./render-gpu.tom']");
  s=s.replace("DefRecursoxJanelayJanelaCriar[l'Bastiao | FPS Tom',960,600]\nJanelaAreaLogica[@Janela,320,200]",`DefRecursoxGPUyGPUCriar[Falso]
DefRecursoxJanelayJanelaGPUCriar[@GPU,l'Bastiao | FPS Tom GPU',960,600,Verdadeiro]`);
  s=s.replace("DefRecursoxAtlasyVisualImagemCarregar[@Janela,l'atlas.png']",`DefRecursoxAtlasyGPUImagemCarregar[@GPU,l'atlas.png']
DefRecursoxMaterialAtlasyMaterialGPUxGPUSpriteOriginal[@GPU,@Atlas,@GPUMisturaAlpha,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxCenayGPUAlvoCriar[@GPU,320,176]
DefRecursoxPosyGPUAlvoCriar[@GPU,320,176]
DefRecursoxFinalyGPUAlvoCriar[@GPU,320,200]
DefRecursoxEfeitoyMaterialGPUxFpsEfeito[@GPU,@Cena,@GPUMisturaOpaca,Falso,[0.0,0.0,1.0,1.0],Verdadeiro,0.0]
DefRecursoxCompositoryMaterialGPUxGPUSpriteOriginal[@GPU,@Pos,@GPUMisturaOpaca,Falso,[0.0,0.0,1.0,1.0]]
DefRecursoxCenaGPUyBufferGPUVec4Fl32Criar[@GPU,65536,0]
DefRecursoxHudGPUyBufferGPUVec4Fl32Criar[@GPU,4096,0]
DefRecursoxRetanguloCPUyBufferVec4Fl32Criar[1,1]
BufferVec4Fl32Gravar[@RetanguloCPU,0,[160.0,88.0,320.0,176.0]]
DefRecursoxRetanguloGPUyBufferGPUVec4Fl32Criar[@GPU,1,1]
ChamarxFpsEnviarLista[@RetanguloGPU,@RetanguloCPU]`);
  s=s.replace(/\/\/ Inicio do adaptador de desenho SDL\.[\s\S]*?\/\/ Fim do adaptador de desenho SDL\./,`// Alvos e atlas persistem; apenas instancias mudam por quadro.
EscopoInixDesenhoGPU
ChamarxFpsEnviarLista[@CenaGPU,@CenaLista]
DefRecursoxDesenharCenayGPUDesenharSpritesAtlas[@Cena,@CenaGPU,@MaterialAtlas]
GPUTrabalhoAguardar[@DesenharCena]
MaterialGPUParametroBl[@Efeito,0,@Controle.efeitos]
DefVarFl32xIntensidadeDanoy0.0
CompararMaiorxyInSd32x@Estado.danoTelay0
Sex@ULTIMO
SetVarFl32xIntensidadeDanoy0.25
FimSe
MaterialGPUParametroFl32[@Efeito,1,@IntensidadeDano]
DefRecursoxPosProcessaryGPUPosProcessar[@Pos,@Efeito]
GPUTrabalhoAguardar[@PosProcessar]
DefRecursoxComporCenayGPUDesenharSprites[@Final,@RetanguloGPU,@Compositor]
GPUTrabalhoAguardar[@ComporCena]
ChamarxFpsEnviarLista[@HudGPU,@HudLista]
DefRecursoxDesenharHudyGPUDesenharSpritesAtlas[@Final,@HudGPU,@MaterialAtlas]
GPUTrabalhoAguardar[@DesenharHud]
DefRecursoxApresentaryJanelaGPUApresentar[@Janela,@Final]
GPUTrabalhoAguardar[@Apresentar]
EscopoFimxDesenhoGPU`);
  for(const [a,b] of [['JanelaEventosCompletos','JanelaGPUEventosCompletos'],['JanelaEventosPonteiro','JanelaGPUEventosPonteiro'],['JanelaMouseRelativo','JanelaGPUMouseRelativo'],['EventoAguardarAte','JanelaGPUEventoAguardarAte'],['EventoAguardar','JanelaGPUEventoAguardar'],['EventoConsultar','JanelaGPUEventoConsultar']])s=s.replaceAll(a+'[',b+'[');
  // Substituir a espera longa depois da variante Ate evita substituir o nome duas vezes.
  s=s.replaceAll('JanelaGPUJanelaGPU','JanelaGPU');
  return s;
}
function generated(){return {'entrada-gpu.tom':gpuInput(fs.readFileSync(path.join(root,'entrada.tom'),'utf8')),'fps-raycaster-gpu.tom':gpuApplication(fs.readFileSync(path.join(root,'fps-raycaster.tom'),'utf8'))};}
function generate(){for(const [name,source] of Object.entries(generated()))fs.writeFileSync(path.join(root,name),'// Gerado por scripts/generate-renderers.js. Edite o adaptador SDL e regenere.\n'+source);}
if(require.main===module)generate();
module.exports={generated,generate};
