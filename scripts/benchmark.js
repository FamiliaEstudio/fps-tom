'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication,command,toolchain}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..');
const print=(value,type='InSd64')=>`${type}ParaTexto[${value},@Texto]\nGerarTxtxTexto\n`;
const fields=['simulation','movementAndQueries','navigationAndAI','combatAndQueries','effectsSimulation','lightingAndScene','hud','audio','transfer','drawing','presentation','frame','gpuSubmissions','submissionCount','measuredSubmissionCount','jobSubmissionCount','commandHostBytes','stagingBytes'];
const quantities=new Set(['submissionCount','measuredSubmissionCount','jobSubmissionCount','commandHostBytes','stagingBytes']);
const immediateReference=path.resolve(app,'../../benchmarks/autonomia-grafica/referencias/fps-gpu-imediato.tom');
function benchmarkSource({renderer='sdl',desktop=false,stress=false,frames=240,warmup=20,immediate=false}={}){
  assert.ok(['sdl','gpu'].includes(renderer));
  const gpu=renderer==='gpu',source=fs.readFileSync(path.join(app,'src',gpu?'fps-tom-gpu.tom':'fps-tom.tom'),'utf8');
  let setup=source.slice(0,source.indexOf('Enquantox@Controle.executar')).replaceAll("l'./","l'../../src/").replaceAll("l'../assets/","l'../../assets/");
  if(gpu&&!desktop)setup=setup.split('\n').filter(l=>!l.includes('JanelaGPUCriar[')&&!l.startsWith('JanelaGPU')&&!l.startsWith('DeferJanelaGPU')).join('\n')+'\n';
  if(!gpu&&!desktop)setup=setup.replace("JanelaCriar[l'Bastiao | FPS Tom',960,600]","JanelaCriar[l'Bastiao | FPS Tom',320,200]");
  const label=gpu?'GPU':'SDL',begin=`// Inicio do desenho ${label} 3D.`,end=`// Fim do desenho ${label} 3D.`;
  assert.ok(source.includes(begin)&&source.includes(end),'Adaptador 3D deve delimitar o desenho.');
  let drawing=gpu&&immediate?fs.readFileSync(immediateReference,'utf8'):source.slice(source.indexOf(begin),source.indexOf(end)+end.length);
  let instrumentation='';
  if(gpu){
    instrumentation=`DefRegistroxFpsBenchmarkGPU
PropInUd64xtempo
PropInUd64xsubmissoes
PropInUd64xmedidas
PropInUd64xstaging
FimDef
DefRegistroxFpsBenchmarkNativo
PropInUd64xsubmissoes
PropInUd64xmedidas
PropInUd64xduracaoNs
FimDef
DefFuncaoxFpsBenchmarkAguardar[DispositivoGPUxGPU,TrabalhoGPUxTrabalho,RefRegistro<FpsBenchmarkGPU>xMedicao]yVazio
DefVarRegistro<PerfilGPU>xMemoriayPadrao
GPUObterPerfil[@GPU,@Memoria]
CompararMaiorxyInUd64x@Memoria.stagingBytesy@Medicao.staging
Sex@ULTIMO
SetVarInUd64xMedicao.stagingy@Memoria.stagingBytes
FimSe
GPUTrabalhoAguardar[@Trabalho]
DefVarRegistro<PerfilTrabalhoGPU>xPerfilyPadrao
DefVarRegistro<PerfilTempoGPU>xGPUTempoyPadrao
GPUTrabalhoObterPerfil[@Trabalho,@Perfil]
GPUTrabalhoObterTempo[@Trabalho,@GPUTempo]
SetVarInUd64xMedicao.tempoy(@Medicao.tempo+@GPUTempo.duracaoNs)
SetVarInUd64xMedicao.submissoesy(@Medicao.submissoes+@Perfil.submissoes)
SetVarInUd64xMedicao.medidasy(@Medicao.medidas+@GPUTempo.submissoesMedidas)
FimFuncao
`;
    if(immediate){
      // Freeze only the previous drawing sequence; scene/simulation and runtime
      // remain identical to the grouped run, and all inputs are hashed below.
      // GA004 moved the implementation into the common library; the FPS wrapper
      // no longer contains waits to instrument. Keep the same current algorithm.
      let mixture=fs.readFileSync(path.resolve(app,'../../tom-lang/stdlib/composicao3d_gpu.tom'),'utf8');
      const start=mixture.indexOf('DefFuncaoxComposicao3DDesenharGPU['),finish=mixture.indexOf('FimFuncao',start);
      assert.ok(start>=0&&finish>start,'Composição imediata deve fornecer o corpo instrumentado.');
      mixture=mixture.slice(start,finish+'FimFuncao'.length);
      mixture=mixture.replace('Composicao3DDesenharGPU[','FpsBenchmarkMisturaGPU[').replace('MaterialGPU3DxAditivo]','MaterialGPU3DxAditivo,DispositivoGPUxGPU,RefRegistro<FpsBenchmarkGPU>xMedicao]');
      mixture=mixture.replaceAll('GPUTrabalhoAguardar[@D]','ChamarxFpsBenchmarkAguardar[@GPU,@D,@Medicao]').replaceAll('GPUTrabalhoObterTempo[@D,@Tempo]','').replace('SetVarInUd64xTempoTotaly(@TempoTotal+@Tempo.duracaoNs)','');
      mixture=mixture.replace(']yInUd64',']yVazio').replace('Retornarx@TempoTotal','Retornar');
      instrumentation+=mixture+'\n';
      drawing=drawing.replace(/ChamarxFpsEnviarLista\[([^,]+),([^\]]+)\]/g,(_,dest,cpu)=>`TempoAgoraNs[]yMarco
BufferVec4Fl32Comprimento[${cpu}]
BufferGPUVec4Fl32Redimensionar[${dest},@ULTIMO]
DefRecursoxUploadFrameyBufferGPUVec4Fl32Enviar[${dest},${cpu}]
GPUTrabalhoAguardar[@UploadFrame]
TempoAgoraNs[]yAgoraTransferencia
SetVarInSd64xTransferenciay(@Transferencia+@AgoraTransferencia-@Marco)`);
      drawing=drawing.replace(/ChamarxFps3DMisturaGPU\[([^\n]+)\]/g,'ChamarxFpsBenchmarkMisturaGPU[$1,@GPU,@MedicaoGPU]');
      drawing=drawing.replace('DefRecursoxApresentaryJanelaGPUApresentar','TempoAgoraNs[]yAntesApresentar\nDefRecursoxApresentaryJanelaGPUApresentar');
      if(!desktop)drawing=drawing.replace('DefRecursoxApresentaryJanelaGPUApresentar[@Janela,@Final]\nGPUTrabalhoAguardar[@Apresentar]','');
    }else{
      drawing=drawing.replace('ComandosGPUBufferEnviarVec4Fl32[@Comandos,@VistaQuadro,@QuadroLista]','TempoAgoraNs[]yMarco\nComandosGPUBufferEnviarVec4Fl32[@Comandos,@VistaQuadro,@QuadroLista]\nTempoAgoraNs[]yAgoraTransferencia\nSetVarInSd64xTransferenciay(@AgoraTransferencia-@Marco)');
      drawing=drawing.replace('DefRecursoxQuadroyComandosGPUSubmeter','ComandosGPUMemoriaHost[@Comandos]yMemoriaComandos\nTempoAgoraNs[]yAntesApresentar\nDefRecursoxQuadroyComandosGPUSubmeter');
      if(!desktop)drawing=drawing.replace('ComandosGPUApresentar[@Comandos,@Janela,@Final]','');
    }
    drawing=drawing.replace(/GPUTrabalhoAguardar\[@(\w+)\]/g,'ChamarxFpsBenchmarkAguardar[@GPU,@$1,@MedicaoGPU]');
  }else{
    drawing=drawing.replace('VisualPixelsEnviar[@Superficie,@Pixels]','TempoAgoraNs[]yMarco\nVisualPixelsEnviar[@Superficie,@Pixels]\nTempoAgoraNs[]yAgoraTransferencia\nSetVarInSd64xTransferenciay(@AgoraTransferencia-@Marco)');
    drawing=drawing.replace('JanelaApresentar[@Janela]','TempoAgoraNs[]yAntesApresentar\nJanelaApresentar[@Janela]');
  }
  const values=['@Nivel','(@SimFim-@Inicio)','@Mundo.movimentoNs','@Mundo.iaNs','@Mundo.consultaNs','@Mundo.efeitosNs','(@CenaFim-@SimFim)','(@HudFim-@CenaFim)','(@AudioFim-@HudFim)','@Transferencia','(@AntesApresentar-@AudioFim-@Transferencia)','(@Fim-@AntesApresentar)','(@Fim-@Inicio)'];
  return (gpu?"Importar[l'tom/perfilgpu']\n"+instrumentation:"")+setup+`DefStkFB256CxTextoyl''
${gpu?`DefStkFB1024CxDispositivoyl''
GPUInformacao[@GPU,@Dispositivo]
GerarTxtxDispositivo
GerarTxtxl'\\n'
DefVarRegistro<PerfilTempoGPU>xTempoGPUyPadrao
DefVarRegistro<PerfilGPU>xMetricasyPadrao
GPUObterPerfil[@GPU,@Metricas]
DefVarInUd64xEnviadosIniciaisy@Metricas.enviadosBytes
GPUTempoDisponivel[@GPU]
DefVarBlxTemTimestampy@ULTIMO
`:''}
ParaxNivel[0,3,1]
TempoAgoraNs[]
DefVarInSd64xInicioCargay@ULTIMO
InSd64ParaInSd32[@Nivel]
ChamarxFps3DNivelCarregar[@ULTIMO,@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PoolAtores,@PoolProjeteis,@PoolEfeitos,@Sons]
TempoAgoraNs[]
DefVarInSd64xCargaFimy@ULTIMO
ChamarxFps3DVisualPreparar[@Mundo,@Malha,@MundoVisual,@MalhaVisual]
ChamarxFps3DBakeVisual[@Mapa,@Mundo,@Malha,@MundoVisual,@MalhaVisual,@Elevadores,@Cores,@Estado.nivel]
TempoAgoraNs[]
DefVarInSd64xBakeFimy@ULTIMO
GerarTxtxl'PREPARE='
${print('@Nivel')}GerarTxtxl','
${print('(@CargaFim-@InicioCarga)')}GerarTxtxl','
${print('(@BakeFim-@CargaFim)')}GerarTxtxl','
${print('@Mundo.triangulos')}GerarTxtxl','
${print('@Mundo.regioes')}GerarTxtxl','
${print('@MundoVisual.triangulos')}GerarTxtxl'\\n'
SetVarBlxMundo.mediryVerdadeiro
SetVarBlxControle.efeitosyVerdadeiro
SetVarBlxControle.minimapayVerdadeiro
SetVarInSd32xSomEstado.nively-1
${stress?`ChamarxFps3DPoolLimpar[@PoolAtores]
ParaxI[0,128,1]
InSd64ParaFl64[@I]
ChamarxFpsEntidadeCriar[@Entidades,@I,1,(3.5+@ULTIMO*0.006),2.5]
DefVarRegistro<EntidadeID>xIDAtoryPadrao
PoolEntidadesReservar[@PoolAtores,@IDAtor]
SetVarInUd64xEntidades@@I.idPooly@IDAtor.pool
SetVarInUd32xEntidades@@I.idIndicey@IDAtor.indice
SetVarInUd32xEntidades@@I.idGeracaoy@IDAtor.geracao
SetVarFl64xEntidades@@I.pzy0.0
SetVarFl64xEntidades@@I.alturaCorpoy1.45
SetVarInSd32xEntidades@@I.tipoAtaquey2
FimPara
SetVarInSd32xEstado.totalInimigosy128
`:''}
ParaxFrame[0,${frames+warmup},1]
SetVarInSd32xEstado.viday1000000
${stress?`// Preserva os 128 atores vivos: dano, projeteis e consultas continuam ativos.
ParaxAtor[0,128,1]
Exigir[Entidades@@Ator.ativa]
SetVarInSd32xEntidades@@Ator.viday1000000
FimPara
`:''}
InSd64ParaFl64[@Frame]
SenoFl64[(@ULTIMO*0.013)]
SetVarFl64xEstado.anguloy(@ULTIMO*0.25)
DefVarRegistro<Fps3DComando>xComandoyPadrao
CompararIgualxyInSd64x@Framey30
SetVarBlxComando.interagiry@ULTIMO
CompararIgualxyInSd64x@Framey70
SetVarBlxComando.pulary@ULTIMO
${gpu?`DefVarRegistro<FpsBenchmarkNativo>xNativoAntesyPadrao
FpsBenchmarkNativoObter[@NativoAntes]`:''}
TempoAgoraNs[]
DefVarInSd64xInicioy@ULTIMO
ChamarxFps3DPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@Comando,@PoolProjeteis,@PoolEfeitos,@Sons]
TempoAgoraNs[]
DefVarInSd64xSimFimy@ULTIMO
ChamarxFps3DVisual[@Estado,1.0]
DefVarRegistro<FpsEstado>xVisualy@ULTIMO
ChamarxFps3DCenaClipe[@Mapa,@MundoVisual,@MalhaVisual,@Elevadores,@Cores,@Entidades,@Projeteis,@Efeitos,@Luzes,@Visual,1.0,@ClipeTV,@AmostraTV,@Controle.texturas,Verdadeiro,@Opaco,@Mascara,@Transparente,@Aditivo,@TVLista,@SA,@SB]
ChamarxFps3DMisturaPreparar[@Transparente,@Aditivo,@Mistura,@MisturaScratch]
TempoAgoraNs[]
DefVarInSd64xCenaFimy@ULTIMO
ChamarxFps3DHud[@HudLista,@Mapa,@Mundo,@Regioes,@Malha,@Elevadores,@Entidades,@Estado,@Controle,0,0]
TempoAgoraNs[]
DefVarInSd64xHudFimy@ULTIMO
ChamarxFps3DAudioAtualizar[@Audio,@Musica0,@Musica1,@Musica2,@TVSom,@Ambiente,@Tiro,@Dano,@Item,@Abrir,@Fechar,@Explosao,@SomEstado,@Estado,@Controle,@Mapa,@Mundo,@Malha,@Elevadores,@Vozes,@Sons,@ClipeTV]yAmostraTV
TempoAgoraNs[]
DefVarInSd64xAudioFimy@ULTIMO
DefVarInSd64xTransferenciay0
DefVarInSd64xMarcoy0
DefVarInSd64xAgoraTransferenciay0
DefVarInSd64xAntesApresentary0
DefVarInUd64xTempoInternoy0
DefVarInUd64xSubmissoesQuadroy0
DefVarInUd64xMedidasQuadroy0
DefVarInUd64xSubmissoesTrabalhosy0
DefVarInUd64xMemoriaComandosy0
DefVarInUd64xStagingQuadroy0
${gpu?'DefVarRegistro<FpsBenchmarkGPU>xMedicaoGPUyPadrao':''}
${drawing}
TempoAgoraNs[]
DefVarInSd64xFimy@ULTIMO
${gpu?`DefVarRegistro<FpsBenchmarkNativo>xNativoDepoisyPadrao
FpsBenchmarkNativoObter[@NativoDepois]
SetVarInUd64xTempoInternoy(@NativoDepois.duracaoNs-@NativoAntes.duracaoNs)
SetVarInUd64xSubmissoesQuadroy(@NativoDepois.submissoes-@NativoAntes.submissoes)
SetVarInUd64xMedidasQuadroy(@NativoDepois.medidas-@NativoAntes.medidas)
SetVarInUd64xSubmissoesTrabalhosy@MedicaoGPU.submissoes
SetVarInUd64xStagingQuadroy@MedicaoGPU.staging`:''}
CompararMaiorIgualxyInSd64x@Framey${warmup}
Sex@ULTIMO
${values.map(v=>print(v)).join("GerarTxtxl','\n")}
GerarTxtxl','
${['@TempoInterno','@SubmissoesQuadro','@MedidasQuadro','@SubmissoesTrabalhos','@MemoriaComandos','@StagingQuadro'].map(v=>print(v,'InUd64')).join("GerarTxtxl','\n")}GerarTxtxl'\\n'
FimSe
${(!gpu||desktop)?`${gpu?'JanelaGPUEventoConsultar':'EventoConsultar'}[@Janela,@Evento]`:''}
FimPara
${stress?`GerarTxtxl'STRESS_ACTORS=128\\n'
`:''}
FimPara
${gpu?`GPUObterPerfil[@GPU,@Metricas]
CompararIgualxyInUd64x@Metricas.recebidosBytesy0
Exigir[@ULTIMO]
${['enviadosBytes','recebidosBytes','buffersBytes','texturasBytes','stagingBytes','scratchBytes'].map(n=>`GerarTxtxl'GPU_${n}='\n${print('@Metricas.'+n,'InUd64')}GerarTxtxl'\\n'`).join('\n')}
GerarTxtxl'GPU_frameUploadBytes='
${print('(@Metricas.enviadosBytes-@EnviadosIniciais)','InUd64')}GerarTxtxl'\\n'
GerarTxtxl'GPU_TIMESTAMPS='
Sex@TemTimestamp
GerarTxtxl'available\\n'
Senao
GerarTxtxl'unavailable\\n'
FimSe
`:''}
EscopoFimxAplicacao
`;
}
function gpuMode(renderer,immediate){return renderer==='gpu'?(immediate?'immediate':'grouped'):null;}
function main(){
  const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const renderer=option('--renderer','sdl'),frames=Number(option('--frames',240)),warmup=Number(option('--warmup',20));
  assert.ok(['sdl','gpu'].includes(renderer),'Use --renderer sdl|gpu');
  assert.ok(Number.isInteger(frames)&&frames>=1&&frames<=10000&&Number.isInteger(warmup)&&warmup>=0&&warmup<=1000);
  const desktop=args.includes('--desktop'),stress=args.includes('--stress'),immediate=args.includes('--immediate'),name=`3d-${renderer}-${desktop?'desktop':'offscreen'}${stress?'-stress':''}${immediate?'-immediate':''}`;
  const directory=path.join(app,'build','benchmark',process.platform==='win32'?'windows':'linux',name);fs.mkdirSync(directory,{recursive:true});
  const file=path.join(app,'build','benchmark',`${process.platform}-${name}.tom`),source=benchmarkSource({renderer,desktop,stress,frames,warmup,immediate});fs.writeFileSync(file,source);
  const {builtins}=require('../../../tom-lang/core/builtins');
  const saved=builtins.FpsBenchmarkNativoObter;
  if(renderer==='gpu')builtins.FpsBenchmarkNativoObter={c:'tom_benchmark_gpu_profile',args:['RefRegistro<FpsBenchmarkNativo>'],access:['write'],result:'Vazio',lib:'gpu',recordLayout:{FpsBenchmarkNativo:[['submissoes','InUd64'],['medidas','InUd64'],['duracaoNs','InUd64']]}};
  let compiled;
  try {compiled=compileResolved(source,{file});}finally{if(saved)builtins.FpsBenchmarkNativoObter=saved;else delete builtins.FpsBenchmarkNativoObter;}
  assert.ok(compiled.success,JSON.stringify(compiled.diagnostics));
  const linkObjects=renderer==='gpu'?[path.join(__dirname,'benchmark-gpu.c'),'-DSDL_STATIC_LIB','-DSDL_SubmitGPUCommandBufferAndAcquireFence=tom_benchmark_submit','-DSDL_ReleaseGPUFence=tom_benchmark_release_fence']:[];
  const binary=buildApplication(compiled,file,path.join(directory,'package'),{optimize:'-O2',assets:path.join(app,'assets'),linkObjects});
  const env={...process.env,SDL_AUDIODRIVER:process.env.TOM_BENCH_AUDIO_DRIVER||'dummy'};
  for(const n of ['TOM_UI_EVENTS','TOM_UI_SNAPSHOT','TOM_UI_TRACE','LD_LIBRARY_PATH'])delete env[n];
  if(renderer==='sdl'&&!desktop)env.SDL_RENDER_DRIVER='software';
  else if(renderer==='sdl'&&process.env.TOM_BENCH_SDL_RENDER_DRIVER)env.SDL_RENDER_DRIVER=process.env.TOM_BENCH_SDL_RENDER_DRIVER;
  else delete env.SDL_RENDER_DRIVER;
  if(desktop)delete env.SDL_VIDEODRIVER;else env.SDL_VIDEODRIVER=renderer==='gpu'?'offscreen':'dummy';
  const timed=process.platform==='linux'&&fs.existsSync('/usr/bin/time');
  const monitored=process.platform==='win32';
  const result=command(timed?'/usr/bin/time':monitored?'powershell.exe':binary,timed?['-f','PEAK_RSS_KB=%M',binary]:monitored?['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'benchmark-memory.ps1'),'-Binary',binary]:[],{env,cwd:os.tmpdir(),timeout:600000});
  const lines=result.stdout.trim().split(/\r?\n/),rows=lines.filter(l=>/^\d+,/.test(l)).map(l=>l.split(',').map(Number));
  assert.equal(rows.length,frames*3);assert.ok(rows.every(r=>r.length===fields.length+1&&r.every(n=>Number.isFinite(n)&&n>=0)));
  if(renderer==='gpu'&&!immediate)assert.ok(rows.every(r=>r[fields.indexOf('submissionCount')+1]===1),'O adaptador agrupado deve submeter uma vez por quadro.');
  if(renderer==='gpu'&&lines.includes('GPU_TIMESTAMPS=available'))assert.ok(rows.every(r=>r[fields.indexOf('submissionCount')+1]===r[fields.indexOf('measuredSubmissionCount')+1]),'Todas as submissões nativas devem ter timestamp.');
  const stats=(values,quantity=false)=>{const sorted=values.map(n=>quantity?n:n/1e6).sort((a,b)=>a-b);return quantity?{p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1)}:{p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};};
  const rss=result.stderr?.match(/PEAK_RSS_KB=(\d+)/),workingSet=result.stderr?.match(/PEAK_WORKING_SET_BYTES=(\d+)/),hash=crypto.createHash('sha256'),repository=path.resolve(app,'../..');
  const inputs=[
    ...[
      ['jogos/fps-tom/src',/\.tom$/],['jogos/fps-tom/assets',/\.(png|wav|tom|json)$/],
      ['tom-lang/stdlib',/\.tom$/],['tom-lang/runtime/stable',/\.(c|h)$/],['tom-lang/core',/\.js$/],
    ].flatMap(([folder,extension])=>fs.readdirSync(path.join(repository,folder)).filter(name=>extension.test(name)).map(name=>folder+'/'+name)),
    'benchmarks/autonomia-grafica/referencias/fps-gpu-imediato.tom','scripts/toolchain.json','jogos/fps-tom/scripts/benchmark.js','jogos/fps-tom/scripts/benchmark-gpu.c','jogos/fps-tom/scripts/benchmark-memory.ps1',
  ].sort();
  const sources=Object.fromEntries(inputs.map(f=>{const bytes=fs.readFileSync(path.join(repository,f));hash.update(f+'\0');hash.update(bytes);return[f,crypto.createHash('sha256').update(bytes).digest('hex')];}));
  const report={version:'3d-commands-v1',commands:gpuMode(renderer,immediate),platform:process.platform,osRelease:os.release(),cpu:os.cpus()[0]?.model,logical:[320,200],scene:[320,176],renderer,driver:desktop?'desktop':env.SDL_VIDEODRIVER,window:desktop?[960,600]:renderer==='sdl'?[320,200]:null,optimize:'O2',stress,warmupPerMap:warmup,framesPerMap:frames,peakRssBytes:rss?Number(rss[1])*1024:null,peakWorkingSetBytes:workingSet?Number(workingSet[1]):null,compiler:command(toolchain().clang,['--version']).stdout.split(/\r?\n/)[0],sourceSha256:hash.digest('hex'),benchmarkSourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sources,metadata:lines.filter(l=>!/^\d+,/.test(l)),levels:[0,1,2].map(level=>({level,...Object.fromEntries(fields.filter(f=>f!=='gpuSubmissions'||lines.includes('GPU_TIMESTAMPS=available')).map(f=>[f,stats(rows.filter(r=>r[0]===level).map(r=>r[fields.indexOf(f)+1]),quantities.has(f))]))})),time:new Date().toISOString()};
  report.phaseSemantics=renderer==='gpu'&&!immediate?'transfer: CPU upload capture; drawing: CPU recording; presentation: submission/acquisition/completion; gpuSubmissions: GPU duration of the whole submission':'transfer: upload and wait; drawing: immediate passes and waits; presentation: swapchain and wait; gpuSubmissions: sum of all native GPU submission durations (including resize)';
  report.quantityUnits={submissionCount:'count',measuredSubmissionCount:'count',jobSubmissionCount:'count (excludes native initialization/resize)',commandHostBytes:'bytes (recorder only; immediate has no recorder)',stagingBytes:'bytes (peak observed before waits)'};
  report.gpuInstrumentation=renderer==='gpu'?'benchmark-gpu.c wraps SDL submission and fence release only in this benchmark build; counts/times native initialization and resize as well as public jobs; startup is outside frame deltas; unchanged simulation/rendering code':null;
  report.sdlRenderer=renderer==='sdl'?(env.SDL_RENDER_DRIVER||'platform default'):null;
  report.audioDriver=env.SDL_AUDIODRIVER;
  report.preparation=lines.filter(line=>line.startsWith('PREPARE=')).map(line=>{
    const [level,loadNs,visualAndBakeNs,canonicalTriangles,regions,visualTriangles]=line.slice(8).split(',').map(Number);
    assert.ok([level,loadNs,visualAndBakeNs,canonicalTriangles,regions,visualTriangles].every(n=>Number.isFinite(n)&&n>=0));
    return{level,loadNs,visualAndBakeNs,canonicalTriangles,regions,visualTriangles};
  });
  assert.equal(report.preparation.length,3);
  report.executableSha256=crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex');
  report.stressProtocol=stress?'128 armed actors remain active; player and actor health restored before each timed step; collision, projectiles, damage, navigation and effects enabled':null;
  fs.writeFileSync(path.join(directory,'samples.csv'),'level,'+fields.map(f=>quantities.has(f)?f:f+'Ns').join(',')+'\n'+rows.map(r=>r.join(',')).join('\n')+'\n');
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
if(require.main===module)main();
module.exports={benchmarkSource,fields};
