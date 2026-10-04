'use strict';
// Pixel art and synthesized sounds authored for this game. No external assets.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const directory=path.join(__dirname,'../assets');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),out.length-4);return out;}
function png(width,height,pixels){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function atlas(){
  const width=512,height=64,p=Buffer.alloc(width*height*4);let tile=0;
  function pixel(x,y,c){if(x<0||x>=64||y<0||y>=64)return;const i=(y*width+tile*64+x)*4;p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2];p[i+3]=c[3]??255;}
  function rect(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixel(xx,yy,c);}
  function ellipse(cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)pixel(x,y,c);}
  const ink=[14,20,26],edge=[28,40,47],steel=[87,108,114],light=[173,192,185],gold=[226,171,70],red=[232,68,56],green=[82,236,159];
  for(tile=0;tile<3;tile++){
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=((x*73+y*179+x*y*7)%17)-8;const base=tile===0?[103,99,82]:tile===1?[58,76,82]:[45,59,58];pixel(x,y,base.map(v=>v+n));}
    rect(0,0,64,2,ink);rect(0,62,64,2,ink);rect(0,0,2,64,ink);rect(62,0,2,64,ink);
    if(tile===0){for(let y=16;y<64;y+=16){rect(0,y,64,2,edge);rect(0,y+2,64,1,[129,121,98]);}for(let y=0;y<4;y++)rect(y%2?32:16,y*16,2,16,edge);}
    if(tile===1){rect(7,7,50,50,ink);rect(9,9,46,45,[66,84,90]);for(let y=14;y<48;y+=5){rect(14,y,36,2,edge);rect(14,y+2,36,1,steel);}rect(0,54,64,7,gold);for(let x=-8;x<70;x+=14)for(let y=0;y<7;y++)rect(x+y,54+y,6,1,ink);}
    if(tile===2){rect(9,3,46,58,ink);rect(12,5,40,54,edge);for(let x=17;x<48;x+=10){rect(x,10,4,44,[32,121,113]);rect(x+1,10,2,44,[115,223,178]);}rect(7,5,50,4,steel);rect(7,54,50,5,steel);}
    for(const [x,y] of [[4,4],[58,4],[4,58],[58,58]]){rect(x,y,2,2,light);rect(x,y+2,2,1,ink);}
  }
  tile=3;ellipse(32,59,24,4,[0,0,0,95]);
  rect(15,34,9,22,ink);rect(40,34,9,22,ink);rect(15,47,10,5,steel);rect(39,47,10,5,steel);rect(12,55,14,5,edge);rect(38,55,14,5,edge);
  ellipse(32,27,24,22,ink);ellipse(32,25,21,19,steel);ellipse(30,20,17,12,light);rect(9,25,46,12,ink);rect(15,28,34,6,[116,36,32]);rect(23,27,18,8,red);rect(28,28,8,4,[255,232,144]);
  rect(5,25,7,20,edge);rect(52,25,7,20,edge);rect(4,39,9,4,gold);rect(51,39,9,4,gold);rect(24,39,16,5,edge);rect(30,40,4,3,red);
  tile=4;ellipse(32,58,21,4,[0,0,0,90]);rect(14,26,37,31,ink);rect(17,23,31,32,[161,185,170]);rect(20,26,26,3,[217,227,189]);rect(26,17,13,8,ink);rect(29,20,7,4,steel);rect(28,32,8,18,red);rect(23,37,18,8,red);rect(18,52,29,3,edge);
  tile=5;ellipse(32,58,22,4,[0,0,0,90]);rect(11,36,43,22,ink);rect(14,38,37,17,[67,78,64]);for(let x=18;x<49;x+=9){rect(x,24,6,23,[151,108,44]);rect(x+1,24,3,22,gold);rect(x+1,19,3,6,[235,212,140]);}rect(14,45,37,7,edge);rect(26,47,13,3,gold);
  tile=6;rect(9,0,46,64,ink);rect(12,3,40,61,[38,64,63]);rect(18,9,28,55,[9,28,32]);rect(14,8,3,53,green);rect(47,8,3,53,green);rect(17,5,30,4,green);rect(25,26,17,5,green);for(let j=0;j<7;j++)rect(35+j,21+j,3,15-2*j,green);rect(20,59,24,5,steel);
  tile=7;rect(12,50,40,14,ink);rect(16,38,32,26,[41,52,56]);rect(22,19,21,36,ink);rect(24,17,17,33,steel);rect(26,10,13,30,edge);rect(28,8,9,24,light);rect(30,11,5,17,ink);rect(19,39,27,14,[106,119,113]);rect(21,40,23,3,light);rect(22,45,5,5,gold);rect(35,44,7,7,ink);rect(27,52,12,12,[25,35,41]);
  return png(width,height,p);
}
function wav(kind){const rate=48000,count=Math.round(rate*(kind==='tiro'?.14:kind==='dano'?.19:.24));const out=Buffer.alloc(44+count*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(count*2,40);let noise=123456789;for(let i=0;i<count;i++){const t=i/rate,u=i/count;noise=(Math.imul(noise,1664525)+1013904223)>>>0;const random=noise/4294967296*2-1;const s=kind==='tiro'?(random*.45+Math.sin(2*Math.PI*(95*t-120*t*t))*.4)*Math.exp(-u*7):kind==='dano'?(Math.sin(2*Math.PI*83*t)*.55+random*.12)*(1-u):Math.sin(2*Math.PI*(520*t+900*t*t))*.35*Math.sin(Math.PI*u);out.writeInt16LE(Math.round(s*28000),44+i*2);}return out;}
function generate(){fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'atlas.png'),atlas());for(const kind of ['tiro','dano','item'])fs.writeFileSync(path.join(directory,kind+'.wav'),wav(kind));}
if(require.main===module){generate();process.stdout.write('Assets do FPS Tom gerados.\n');}
module.exports={atlas,wav,generate};
