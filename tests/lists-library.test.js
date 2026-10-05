'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {run,eq}=require('./helpers'),{builtins}=require('../../../tom-lang/core/builtins');
for(const optimize of ['-O0','-O2'])test(`draw lists and stable transparency match frozen FPS bytes, groups and offsets ${optimize}`,()=>{
 builtins.ListasIguais={c:'tom_lists_equal',args:['BufferVec4Fl32','BufferVec4Fl32'],result:'Vazio',lib:'numeric_buffer'};
 try{
  let s=`Importar[l'../src/lotes3d.tom']
Importar[l'../src/transparencias3d.tom']
Importar[l'./lotes3d-reference.tom']
Importar[l'./transparencias3d-reference.tom']
Importar[l'./lotes-candidate.tom']
Importar[l'tom/composicao3d']
DefRecursoxAyBufferVec4Fl32Criar[4608,0]
DefRecursoxByBufferVec4Fl32Criar[4608,0]
DefRecursoxHudyBufferVec4Fl32Criar[3,3]
DefRecursoxVazioyBufferVec4Fl32Criar[0,0]
DefRecursoxAntigayBufferVec4Fl32Criar[9216,0]
DefRecursoxAtualyBufferVec4Fl32Criar[9216,0]
DefRecursoxPreparadayBufferVec4Fl32Criar[9216,0]
DefRecursoxSAyBufferVec4Fl32Criar[9216,0]
DefRecursoxSByBufferVec4Fl32Criar[9216,0]
DefRecursoxSCyBufferVec4Fl32Criar[9216,0]
DefRecursoxLAyBufferVec4Fl32Criar[18435,0]
DefRecursoxLByBufferVec4Fl32Criar[18435,0]
DefRecursoxLCyBufferVec4Fl32Criar[18435,0]
DefVarRegistro<ReferenciaFps3DLotes>xRAyPadrao
DefVarRegistro<Fps3DLotes>xRByPadrao
DefVarRegistro<Fps3DLotes>xRCyPadrao
DefVarInSd64xInicy0
DefVarInSd64xFimy0
DefVarInSd32xModoy0
BufferVec4Fl32Gravar[@Hud,0,[1.0,2.0,3.0,4.0]]
`;
  for(const n of [0,1,7,512,2,0]){
   s+=`BufferVec4Fl32Redimensionar[@A,${n*9}]
BufferVec4Fl32Redimensionar[@B,${n*9}]
ParaxI[0,${n},1]
DefVarInSd64xRestoy(@I-(@I/8)*8)
InSd64ParaFl32[(@Resto+1)]
DefVarFl32xWy@ULTIMO
InSd64ParaFl32[@I]
DefVarFl32xIDy@ULTIMO
ParaxJ[0,9,3]
InSd64ParaInUd64[(@I*9+@J)]
DefVarInUd64xKy@ULTIMO
BufferVec4Fl32Gravar[@A,@K,[1.0,2.0,3.0,@W]]
BufferVec4Fl32Gravar[@A,(@K+1),[0.25,0.75,8.0,9.0]]
BufferVec4Fl32Gravar[@A,(@K+2),[@ID,0.0,0.0,0.5]]
BufferVec4Fl32Gravar[@B,@K,[4.0,5.0,6.0,@W]]
BufferVec4Fl32Gravar[@B,(@K+1),[0.75,0.25,10.0,11.0]]
BufferVec4Fl32Gravar[@B,(@K+2),[(@ID+512.0),0.0,0.0,0.5]]
FimPara
FimPara
ChamarxReferenciaFps3DMisturaPreparar[@A,@B,@Antiga,@SA]
ChamarxFps3DMisturaPreparar[@A,@B,@Atual,@SB]
ChamarxComposicao3DPreparar[@A,@B,@Preparada,@SC]
ListasIguais[@Antiga,@Atual]
ListasIguais[@Antiga,@Preparada]
ChamarxReferenciaFps3DLotesPreparar[@A,@Vazio,@B,@Antiga,@Hud,@LA]yRA
ChamarxFps3DLotesPreparar[@A,@Vazio,@B,@Atual,@Hud,@LB]yRB
ChamarxCandidatoFps3DLotesPreparar[@A,@Vazio,@B,@Preparada,@Hud,@LC]yRC
ListasIguais[@LA,@LB]
ListasIguais[@LA,@LC]
`;
   for(const field of ['opaco','tv','mascara','mistura','hud','nOpaco','nTV','nMascara','nMistura','nHud','total'])s+=eq('@RA.'+field,'@RB.'+field,'InUd64')+eq('@RA.'+field,'@RC.'+field,'InUd64');
   s+=`SetVarInSd64xInicy0
EnquantoxVerdadeiro
CompararMaiorIgualxyInSd64x@Inicy${n*18}
Sex@ULTIMO
Interromper
FimSe
ChamarxReferenciaFps3DMisturaModo[@Antiga,@Inic]yModo
ChamarxComposicao3DModo[@Preparada,@Inic]
${eq('@ULTIMO','@Modo')}
ChamarxReferenciaFps3DMisturaGrupoFim[@Antiga,@Inic,${n*18},@Modo]yFim
ChamarxComposicao3DGrupoFim[@Preparada,@Inic,${n*18},@Modo]
${eq('@ULTIMO','@Fim','InSd64')}
SetVarInSd64xInicy@Fim
FimEnquanto
`;
  }
  s+="GerarTxtxl'listas-compostas-equivalentes'";
  assert.equal(run(s,optimize,{buildTimeout:120000,nativeSources:[path.resolve(__dirname,'../../../tom-lang/tests/graphics-lists-runtime.c')]}).stdout,'listas-compostas-equivalentes');
 }finally{delete builtins.ListasIguais;}
});
