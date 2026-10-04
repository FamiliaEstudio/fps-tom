'use strict';
const fs=require('node:fs'),path=require('node:path');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..'),file=path.join(app,'src/fps-tom.tom');
function build({optimize='-O2',testUI=false,output=path.join(app,'build',process.platform==='win32'?'windows':'linux',testUI?'test':'package')}={}){
  const result=compileResolved(fs.readFileSync(file,'utf8'),{file});
  if(!result.success)throw new Error(JSON.stringify(result.diagnostics));
  const binary=buildApplication(result,file,output,{optimize,testUI,assets:path.join(app,'assets')});
  fs.copyFileSync(path.join(app,'README.md'),path.join(path.dirname(binary),'LEIA-ME.md'));
  return binary;
}
if(require.main===module)process.stdout.write(build()+'\n');
module.exports={build,app};
