'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run,eq}=require('./helpers'),{builtins}=require('../../../tom-lang/core/builtins');
const reference=fs.readFileSync(path.join(__dirname,'billboard-reference.tom'),'utf8');
const candidate=reference.split('DefFuncaoxReferenciaFps3DEfeitoPosicao')[0]
  .replace('ReferenciaFps3DBillboardCamera','PreparadoFps3DBillboardCamera')
  .replace(/DefVarFl64xRXy[\s\S]*?ChamarxFps3DUV/,`ChamarxBillboard3DPreparar[@P,[(-@Camera.sy),@Camera.cy,0.0],[0.0,0.0,1.0],@W,@H]
DefVarRegistro<Billboard3D>xQy@ULTIMO
DefVarVec3<Fl64>xAy@Q.a
DefVarVec3<Fl64>xBy@Q.b
DefVarVec3<Fl64>xCy@Q.c
DefVarVec3<Fl64>xDy@Q.d
ChamarxFps3DUV`);
const fl=n=>Number.isInteger(n)?n+'.0':String(n);
for(const optimize of ['-O0','-O2'])test(`FPS billboards preserve projected/clipped vertices, UV, colors and particle poses ${optimize}`,()=>{
  builtins.BillboardListasIguais={c:'tom_billboard_lists_equal',args:['BufferVec4Fl32','BufferVec4Fl32'],result:'Vazio',lib:'ui'};
  try{
    let source=`Importar[l'../src/cena3d.tom']
Importar[l'tom/particulas']
Importar[l'./billboard-reference.tom']
${candidate}
DefRecursoxAyBufferVec4Fl32Criar[256,0]
DefRecursoxByBufferVec4Fl32Criar[256,0]
DefRecursoxCyBufferVec4Fl32Criar[256,0]
DefRecursoxSAyBufferVec4Fl32Criar[60,0]
DefRecursoxSByBufferVec4Fl32Criar[60,0]
DefVarRegistro<FpsEstado>xEyPadrao
DefVarRegistro<FpsCamera3D>xCamerayPadrao
DefVarInSd64xVaziosy0
DefVarInSd64xRecortadosy0
DefVarInSd64xInteirosy0
DefVarInUd64xNy0
`;
    for(const [yaw,pitch,eye] of [[0,0,[0,0,0]],[.7,.3,[.1,-.2,.5]],[-1.1,-.4,[-.5,.7,.1]],[3.141592653589793,0,[0,0,0]]]){
      source+=`SetVarFl64xE.anguloy${fl(yaw)}\nSetVarFl64xE.inclinacaoy${fl(pitch)}\nSetVarFl64xE.pxy${fl(eye[0])}\nSetVarFl64xE.pyy${fl(eye[1])}\nSetVarFl64xE.pzy${fl(eye[2])}\nChamarxFps3DCameraPreparar[@E]yCamera\n`;
      for(const [point,w,h] of [[[4,0,-.5],1,1],[[.1,0,-.2],.8,.4],[[-4,0,0],1,1],[[3,3,-.5],2,3],[[0,0,0],0,0],[[100,0,0],1,1]]){
        source+='BufferVec4Fl32Redimensionar[@A,0]\nBufferVec4Fl32Redimensionar[@B,0]\nBufferVec4Fl32Redimensionar[@C,0]\n';
        for(const [fn,list] of [['ReferenciaFps3DBillboardCamera','A'],['PreparadoFps3DBillboardCamera','B'],['Fps3DBillboardCamera','C']])source+=`Chamarx${fn}[[${point.map(fl)}],${fl(w)},${fl(h)},28,[0.2,0.4,0.6,0.8],@Camera,@${list},@SA,@SB]\n`;
        source+=`BillboardListasIguais[@A,@B]
BillboardListasIguais[@A,@C]
BufferVec4Fl32Comprimento[@A]
SetVarInUd64xNy@ULTIMO
CompararIgualxyInUd64x@Ny0
Sex@ULTIMO
SetVarInSd64xVaziosy(@Vazios+1)
FimSe
CompararIgualxyInUd64x@Ny18
Sex@ULTIMO
SetVarInSd64xInteirosy(@Inteiros+1)
FimSe
CompararMaiorxyInUd64x@Ny18
Sex@ULTIMO
SetVarInSd64xRecortadosy(@Recortados+1)
FimSe
`;
      }
    }
    for(const name of ['Vazios','Inteiros','Recortados'])source+=`CompararMaiorxyInSd64x@${name}y0\nExigir[@ULTIMO]\n`;
    source+=`DefArraySoAxEfeitosxFpsEfeitox1
SetVarFl64xEfeitos@0.anteriorXy1.2
SetVarFl64xEfeitos@0.anteriorYy-2.5
SetVarFl64xEfeitos@0.anteriorZy0.7
SetVarFl64xEfeitos@0.pxy4.1
SetVarFl64xEfeitos@0.pyy3.4
SetVarFl64xEfeitos@0.pzy-1.2
DefVarVec3<Fl64>xAntesy[0.0,0.0,0.0]
DefVarVec3<Fl64>xAtualy[0.0,0.0,0.0]
DefVarRegistro<EfeitoVisual3D>xVisualyPadrao
DefVarFl32xFadey0.0
`;
    for(const alpha of [-.5,0,.5,1,1.5])for(const life of [0,1,2147483647]){
      source+=`ChamarxReferenciaFps3DEfeitoPosicao[@Efeitos,0,${fl(alpha)}]yAntes
ChamarxFps3DEfeitoPosicao[@Efeitos,0,${fl(alpha)}]yAtual
ChamarxEfeito3DPreparar[[Efeitos@0.anteriorX,Efeitos@0.anteriorY,Efeitos@0.anteriorZ],[Efeitos@0.px,Efeitos@0.py,Efeitos@0.pz],${fl(alpha)},0.4,${life},2147483647,[1.0,1.0,1.0,1.0],[0.0,0.0,1.0]]yVisual
${eq('@Antes','@Atual','Vec3<Fl64>')}${eq('@Antes','@Visual.posicao','Vec3<Fl64>')}
SetVarFl64xAntes.zy(@Antes.z-0.4*0.5)
${eq('@Antes','@Visual.base','Vec3<Fl64>')}
InSd32ParaFl32[${life}]yFade
InSd32ParaFl32[2147483647]
SetVarFl32xFadey(@Fade/@ULTIMO)
${eq('@Fade','@Visual.cor.w','Fl32')}`;
    }
    source+="GerarTxtxl'billboards e particulas equivalentes'";
    const r=run(source,optimize,{nativeSources:[path.resolve(__dirname,'../../../tom-lang/tests/graphics-particles-runtime.c')],buildTimeout:120000});
    assert.equal(r.stdout,'billboards e particulas equivalentes');
  }finally{delete builtins.BillboardListasIguais;}
});
