'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {build,app}=require('./build');
function completed(child){return new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(status,signal)=>resolve({status,signal}));});}
async function main(){
  const production=process.argv.includes('--package'),windows=process.platform==='win32';
  const output=path.join(app,'build',windows?'windows':'linux',production?'package':'desktop');fs.mkdirSync(output,{recursive:true});
  const receipt=path.join(output,'verification.json');fs.rmSync(receipt,{force:true});
  const binary=build({testUI:!production,output}),trace=path.join(output,'desktop.trace');
  const env={...process.env};
  if(!production)env.SDL_RENDER_DRIVER='software';
  for(const name of ['TOM_UI_EVENTS','TOM_UI_TRACE','TOM_UI_SNAPSHOT','SDL_VIDEODRIVER','SDL_AUDIODRIVER','LD_LIBRARY_PATH'])delete env[name];
  if(process.env.TOM_VERIFY_AUDIO_DRIVER)env.SDL_AUDIODRIVER=process.env.TOM_VERIFY_AUDIO_DRIVER;
  if(!production){env.TOM_UI_TRACE=trace;env.TOM_UI_SNAPSHOT=path.join(output,'desktop.bmp');}
  env.PATH=windows?`${process.env.SystemRoot}/System32;${process.env.SystemRoot}`:'/usr/bin:/bin';
  const child=spawn(binary,[],{env,cwd:os.tmpdir(),stdio:['ignore','pipe','pipe']}),done=completed(child);
  let stdout='',stderr='',driver;
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
  const timeout=setTimeout(()=>{child.kill();driver?.kill();},45000);
  try {
    const scripts=path.resolve(app,'../../scripts');
    driver=spawn(windows?'powershell.exe':'python3',windows?['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(scripts,'desktop-windows.ps1'),'-ProcessId',String(child.pid),'-StateDemo','fps','-Trace',trace,...(production?['-Production']:[])]:[path.join(scripts,'desktop-linux.py'),String(child.pid),'--state','fps','--trace',trace,...(production?['--production']:[])],{stdio:'inherit'});
    const input=await completed(driver),result=await done;
    assert.equal(input.status,0,'desktop input');assert.equal(result.status,0,stdout+stderr);assert.equal(result.signal,null,stderr);
    if(!production)assert.ok(fs.readFileSync(trace,'utf8').split('FRAME').length>5);
    const report={platform:process.platform,production,binary,status:'passed',renderer:env.SDL_RENDER_DRIVER||'default',audio:env.SDL_AUDIODRIVER||'system device',relativeMouse:!stdout.includes('Mouse relativo indisponivel'),time:new Date().toISOString()};
    fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }finally{clearTimeout(timeout);if(child.exitCode===null)child.kill();if(driver&&driver.exitCode===null)driver.kill();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
