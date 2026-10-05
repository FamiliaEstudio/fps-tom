'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run,eq}=require('./helpers');
const fl=n=>Number.isInteger(n)?n+'.0':String(n);
for(const optimize of ['-O0','-O2'])test(`light library preserves frozen FPS priority, distance, ties, margin and RGB ${optimize}`,()=>{
  let s=`Importar[l'../src/cena3d.tom']
Importar[l'tom/luzes3d']
Importar[l'./lights-reference.tom']
DefArraySoAxAntigasxFpsLuzx32
DefArraySoAxNovasxLuz3Dx32
DefVarRegistro<ReferenciaFpsLuzes3D>xAyPadrao
DefVarRegistro<Luzes3DSelecao>xByPadrao
DefVarVec4<Fl32>xCAy[0.0,0.0,0.0,0.0]
DefVarVec4<Fl32>xCBy[0.0,0.0,0.0,0.0]
`;
  for(const state of ['empty','populated']){
    if(state==='populated')for(let i=0;i<32;i++){
      const values={ativa:i%4===0?'Falso':'Verdadeiro',prioridade:i===1?-2147483648:i===31?2147483647:i%5-2,px:fl(i%4-1.5),py:fl(i%3-1),pz:fl((i%5)*.25),raio:fl(1+(i%4)/2),r:fl((i%3)/4),g:fl((i%5)/8),b:fl((i%7)/8)};
      for(const target of ['Antigas','Novas'])for(const [f,v] of Object.entries(values))s+=`SetVar${f==='ativa'?'Bl':f==='prioridade'?'InSd32':'Fl64'}x${target}@${i}.${f}y${v}\n`;
    }
    for(const p of [[0,0,0],[.5,-.25,.75],[20,10,-5]])for(const margin of [0,.5,100]){
      const point='['+p.map(fl)+']';
      s+=`ChamarxReferenciaFps3DLuzesSelecionar[${point},${fl(margin)},@Antigas]yA\nChamarxLuzes3DSelecionar[${point},${fl(margin)},@Novas,8]yB\n`+eq('@A.quantidade','@B.quantidade');
      for(let i=0;i<8;i++)s+=eq('@A.id'+i,'@B.id'+i,'InSd64');
      for(const q of [point,'[0.25,0.0,0.5]'])s+=`ChamarxReferenciaFps3DLuzCorSelecionada[${q},[0.1,0.2,0.3,0.7],@Antigas,@A]yCA\nChamarxLuzes3DCorSelecionada[${q},[0.1,0.2,0.3,0.7],@Novas,@B]yCB\n`+eq('@CA','@CB','Vec4<Fl32>');
    }
  }
  s+="GerarTxtxl'luzes-equivalentes'";
  assert.equal(run(s,optimize,{buildTimeout:120000}).stdout,'luzes-equivalentes');
});
