'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {run,root,game,eq}=require('./helpers');
for(const optimize of ['-O0','-O2'])test(`FPS application: play, pause, focus, restart, rendering and resource cleanup ${optimize}`,()=>{
  const source=game();
  const r=run(source,optimize,{file:path.join(root,'src/fps-tom.tom'),events:'key 13\nwait 20\ndown 119 26 0 0\nwait 40\nrelative 480 300 20 -2\nmouse 480 300\nwait 40\nrelease 480 300\nup 119 26\nkey 27\nfocuslost\nfocusgain\nkey 13\nkey 1073741882\nkey 1073741883\nkey 114\nquit\n'});
  assert.ok((r.trace.match(/FRAME/g)||[]).length>=5,r.trace);
  assert.doesNotMatch(r.stdout,/Erro|Falha|RESOURCE/);
});

test('FPS event semantics: focus does not auto-resume, mouse deltas and click pulses',()=>{
  const source=`Importar[l'../src/entrada.tom']
DefRecursoxJyJanelaCriar[l'Entrada',320,200]
JanelaEventosCompletos[@J,Verdadeiro]
JanelaEventosPonteiro[@J,Verdadeiro]
DefRecursoxEyEventoCriar[]
DefVarRegistro<FpsEstado>xEstadoyPadrao
DefVarRegistro<FpsControle>xControleyPadrao
DefVarRegistro<FpsRelogio>xRelogioyPadrao
DefArraySoAxMapaxFpsCelulax1024
DefArraySoAxEntidadesxFpsEntidadex32
ChamarxFpsIniciar[@Estado,@Mapa,@Entidades]
SetVarBlxControle.focoyVerdadeiro
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
${eq('@Estado.angulo','0.05','Fl64')}
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
NaoBlx@Controle.mouseTiro
Exigir[@ULTIMO]
Exigir[@Controle.pulsoTiro]
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
${eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')}
NaoBlx@Controle.foco
Exigir[@ULTIMO]
NaoBlx@Controle.pulsoTiro
Exigir[@ULTIMO]
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
${eq('@Estado.fase','@FpsFase.Pausa','Enum<FpsFase>')}
Exigir[@Controle.foco]
EventoAguardar[@J,@E]
ChamarxFpsEvento[@J,@E,@Controle,@Estado,@Relogio,@Mapa,@Entidades]
${eq('@Estado.fase','@FpsFase.Jogando','Enum<FpsFase>')}
JanelaMouseRelativo[@J,Falso]
`;
  run(source,'-O2',{events:'relative 100 100 20 -10\nmouse 100 100\nrelease 100 100\nfocuslost\nfocusgain\nkey 13\n'});
});

test('wall depth completely hides a sprite behind it and reveals one in front',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'fps-occlusion-'));
  try {
    const captures=[];
    for(const x of [0,6.5,4.0]){
      const snapshot=path.join(directory,`${x}.bmp`);
      const source=`Importar[l'../src/simulacao.tom']
Importar[l'../src/render.tom']
DefRecursoxJyJanelaCriar[l'Oclusao',320,200]
DefRecursoxAyVisualImagemCarregar[@J,l'atlas.png']
DefArraySoAxMapaxFpsCelulax1024
DefArraySoAxEntidadesxFpsEntidadex32
DefArraySoAxColunasxFpsColunax320
DefArraySoAxSpritesxFpsSpritex32
DefVarRegistro<FpsEstado>xEstadoyPadrao
SetVarFl64xEstado.pxy2.5
SetVarFl64xEstado.pyy2.5
ParaxY[0,16,1]
MultixyInSd64x@Yy32
SomarxyInSd64x@ULTIMOy5
DefVarInSd64xIndicey@ULTIMO
SetVarInSd32xMapa@@Indice.materialy1
FimPara
${x?`ChamarxFpsEntidadeCriar[@Entidades,0,1,${x.toFixed(1)},2.5]`:''}
ChamarxFpsProjetar[@Mapa,@Estado,@Entidades,@Colunas,@Sprites]
ChamarxFpsCenario[@J,@A,@Colunas,Verdadeiro]
ChamarxFpsDesenharSprites[@J,@A,@Colunas,@Sprites]
JanelaApresentar[@J]`;
      run(source,'-O2',{events:'quit\n',snapshot});captures.push(fs.readFileSync(snapshot));
    }
    assert.deepEqual(captures[0],captures[1]);assert.notDeepEqual(captures[0],captures[2]);
  }finally{fs.rmSync(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
