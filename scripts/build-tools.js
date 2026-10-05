'use strict';
const fs=require('node:fs'),path=require('node:path');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication}=require('../../../tom-lang/core/native-build');
const app=path.resolve(__dirname,'..');
function buildTools({optimize='-O2',output}={}) {
  output??=path.join(app,'build',process.platform==='win32'?'windows':'linux','tools');
  return Object.fromEntries([
    ['prepareClips','preparar-clipes.tom'],
    ['generateAssets','gerar-recursos.tom'],
    ['generateResources3d','gerar-recursos-3d.tom'],
  ].map(([name,file])=>{
    const source=path.join(app,'ferramentas',file);
    const compiled=compileResolved(fs.readFileSync(source,'utf8'),{file:source});
    if(!compiled.success)throw new Error(JSON.stringify(compiled.diagnostics));
    return [name,buildApplication(compiled,source,output,{optimize})];
  }));
}
if(require.main===module)for(const binary of Object.values(buildTools()))process.stdout.write(binary+'\n');
module.exports={buildTools};
