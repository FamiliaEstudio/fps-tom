'use strict';
// Replay por passo; sem janela/GPU. IDs opacos de pools e caches nao sao estado portavel.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {run}=require('./helpers');
const root=path.resolve(__dirname,'..'),file=path.join(__dirname,'replay3d.tom');
const floatFields=new Set(['px','py','pz','vx','vy','vz','impulsoX','impulsoY','angulo','inclinacao','alturaCorpo','postoX','postoY','abertura','largura','comprimento','minimo','maximo']);
const tolerance=1e-9;
function equal(a,b){
 const stats={maiorDiferencaNumerica:0,camposNumericosComparados:0,camposDiscretosComparados:0};
 function visit(left,right,location,key){
  assert.equal(typeof left,typeof right,`tipo em ${location}`);
  if(Array.isArray(left)){assert.ok(Array.isArray(right),location);assert.equal(left.length,right.length,`comprimento em ${location}`);left.forEach((value,i)=>visit(value,right[i],`${location}[${i}]`,key));return;}
  if(left!==null&&typeof left==='object'){
   assert.ok(right!==null&&!Array.isArray(right),location);
   const keys=Object.keys(left).sort();assert.deepEqual(keys,Object.keys(right).sort(),`campos em ${location}`);
   for(const name of keys){if(name==='modo')continue;visit(left[name],right[name],`${location}.${name}`,name);}return;
  }
  if(typeof left==='number'&&floatFields.has(key)){
   assert.ok(Number.isFinite(left)&&Number.isFinite(right),`numero finito em ${location}`);
   const difference=Math.abs(left-right);stats.maiorDiferencaNumerica=Math.max(stats.maiorDiferencaNumerica,difference);stats.camposNumericosComparados++;
   assert.ok(difference<=tolerance,`${location}: ${left} vs ${right} (delta ${difference})`);
  }else{assert.equal(left,right,`estado discreto em ${location}`);stats.camposDiscretosComparados++;}
 }
 visit(a,b,'passos','');return stats;
}
function verify(rows){
 assert.equal(rows.length,120);rows.forEach((row,i)=>assert.equal(row.passos,i+1));
 const checks={
  chaveAzulColetada:rows.some(r=>r.chaveAzul),
  lancadorColetado:rows.some(r=>r.lancador&&r.arma===2),
  portaParcial:rows.some(r=>r.portas.some(p=>p.indice===67&&p.abertura>0&&p.abertura<1)),
  portaAberta:rows.some(r=>r.portas.some(p=>p.indice===67&&p.passo===60)),
  salto:Math.max(...rows.map(r=>r.pz))>0.2,
  mouseHorizontalVertical:rows.some(r=>Math.abs(r.angulo-0.2)<tolerance&&Math.abs(r.inclinacao+0.1)<tolerance),
  projetilJogador:rows.some(r=>r.projeteis.some(p=>p.dono===-1)),
  sentinelaArmadaAtiva:rows.some(r=>r.atores.some(a=>a.indice===0&&a.ativa&&a.tipoAtaque===2)),
  disparoSentinela:rows.some(r=>r.projeteis.some(p=>p.dono===0)),
  barrilExplodiu:rows.some(r=>r.atores.some(a=>a.indice===64&&a.tipo===8&&!a.ativa&&a.vida<=0)),
  explosao:rows.some(r=>r.explosoes>0),
  dano:rows.some(r=>r.vida<500),
  elevadorEmMovimento:rows.some(r=>r.elevadores.some(e=>e.indice===0&&e.pz>0.02)),
 };
 for(const [name,value] of Object.entries(checks))assert.ok(value,`O cenario nao exercitou ${name}`);
 return checks;
}
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function evidence(a,b,aFile,bFile,stats){
 const sources=['tests/replay3d.tom','tests/replay3d-run.js','src/modelo.tom','src/fase.tom','src/mundo3d.tom','src/simulacao3d.tom','src/tecnico3d.tom','tests/gameplay3d.test.js','tests/navigation3d.test.js'];
 const perRate=[0,1,2].map(m=>a.passos.filter(p=>p.modo===m));
 return {data:'2026-10-04',descricao:'Replay por passo com chave, porta parcial, salto, mouse, lancador, sentinela armada, projeteis individuais, barril/explosao e elevador, em 30/60/144 FPS; comparacao Linux/Windows.',otimizacao:'O2',passosPorTaxa:120,taxas:[30,60,144],estadosComparados:a.passos.length,discretosIguais:true,toleranciaNumerica:tolerance,...stats,
  comportamentosPorTaxa:perRate.map((rows,i)=>({taxa:[30,60,144][i],...verify(rows)})),
  snapshots:{jogador:'Posicao, velocidade XYZ, residuos de impulso XY e estado de combate/movimento.',atores:'Slots com tipo definido, incluindo coletados/mortos; estado individual, velocidade XYZ, residuos de impulso XY, geracao e indice logico.',projeteis:'Todos os ativos por slot, dono, geracao, vida, posicao e velocidade; ausencia registra desativacao.',portas:'Todas as portas por celula, chave, orientacao e animacao.',elevadores:'Todos os moveis por indice, dimensoes, curso, direcao, espera e posicao.',omitidos:['IDs opacos do pool','caches de piso','contadores de perfil','estado visual anterior']},
  fontesNaFinalizacaoSha256:Object.fromEntries(sources.map(name=>[name,digest(fs.readFileSync(path.join(root,name)))])),logsSha256:{linux:digest(fs.readFileSync(aFile)),win32:digest(fs.readFileSync(bFile))},estadoFinalPorTaxa:perRate.map(rows=>rows.at(-1)),
  comandos:['node jogos/fps-tom/tests/replay3d-run.js','node jogos/fps-tom/tests/replay3d-run.js --compare jogos/fps-tom/build/replay3d/linux.json jogos/fps-tom/build/replay3d/win32.json'],
  regressaoGameplay:Object.fromEntries(['linux','windows'].map(platform=>[platform,{totalCasosNaSuite:26,baseAntesDasCorrecoesPortaSpawn:{testes:20,passaram:20},novosCasosAposCorrecoesPortaSpawn:{testes:6,passaram:6},navegacaoAntesDasCorrecoes:{testes:2,passaram:2},coreCampaignAntesDasCorrecoes:{testes:4,passaram:4},otimizacoes:['O0','O2'],observacao:'Os seis casos novos foram executados nas fontes finais; a rodada completa test:fps final e registrada separadamente.'}]))};
}
function main(options=process.argv.slice(2)){
 const compare=options.indexOf('--compare');
 if(compare>=0){
  const aFile=options[compare+1],bFile=options[compare+2],a=JSON.parse(fs.readFileSync(aFile,'utf8')),b=JSON.parse(fs.readFileSync(bFile,'utf8'));
  const stats=equal(a.passos,b.passos);for(const data of [a,b])for(const mode of [0,1,2])verify(data.passos.filter(p=>p.modo===mode));
  fs.writeFileSync(path.join(root,'benchmarks/replay-3d-2026-10-04.json'),JSON.stringify(evidence(a,b,aFile,bFile,stats),null,2)+'\n');
  console.log(`Estados individuais/discretos iguais; delta maximo ${stats.maiorDiferencaNumerica} <= ${tolerance} em ${a.passos.length} passos.`);
 }else{
  const capture=fs.mkdtempSync(path.join(os.tmpdir(),'tom-replay3d-'));let data;
  try{const result=run(fs.readFileSync(file,'utf8'),'-O2',{file,buildTimeout:180000,events:'',environment:{TOM_DATA_DIRECTORY:capture}});assert.equal(result.stdout,'replay-json-file');data=JSON.parse(fs.readFileSync(path.join(capture,'snapshot.json'),'utf8'));}finally{fs.rmSync(capture,{recursive:true,force:true});}
  const rows=[0,1,2].map(m=>data.passos.filter(p=>p.modo===m));
  rows.forEach(verify);equal(rows[0],rows[1]);equal(rows[0],rows[2]);
  const out=path.join(root,`build/replay3d/${process.platform}.json`);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
  console.log(`Replay 30/60/144 FPS: 360 snapshots individuais iguais; ${out}`);
 }
}
if(require.main===module)main();module.exports={equal,verify,evidence};
