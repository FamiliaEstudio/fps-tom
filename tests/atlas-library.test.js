'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run,eq}=require('./helpers');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const path=require('node:path');
const imports="Importar[l'../src/cena3d.tom']\nImportar[l'./atlas-reference.tom']\nImportar[l'tom/atlas']\nImportar[l'tom/animacao']\n";
test('FPS atlas preparation keeps the SDL application free from GPU dependencies',()=>{
  const fs=require('node:fs'),file=path.resolve(__dirname,'../src/fps-tom.tom');
  const r=compileResolved(fs.readFileSync(file,'utf8'),{file});assert.equal(r.success,true,JSON.stringify(r.diagnostics));
  assert.ok(!r.artifacts.runtimeRequirements.some(name=>name.startsWith('gpu')));
});
for(const optimize of ['-O0','-O2'])test(`shared atlas/clock exactly match the frozen FPS formulas ${optimize}`,()=>{
  let source=imports+`DefVarRegistro<FpsClipe3D>xClipeyPadrao
DefVarVec4<Fl32>xAntesy[0.0,0.0,0.0,0.0]
DefVarVec4<Fl32>xDepoisy[0.0,0.0,0.0,0.0]
DefVarVec4<Fl32>xAdaptadory[0.0,0.0,0.0,0.0]
DefVarInSd64xQuadroy0
DefVarInSd64xQuadroAntesy0
ParaxTile[0,128,1]
InSd64ParaInSd32[@Tile]
DefVarInSd32xIdy@ULTIMO
ParaxI[-2,7,1]
InSd64ParaFl64[@I]
DefVarFl64xUy(@ULTIMO*0.25)
DefVarFl64xVy(1.0-@U)
ChamarxReferenciaFps3DUV[@Id,@U,@V]yAntes
ChamarxAtlasGradeUV[64,64,16,8,@Tile,@U,@V]yDepois
ChamarxFps3DUV[@Id,@U,@V]yAdaptador
`;
  for(const axis of ['x','y','z','w'])source+=eq('@Antes.'+axis,'@Depois.'+axis,'Fl32')+eq('@Antes.'+axis,'@Adaptador.'+axis,'Fl32');
  source+='FimPara\nFimPara\n';
  for(const [width,height,columns,rows,count,rate] of [[128,96,8,12,96,12],[2,1,3,1,3,6],[2,1,8,2,13,20],[1,1,1,1,1,30]]){
    for(const [field,value] of Object.entries({largura:width,altura:height,colunas:columns,linhas:rows,quadros:count,taxa:rate}))source+=`SetVarInSd64xClipe.${field}y${value}\n`;
    for(const time of [-9223372036854775808n,-1n,0n,7999n,8000n,16000n,31200n,384000n,9223372036854775807n]){
      source+=`ChamarxReferenciaFpsClipeQuadro[@Clipe,${time}]yQuadroAntes\nChamarxAnimacaoQuadro[${time},(48000/@Clipe.taxa),@Clipe.quadros,Verdadeiro]yQuadro\n`+eq('@QuadroAntes','@Quadro','InSd64');
      source+=`ChamarxFpsClipeQuadro[@Clipe,${time}]yQuadro\n`+eq('@QuadroAntes','@Quadro','InSd64');
      for(const [u,v] of [[0,0],[1,1],[.375,.625],[-.5,1.5]]){
        source+=`ChamarxReferenciaFps3DClipeUV[${u.toFixed(3)},${v.toFixed(3)},${time},@Clipe]yAntes\nChamarxAtlasGradeUV[@Clipe.largura,@Clipe.altura,@Clipe.colunas,@Clipe.linhas,@Quadro,${u.toFixed(3)},${v.toFixed(3)}]yDepois\nChamarxFps3DClipeUV[${u.toFixed(3)},${v.toFixed(3)},${time},@Clipe]yAdaptador\n`;
        for(const axis of ['x','y','z','w'])source+=eq('@Antes.'+axis,'@Depois.'+axis,'Fl32')+eq('@Antes.'+axis,'@Adaptador.'+axis,'Fl32');
      }
    }
  }
  run(source,optimize,{buildTimeout:120000});
});
