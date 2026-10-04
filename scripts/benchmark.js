'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication,command}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..');
function main(){
  const desktop=process.argv.includes('--desktop'),stress=process.argv.includes('--stress');
  const directory=path.join(app,'build','benchmark'),file=path.join(directory,'benchmark.tom');fs.mkdirSync(directory,{recursive:true});
  const source=`Importar[l'../../src/painel.tom']
Importar[l'../../src/simulacao.tom']
DefRecursoxJyJanelaCriar[l'FPS Tom - benchmark',960,600]
JanelaAreaLogica[@J,320,200]
DefRecursoxEyEventoCriar[]
DefRecursoxAyVisualImagemCarregar[@J,l'atlas.png']
DefRecursoxGrandeyFonteCarregar[18]
DefRecursoxPequenayFonteCarregar[9]
DefRecursoxCatalogoyCatalogoVisualCriar[@J,32]
DefArraySoAxDigitosxFpsDigitox10
DefVarRegistro<FpsRotulos>xRotulosyPadrao
ChamarxFpsRotulosCriar[@Catalogo,@Grande,@Pequena,@Rotulos,@Digitos]
DefArraySoAxMapaxFpsCelulax1024
DefArraySoAxEntidadesxFpsEntidadex32
DefArraySoAxColunasxFpsColunax320
DefArraySoAxSpritesxFpsSpritex32
DefVarRegistro<FpsEstado>xEstadoyPadrao
ChamarxFpsIniciar[@Estado,@Mapa,@Entidades]
${stress?`ParaIndiceSOAxI[@Mapa]
SetVarInSd32xMapa@@I.materialy0
FimPara
ParaxI[0,16,1]
InSd64ParaFl64[@I]
MultixyFl64x@ULTIMOy0.09
SomarxyFl64x@ULTIMOy4.0
DefVarFl64xPXy@ULTIMO
InSd64ParaFl64[@I]
MultixyFl64x@ULTIMOy0.08
SomarxyFl64x@ULTIMOy1.9
ChamarxFpsEntidadeCriar[@Entidades,@I,1,@PX,@ULTIMO]
FimPara`:''}
DefStkFB64CxTextoyl''
ParaxFrame[0,260,1]
InSd64ParaFl64[@Frame]
MultixyFl64x@ULTIMOy0.02
SenoFl64[@ULTIMO]
MultixyFl64x@ULTIMOy0.25
SetVarFl64xEstado.anguloy@ULTIMO
TempoAgoraNs[]
DefVarInSd64xInicioy@ULTIMO
ChamarxFpsProjetar[@Mapa,@Estado,@Entidades,@Colunas,@Sprites]
TempoAgoraNs[]
DefVarInSd64xCalculoFimYy@ULTIMO
ChamarxFpsCenario[@J,@A,@Colunas,Verdadeiro]
ChamarxFpsDesenharSprites[@J,@A,@Colunas,@Sprites]
ChamarxFpsArma[@J,@A,@Estado]
ChamarxFpsPainel[@J,@Catalogo,@Digitos,@Rotulos,@Estado,Falso,0,0]
TempoAgoraNs[]
DefVarInSd64xDesenhoFimYy@ULTIMO
JanelaApresentar[@J]
TempoAgoraNs[]
DefVarInSd64xFimYy@ULTIMO
CompararMaiorIgualxyInSd64x@Framey20
Sex@ULTIMO
SubtrxyInSd64x@CalculoFimYy@Inicio
InSd64ParaTexto[@ULTIMO,@Texto]
GerarTxtxTexto
GerarTxtxl','
SubtrxyInSd64x@DesenhoFimYy@CalculoFimY
InSd64ParaTexto[@ULTIMO,@Texto]
GerarTxtxTexto
GerarTxtxl','
SubtrxyInSd64x@FimYy@DesenhoFimY
InSd64ParaTexto[@ULTIMO,@Texto]
GerarTxtxTexto
GerarTxtxl'\n'
FimSe
DefVarBlxDisponivelyVerdadeiro
Enquantox@Disponivel
EventoConsultar[@J,@E]
SetVarBlxDisponively@ULTIMO
FimEnquanto
FimPara`;
  // Keep Tom's escaped newline literal rather than embedding a command newline.
  fs.writeFileSync(file,source.replace("GerarTxtxl'\n'","GerarTxtxl'\\n'"));
  const compiled=compileResolved(fs.readFileSync(file,'utf8'),{file});assert.ok(compiled.success,JSON.stringify(compiled.diagnostics));
  const binary=buildApplication(compiled,file,path.join(directory,'package'),{optimize:'-O2',assets:path.join(app,'assets')});
  const env={...process.env,SDL_RENDER_DRIVER:'software'};
  for(const name of ['TOM_UI_EVENTS','TOM_UI_SNAPSHOT','TOM_UI_TRACE','LD_LIBRARY_PATH'])delete env[name];
  if(desktop)delete env.SDL_VIDEODRIVER;else env.SDL_VIDEODRIVER='dummy';
  const result=command(binary,[],{env,cwd:os.tmpdir(),timeout:60000});
  const rows=result.stdout.trim().split(/\r?\n/).map(line=>line.split(',').map(Number));assert.equal(rows.length,240);assert.ok(rows.every(r=>r.length===3&&r.every(n=>Number.isFinite(n)&&n>=0)));
  const stats=values=>{const sorted=values.map(n=>n/1e6).sort((a,b)=>a-b);return{meanMs:sorted.reduce((a,b)=>a+b,0)/sorted.length,p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};};
  const report={platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logical:[320,200],window:[960,600],optimize:'O2',driver:desktop?'system desktop / software':'dummy / software',scene:stress?'16 overlapping sentinels':'level with 6 sentinels',warmup:20,frames:240,projection:stats(rows.map(r=>r[0])),drawing:stats(rows.map(r=>r[1])),presentation:stats(rows.map(r=>r[2])),total:stats(rows.map(r=>r.reduce((a,b)=>a+b,0))),time:new Date().toISOString()};
  const name=`${desktop?'desktop':'dummy'}${stress?'-stress':''}`;
  fs.writeFileSync(path.join(directory,name+'.csv'),'projectionNs,drawingNs,presentationNs\n'+rows.map(r=>r.join(',')).join('\n')+'\n');
  fs.writeFileSync(path.join(directory,name+'.json'),JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
if(require.main===module)main();
