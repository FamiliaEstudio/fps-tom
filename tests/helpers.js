'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execute}=require('../../../tom-lang/tests/helpers');
const {loadModules}=require('../../../tom-lang/core/module-loader');
const root=path.resolve(__dirname,'..'),file=path.join(__dirname,'case.tom');
const environment={SDL_VIDEODRIVER:'dummy',SDL_RENDER_DRIVER:'software',SDL_AUDIODRIVER:'dummy'};
const eq=(a,b,type='InSd32')=>`CompararIgualxy${type}x${a}y${b}\nExigir[@ULTIMO]\n`;
function run(source,optimize,options={}){const sourceFile=options.file||file;const r=execute(source,{file:sourceFile,modules:loadModules(source,sourceFile),optimize,assets:path.join(root,'assets'),environment,maximumLiveObjects:64,...options});assert.equal(r.status,0,r.stdout+r.stderr);return r;}
const game=()=>fs.readFileSync(path.join(root,'src/fps-tom.tom'),'utf8');
module.exports={root,file,eq,run,game,environment};
