'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication,command}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..');
const print=(value,type='InSd64')=>`${type}ParaTexto[${value},@Texto]\nGerarTxtxTexto\n`;
function benchmarkSource({renderer='sdl',desktop=false,stress=false}){
  const gpu=renderer==='gpu',source=fs.readFileSync(path.join(app,'src',gpu?'fps-raycaster-gpu.tom':'fps-raycaster.tom'),'utf8');
  let setup=source.slice(0,source.indexOf('DefVarInSd64xProximoQuadroy0'));
  setup=setup.replaceAll("l'./","l'../../src/");
  if(gpu&&!desktop)setup=setup.split('\n').filter(l=>!l.includes('JanelaGPUCriar[')&&!l.startsWith('JanelaGPU')&&!l.startsWith('DeferJanelaGPU')).join('\n')+'\n';
  let drawing=gpu?source.match(/\/\/ Alvos e atlas[\s\S]*?EscopoFimxDesenhoGPU/)[0]:source.match(/\/\/ Inicio do adaptador de desenho SDL\.[\s\S]*?\/\/ Fim do adaptador de desenho SDL\./)[0];
  if(gpu){
    for(const [buffer,list] of [['CenaGPU','CenaLista'],['HudGPU','HudLista']]){
      drawing=drawing.replace(`ChamarxFpsEnviarLista[@${buffer},@${list}]`,`TempoAgoraNs[]yMarco\nChamarxFpsEnviarLista[@${buffer},@${list}]\nTempoAgoraNs[]yAgoraTransferencia\nSetVarInSd64xTransferenciay(@Transferencia + @AgoraTransferencia - @Marco)`);
    }
    for(const job of ['DesenharCena','PosProcessar','ComporCena','DesenharHud'])drawing=drawing.replace(`GPUTrabalhoAguardar[@${job}]`,`GPUTrabalhoAguardar[@${job}]\nGPUTrabalhoObterTempo[@${job},@TempoGPU]\nSetVarInUd64xTempoInternoy(@TempoInterno + @TempoGPU.duracaoNs)`);
    drawing=drawing.replace('DefRecursoxApresentaryJanelaGPUApresentar', 'TempoAgoraNs[]yAntesApresentar\nDefRecursoxApresentaryJanelaGPUApresentar');
    if(!desktop)drawing=drawing.replace('TempoAgoraNs[]yAntesApresentar\nDefRecursoxApresentaryJanelaGPUApresentar[@Janela,@Final]\nGPUTrabalhoAguardar[@Apresentar]','TempoAgoraNs[]yAntesApresentar');
  }else drawing=drawing.replace('JanelaApresentar[@Janela]','TempoAgoraNs[]yAntesApresentar\nJanelaApresentar[@Janela]');
  return (gpu?"Importar[l'tom/perfilgpu']\n":"")+setup+`DefStkFB256CxTextoyl''
${gpu?`DefStkFB1024CxDispositivoyl''
GPUInformacao[@GPU,@Dispositivo]
GerarTxtxDispositivo
GerarTxtxl'\\n'
DefVarRegistro<PerfilTempoGPU>xTempoGPUyPadrao
DefVarRegistro<PerfilGPU>xMetricasyPadrao
GPUTempoDisponivel[@GPU]
DefVarBlxTemTimestampy@ULTIMO
`:''}
ParaxNivel[0,3,1]
InSd64ParaInSd32[@Nivel]
ChamarxFpsNivelCarregar[@ULTIMO,@Estado,@Mapa,@Entidades]
${stress?`ParaIndiceSOAxI[@Mapa]
SetVarInSd32xMapa@@I.materialy0
SetVarBlxMapa@@I.portayFalso
FimPara
ParaIndiceSOAxI[@Entidades]
InSd64ParaFl64[@I]
ChamarxFpsEntidadeCriar[@Entidades,@I,1,(7.0 + @ULTIMO * 0.006),2.5]
FimPara
SetVarInSd32xEstado.totalInimigosy64
`:''}
ParaxFrame[0,260,1]
TempoAgoraNs[]
DefVarInSd64xInicioy@ULTIMO
DefVarRegistro<FpsComando>xComandoyPadrao
CompararIgualxyInSd64x@Framey30
SetVarBlxComando.interagiry@ULTIMO
ChamarxFpsPasso[@Mapa,@Estado,@Entidades,@Comando]
CompararIgualxyEnum<FpsFase>x@Estado.fasey@FpsFase.Jogando
Exigir[@ULTIMO]
TempoAgoraNs[]
DefVarInSd64xSimulacaoFimy@ULTIMO
InSd64ParaFl64[@Frame]
SenoFl64[(@ULTIMO * 0.02)]
SetVarFl64xEstado.anguloy(@ULTIMO * 0.25)
ChamarxFpsProjetar[@Mapa,@Estado,@Entidades,@Colunas,@Sprites]
ChamarxFpsCenaLista[@CenaLista,@Colunas,@Sprites,@Estado,Verdadeiro]
ChamarxFpsHudLista[@HudLista,@Mapa,@Estado,Falso,0,0]
TempoAgoraNs[]
DefVarInSd64xProjecaoFimy@ULTIMO
DefVarInSd64xTransferenciay0
DefVarInSd64xMarcoy0
DefVarInSd64xAgoraTransferenciay0
DefVarInSd64xAntesApresentary0
DefVarInUd64xTempoInternoy0
${drawing}
TempoAgoraNs[]
DefVarInSd64xFimy@ULTIMO
CompararMaiorIgualxyInSd64x@Framey20
Sex@ULTIMO
${['@Nivel','(@SimulacaoFim - @Inicio)','(@ProjecaoFim - @SimulacaoFim)','@Transferencia','(@AntesApresentar - @ProjecaoFim - @Transferencia)','(@Fim - @AntesApresentar)','(@Fim - @Inicio)'].map(v=>print(v)).join("GerarTxtxl','\n")}
GerarTxtxl','
${print('@TempoInterno','InUd64')}
GerarTxtxl'\\n'
FimSe
${(!gpu||desktop)?`${gpu?'JanelaGPUEventoConsultar':'EventoConsultar'}[@Janela,@Evento]`:''}
FimPara
FimPara
${gpu?`GPUObterPerfil[@GPU,@Metricas]
CompararIgualxyInUd64x@Metricas.recebidosBytesy0
Exigir[@ULTIMO]
GerarTxtxl'UPLOAD_BYTES='
${print('@Metricas.enviadosBytes','InUd64')}
GerarTxtxl'\\nGPU_TIMESTAMPS='
Sex@TemTimestamp
GerarTxtxl'available\\n'
Senao
GerarTxtxl'unavailable\\n'
FimSe
`:''}
EscopoFimxAplicacao
`;
}
function main(){
  const args=process.argv.slice(2),i=args.indexOf('--renderer'),renderer=i<0?'sdl':args[i+1];
  assert.ok(['sdl','gpu'].includes(renderer),'Use --renderer sdl|gpu');
  const desktop=args.includes('--desktop'),stress=args.includes('--stress');
  const name=`${renderer}-${desktop?'desktop':'offscreen'}${stress?'-stress':''}`,directory=path.join(app,'build','benchmark',process.platform==='win32'?'windows':'linux',name);
  fs.mkdirSync(directory,{recursive:true});
  // Imports are relative to build/benchmark; packages and metrics live in a separate directory.
  const file=path.join(app,'build','benchmark',`${process.platform}-${name}.tom`),source=benchmarkSource({renderer,desktop,stress});fs.writeFileSync(file,source);
  const compiled=compileResolved(source,{file});assert.ok(compiled.success,JSON.stringify(compiled.diagnostics));
  const binary=buildApplication(compiled,file,path.join(directory,'package'),{optimize:'-O2',assets:path.join(app,'assets')});
  const env={...process.env,SDL_AUDIODRIVER:'dummy'};
  for(const n of ['TOM_UI_EVENTS','TOM_UI_SNAPSHOT','TOM_UI_TRACE','LD_LIBRARY_PATH'])delete env[n];
  if(renderer==='sdl')env.SDL_RENDER_DRIVER='software';else delete env.SDL_RENDER_DRIVER;
  if(desktop)delete env.SDL_VIDEODRIVER;else env.SDL_VIDEODRIVER=renderer==='gpu'?'offscreen':'dummy';
  const result=command(binary,[],{env,cwd:os.tmpdir(),timeout:180000});
  const lines=result.stdout.trim().split(/\r?\n/),rows=lines.filter(l=>/^\d+,/.test(l)).map(l=>l.split(',').map(Number));
  assert.equal(rows.length,720);assert.ok(rows.every(r=>r.length===8&&r.every(n=>Number.isFinite(n)&&n>=0)));
  const stats=values=>{const sorted=values.map(n=>n/1e6).sort((a,b)=>a-b);return{p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};};
  const fields=['simulation','projectionAndLists','transfer','drawing','presentation','frame',...(renderer==='gpu'&&lines.includes('GPU_TIMESTAMPS=available')?['gpuDrawingSubmissions']:[])];
  const report={platform:process.platform,cpu:os.cpus()[0]?.model,renderer,driver:desktop?'desktop':env.SDL_VIDEODRIVER,logical:[320,200],optimize:'O2',stress,warmupPerMap:20,framesPerMap:240,metadata:lines.filter(l=>!/^\d+,/.test(l)),levels:[0,1,2].map(level=>({level,...Object.fromEntries(fields.map((f,i)=>[f,stats(rows.filter(r=>r[0]===level).map(r=>r[i+1]))]))})),time:new Date().toISOString()};
  fs.writeFileSync(path.join(directory,'samples.csv'),'level,simulationNs,projectionNs,transferNs,drawingNs,presentationNs,frameNs,gpuDrawingNs\n'+rows.map(r=>r.join(',')).join('\n')+'\n');
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
if(require.main===module)main();
module.exports={benchmarkSource};
