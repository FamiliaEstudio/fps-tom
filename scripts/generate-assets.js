'use strict';
// Referência de regressão. Uso normal: ferramentas/gerar-recursos.tom (build-tools.js).
// Pixel art and synthesized sounds authored for this game. No external assets.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const directory=path.join(__dirname,'../assets');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),out.length-4);return out;}
function png(width,height,pixels){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function atlas(){
  const width=1024,height=512,p=Buffer.alloc(width*height*4);let tile=0;
  function pixel(x,y,c){if(x<0||x>=64||y<0||y>=64)return;const i=((Math.floor(tile/16)*64+y)*width+(tile%16)*64+x)*4;p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2];p[i+3]=c[3]??255;}
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
  for (tile=8;tile<=10;tile++) {
    rect(0,0,64,64,ink);rect(3,0,58,64,[66,79,86]);
    for(let x=7;x<64;x+=9)rect(x,2,2,60,steel);
    rect(0,0,64,5,gold);rect(0,59,64,5,gold);
    const badge=tile===8?gold:tile===9?[65,175,255]:red;
    rect(22,19,21,28,ink);rect(25,22,15,22,badge);
    // A barra unica azul e a cruz vermelha distinguem as chaves sem depender da cor.
    rect(31,26,3,14,ink);if(tile===10)rect(27,31,11,3,ink);
  }
  for(tile=11;tile<=12;tile++) {
    const c=tile===11?[65,175,255]:red;
    ellipse(22,25,12,12,ink);ellipse(22,25,9,9,c);ellipse(22,25,4,4,ink);
    rect(29,23,26,6,c);rect(44,26,5,10,c);if(tile===12)rect(52,26,4,10,c);
  }
  tile=13;ellipse(32,57,24,5,[0,0,0,100]);rect(15,20,34,37,ink);rect(18,22,28,32,steel);
  for(let y=25;y<50;y+=7)rect(21,y,22,3,edge);rect(25,13,14,9,gold);
  tile=14;rect(0,0,64,64,[255,255,255]);
  for(const [base,warm] of [[16,true],[20,false]])for(let t=0;t<3;t++) {
    tile=base+t;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){
      const i=(y*width+t*64+x)*4;
      const c=warm?[Math.min(255,p[i]*1.25),p[i+1]*.7,p[i+2]*.45]:[p[i]*.55,p[i+1]*.9,Math.min(255,p[i+2]*1.25)];
      pixel(x,y,c.map(Math.round));
    }
    if(!warm){rect(4,29,56,3,[42,230,217]);rect(4,32,56,2,ink);}
  }
  // Fonte bitmap original 5x7. Glifos ocupam as celulas ASCII 32..126.
  const glyphs={
    'A':'01110/10001/10001/11111/10001/10001/10001','B':'11110/10001/10001/11110/10001/10001/11110',
    'C':'01111/10000/10000/10000/10000/10000/01111','D':'11110/10001/10001/10001/10001/10001/11110',
    'E':'11111/10000/10000/11110/10000/10000/11111','F':'11111/10000/10000/11110/10000/10000/10000',
    'G':'01111/10000/10000/10111/10001/10001/01111','H':'10001/10001/10001/11111/10001/10001/10001',
    'I':'11111/00100/00100/00100/00100/00100/11111','J':'00111/00010/00010/00010/10010/10010/01100',
    'K':'10001/10010/10100/11000/10100/10010/10001','L':'10000/10000/10000/10000/10000/10000/11111',
    'M':'10001/11011/10101/10101/10001/10001/10001','N':'10001/11001/10101/10011/10001/10001/10001',
    'O':'01110/10001/10001/10001/10001/10001/10001/01110','P':'11110/10001/10001/11110/10000/10000/10000',
    'Q':'01110/10001/10001/10001/10101/10010/01101','R':'11110/10001/10001/11110/10100/10010/10001',
    'S':'01111/10000/10000/01110/00001/00001/11110','T':'11111/00100/00100/00100/00100/00100/00100',
    'U':'10001/10001/10001/10001/10001/10001/01110','V':'10001/10001/10001/10001/10001/01010/00100',
    'W':'10001/10001/10001/10101/10101/11011/10001','X':'10001/10001/01010/00100/01010/10001/10001',
    'Y':'10001/10001/01010/00100/00100/00100/00100','Z':'11111/00001/00010/00100/01000/10000/11111',
    '0':'01110/10001/10011/10101/11001/10001/01110','1':'00100/01100/00100/00100/00100/00100/01110',
    '2':'01110/10001/00001/00010/00100/01000/11111','3':'11110/00001/00001/01110/00001/00001/11110',
    '4':'00010/00110/01010/10010/11111/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110',
    '6':'01110/10000/10000/11110/10001/10001/01110','7':'11111/00001/00010/00100/01000/01000/01000',
    '8':'01110/10001/10001/01110/10001/10001/01110','9':'01110/10001/10001/01111/00001/00001/01110',
    '-':'00000/00000/00000/11111/00000/00000/00000','/':'00001/00010/00010/00100/01000/01000/10000',
    '!':'00100/00100/00100/00100/00100/00000/00100','?':'01110/10001/00001/00010/00100/00000/00100',
    '.':'00000/00000/00000/00000/00000/00000/00100',':':'00000/00100/00100/00000/00100/00100/00000'
  };
  glyphs.O='01110/10001/10001/10001/10001/10001/01110';
  for(const [ch,pattern] of Object.entries(glyphs)){
    tile=ch.charCodeAt(0);
    pattern.split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')rect(x*10,y*8,10,8,[255,255,255]);}));
  }
  return png(width,height,p);
}
function wav(kind){const rate=48000,count=Math.round(rate*(kind==='tiro'?.14:kind==='dano'?.19:kind==='abrir'||kind==='fechar'?.5:.24));const out=Buffer.alloc(44+count*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(count*2,40);let noise=123456789;for(let i=0;i<count;i++){const t=i/rate,u=i/count;noise=(Math.imul(noise,1664525)+1013904223)>>>0;const random=noise/4294967296*2-1;const s=kind==='abrir'||kind==='fechar'?(random*.12+Math.sin(2*Math.PI*(kind==='abrir'?120+80*u:200-80*u)*t)*.25)*Math.sin(Math.PI*u):kind==='tiro'?(random*.45+Math.sin(2*Math.PI*(95*t-120*t*t))*.4)*Math.exp(-u*7):kind==='dano'?(Math.sin(2*Math.PI*83*t)*.55+random*.12)*(1-u):Math.sin(2*Math.PI*(520*t+900*t*t))*.35*Math.sin(Math.PI*u);out.writeInt16LE(Math.round(s*28000),44+i*2);}return out;}
function generate(){fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'atlas.png'),atlas());for(const kind of ['tiro','dano','item','abrir','fechar'])fs.writeFileSync(path.join(directory,kind+'.wav'),wav(kind));}
if(require.main===module){generate();process.stdout.write('Assets do FPS Tom gerados.\n');}
module.exports={atlas,wav,png,crc32,generate};
