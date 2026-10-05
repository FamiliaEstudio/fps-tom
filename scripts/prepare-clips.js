'use strict';
// Preparador offline: PNG RGB/RGBA8 sem interlace + WAV PCM, sem codecs no jogo.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {png,crc32}=require('./generate-assets');
function decodePNG(bytes){
  if(!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))throw Error('PNG inválido');
  let width,height,channels,compressed=[],ended=false;
  for(let at=8;at+12<=bytes.length;){const n=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+n);if(at+12+n>bytes.length)throw Error('PNG truncado');if(crc32(bytes.subarray(at+4,at+8+n))!==bytes.readUInt32BE(at+8+n))throw Error('CRC PNG inválido');
    if(type==='IHDR'){if(channels||n!==13||at!==8)throw Error('IHDR inválido');width=data.readUInt32BE();height=data.readUInt32BE(4);channels=data[9]===6?4:data[9]===2?3:0;if(data[8]!==8||!channels||data[10]!==0||data[11]!==0||data[12]!==0||width<1||height<1||width>4096||height>4096)throw Error('Use PNG RGB/RGBA8, sem interlace, até 4096x4096');}
    if(type==='IDAT'){if(!channels)throw Error('IDAT antes de IHDR');compressed.push(data);}at+=n+12;if(type==='IEND'){if(n!==0||at!==bytes.length)throw Error('IEND inválido');ended=true;break;}
  }
  if(!channels||!ended||!compressed.length)throw Error('PNG incompleto');
  const stride=width*channels,raw=zlib.inflateSync(Buffer.concat(compressed),{maxOutputLength:(stride+1)*height});
  if(raw.length!==(stride+1)*height)throw Error('Linhas PNG inválidas');
  const decoded=Buffer.alloc(stride*height),rgba=Buffer.alloc(width*height*4);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Filtro PNG inválido');for(let x=0;x<stride;x++){const a=x>=channels?decoded[y*stride+x-channels]:0,b=y?decoded[(y-1)*stride+x]:0,c=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;
    decoded[y*stride+x]=(raw[y*(stride+1)+1+x]+[0,a,b,(a+b)>>1,paeth(a,b,c)][filter])&255;}}
  for(let i=0;i<width*height;i++){decoded.copy(rgba,i*4,i*channels,i*channels+3);rgba[i*4+3]=channels===4?decoded[i*channels+3]:255;}
  return{width,height,pixels:rgba};
}
function wavFrames(bytes){
  if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('WAV inválido');
  if(bytes.readUInt32LE(4)+8!==bytes.length)throw Error('Tamanho RIFF inválido');let format,data,at=12;
  while(at<bytes.length){if(at+8>bytes.length)throw Error('Cabeçalho WAV truncado');const n=bytes.readUInt32LE(at+4),type=bytes.toString('ascii',at,at+4),end=at+8+n,next=end+(n&1);if(next>bytes.length)throw Error('WAV truncado ou sem alinhamento');
    if(type==='fmt '){if(format!==undefined)throw Error('Chunk fmt WAV duplicado');format=bytes.subarray(at+8,end);}
    if(type==='data'){if(data!==undefined)throw Error('Chunk data WAV duplicado');data=n;}
    at=next;
  }
  if(!format||format.length<16||data===undefined||format.readUInt16LE()!==1||format.readUInt32LE(4)!==48000||format.readUInt16LE(14)!==16||![1,2].includes(format.readUInt16LE(2)))throw Error('Use WAV PCM16, 48000 Hz, mono/estéreo');
  const channels=format.readUInt16LE(2),align=channels*2;if(format.readUInt16LE(12)!==align||format.readUInt32LE(8)!==48000*align||data%align)throw Error('Alinhamento PCM inválido');return data/align;
}
function pack(frames,{fps=12,audio}={}){
  if(!Number.isInteger(fps)||fps<1||fps>30||48000%fps||!frames.length||frames.length>fps*8)throw Error('Clipe exige 1..8 segundos, taxa inteira de 1..30 divisora de 48000');
  const {width,height}=frames[0];if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>128||height>96||frames.some(f=>f.width!==width||f.height!==height||!Buffer.isBuffer(f.pixels)||f.pixels.length!==width*height*4))throw Error('Quadros devem ter mesma dimensão, até 128x96');
  if(audio&&wavFrames(audio)!==frames.length*48000/fps)throw Error('Duração WAV deve coincidir exatamente com o loop');
  const columns=Math.min(8,frames.length),rows=Math.ceil(frames.length/columns),atlasWidth=columns*width,atlasHeight=rows*height,pixels=Buffer.alloc(atlasWidth*atlasHeight*4);
  frames.forEach((frame,i)=>{const x=(i%columns)*width,y=Math.floor(i/columns)*height;for(let row=0;row<height;row++)frame.pixels.copy(pixels,((y+row)*atlasWidth+x)*4,row*width*4,(row+1)*width*4);});
  return{atlas:png(atlasWidth,atlasHeight,pixels),metadata:{version:1,width,height,fps,frames:frames.length,columns,rows,durationSamples:frames.length*48000/fps,audio:!!audio}};
}
function tomMetadata(metadata){
  // Ambos os formatos sao derivados dos mesmos campos, sem adaptadores de texto no jogo.
  const fields={largura:metadata.width,altura:metadata.height,taxa:metadata.fps,quadros:metadata.frames,colunas:metadata.columns,linhas:metadata.rows,duracaoAmostras:metadata.durationSamples};
  if(Object.values(fields).some(n=>!Number.isSafeInteger(n)||n<1)||metadata.width>128||metadata.height>96||metadata.fps>30||48000%metadata.fps||metadata.frames>metadata.fps*8||metadata.columns>8||metadata.columns>metadata.frames||metadata.rows!==Math.ceil(metadata.frames/metadata.columns)||metadata.durationSamples!==metadata.frames*48000/metadata.fps||typeof metadata.audio!=='boolean')throw Error('Metadados de clipe inválidos');
  return "Importar[l'../src/clipe3d.tom']\nDefFuncaoxFpsClipePreparado[]yRegistro<FpsClipe3D>\nDefVarRegistro<FpsClipe3D>xRyPadrao\n"+Object.entries(fields).map(([name,value])=>`SetVarInSd64xR.${name}y${value}\n`).join('')+`SetVarBlxR.audioy${metadata.audio?'Verdadeiro':'Falso'}\nRetornarx@R\nFimFuncao\n`;
}
function main(){const args=process.argv.slice(2),get=(name)=>args[args.indexOf(name)+1];if(!args.includes('--frames')||!args.includes('--output'))throw Error('Use --frames pasta --output prefixo [--audio arquivo.wav] [--fps 12]');
  const folder=get('--frames'),prefix=get('--output'),names=fs.readdirSync(folder).filter(n=>n.toLowerCase().endsWith('.png')).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
  const audio=args.includes('--audio')?fs.readFileSync(get('--audio')):undefined,result=pack(names.map(n=>decodePNG(fs.readFileSync(path.join(folder,n)))),{fps:args.includes('--fps')?Number(get('--fps')):12,audio});
  fs.mkdirSync(path.dirname(prefix),{recursive:true});fs.writeFileSync(prefix+'.png',result.atlas);fs.writeFileSync(prefix+'.json',JSON.stringify(result.metadata,null,2)+'\n');fs.writeFileSync(prefix+'.tom',tomMetadata(result.metadata));if(audio)fs.writeFileSync(prefix+'.wav',audio);
}
if(require.main===module)main();module.exports={decodePNG,wavFrames,pack,tomMetadata};
