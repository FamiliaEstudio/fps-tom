'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const{root,run,eq}=require('./helpers');
const{decodePNG,wavFrames,pack,tomMetadata}=require('../scripts/prepare-clips');
const resources=require('../scripts/generate-resources-3d');
const{comparePCM}=require('./resource-equivalence');
const{png}=require('../scripts/generate-assets');
const crc=bytes=>{let value=0xffffffff;for(const b of bytes){value^=b;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;};
function chunk(name,data){const kind=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);kind.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([kind,data])),out.length-4);return out;}
function fixturePNG(filter,channels=4){
 const width=3,height=2,rgba=Buffer.from([5,30,170,255,240,15,60,128,1,200,45,0,80,90,100,48,0,255,9,230,220,140,20,255]);
 const decoded=Buffer.alloc(width*height*channels);for(let i=0;i<width*height;i++)rgba.copy(decoded,i*channels,i*4,i*4+channels);
 const bytes=Buffer.alloc(height*(width*channels+1)),stride=width*channels;
 const paeth=(a,b,c)=>{const p=a+b-c,d=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];return d[0]<=d[1]&&d[0]<=d[2]?a:d[1]<=d[2]?b:c;};
 for(let y=0;y<height;y++){bytes[y*(stride+1)]=filter;for(let x=0;x<stride;x++){const a=x>=channels?decoded[y*stride+x-channels]:0,b=y?decoded[(y-1)*stride+x]:0,c=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;bytes[y*(stride+1)+x+1]=(decoded[y*stride+x]-[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=channels===4?6:2;
 const encoded=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(bytes)),chunk('IEND',Buffer.alloc(0))]);
 if(channels===3)for(let i=0;i<width*height;i++)rgba[i*4+3]=255;
 return{encoded,rgba};
}
function wav(frames,channels=1){const buffer=Buffer.alloc(44+frames*channels*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(channels,22);buffer.writeUInt32LE(48000,24);buffer.writeUInt32LE(48000*channels*2,28);buffer.writeUInt16LE(channels*2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(frames*channels*2,40);return buffer;}
function riff(parts){const body=Buffer.concat([Buffer.from('WAVE'),...parts]),header=Buffer.alloc(8);header.write('RIFF');header.writeUInt32LE(body.length,4);return Buffer.concat([header,body]);}
test('PNG clip preparation handles every RGBA/RGB8 predictor and preserves channels',()=>{
 for(const channels of [3,4])for(let filter=0;filter<=4;filter++){const f=fixturePNG(filter,channels),image=decodePNG(f.encoded);assert.equal(image.width,3);assert.equal(image.height,2);assert.deepEqual(image.pixels,f.rgba);}
});
test('PNG clip preparation rejects corrupt CRC, truncation, incomplete streams and unsupported headers',()=>{
 const good=fixturePNG(4).encoded,badCRC=Buffer.from(good);badCRC[32]^=1;
 assert.throws(()=>decodePNG(badCRC),/PNG|CRC/i);
 assert.throws(()=>decodePNG(good.subarray(0,good.length-12)),/PNG|IEND|completo/i);
 assert.throws(()=>decodePNG(good.subarray(0,good.length-15)));
 for(const [offset,value] of [[8,16],[9,3],[10,1],[11,1],[12,1]]){const header=Buffer.from(good.subarray(16,29));header[offset]=value;const altered=Buffer.concat([good.subarray(0,8),chunk('IHDR',header),good.subarray(33)]);assert.throws(()=>decodePNG(altered));}
});
test('Clip packs preserve frame order, exact UV grid, reproducibility and WAV loop duration',()=>{
 const images=[0,1,2].map(i=>({width:2,height:1,pixels:Buffer.from([10+i,20,30,255,40+i,50,60,128])})),audio=wav(12000),a=pack(images,{fps:12,audio}),b=pack(images,{fps:12,audio});
 assert.deepEqual(a,b);assert.deepEqual(a.metadata,{version:1,width:2,height:1,fps:12,frames:3,columns:3,rows:1,durationSamples:12000,audio:true});
 assert.deepEqual(decodePNG(a.atlas).pixels,Buffer.concat(images.map(f=>f.pixels)));
 assert.equal(wavFrames(audio),12000);assert.equal(wavFrames(wav(12000,2)),12000);
 assert.throws(()=>pack(images,{fps:12,audio:wav(11999)}),/Duração|WAV/i);
 assert.throws(()=>pack(images,{fps:7}));assert.throws(()=>pack(Array(97).fill(images[0]),{fps:12}));
 assert.throws(()=>pack([{width:0,height:1,pixels:Buffer.alloc(0)}]));
 assert.throws(()=>pack([{width:2,height:1,pixels:Buffer.alloc(4)}]));
 assert.throws(()=>pack([images[0],{...images[1],height:2}]));
 const brokenAlign=Buffer.from(audio);brokenAlign.writeUInt16LE(0,32);assert.throws(()=>wavFrames(brokenAlign));
 const brokenRate=Buffer.from(audio);brokenRate.writeUInt32LE(1,28);assert.throws(()=>wavFrames(brokenRate));
 const truncated=Buffer.from(audio);truncated.writeUInt32LE(audio.length,40);assert.throws(()=>wavFrames(truncated));
});
test('Prepared WAV rejects duplicate chunks and malformed padding accepted by neither clip contract nor runtime',()=>{
 const good=wav(4000),format=good.subarray(12,36),data=good.subarray(36);
 assert.throws(()=>wavFrames(riff([format,format,data])),/fmt.*duplicado/);
 assert.throws(()=>wavFrames(riff([format,data,data])),/data.*duplicado/);
 assert.throws(()=>wavFrames(riff([format,data,Buffer.from([1,2,3])])),/Cabeçalho.*truncado/);
 const odd=Buffer.alloc(9);odd.write('JUNK');odd.writeUInt32LE(1,4);odd[8]=1;
 assert.throws(()=>wavFrames(riff([format,data,odd])),/alinhamento/);
 assert.equal(wavFrames(riff([format,Buffer.concat([odd,Buffer.alloc(1)]),data])),4000);
 const image={width:1,height:1,pixels:Buffer.from([255,255,255,255])};
 assert.throws(()=>pack([image],{fps:12,audio:riff([format,data,data])}),/duplicado/);
});
test('3D resources are deterministic and packaged TV/music WAV loops match eight seconds',()=>{
 const first=resources.tv(),second=resources.tv();assert.deepEqual(first,second);
 assert.deepEqual(decodePNG(first.atlas),decodePNG(fs.readFileSync(path.join(root,'assets/tv.png'))));
 comparePCM(fs.readFileSync(path.join(root,'assets/tv.wav')),first.audio,'TV');
 assert.deepEqual(first.metadata,JSON.parse(fs.readFileSync(path.join(root,'assets/tv.json'),'utf8')));
 assert.equal(tomMetadata(first.metadata),fs.readFileSync(path.join(root,'assets/tv.tom'),'utf8'));
 assert.equal(wavFrames(first.audio),384000);assert.deepEqual(decodePNG(resources.atlas3d()),decodePNG(fs.readFileSync(path.join(root,'assets/atlas3d.png'))));
 for(let level=0;level<3;level++){const sound=resources.music(level);assert.deepEqual(sound,resources.music(level));assert.equal(wavFrames(sound),384000);comparePCM(fs.readFileSync(path.join(root,`assets/musica${level}.wav`)),sound,`musica${level}`);}
 comparePCM(fs.readFileSync(path.join(root,'assets/ambiente.wav')),resources.environment(),'ambiente');
 comparePCM(fs.readFileSync(path.join(root,'assets/explosao.wav')),resources.explosion(),'explosao');
});
test('Clip metadata emits the same validated profile in JSON and compilable Tom for silent and voiced rates',()=>{
 for(const [fps,audio,frames] of [[6,false,7],[20,true,13]]){
  const image={width:2,height:1,pixels:Buffer.from([20,40,60,255,80,100,120,255])};
  const clip=pack(Array(frames).fill(image),{fps,audio:audio?wav(frames*48000/fps):undefined}),source=tomMetadata(clip.metadata);
  assert.equal(source,tomMetadata(clip.metadata));
  assert.match(source,new RegExp(`R.taxay${fps}\\n`));assert.match(source,new RegExp(`R.quadrosy${frames}\\n`));
  assert.match(source,new RegExp(`R.audioy${audio?'Verdadeiro':'Falso'}\\n`));
  assert.throws(()=>tomMetadata({...clip.metadata,rows:0}));assert.throws(()=>tomMetadata({...clip.metadata,durationSamples:1}));
 }
});
for(const optimize of ['-O0','-O2'])test(`Prepared clips sample arbitrary atlas grids, wrap, clocks and dimension contracts ${optimize}`,()=>{
 const image={width:2,height:1,pixels:Buffer.from([10,20,30,255,40,50,60,255])},silent=pack(Array(3).fill(image),{fps:6}),voiced=pack(Array(13).fill(image),{fps:20,audio:wav(31200)});
 let source="Importar[l'../src/cena3d.tom']\n"+tomMetadata(silent.metadata)+"ChamarxFpsClipePreparado[]\nDefVarRegistro<FpsClipe3D>xCy@ULTIMO\nChamarxFpsClipeValidar[@C,6,1]\n";
 for(const [sample,expected] of [[0,0],[7999,0],[8000,1],[16000,2],[24000,0],[-1,0]])source+=`ChamarxFpsClipeQuadro[@C,${sample}]\n`+eq('@ULTIMO',expected,'InSd64');
 source+="ChamarxFps3DClipeUV[0.0,0.0,16000,@C]\nDefVarVec4<Fl32>xUVy@ULTIMO\n"+eq('@UV.x',0.75,'Fl32')+eq('@UV.y',0.5,'Fl32');
 source+="ChamarxFpsClipeRelogio[@C,120,7654321]\n"+eq('@ULTIMO',96000,'InSd64');
 source+="DefVarBlxFalhouyFalso\nTentar\nChamarxFpsClipeValidar[@C,7,1]\nCapturarxErro\nSetVarBlxFalhouyVerdadeiro\nFimTentar\nExigir[@Falhou]\n";
 for(const [name,value] of Object.entries({taxa:20,quadros:13,colunas:8,linhas:2,duracaoAmostras:31200}))source+=`SetVarInSd64xC.${name}y${value}\n`;
 source+="SetVarBlxC.audioyVerdadeiro\nChamarxFpsClipeValidar[@C,16,2]\nChamarxFpsClipeRelogio[@C,120,31415]\n"+eq('@ULTIMO',31415,'InSd64');
 source+="ChamarxFpsClipeQuadro[@C,31200]\n"+eq('@ULTIMO',0,'InSd64')+"ChamarxFps3DClipeUV[0.0,0.0,19200,@C]\nSetVarVec4<Fl32>xUVy@ULTIMO\n"+eq('@UV.x',0.03125,'Fl32')+eq('@UV.y',0.75,'Fl32');
 run(source,optimize);
});
for(const optimize of ['-O0','-O2'])test(`Silent prepared TV starts the SDL game without tv.wav and stays on simulation clock ${optimize}`,()=>{
 const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'tom-fps-silent-'));
 try{
  fs.cpSync(path.join(root,'assets'),directory,{recursive:true});fs.rmSync(path.join(directory,'tv.wav'));
  const image={width:2,height:1,pixels:Buffer.from([10,20,30,255,40,50,60,255])},clip=pack(Array(3).fill(image),{fps:6});fs.writeFileSync(path.join(directory,'tv.png'),clip.atlas);
  let source=fs.readFileSync(path.join(root,'src/fps-tom.tom'),'utf8').split('Enquantox@Controle.executar')[0].replaceAll("l'./","l'../src/").replace("Importar[l'../assets/tv.tom']",tomMetadata(clip.metadata));
  source+="ChamarxFps3DNivelCarregar[1,@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PoolAtores,@PoolProjeteis,@PoolEfeitos,@Sons]\nSetVarInSd64xEstado.passosy120\n";
  const audioCall='ChamarxFps3DAudioAtualizar[@Audio,@Musica0,@Musica1,@Musica2,@TVSom,@Ambiente,@Tiro,@Dano,@Item,@Abrir,@Fechar,@Explosao,@SomEstado,@Estado,@Controle,@Mapa,@Mundo,@Malha,@Elevadores,@Vozes,@Sons,@ClipeTV]\n';
  source+=audioCall+eq('@ULTIMO',96000,'InSd64')+"SetVarEnum<FpsFase>xEstado.fasey@FpsFase.Pausa\n"+audioCall+eq('@ULTIMO',96000,'InSd64')+"EscopoFimxAplicacao\n";
  run(source,optimize,{assets:directory});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
const setup=`Importar[l'../src/entrada3d.tom']
DefRecursoxJyJanelaCriar[l'Entrada 3D',320,200]
JanelaEventosCompletos[@J,Verdadeiro]
JanelaEventosPonteiro[@J,Verdadeiro]
DefRecursoxEyEventoCriar[]
DefVarRegistro<FpsEstado>xEstadoyPadrao
SetVarEnum<FpsFase>xEstado.fasey@FpsFase.Jogando
DefVarRegistro<Fps3DControle>xCyPadrao
SetVarBlxC.focoyVerdadeiro
SetVarFl64xC.sensibilidadey0.0025
SetVarInSd32xC.carregary-1
`;
const event=`EventoAguardar[@J,@E]
ChamarxFps3DEvento[@E,@C,@Estado]
`;
for(const optimize of ['-O0','-O2'])test(`Voiced TV preserves its sample origin across callback interleaving, loops, focus and restart ${optimize}`,()=>{
 const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'tom-fps-sync-'));
 const {builtins}=require('../../../tom-lang/core/builtins'),saved={AudioCriar:builtins.AudioCriar,AudioSom:builtins.AudioSom};
 const injected={
  TestarOrigemTV:{c:'tom_fps_sync_origin',args:['Audio','InSd64'],result:'Vazio',lib:'audio'},
  TestarPausaAudio:{c:'tom_fps_sync_paused',args:['Audio','Bl'],result:'Vazio',lib:'audio'},
  TestarAvancarAudio:{c:'tom_fps_sync_advance',args:['RefAudio','InSd32'],result:'InSd64',lib:'audio'},
  TestarAmostraTV:{c:'tom_fps_sync_sample',args:['Fl64'],result:'Vazio',lib:'audio'},
 };
 try{
  builtins.AudioCriar={...saved.AudioCriar,c:'tom_fps_sync_new'};builtins.AudioSom={...saved.AudioSom,c:'tom_fps_sync_sound'};Object.assign(builtins,injected);
  const voiced=wav(24000);for(let i=0;i<24000;i++)voiced.writeInt16LE(i<8000?8192:i<16000?16384:24576,44+i*2);
  fs.writeFileSync(path.join(directory,'sync.wav'),voiced);fs.writeFileSync(path.join(directory,'silence.wav'),wav(24000));
  const audioCall='ChamarxFps3DAudioAtualizar[@Audio,@Silencio,@Silencio,@Silencio,@TVSom,@Silencio,@Silencio,@Silencio,@Silencio,@Silencio,@Silencio,@Silencio,@SomEstado,@Estado,@C,@Mapa,@Mundo,@Malha,@Elevadores,@Vozes,@Sons,@ClipeTV]\n';
  const metadata=tomMetadata(pack(Array(3).fill({width:1,height:1,pixels:Buffer.alloc(4)}),{fps:6,audio:voiced}).metadata);
  let source="Importar[l'../src/audio3d.tom']\n"+metadata+"EscopoInixSincronia\n"+setup.replace("Importar[l'../src/entrada3d.tom']\n",'')+`DefRecursoxAudioyAudioCriar[]
DefRecursoxTVSomySomCarregarWav[@Audio,l'sync.wav',16777216]
DefRecursoxSilencioySomCarregarWav[@Audio,l'silence.wav',16777216]
DefVarRegistro<Fps3DAudioEstado>xSomEstadoyPadrao
SetVarInSd32xSomEstado.nively-1
DefVarRegistro<Fps3DMundo>xMundoyPadrao
SetVarInSd64xMundo.triangulosy1
DefArraySoAxMapaxFpsCelulax1
DefArraySoAxMalhaxFpsTriangulox1
SetVarInSd32xMalha@0.materialy200
DefArraySoAxElevadoresxFpsElevadorx1
DefArraySoAxVozesxFpsVoz3Dx22
DefArraySoAxSonsxFpsSomx64
SetVarFl64xC.musicay0.0
SetVarFl64xC.efeitosVolumey1.0
ChamarxFpsClipePreparado[]
DefVarRegistro<FpsClipe3D>xClipeTVy@ULTIMO
DefVarInSd64xAmostraLiday0
`;
  source+=audioCall+eq('@ULTIMO',0,'InSd64')+'TestarOrigemTV[@Audio,@SomEstado.inicioTV]\nTestarPausaAudio[@Audio,Falso]\n';
  source+='TestarAvancarAudio[@Audio,7999]\nTestarAmostraTV[0.06]\n'+audioCall+'SetVarInSd64xAmostraLiday@ULTIMO\n'+eq('@AmostraLida',7999,'InSd64')+'ChamarxFpsClipeQuadro[@ClipeTV,@AmostraLida]\n'+eq('@ULTIMO',0,'InSd64');
  source+='TestarAvancarAudio[@Audio,1]\nTestarAmostraTV[0.06]\n'+audioCall+'SetVarInSd64xAmostraLiday@ULTIMO\n'+eq('@AmostraLida',8000,'InSd64')+'ChamarxFpsClipeQuadro[@ClipeTV,@AmostraLida]\n'+eq('@ULTIMO',1,'InSd64');
  source+='TestarAvancarAudio[@Audio,16000]\nTestarAmostraTV[0.12]\n'+audioCall+'SetVarInSd64xAmostraLiday@ULTIMO\n'+eq('@AmostraLida',24000,'InSd64')+'ChamarxFpsClipeQuadro[@ClipeTV,@AmostraLida]\n'+eq('@ULTIMO',0,'InSd64');
  source+=event+audioCall+eq('@ULTIMO',24000,'InSd64')+'TestarPausaAudio[@Audio,Verdadeiro]\nTestarAvancarAudio[@Audio,1000]\nTestarAmostraTV[0.0]\n'+audioCall+eq('@ULTIMO',24000,'InSd64');
  source+=event+eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')+audioCall+'TestarPausaAudio[@Audio,Verdadeiro]\n';
  source+=event+eq('@Estado.fase','@FpsFase.Jogando','Enum<FpsFase>')+audioCall+eq('@ULTIMO',24000,'InSd64')+'TestarPausaAudio[@Audio,Falso]\nTestarAvancarAudio[@Audio,8000]\nTestarAmostraTV[0.06]\n'+audioCall+eq('@ULTIMO',32000,'InSd64');
  source+='SetVarInSd32xSomEstado.nively-1\nSetVarInSd64xEstado.passosy0\n'+audioCall+eq('@ULTIMO',0,'InSd64')+'TestarOrigemTV[@Audio,@SomEstado.inicioTV]\nTestarPausaAudio[@Audio,Falso]\nGerarTxtxl\'OK\'\nEscopoFimxSincronia\n';
  assert.equal(run(source,optimize,{assets:directory,events:'focuslost\nfocusgain\nkey 13\n',nativeSources:[path.join(__dirname,'multimedia3d-sync.c')],linkFlags:['-DTOM_AUDIO_TEST'],buildTimeout:180000}).stdout,'OK');
 }finally{Object.assign(builtins,saved);for(const name of Object.keys(injected))delete builtins[name];fs.rmSync(directory,{recursive:true,force:true});}
});
for(const optimize of ['-O0','-O2'])test(`3D input consumes pulse/mouse only once over six simulation steps, focus never auto-resumes ${optimize}`,()=>{
 const source=setup+event.repeat(7)+`Exigir[@C.pulsoPular]
Exigir[@C.pulsoInteragir]
${eq('@C.arma','2')}
ChamarxFps3DComandoLer[@C]
DefVarRegistro<Fps3DComando>xPrimeiroy@ULTIMO
Exigir[@Primeiro.pular]
Exigir[@Primeiro.interagir]
Exigir[@Primeiro.atirar]
${eq('@Primeiro.giro','0.075','Fl64')}${eq('@Primeiro.pitchDelta','0.025','Fl64')}${eq('@Primeiro.arma','2')}
ParaxI[0,5,1]
ChamarxFps3DComandoLer[@C]
DefVarRegistro<Fps3DComando>xRy@ULTIMO
NaoBlx@R.pular
Exigir[@ULTIMO]
NaoBlx@R.interagir
Exigir[@ULTIMO]
NaoBlx@R.atirar
Exigir[@ULTIMO]
${eq('@R.giro','0.0','Fl64')}${eq('@R.pitchDelta','0.0','Fl64')}${eq('@R.arma','0')}
FimPara
${event}ChamarxFps3DComandoLer[@C]
DefVarRegistro<Fps3DComando>xRepetidoy@ULTIMO
NaoBlx@Repetido.pular
Exigir[@ULTIMO]
${event.repeat(2)}Exigir[@C.w]
${event}${eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')}
NaoBlx@C.foco
Exigir[@ULTIMO]
NaoBlx@C.w
Exigir[@ULTIMO]
${eq('@C.mouseX','0.0','Fl64')}${eq('@C.mouseY','0.0','Fl64')}
${event}Exigir[@C.foco]
${eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')}
${event}${eq('@Estado.fase','@FpsFase.Jogando','Enum<FpsFase>')}
Exigir[@C.capturar]
GerarTxtxl'OK'`;
 const r=run(source,optimize,{buildTimeout:120000,events:'relative 160 100 20 -4\nrelative 160 100 10 -6\ndown 32 44 0 0\ndown 101 8 0 0\ndown 50 31 0 0\nmouse 160 100\nrelease 160 100\ndown 32 44 1 0\ndown 119 26 0 0\nrelative 160 100 100 80\nfocuslost\nfocusgain\nkey 13\n'});assert.equal(r.stdout,'OK');
});
test('3D minimap toggles pause/resume only during play and cannot revive campaign result screens',()=>{
 const source=setup+event+`Exigir[@C.mapa]
${eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')}
${event}NaoBlx@C.mapa
Exigir[@ULTIMO]
${eq('@Estado.fase','@FpsFase.Jogando','Enum<FpsFase>')}
SetVarEnum<FpsFase>xEstado.fasey@FpsFase.Derrota
${event.repeat(2)}${eq('@Estado.fase','@FpsFase.Derrota','Enum<FpsFase>')}
SetVarEnum<FpsFase>xEstado.fasey@FpsFase.SetorConcluido
${event.repeat(2)}${eq('@Estado.fase','@FpsFase.SetorConcluido','Enum<FpsFase>')}
SetVarEnum<FpsFase>xEstado.fasey@FpsFase.Vitoria
${event.repeat(2)}${eq('@Estado.fase','@FpsFase.Vitoria','Enum<FpsFase>')}
GerarTxtxl'OK'`;
 assert.equal(run(source,'-O2',{buildTimeout:120000,events:'key 9\n'.repeat(8)}).stdout,'OK');
});

for(const optimize of ['-O0','-O2'])test(`3D voice pressure preserves important sounds, selects oldest ties and reuses expired channels ${optimize}`,()=>{
 const source=`Importar[l'../src/audio3d.tom']
DefArraySoAxVozesxFpsVoz3Dx22
ParaxI[0,22,1]
SetVarInSd64xVozes@@I.fimy1000
SetVarInSd32xVozes@@I.prioridadey6
SetVarFl64xVozes@@I.pxy99.0
FimPara
ChamarxFps3DAudioReservar[@Vozes,100,1,[1.0,2.0,3.0],0.5]
${eq('@ULTIMO','-1')}${eq('Vozes@0.px','99.0','Fl64')}${eq('Vozes@21.fim','1000','InSd64')}
SetVarInSd32xVozes@0.prioridadey1
SetVarInSd64xVozes@0.fimy900
SetVarInSd32xVozes@1.prioridadey1
SetVarInSd64xVozes@1.fimy600
SetVarInSd32xVozes@2.prioridadey1
SetVarInSd64xVozes@2.fimy600
ChamarxFps3DAudioReservar[@Vozes,100,1,[1.0,2.0,3.0],0.5]
${eq('@ULTIMO','11')}${eq('Vozes@1.px','1.0','Fl64')}${eq('Vozes@1.py','2.0','Fl64')}${eq('Vozes@1.pz','3.0','Fl64')}${eq('Vozes@1.volume','0.5','Fl64')}${eq('Vozes@1.fim','33700','InSd64')}${eq('Vozes@2.fim','600','InSd64')}
ParaxI[0,22,1]
SetVarInSd64xVozes@@I.fimy1000
SetVarInSd32xVozes@@I.prioridadey6
FimPara
ChamarxFps3DAudioReservar[@Vozes,100,7,[4.0,5.0,6.0],1.0]
${eq('@ULTIMO','10')}${eq('Vozes@0.prioridade','7')}
SetVarInSd64xVozes@4.fimy100
SetVarInSd32xVozes@4.prioridadey9
ChamarxFps3DAudioReservar[@Vozes,100,1,[7.0,8.0,9.0],0.25]
${eq('@ULTIMO','14')}${eq('Vozes@4.prioridade','1')}${eq('Vozes@4.fim','33700','InSd64')}
GerarTxtxl'OK'`;
 assert.equal(run(source,optimize,{buildTimeout:120000}).stdout,'OK');
});
