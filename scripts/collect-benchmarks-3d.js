'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'..'),repository=path.resolve(app,'../..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function collect(){
  const reports=[];
  for(const platform of ['linux','windows'])for(const renderer of ['sdl','gpu'])for(const mode of ['offscreen','offscreen-stress','desktop']){
    const file=path.join(app,'build','benchmark',platform,`3d-${renderer}-${mode}`,'report.json');
    const report=JSON.parse(fs.readFileSync(file,'utf8'));
    assert.equal(report.renderer,renderer,file);assert.equal(report.platform,platform==='windows'?'win32':'linux',file);
    assert.equal(report.optimize,'O2',file);assert.equal(report.levels.length,3,file);
    assert.deepEqual(report.logical,[320,200],file);assert.deepEqual(report.scene,[320,176],file);
    assert.equal(report.audioDriver,'dummy','O protocolo agregado usa áudio dummy em todos os casos.');
    if(reports.length){
      assert.equal(report.framesPerMap,reports[0].framesPerMap,'Não combinar quantidades de amostras diferentes.');
      assert.equal(report.warmupPerMap,reports[0].warmupPerMap,'Não combinar quantidades de aquecimento diferentes.');
    }
    assert.equal(report.stress,mode.endsWith('-stress'),file);assert.equal(report.driver==='desktop',mode==='desktop',file);
    const hash=crypto.createHash('sha256');
    for(const [name,expected] of Object.entries(report.sources)){
      const bytes=fs.readFileSync(path.join(repository,name));assert.equal(digest(bytes),expected,`Fonte alterada depois da medição: ${name}`);
      hash.update(name+'\0');hash.update(bytes);
    }
    assert.equal(hash.digest('hex'),report.sourceSha256,file);
    assert.equal(report.sourceSha256,reports[0]?.sourceSha256??report.sourceSha256,'Não combinar builds de fontes diferentes.');
    if(renderer==='gpu')assert.ok(report.metadata.includes('GPU_recebidosBytes=0'),'Benchmark GPU não pode baixar pixels durante o quadro.');
    if(report.stress)assert.equal(report.metadata.filter(line=>line==='STRESS_ACTORS=128').length,3,'Estresse deve manter 128 atores nos três mapas.');
    const {sources,...summary}=report;reports.push({...summary,rawReport:path.relative(app,file).replaceAll(path.sep,'/')});
  }
  const first=JSON.parse(fs.readFileSync(path.join(app,reports[0].rawReport),'utf8'));
  const result={
    descricao:'Medições 3D SDL/GPU da mesma árvore em Linux/Windows; campanha, estresse e janela real.',
    protocolo:{
      quadrosPorMapa:first.framesPerMap,aquecimentoPorMapa:first.warmupPerMap,
      mapas:['Bastião','Fundição','Núcleo'],passosPorQuadro:1,passoNs:16666667,
      cena:[320,176],resolucaoLogica:[320,200],janelaDesktop:[960,600],audio:'dummy',
      execucao:'Sequencial, sem suítes concorrentes. Carga e iluminação estática medidas separadamente.',
      estresse:'128 sentinelas ativas; vida do jogador e dos atores restaurada antes da amostra para preservar a carga. Regras do jogo permanecem intactas.',
      limites:'A câmera e os comandos são controlados; estas amostras não garantem desempenho em todo percurso. Tempos de consultas estão incluídos nos grupos que as executam.',
      memoria:'Linux: pico RSS por /usr/bin/time. Windows: pico WorkingSet do processo, amostrado em intervalos de 20 ms.',
      metaQuadroMs:1000/60,
    },
    sourceSha256:first.sourceSha256,sources:first.sources,
    resultados:reports.map(report=>({...report,meta60FpsPorMapa:report.levels.map(level=>({level:level.level,p95DentroDaMeta:level.frame.p95Ms<=1000/60}))})),
    evidenciasRelacionadas:['benchmarks/replay-3d-2026-10-04.json','docs/evolucao-3d.md'],
  };
  const argument=process.argv.indexOf('--output'),output=argument<0?path.join(app,'benchmarks','resultados-3d-2026-10-04.json'):path.resolve(process.argv[argument+1]);
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  process.stdout.write(output+'\n');return result;
}
if(require.main===module)collect();
module.exports={collect};
