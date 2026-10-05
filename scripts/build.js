'use strict';
const fs=require('node:fs'),path=require('node:path');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..');
function build({optimize='-O2',testUI=false,renderer='sdl',output}={}){
  if(!['sdl','gpu'].includes(renderer))throw new Error('Renderer deve ser sdl ou gpu.');
  const file=path.join(app,'src',renderer==='gpu'?'fps-tom-gpu.tom':'fps-tom.tom');
  output??=path.join(app,'build',process.platform==='win32'?'windows':'linux',testUI?'test':'package',...(renderer==='gpu'?['gpu']:[]));
  const result=compileResolved(fs.readFileSync(file,'utf8'),{file});
  if(!result.success)throw new Error(JSON.stringify(result.diagnostics));
  const binary=buildApplication(result,file,output,{optimize,testUI,assets:path.join(app,'assets')});
  fs.copyFileSync(path.join(app,'README.md'),path.join(path.dirname(binary),'LEIA-ME.md'));
  fs.cpSync(path.join(app,'docs'),path.join(path.dirname(binary),'docs'),{recursive:true});
  const reports=path.join(app,'benchmarks');
  if(fs.existsSync(reports))fs.cpSync(reports,path.join(path.dirname(binary),'benchmarks'),{recursive:true});
  return binary;
}
if(require.main===module){
  const args=process.argv.slice(2),index=args.indexOf('--renderer'),renderer=index<0?'sdl':args[index+1];
  if(!['sdl','gpu','all'].includes(renderer))throw new Error('Use --renderer sdl|gpu|all');
  for(const backend of renderer==='all'?['sdl','gpu']:[renderer])process.stdout.write(build({renderer:backend})+'\n');
}
module.exports={build,app};
