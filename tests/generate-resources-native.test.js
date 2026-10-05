'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication}=require('../../../tom-lang/core/native-build');
const base=require('../scripts/generate-assets'),extra=require('../scripts/generate-resources-3d');
const {decodePNG,tomMetadata}=require('../scripts/prepare-clips'),{comparePCM}=require('./resource-equivalence');
let references;
function expectedFiles() {
  if(references)return references;
  const tv=extra.tv();
  references=[{
    'atlas.png':base.atlas(),
    ...Object.fromEntries(['tiro','dano','item','abrir','fechar'].map(k=>[k+'.wav',base.wav(k)])),
  },{
    'atlas3d.png':extra.atlas3d(),
    ...Object.fromEntries([0,1,2].map(i=>[`musica${i}.wav`,extra.music(i)])),
    'explosao.wav':extra.explosion(),'ambiente.wav':extra.environment(),
    'tv.png':tv.atlas,'tv.wav':tv.audio,
    'tv.json':Buffer.from(JSON.stringify(tv.metadata,null,2)+'\n'),
    'tv.tom':Buffer.from(tomMetadata(tv.metadata)),
  }];
  return references;
}
for(const optimize of ['-O0','-O2'])for(const [index,name]of ['gerar-recursos','gerar-recursos-3d'].entries())
test(`native ${name} reproduces all pixels, PCM and metadata ${optimize}`,(t)=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'tom-resources-'));
  try {
    const source=path.resolve(__dirname,'../ferramentas',name+'.tom');
    const compiled=compileResolved(fs.readFileSync(source,'utf8'),{file:source});
    assert.equal(compiled.success,true,JSON.stringify(compiled.diagnostics));
    compiled.artifacts.llvm=compiled.artifacts.llvm.replace('define i32 @main(', 'define i32 @tom_program_main(');
    const harness=path.join(directory,'leaks.c');
    fs.writeFileSync(harness,'#include <stdint.h>\n#include <stdio.h>\nextern int tom_program_main(int,char**);\nextern int64_t tom_live_objects(void);\nint main(int argc,char**argv){int status=tom_program_main(argc,argv);if(tom_live_objects()){puts("LEAK");return 91;}return status;}\n');
    const binary=buildApplication(compiled,source,path.join(directory,'package'),{optimize,linkObjects:[harness]});
    const env={...process.env,PATH:process.platform==='win32'?process.env.SystemRoot+'\\System32':'/usr/bin:/bin',LD_LIBRARY_PATH:''};
    const run=args=>{
      const r=spawnSync(binary,args,{cwd:directory,env,encoding:'utf8',timeout:30000});
      assert.ifError(r.error);assert.equal(r.signal,null,r.stderr);assert.notEqual(r.status,91,r.stdout);return r;
    };
    const output=path.join(directory,'recursos ação 测试','subpasta');
    const args=['--output',output];
    const result=run(args);assert.equal(result.status,0,result.stdout+result.stderr);
    const expected=expectedFiles()[index],metrics={};
    assert.deepEqual(fs.readdirSync(output).sort(),Object.keys(expected).sort());
    const previous={};
    for(const [file,data]of Object.entries(expected)) {
      const actual=fs.readFileSync(path.join(output,file));previous[file]=actual;
      if(file.endsWith('.png'))assert.deepEqual(decodePNG(actual),decodePNG(data),file);
      else if(file.endsWith('.wav'))metrics[file]=comparePCM(actual,data,file);
      else assert.deepEqual(actual,data,file);
    }
    t.diagnostic(JSON.stringify({platform:process.platform,optimize,name,pcm:metrics}));
    // CLI é validada antes de qualquer gravação, incluindo repetição e excesso.
    for(const bad of [[],['--output'],['--output',''],['--unknown',output],[...args,'--output',output],[...args,'extra'],['--output',output+'x'.repeat(65536)]]) {
      // Windows limita a linha de comando inteira a 32767 UTF-16; testar o
      // limite interno de caminho/argumentos pelo teste de API nessa plataforma.
      if(process.platform==='win32'&&(bad.at(-1)?.length??0)>32700)continue;
      const failed=run(bad);assert.notEqual(failed.status,0,failed.stdout);
      for(const [file,data]of Object.entries(previous))assert.deepEqual(fs.readFileSync(path.join(output,file)),data,file);
    }
    const again=run(args);assert.equal(again.status,0,again.stdout+again.stderr);
    for(const [file,data]of Object.entries(previous))assert.deepEqual(fs.readFileSync(path.join(output,file)),data,`repetição ${file}`);
  } finally {fs.rmSync(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
