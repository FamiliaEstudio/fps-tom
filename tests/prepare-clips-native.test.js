'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const {compileResolved}=require('../../../tom-lang/core/module-loader');
const {buildApplication}=require('../../../tom-lang/core/native-build');
const {png,crc32}=require('../scripts/generate-assets');
const {decodePNG,pack,tomMetadata}=require('../scripts/prepare-clips');
function frame(index,width=3,height=2) {
  const pixels=Buffer.alloc(width*height*4);for(let p=0;p<pixels.length;p++)pixels[p]=(index*29+p*61)%256;
  return {width,height,pixels};
}
function wav(frames,channels=1) {
  const bytes=Buffer.alloc(44+frames*channels*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);
  bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(channels,22);bytes.writeUInt32LE(48000,24);
  bytes.writeUInt32LE(48000*channels*2,28);bytes.writeUInt16LE(channels*2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
  for(let i=44;i<bytes.length;i+=2)bytes.writeInt16LE((i*73)%65536-32768,i);return bytes;
}
function riff(parts) {const data=Buffer.concat([Buffer.from('WAVE'),...parts]),header=Buffer.alloc(8);header.write('RIFF');header.writeUInt32LE(data.length,4);return Buffer.concat([header,data]);}
function chunk(type,data) {const part=Buffer.alloc(data.length+12);part.writeUInt32BE(data.length);part.write(type,4);data.copy(part,8);part.writeUInt32BE(crc32(part.subarray(4,-4)),part.length-4);return part;}
function filtered(image,channels,filter) {
  const {width,height,pixels}=image,stride=width*channels,raw=Buffer.alloc(stride*height),rows=Buffer.alloc((stride+1)*height);
  for(let i=0;i<width*height;i++)pixels.copy(raw,i*channels,i*4,i*4+channels);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){rows[y*(stride+1)]=filter;for(let x=0;x<stride;x++){
    const a=x>=channels?raw[y*stride+x-channels]:0,b=y?raw[(y-1)*stride+x]:0,c=y&&x>=channels?raw[(y-1)*stride+x-channels]:0;
    rows[y*(stride+1)+x+1]=(raw[y*stride+x]-[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }}
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=channels===4?6:2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
for(const optimize of ['-O0','-O2'])test(`Tom clip preparer preserves pixels, PCM, metadata and failed destinations ${optimize}`,()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'tom-clips-'));
  try {
    const source=path.resolve(__dirname,'../ferramentas/preparar-clipes.tom');
    const compiled=compileResolved(fs.readFileSync(source,'utf8'),{file:source});assert.equal(compiled.success,true,JSON.stringify(compiled.diagnostics));
    // Run the actual tool body with the same argv and assert complete cleanup.
    compiled.artifacts.llvm=compiled.artifacts.llvm.replace('define i32 @main(', 'define i32 @tom_program_main(');
    const harness=path.join(directory,'leaks.c');
    fs.writeFileSync(harness,'#include <stdint.h>\n#include <stdio.h>\nextern int tom_program_main(int,char**);\nextern int64_t tom_live_objects(void);\nint main(int argc,char**argv){int status=tom_program_main(argc,argv);if(tom_live_objects()){puts("LEAK");return 91;}return status;}\n');
    const binary=buildApplication(compiled,source,path.join(directory,'package'),{optimize,linkObjects:[harness]});
    const env={...process.env,PATH:process.platform==='win32'?process.env.SystemRoot+'\\System32':'/usr/bin:/bin',LD_LIBRARY_PATH:''};
    const run=args=>{const r=spawnSync(binary,args,{cwd:directory,env,encoding:'utf8',timeout:15000});assert.ifError(r.error);assert.equal(r.signal,null,r.stderr);assert.notEqual(r.status,91,r.stdout);return r;};
    const folder=path.join(directory,'quadros ação 测试');fs.mkdirSync(folder);
    const prefix=path.join(directory,'saída 测试','tv');
    const images=[1,2,3,4,5,6,7,8,10].map(i=>frame(i));
    for(const [i,image] of images.entries())fs.writeFileSync(path.join(folder,`quadro${i===8?10:i+1}.${i===0?'PNG':'png'}`),png(image.width,image.height,image.pixels));
    fs.writeFileSync(path.join(folder,'ignorar.txt'),'ignored');fs.mkdirSync(path.join(folder,'pasta.png'));
    function check(expected,audio) {
      assert.deepEqual(decodePNG(fs.readFileSync(prefix+'.png')),decodePNG(expected.atlas));
      assert.equal(fs.readFileSync(prefix+'.json','utf8'),JSON.stringify(expected.metadata,null,2)+'\n');
      assert.equal(fs.readFileSync(prefix+'.tom','utf8'),tomMetadata(expected.metadata));
      if(audio)assert.deepEqual(fs.readFileSync(prefix+'.wav'),audio);
    }
    const base=['--frames',folder,'--output',prefix];
    let result=run(base);assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(result.stdout.replace(/\r\n/g,'\n'),'Clipe preparado.\n');check(pack(images));
    for(const channels of [1,2]) {
      const original=wav(images.length*4000,channels);
      const odd=Buffer.from([74,85,78,75,1,0,0,0,23,0]);
      const audio=riff([original.subarray(12,36),odd,original.subarray(36)]);
      const audioFile=path.join(directory,'áudio.wav');fs.writeFileSync(audioFile,audio);
      result=run([...base,'--audio',audioFile,'--fps','12']);assert.equal(result.status,0,result.stdout+result.stderr);check(pack(images,{audio}),audio);
    }
    // Rejected inputs must leave the entire previously published set unchanged.
    const previous=Object.fromEntries(['.png','.json','.tom','.wav'].map(ext=>[ext,fs.readFileSync(prefix+ext)]));
    const fail=args=>{const r=run(args);assert.notEqual(r.status,0,r.stdout);for(const [ext,bytes] of Object.entries(previous))assert.deepEqual(fs.readFileSync(prefix+ext),bytes);};
    for(const args of [[],['--frames'],[...base,'--unknown','x'],[...base,'--frames',folder],...['0','7','31','NaN','999999999999'].map(fps=>[...base,'--fps',fps]),[...base,'--fps','1']])fail(args);
    const audioFile=path.join(directory,'bad.wav'),good=wav(images.length*4000);
    for(const [offset,value,width] of [[4,good.length,4],[20,3,2],[22,3,2],[24,44100,4],[28,1,4],[32,7,2],[34,8,2],[40,0xffffffff,4]]) {
      const bad=Buffer.from(good);width===2?bad.writeUInt16LE(value,offset):bad.writeUInt32LE(value,offset);fs.writeFileSync(audioFile,bad);fail([...base,'--audio',audioFile]);
    }
    const oddPCM=Buffer.from(good);oddPCM.writeUInt32LE(good.length-45,40);
    for(const bad of [Buffer.alloc(0),good.subarray(0,43),wav(images.length*4000-1),oddPCM,riff([good.subarray(12,36),good.subarray(12,36),good.subarray(36)]),riff([good.subarray(12,36),good.subarray(36),good.subarray(36)]),riff([good.subarray(12,36),Buffer.from([74,85,78,75,1,0,0,0,7]),good.subarray(36)])]) {
      fs.writeFileSync(audioFile,bad);fail([...base,'--audio',audioFile]);
    }
    const badFrame=path.join(folder,'quadro1.PNG'),original=fs.readFileSync(badFrame),crc=Buffer.from(original);crc[32]^=1;
    for(const bad of [Buffer.alloc(0),original.subarray(0,28),original.subarray(0,original.length-1),crc,png(2,1,frame(1,2,1).pixels),png(129,1,frame(1,129,1).pixels),png(1,97,frame(1,1,97).pixels)]) {
      fs.writeFileSync(badFrame,bad);fail(base);
    }
    for(const [offset,value] of [[8,16],[9,3],[10,1],[11,1],[12,1]]) {
      const header=Buffer.from(original.subarray(16,29));header[offset]=value;
      fs.writeFileSync(badFrame,Buffer.concat([original.subarray(0,8),chunk('IHDR',header),original.subarray(33)]));fail(base);
    }
    fs.writeFileSync(badFrame,original);
    const empty=path.join(directory,'vazio');fs.mkdirSync(empty);fail(['--frames',empty,'--output',prefix]);
    fail(['--frames',path.join(directory,'ausente'),'--output',prefix]);
    // Maximum frame count, numeric order beyond 99, and partial last rows.
    const many=path.join(directory,'maximo');fs.mkdirSync(many);const manyFrames=[];
    for(let i=0;i<240;i++){const f=frame(i,1,1);manyFrames.push(f);fs.writeFileSync(path.join(many,`f${i}.png`),png(1,1,f.pixels));}
    result=run(['--frames',many,'--output',prefix,'--fps','30']);assert.equal(result.status,0,result.stdout+result.stderr);check(pack(manyFrames,{fps:30}));
    const predictors=path.join(directory,'preditores');fs.mkdirSync(predictors);const decoded=[];
    for(const channels of [3,4])for(let filter=0;filter<=4;filter++){
      const input=filtered(frame(filter),channels,filter);decoded.push(decodePNG(input));fs.writeFileSync(path.join(predictors,`f${decoded.length}.png`),input);
    }
    result=run(['--frames',predictors,'--output',prefix]);assert.equal(result.status,0,result.stdout+result.stderr);check(pack(decoded));
    const maximum=path.join(directory,'dimensoes');fs.mkdirSync(maximum);const large=frame(1,128,96);fs.writeFileSync(path.join(maximum,'f1.png'),png(128,96,large.pixels));
    result=run(['--frames',maximum,'--output',prefix,'--fps','1']);assert.equal(result.status,0,result.stdout+result.stderr);check(pack([large],{fps:1}));
  } finally{fs.rmSync(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
