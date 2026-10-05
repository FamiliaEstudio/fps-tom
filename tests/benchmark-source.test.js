'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {benchmarkSource}=require('../scripts/benchmark');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {builtins}=require('../../../tom-lang/core/builtins');
test('FPS benchmark compiles all render paths after shared composition extraction',()=>{
  const saved=builtins.FpsBenchmarkNativoObter;
  builtins.FpsBenchmarkNativoObter={c:'tom_benchmark_gpu_profile',args:['RefRegistro<FpsBenchmarkNativo>'],access:['write'],result:'Vazio',lib:'gpu',recordLayout:{FpsBenchmarkNativo:[['submissoes','InUd64'],['medidas','InUd64'],['duracaoNs','InUd64']]}};
  try{
    for(const renderer of ['sdl','gpu'])for(const desktop of [false,true])for(const stress of [false,true])
      for(const immediate of renderer==='gpu'?[false,true]:[false]){
        const source=benchmarkSource({renderer,desktop,stress,immediate,frames:1,warmup:0});
        const r=compileResolved(source,{file:path.resolve(__dirname,'../build/benchmark/test.tom')});
        assert.equal(r.success,true,JSON.stringify({renderer,desktop,stress,immediate,diagnostics:r.diagnostics}));
        if(renderer==='sdl')assert.ok(!r.artifacts.runtimeRequirements.some(x=>/gpu/.test(x)));
        if(immediate){
          const body=source.slice(source.indexOf('DefFuncaoxFpsBenchmarkMisturaGPU'),source.indexOf('FimFuncao',source.indexOf('DefFuncaoxFpsBenchmarkMisturaGPU')));
          assert.equal((body.match(/ChamarxFpsBenchmarkAguardar\[@GPU,@D,@Medicao\]/g)||[]).length,2);
          assert.doesNotMatch(body,/ChamarxComposicao3DDesenharGPU|GPUTrabalhoAguardar/);
        }
      }
  }finally{if(saved)builtins.FpsBenchmarkNativoObter=saved;else delete builtins.FpsBenchmarkNativoObter;}
});
