'use strict';
// Referência de regressão. Uso normal: ferramentas/gerar-recursos-3d.tom (build-tools.js).
const fs=require('node:fs'),path=require('node:path');
const {atlas,png}=require('./generate-assets'),{decodePNG,pack,tomMetadata}=require('./prepare-clips');
const directory=path.resolve(__dirname,'../assets');
function atlas3d(){const image=decodePNG(atlas()),{pixels,width,height}=image;
  const pixel=(tile,x,y,c)=>{const at=((Math.floor(tile/16)*64+y)*width+tile%16*64+x)*4;pixels.set([...c.slice(0,3),c[3]??255],at);};
  const rect=(tile,x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixel(tile,xx,yy,c);};
  for(let tile=23;tile<=31;tile++)rect(tile,0,0,64,64,[0,0,0,0]);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const seams=x%16===0||y%16===0,n=(x*7+y*13)%8;pixel(23,x,y,seams?[28,32,37]:[70+n,77+n,72+n]);pixel(24,x,y,x%32<2||y%32<2?[18,26,35]:[40+n,51+n,62+n]);}
  // Barril, foguete, pulso, explosão, arma, vidro e luminária.
  rect(25,14,8,36,52,[33,26,22]);rect(25,17,10,30,47,[129,51,26]);for(const y of [15,43])rect(25,14,y,36,5,[201,155,62]);rect(25,26,25,12,13,[255,225,103]);
  rect(26,24,18,16,39,[104,132,144]);rect(26,27,4,10,18,[225,69,42]);rect(26,20,45,24,13,[191,172,74]);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const d=Math.hypot(x-32,y-32);if(d<12)pixel(27,x,y,[255,Math.max(20,210-d*12),30,255]);if(d<30){const n=((x*17+y*31)%13)/13;pixel(28,x,y,[255,Math.round(80+150*n),18,Math.round(255*(1-d/30))]);}}
  rect(29,12,46,45,18,[30,42,48]);rect(29,17,23,33,28,[57,87,97]);rect(29,21,0,25,39,[111,145,144]);rect(29,26,2,15,19,[20,31,39]);rect(29,15,26,37,6,[219,179,57]);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++)pixel(30,x,y,[56,173,201,x<3||y<3||x>60||y>60?200:70]);
  rect(31,0,0,64,64,[27,39,43]);rect(31,7,25,50,14,[205,246,219]);rect(31,9,27,46,10,[246,255,222]);
  return png(width,height,pixels);
}
function pcm(seconds,sample){const rate=48000,frames=Math.round(seconds*rate),out=Buffer.alloc(44+frames*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(frames*2,40);for(let i=0;i<frames;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample(i/rate,i)))*24000),44+i*2);return out;}
function music(level){const notes=[[110,130.8128,146.8324,98],[82.4069,110,123.4708,73.4162],[65.4064,98,82.4069,110]][level];return pcm(8,(t,i)=>{const beat=Math.floor(t*4),phase=t%0.25,bass=notes[Math.floor(beat/4)%4],melody=bass*[2,3,4,3,2,1.5,2,3][beat%8],noise=(((Math.imul(i,1664525)+1013904223)>>>0)/4294967296*2-1);return Math.sin(t*2*Math.PI*bass)*.16+Math.sin(t*2*Math.PI*melody)*Math.exp(-phase*12)*.12+Math.sin(2*Math.PI*(55*t-30*phase*phase))*Math.exp(-phase*30)*.13+noise*Math.exp(-phase*80)*.035;});}
function tv(){const frames=[];for(let frame=0;frame<96;frame++){const pixels=Buffer.alloc(128*96*4);for(let y=0;y<96;y++)for(let x=0;x<128;x++){const at=(y*128+x)*4,scan=y%3===0?.55:1,orbit=Math.hypot(x-64-Math.cos(frame/12)*20,y-48-Math.sin(frame/12)*20),bars=Math.floor(x/16),v=(x+frame*3)%128;
      const rgb=orbit<17?[239,185,54]:y<14?[20,210,160]:[15+bars*8,35+v,65+(frame*7+y)%105];pixels.set([...rgb.map(c=>Math.round(c*scan)),255],at);}
    frames.push({width:128,height:96,pixels});}
  const audio=pcm(8,t=>Math.sin(t*2*Math.PI*164.8138)*.07+Math.sin(t*2*Math.PI*329.6276)*.025);return{...pack(frames,{audio}),audio};}
function explosion(){return pcm(.7,(t,i)=>{const noise=(((Math.imul(i,1103515245)+12345)>>>0)/4294967296*2-1);return(noise*.65+Math.sin(2*Math.PI*43*t)*.25)*Math.exp(-t*8);});}
function environment(){return pcm(8,t=>Math.sin(t*2*Math.PI*55)*.07+Math.sin(t*2*Math.PI*83)*.02);}
function generate(){fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'atlas3d.png'),atlas3d());for(let level=0;level<3;level++)fs.writeFileSync(path.join(directory,`musica${level}.wav`),music(level));fs.writeFileSync(path.join(directory,'explosao.wav'),explosion());fs.writeFileSync(path.join(directory,'ambiente.wav'),environment());const clip=tv();fs.writeFileSync(path.join(directory,'tv.png'),clip.atlas);fs.writeFileSync(path.join(directory,'tv.wav'),clip.audio);fs.writeFileSync(path.join(directory,'tv.json'),JSON.stringify(clip.metadata,null,2)+'\n');fs.writeFileSync(path.join(directory,'tv.tom'),tomMetadata(clip.metadata));}
if(require.main===module)generate();module.exports={atlas3d,music,tv,explosion,environment,generate};
