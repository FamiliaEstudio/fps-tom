'use strict';
const test=require('node:test');
const {run,eq}=require('./helpers');
const prefix=`Importar[l'../src/simulacao3d.tom']
DefArraySoAxMapaxFpsCelulax1024
DefArraySoAxEntidadesxFpsEntidadex128
DefArraySoAxMalhaxFpsTriangulox16384
DefArraySoAxElevadoresxFpsElevadorx16
DefArraySoAxRegioesxFpsRegiaox2048
DefArraySoAxProjeteisxFpsProjetilx256
DefArraySoAxEfeitosxFpsEfeitox1024
DefArraySoAxLuzesxFpsLuzx32
DefArraySoAxSonsxFpsSomx64
DefRecursoxPAtoresyPoolEntidadesCriar[128]
DefRecursoxPProjeteisyPoolEntidadesCriar[256]
DefRecursoxPEfeitosyPoolEntidadesCriar[1024]
DefVarRegistro<FpsEstado>xEstadoyPadrao
DefVarRegistro<Fps3DMundo>xMundoyPadrao
DefFuncaoxPerto[Fl64xA,Fl64xB]yVazio
ChamarxFpsAbsoluto[(@A-@B)]
CompararMenorxyFl64x@ULTIMOy0.002
Exigir[@ULTIMO]
FimFuncao
`;
const load=n=>`ChamarxFps3DNivelCarregar[${n},@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PAtores,@PProjeteis,@PEfeitos,@Sons]\n`;
const step=`ChamarxFps3DPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@Comando,@PProjeteis,@PEfeitos,@Sons]\n`;
const clear=`ParaIndiceSOAxI[@Entidades]\nSetVarBlxEntidades@@I.ativayFalso\nFimPara\n`;
const physics=prefix+`
// Todas as capacidades, contagens e mapas preservados.
ParaxNivel[0,3,1]
InSd64ParaInSd32[@Nivel]
${load('@ULTIMO')}
CompararMaiorxyInSd64x@Mundo.triangulosy1000
Exigir[@ULTIMO]
CompararMenorxyInSd64x@Mundo.triangulosy16384
Exigir[@ULTIMO]
CompararMenorxyInSd64x@Mundo.regioesy2048
Exigir[@ULTIMO]
${eq('@Estado.vida',100)}${eq('@Estado.municao',30)}
DefVarInSd32xEsperadosy6
CompararIgualxyInSd64x@Nively1
Sex@ULTIMO
SetVarInSd32xEsperadosy10
FimSe
CompararIgualxyInSd64x@Nively2
Sex@ULTIMO
SetVarInSd32xEsperadosy16
FimSe
${eq('@Estado.totalInimigos','@Esperados')}
FimPara
${load(0)}${clear}
// Vertical aim, jump, fall and floor contact without float drift.
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarBlxComando.pularyVerdadeiro
SetVarFl64xComando.pitchDeltay4.0
${step}
CompararMaiorxyFl64x@Estado.pzy0.04
Exigir[@ULTIMO]
ChamarxPerto[@Estado.inclinacao,1.48352986419518]
SetVarBlxComando.pularyFalso
SetVarFl64xComando.pitchDeltay0.0
ParaxJ[0,90,1]
${step}
FimPara
ChamarxPerto[@Estado.pz,0.0]
Exigir[@Estado.noChao]
SetVarBlxComando.agacharyVerdadeiro
${step}
ChamarxPerto[@Estado.alturaCorpo,0.62]
SetVarBlxComando.agacharyFalso
${step}
ChamarxPerto[@Estado.alturaCorpo,1.05]
// Sweep a capsule through a thin wall at > whole room displacement.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[4.0,0.0,0.0],[4.0,8.0,0.0],[4.0,8.0,4.0],[4.0,0.0,4.0],0,0,0,0,Verdadeiro]
ChamarxFps3DDeslizar[@Mapa,@Mundo,@Malha,@Elevadores,[2.0,2.0,0.0],[20.0,0.0,0.0],1.05]
DefVarVec3<Fl64>xResulty@ULTIMO
ChamarxPerto[@Result.x,3.78]
// Parallel sweep slides freely; vertical ray remains valid.
ChamarxFps3DDeslizar[@Mapa,@Mundo,@Malha,@Elevadores,[3.78,2.0,0.0],[0.0,2.0,0.0],1.05]yResult
ChamarxPerto[@Result.y,4.0]
ChamarxFps3DRaio[@Mapa,@Mundo,@Malha,@Elevadores,[2.0,2.0,0.85],[1.0,0.0,0.0],10.0]
DefVarRegistro<Fps3DContato>xRy@ULTIMO
ChamarxPerto[@R.distancia,2.0]
// Walk under and stand on the same bridge XY.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DCaixa[@Mundo,@Malha,[2.0,2.0,1.4],[5.0,5.0,1.6],16,1,0]
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,[3.0,3.0,0.0],1.05]
Exigir[@ULTIMO]
ChamarxFps3DPiso[@Mapa,@Mundo,@Malha,@Elevadores,3.0,3.0,1.7]yR
ChamarxPerto[@R.ponto.z,1.6]
// Ramp climb and stairs use the exact same mesh as rays.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DRampa[@Mundo,@Malha,@Regioes,2.0,2.0,1.0,2.0,1.6]
ChamarxFps3DDeslizar[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,1.5,0.0],[0.0,1.5,0.0],1.05]yResult
CompararMaiorxyFl64x@Result.zy0.25
Exigir[@ULTIMO]
// Faces acima de 45 graus sao obstaculos, mesmo sob deslocamento grande.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[2.0,2.0,0.0],[3.0,2.0,0.0],[3.0,4.0,4.0],[2.0,4.0,4.0],23,0,0,0,Verdadeiro]
ChamarxFps3DDeslizar[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,1.5,0.0],[0.0,1.5,0.0],1.05]yResult
CompararMenorxyFl64x@Result.zy0.05
Exigir[@ULTIMO]
// A partially open panel shares intersection and capsule clearance.
${load(0)}
SetVarFl64xMapa@103.aberturay0.5
ChamarxFps3DRaio[@Mapa,@Mundo,@Malha,@Elevadores,[6.5,3.25,0.85],[1.0,0.0,0.0],2.0]yR
CompararMenorxyInSd64x@R.trianguloy0
Exigir[@ULTIMO]
ChamarxFps3DRaio[@Mapa,@Mundo,@Malha,@Elevadores,[6.5,3.75,0.85],[1.0,0.0,0.0],2.0]yR
${eq('@R.movel',104)}
ChamarxPerto[@R.distancia,0.9375]
// Elevator carries actors and reverses if a ceiling would crush them.
${load(1)}${clear}
SetVarFl64xEstado.pxy9.9
SetVarFl64xEstado.pyy2.9
SetVarInSd32xElevadores@0.esperay0
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
CompararMaiorxyFl64x@Estado.pzy0.01
Exigir[@ULTIMO]
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[8.0,2.0,1.07],[11.0,2.0,1.07],[11.0,4.0,1.07],[8.0,4.0,1.07],24,0,0,0,Verdadeiro]
SetVarFl64xEstado.pzy0.01333333333333333
SetVarFl64xElevadores@0.pzy0.01333333333333333
SetVarInSd32xElevadores@0.esperay0
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
${eq('Elevadores@0.direcao',-1)}
GerarTxtxl'OK'
`;
const combat=prefix+`
${load(0)}${clear}
// A prepared hitscan attack is visible first and then deals damage at range.
ChamarxFpsEntidadeCriar[@Entidades,0,1,4.5,2.5]
SetVarInSd32xEntidades@0.tipoAtaquey1
SetVarFl64xEntidades@0.alturaCorpoy1.05
DefVarRegistro<Fps3DComando>xComandoyPadrao
ParaxJ[0,20,1]
${step}
FimPara
CompararMenorxyInSd32x@Estado.viday100
Exigir[@ULTIMO]
// Projectiles reserve slots without silently consuming capacity or ammunition.
ParaIndiceSOAxI[@Projeteis]
ChamarxFps3DProjetilCriar[@Projeteis,[2.0,2.0,0.8],[4.0,0.0,0.0],-1,@PProjeteis]
FimPara
ChamarxFps3DProjetilCriar[@Projeteis,[2.0,2.0,0.8],[4.0,0.0,0.0],-1,@PProjeteis]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
ChamarxFps3DProjetilRemover[@Projeteis,0,@PProjeteis]
ChamarxFps3DProjetilCriar[@Projeteis,[2.0,2.0,0.8],[400.0,0.0,0.0],-1,@PProjeteis]
Exigir[@ULTIMO]
// Fast projectile hits a thin face during the tick, not after tunnelling.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[4.0,0.0,0.0],[4.0,8.0,0.0],[4.0,8.0,4.0],[4.0,0.0,4.0],0,0,0,0,Verdadeiro]
ParaIndiceSOAxI[@Projeteis]
CompararDiferentexyInSd64x@Iy0
Sex@ULTIMO
ChamarxFps3DProjetilRemover[@Projeteis,@I,@PProjeteis]
FimSe
FimPara
${clear}
ChamarxFps3DProjeteisPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Projeteis,@Efeitos,@Luzes,@PProjeteis,@PEfeitos,@Sons]
NaoBlxProjeteis@0.ativa
Exigir[@ULTIMO]
ChamarxPerto[Projeteis@0.px,4.0]
// Explosion blocked by the exact triangle face, including different heights.
SetVarInSd32xEstado.viday100
SetVarFl64xEstado.pxy5.5
SetVarFl64xEstado.pyy2.5
ChamarxFps3DExplodir[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Efeitos,@Luzes,[3.0,2.5,0.7],4.0,35,@PEfeitos,@Sons]
${eq('@Estado.vida',100)}
// Barril chain consumes each item once even if both are damaged simultaneously.
SetVarInSd64xMundo.triangulosy0
ChamarxFpsEntidadeCriar[@Entidades,64,8,2.5,2.5]
ChamarxFpsEntidadeCriar[@Entidades,65,8,3.0,2.5]
SetVarInSd32xEntidades@64.viday1
SetVarInSd32xEntidades@65.viday1
SetVarInSd32xEntidades@64.aiy1
SetVarInSd64xMundo.eventosExplosaoy0
ChamarxFps3DBarrisPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Efeitos,@Luzes,@PEfeitos,@Sons]
${eq('@Mundo.eventosExplosao',2,'InSd64')}
NaoBlxEntidades@64.ativa
Exigir[@ULTIMO]
NaoBlxEntidades@65.ativa
Exigir[@ULTIMO]
// Launcher pickup requires vertical proximity and campaign conclusion preserves rules.
${load(1)}${clear}
ChamarxFpsEntidadeCriar[@Entidades,66,9,2.5,2.5]
SetVarFl64xEntidades@66.pzy1.6
ChamarxFps3DItens[@Estado,@Entidades,@Mundo,@Sons]
NaoBlx@Estado.lancador
Exigir[@ULTIMO]
SetVarFl64xEstado.pzy1.6
ChamarxFps3DItens[@Estado,@Entidades,@Mundo,@Sons]
Exigir[@Estado.lancador]
${eq('@Estado.foguetes',12)}
${load(2)}
Exigir[@Estado.lancador]
ParaIndiceSOAxI[@Entidades]
CompararIgualxyInSd32xEntidades@@I.tipoy4
ExyBlx@ULTIMOyEntidades@@I.ativa
Sex@ULTIMO
SetVarFl64xEstado.pxyEntidades@@I.px
SetVarFl64xEstado.pyyEntidades@@I.py
SetVarFl64xEstado.pzyEntidades@@I.pz
FimSe
FimPara
SetVarInSd32xEstado.abatidosy@Estado.totalInimigos
ChamarxFps3DItens[@Estado,@Entidades,@Mundo,@Sons]
${eq('@Estado.fase','@FpsFase.Vitoria','Enum<FpsFase>')}
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D world/capsule sweep, jump, slopes, stacked floors, doors and elevators (${optimize})`,()=>run(physics,optimize,{buildTimeout:180000}));
 test(`3D combat, projectile sweep, explosion coverage, barrel chains and campaign (${optimize})`,()=>run(combat,optimize,{buildTimeout:180000}));
}

const replay=prefix+`
DefVarFl64xReferenciaXy0.0
DefVarFl64xReferenciaYy0.0
DefVarFl64xReferenciaZy0.0
DefVarFl64xReferenciaAnguloy0.0
ParaxModo[0,3,1]
${load(0)}${clear}
ChamarxFpsEntidadeCriar[@Entidades,32,5,2.5,2.5]
ChamarxFpsPortaCriar[@Mapa,3,2,0,1]
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[32.0,0.0,0.0],[32.0,32.0,0.0],[0.0,32.0,0.0],23,0,0,0,Verdadeiro]
ChamarxFps3DCaixa[@Mundo,@Malha,[3.4375,2.0,0.0],[3.5625,3.0,3.8],8,0,68]
DefVarInSd64xQuadrosy60
CompararIgualxyInSd64x@Modoy1
Sex@ULTIMO
SetVarInSd64xQuadrosy120
FimSe
CompararIgualxyInSd64x@Modoy2
Sex@ULTIMO
SetVarInSd64xQuadrosy288
FimSe
DefVarRegistro<FpsRelogio>xRelogioyPadrao
DefVarInSd64xFimy(@Quadros+1)
ParaxF[1,@Fim,1]
MultiplicarDividirInSd64[@F,2000000040,@Quadros]
ChamarxFpsRelogioAvancar[@Relogio,@ULTIMO,Verdadeiro]
DefVarInSd64xPassosy@ULTIMO
ParaxP[0,@Passos,1]
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarFl64xComando.frentey1.0
CompararIgualxyInSd64x@Estado.passosy1
SetVarBlxComando.interagiry@ULTIMO
CompararIgualxyInSd64x@Estado.passosy30
SetVarBlxComando.pulary@ULTIMO
CompararIgualxyInSd64x@Estado.passosy70
Sex@ULTIMO
SetVarFl64xComando.giroy0.2
SetVarFl64xComando.pitchDeltay-0.1
FimSe
${step}
FimPara
FimPara
${eq('@Estado.passos',120,'InSd64')}
Exigir[@Estado.chaveAzul]
${eq('Mapa@67.passo',60)}
CompararIgualxyInSd64x@Modoy0
Sex@ULTIMO
SetVarFl64xReferenciaXy@Estado.px
SetVarFl64xReferenciaYy@Estado.py
SetVarFl64xReferenciaZy@Estado.pz
SetVarFl64xReferenciaAnguloy@Estado.angulo
Senao
ChamarxPerto[@Estado.px,@ReferenciaX]
ChamarxPerto[@Estado.py,@ReferenciaY]
ChamarxPerto[@Estado.pz,@ReferenciaZ]
ChamarxPerto[@Estado.angulo,@ReferenciaAngulo]
FimSe
FimPara
// Locked-door graph is reusable and key acquisition changes routes.
${load(1)}
ChamarxFps3DNavegacao[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Regioes]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[5.5,18.5,0.0]]
DefVarInSd64xChavey@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@Chave.distanciay0
Exigir[@ULTIMO]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[22.5,22.5,0.0]]
DefVarInSd64xSaiday@ULTIMO
${eq('Regioes@@Saida.distancia',-1)}
SetVarBlxEstado.chaveAzulyVerdadeiro
ChamarxFps3DNavegacao[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Regioes]
CompararMaiorIgualxyInSd32xRegioes@@Saida.distanciay0
Exigir[@ULTIMO]
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D command replay at 30/60/144 FPS and navigation through key gates (${optimize})`,()=>run(replay,optimize,{buildTimeout:180000}));
}

const contracts=prefix+`
Importar[l'../src/tecnico3d.tom']
${load(0)}
// Native IDs survive slot reuse without resurrecting an old generation.
ChamarxFps3DProjetilCriar[@Projeteis,[2.0,2.0,0.8],[4.0,0.0,0.0],-1,@PProjeteis]
Exigir[@ULTIMO]
DefVarRegistro<EntidadeID>xAntigo yPadrao
SetVarInUd64xAntigo.poolyProjeteis@0.idPool
SetVarInUd32xAntigo.indiceyProjeteis@0.idIndice
SetVarInUd32xAntigo.geracaoyProjeteis@0.geracao
ChamarxFps3DProjetilRemover[@Projeteis,0,@PProjeteis]
ChamarxFps3DProjetilCriar[@Projeteis,[2.0,2.0,0.8],[4.0,0.0,0.0],-1,@PProjeteis]
Exigir[@ULTIMO]
PoolEntidadesValido[@PProjeteis,@Antigo]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
CompararDiferentexyInUd32xProjeteis@0.geracaoy@Antigo.geracao
Exigir[@ULTIMO]
ChamarxFps3DEfeitoAdicionar[@Efeitos,3,[2.0,2.0,0.8],[0.0,0.0,0.0],1,0.1,@PEfeitos]
DefVarRegistro<EntidadeID>xEfeitoAntigo yPadrao
SetVarInUd64xEfeitoAntigo.poolyEfeitos@0.idPool
SetVarInUd32xEfeitoAntigo.indiceyEfeitos@0.idIndice
SetVarInUd32xEfeitoAntigo.geracaoyEfeitos@0.geracao
ChamarxFps3DEfeitosPasso[@Efeitos,@Luzes,@PEfeitos]
ChamarxFps3DEfeitoAdicionar[@Efeitos,3,[2.0,2.0,0.8],[0.0,0.0,0.0],1,0.1,@PEfeitos]
PoolEntidadesValido[@PEfeitos,@EfeitoAntigo]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
// Simultaneous sounds fill 64 slots, then replace only a lower priority.
SetVarInSd64xMundo.sonsy0
ParaxI[0,64,1]
InSd64ParaFl64[@I]
ChamarxFps3DSomAdicionar[@Mundo,@Sons,1,[@ULTIMO,2.0,0.7],5]
FimPara
ChamarxFps3DSomAdicionar[@Mundo,@Sons,6,[99.0,2.0,0.7],100]
${eq('@Mundo.sons',64,'InSd64')}
${eq('@Mundo.somDescartados',1,'InSd64')}
${eq('Sons@0.tipo',6)}
ChamarxPerto[Sons@0.px,99.0]
ChamarxFps3DSomAdicionar[@Mundo,@Sons,1,[98.0,2.0,0.7],1]
${eq('@Mundo.somDescartados',2,'InSd64')}
${eq('Sons@0.tipo',6)}
// Reload clears live objects and preserves generation invalidation.
DefVarRegistro<EntidadeID>xAtorAntes yPadrao
SetVarInUd64xAtorAntes.poolyEntidades@0.idPool
SetVarInUd32xAtorAntes.indiceyEntidades@0.idIndice
SetVarInUd32xAtorAntes.geracaoyEntidades@0.idGeracao
${load(1)}
PoolEntidadesComprimento[@PProjeteis]
${eq('@ULTIMO',0,'InUd32')}
PoolEntidadesComprimento[@PEfeitos]
${eq('@ULTIMO',0,'InUd32')}
PoolEntidadesValido[@PAtores,@AtorAntes]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
${eq('@Mundo.sons',0,'InSd64')}
// Standalone technical map exercises all surface modes, heights and actors.
ChamarxFps3DTecnicoCarregar[0,@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PAtores,@PProjeteis,@PEfeitos,@Sons]
Exigir[@Mundo.tecnico]
${eq('@Estado.totalInimigos',2)}
${eq('Entidades@0.tipoAtaque',1)}${eq('Entidades@1.tipoAtaque',2)}
${eq('@Mundo.elevadores',1,'InSd64')}
DefVarInSd32xPortas y0
DefVarInSd32xTV y0
DefVarInSd32xVidro y0
ParaIndiceSOAxI[@Mapa]
SexMapa@@I.porta
SetVarInSd32xPortasy(@Portas+1)
FimSe
FimPara
ParaxT[0,@Mundo.triangulos,1]
CompararIgualxyInSd32xMalha@@T.materialy200
Sex@ULTIMO
SetVarInSd32xTVy(@TV+1)
FimSe
CompararIgualxyInSd32xMalha@@T.materialy30
Sex@ULTIMO
SetVarInSd32xVidroy(@Vidro+1)
FimSe
FimPara
${eq('@Portas',2)}${eq('@TV',2)}${eq('@Vidro',2)}
ChamarxFps3DPiso[@Mapa,@Mundo,@Malha,@Elevadores,3.5,6.5,1.7]
DefVarRegistro<Fps3DContato>xPisoTecnico y@ULTIMO
ChamarxPerto[@PisoTecnico.ponto.z,1.6]
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,[3.5,6.5,0.0],1.05]
Exigir[@ULTIMO]
ChamarxFps3DNavegacao[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Regioes]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[5.5,3.0,0.0]]
DefVarInSd64xKeyBlue y@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@KeyBlue.distanciay0
Exigir[@ULTIMO]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[11.5,6.5,0.0]]
DefVarInSd64xKeyRed y@ULTIMO
${eq('Regioes@@KeyRed.distancia',-1)}
SetVarBlxEstado.chaveAzulyVerdadeiro
ChamarxFps3DNavegacao[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Regioes]
CompararMaiorIgualxyInSd32xRegioes@@KeyRed.distanciay0
Exigir[@ULTIMO]
GerarTxtxl'OK'
`.replace(/ y/g,'y');
for(const optimize of ['-O0','-O2']) {
 test(`3D native ID generations, sound queue priorities and technical map (${optimize})`,()=>run(contracts,optimize,{buildTimeout:180000}));
}

const floors=prefix+`
// A carga associa inimigos e itens elevados ao piso real da malha.
${load(2)}${eq('Entidades@0.andar',1)}
${load(1)}${eq('Entidades@66.andar',1)}
${load(0)}${clear}
SetVarInSd64xMundo.triangulosy0
SetVarInSd64xMundo.regioesy0
SetVarInSd64xMundo.elevadoresy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[16.0,0.0,0.0],[16.0,16.0,0.0],[0.0,16.0,0.0],23,0,0,0,Verdadeiro]
ChamarxFps3DCaixa[@Mundo,@Malha,[2.0,2.0,1.4],[5.0,5.0,1.6],16,1,0]
SetVarFl64xEstado.pxy6.0
SetVarFl64xEstado.pyy3.0
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarBlxComando.pularyVerdadeiro
${step}
SetVarBlxComando.pularyFalso
DefVarFl64xApex y0.0
ParaxJ[0,90,1]
${step}
${eq('@Estado.andar',0)}
CompararMaiorxyFl64x@Estado.pzy@Apex
Sex@ULTIMO
SetVarFl64xApexy@Estado.pz
FimSe
FimPara
CompararMaiorxyFl64x@Apexy0.8
Exigir[@ULTIMO]
// Mesma XY tem andares distintos em cima e embaixo da passarela.
SetVarFl64xEstado.pxy3.0
SetVarFl64xEstado.pzy1.6
ChamarxFpsEntidadeCriar[@Entidades,0,1,4.4,4.4]
SetVarFl64xEntidades@0.pzy1.6
SetVarFl64xEntidades@0.alturaCorpoy1.05
SetVarInSd32xEntidades@0.aiy3
SetVarInSd32xEntidades@0.ataquey200
ChamarxFpsEntidadeCriar[@Entidades,33,2,4.4,3.0]
SetVarFl64xEntidades@33.pzy1.6
${step}
${eq('@Estado.andar',1)}${eq('Entidades@0.andar',1)}${eq('Entidades@33.andar',1)}
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.vzy0.0
${step}
${eq('@Estado.andar',0)}${eq('Entidades@0.andar',1)}${eq('Entidades@33.andar',1)}
// Um elevador pertence ao patamar mais proximo, inclusive a regiao movel.
${load(1)}${clear}
SetVarFl64xEstado.pxy9.4
SetVarFl64xEstado.pyy2.4
SetVarFl64xEstado.pzyElevadores@0.pz
ChamarxFpsEntidadeCriar[@Entidades,0,1,10.3,3.3]
SetVarFl64xEntidades@0.pzyElevadores@0.pz
SetVarFl64xEntidades@0.alturaCorpoy1.05
SetVarInSd32xEntidades@0.aiy3
SetVarInSd32xEntidades@0.ataquey500
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('@Estado.andar',0)}${eq('Entidades@0.andar',0)}
SetVarFl64xElevadores@0.pzy0.8
SetVarFl64xEstado.pzy0.8
SetVarFl64xEntidades@0.pzy0.8
SetVarInSd32xElevadores@0.esperay0
${step}
CompararMaiorxyFl64xEntidades@0.pzy0.8
Exigir[@ULTIMO]
${eq('@Estado.andar',1)}${eq('Entidades@0.andar',1)}
ParaxR[0,@Mundo.regioes,1]
CompararMenorxyInSd32xRegioes@@R.movely0
Sex@ULTIMO
${eq('Regioes@@R.andar',1)}
FimSe
FimPara
GerarTxtxl'OK'
`.replace(/ y/g,'y');
for(const optimize of ['-O0','-O2']) {
 test(`3D minimap floors follow walkable support, jump and elevator transport (${optimize})`,()=>run(floors,optimize,{buildTimeout:180000}));
}

const floorCache=prefix+`
${load(0)}${clear}
SetVarInSd64xMundo.triangulosy0
SetVarInSd64xMundo.regioesy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[16.0,0.0,0.0],[16.0,16.0,0.0],[0.0,16.0,0.0],23,0,0,0,Verdadeiro]
ChamarxFps3DCaixa[@Mundo,@Malha,[2.0,2.0,1.4],[5.0,5.0,1.6],16,1,0]
ChamarxFpsEntidadeCriar[@Entidades,33,2,3.0,3.0]
SetVarFl64xEntidades@33.pzy0.0
ChamarxFpsEntidadeCriar[@Entidades,0,1,4.4,4.4]
SetVarFl64xEntidades@0.pzy1.6
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andar',0)}${eq('Entidades@33.andarConsultas',1,'InSd64')}
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andarConsultas',1,'InSd64')}${eq('Entidades@0.andarConsultas',2,'InSd64')}
// A pose propria do cache percebe mudancas feitas mesmo antes do snapshot do passo.
SetVarFl64xEntidades@33.pzy1.6
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andar',1)}${eq('Entidades@33.andarConsultas',2,'InSd64')}
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andarConsultas',2,'InSd64')}
// Criacao invalida apoio mesmo quando a nova entidade tem exatamente a mesma pose.
SetVarInSd64xEstado.passosy90
ChamarxFpsEntidadeCriar[@Entidades,33,2,3.0,3.0]
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andar',1)}${eq('Entidades@33.andarConsultas',1,'InSd64')}
// Uma porta fechada conserva o curso futuro inteiro como area sem cache.
ChamarxFpsPortaCriar[@Mapa,3,3,0,0]
ChamarxFps3DCaixa[@Mundo,@Malha,[3.4375,3.0,0.0],[3.5625,4.0,3.8],8,0,100]
SetVarFl64xEntidades@33.pxy3.5
SetVarFl64xEntidades@33.pyy4.5
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andarConsultas',3,'InSd64')}
// Item sobre elevador nunca reutiliza apoio, nem quando a plataforma esta parada.
${load(1)}${clear}
ChamarxFpsEntidadeCriar[@Entidades,33,2,9.8,2.8]
SetVarFl64xEntidades@33.pzyElevadores@0.pz
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andar',0)}${eq('Entidades@33.andarConsultas',2,'InSd64')}
SetVarFl64xElevadores@0.pzy0.8
SetVarFl64xEntidades@33.pzy0.8
SetVarInSd32xElevadores@0.esperay0
DefVarRegistro<Fps3DComando>xComandoyPadrao
${step}
CompararMaiorxyFl64xEntidades@33.pzy0.8
Exigir[@ULTIMO]
${eq('Entidades@33.andar',1)}${eq('Entidades@33.andarConsultas',3,'InSd64')}
SetVarInSd32xElevadores@0.esperay90
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andarConsultas',4,'InSd64')}
// Exceder as 48 caixas desliga a otimizacao sem perder consultas ou resultados.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[16.0,0.0,0.0],[16.0,16.0,0.0],[0.0,16.0,0.0],23,0,0,0,Verdadeiro]
ParaxMovel[1,50,1]
InSd64ParaInSd32[@Movel]
ChamarxFps3DCaixa[@Mundo,@Malha,[8.0,8.0,0.0],[8.2,8.2,0.2],8,0,@ULTIMO]
FimPara
ChamarxFpsEntidadeCriar[@Entidades,33,2,6.0,6.0]
SetVarFl64xEntidades@33.pzy0.0
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('Entidades@33.andarConsultas',2,'InSd64')}${eq('Entidades@33.andar',0)}
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D floor cache reuses static support, invalidates pose and respects moving objects (${optimize})`,()=>run(floorCache,optimize,{buildTimeout:180000}));
}

const arena=`${load(0)}${clear}
SetVarInSd64xMundo.triangulosy0
SetVarInSd64xMundo.regioesy0
SetVarInSd64xMundo.elevadoresy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[16.0,0.0,0.0],[16.0,16.0,0.0],[0.0,16.0,0.0],23,0,0,0,Verdadeiro]
SetVarFl64xEstado.pxy2.0
SetVarFl64xEstado.pyy2.0
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.vzy0.0
SetVarFl64xEstado.impulsoXy0.0
SetVarFl64xEstado.impulsoYy0.0
SetVarBlxEstado.noChaoyVerdadeiro
`;
const move=`ChamarxFps3DMover[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Comando]\n`;
const jumpPulses=prefix+arena+`
DefVarRegistro<Fps3DComando>xComandoyPadrao
// Dois pulsos consecutivos nao renovam vz enquanto a calota ainda ve o piso.
SetVarBlxComando.pularyVerdadeiro
${move}
ChamarxPerto[@Estado.vz,(4.4-9.8/60.0)]
NaoBlx@Estado.noChao
Exigir[@ULTIMO]
${move}
ChamarxPerto[@Estado.vz,(4.4-2.0*9.8/60.0)]
NaoBlx@Estado.noChao
Exigir[@ULTIMO]
SetVarBlxComando.pularyFalso
ParaxPasso[0,90,1]
${move}
FimPara
ChamarxPerto[@Estado.pz,0.0]
ChamarxPerto[@Estado.vz,0.0]
Exigir[@Estado.noChao]
// O contato verdadeiro da aterrissagem permite o proximo salto.
SetVarBlxComando.pularyVerdadeiro
${move}
ChamarxPerto[@Estado.vz,(4.4-9.8/60.0)]
// Contato com teto interrompe subida e a gravidade retorna ao piso.
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.vzy0.0
SetVarBlxEstado.noChaoyVerdadeiro
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,1.12],[0.0,16.0,1.12],[16.0,16.0,1.12],[16.0,0.0,1.12],24,0,0,0,Verdadeiro]
${move}
CompararMenorIgualxyFl64x@Estado.pzy0.071
Exigir[@ULTIMO]
ChamarxPerto[@Estado.vz,0.0]
SetVarBlxComando.pularyFalso
ParaxQueda[0,40,1]
${move}
FimPara
ChamarxPerto[@Estado.pz,0.0]
Exigir[@Estado.noChao]
// Sem geometria de apoio, nem um novo pulso pode criar velocidade de salto.
SetVarInSd64xMundo.triangulosy0
${move}
NaoBlx@Estado.noChao
Exigir[@ULTIMO]
SetVarBlxComando.pularyVerdadeiro
${move}
ChamarxPerto[@Estado.vz,(-2.0*9.8/60.0)]
GerarTxtxl'OK'
`;

const impulses=prefix+arena+`
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarFl64xComando.frentey1.0
SetVarFl64xEstado.anguloy0.0
${move}
ChamarxPerto[@Estado.vx,2.6]
ChamarxPerto[@Estado.vy,0.0]
SetVarFl64xEstado.pxy2.0
SetVarFl64xComando.frentey0.0
// Explosao altera velocidade e acumula impulso; a pose so muda na simulacao.
ChamarxFps3DExplodir[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Efeitos,@Luzes,[1.0,2.0,0.525],4.0,35,@PEfeitos,@Sons]
ChamarxPerto[@Estado.px,2.0]
CompararMaiorxyFl64x@Estado.impulsoXy0.0
Exigir[@ULTIMO]
DefVarFl64xImpulsoAntesy@Estado.impulsoX
CompararMaiorxyFl64x@Estado.vzy0.0
Exigir[@ULTIMO]
NaoBlx@Estado.noChao
Exigir[@ULTIMO]
${move}
ChamarxPerto[@Estado.px,(2.0+@ImpulsoAntes/60.0)]
ChamarxPerto[@Estado.vx,@ImpulsoAntes]
ChamarxPerto[@Estado.impulsoX,(@ImpulsoAntes*0.85)]
// Impulso de alta velocidade e consumido por CCD contra a parede fina.
ChamarxFps3DQuad[@Mundo,@Malha,[4.0,0.0,0.0],[4.0,8.0,0.0],[4.0,8.0,4.0],[4.0,0.0,4.0],0,0,0,0,Verdadeiro]
SetVarFl64xEstado.pxy2.0
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.vzy0.0
SetVarFl64xEstado.impulsoXy1200.0
SetVarBlxEstado.noChaoyFalso
${move}
ChamarxPerto[@Estado.px,3.78]
ChamarxPerto[@Estado.vx,((@Estado.px-2.0)*60.0)]
ChamarxPerto[@Estado.impulsoX,1020.0]
// A mesma cobertura impede tanto dano quanto qualquer componente de impulso.
SetVarFl64xEstado.pxy5.5
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.vxy0.0
SetVarFl64xEstado.vyy0.0
SetVarFl64xEstado.vzy0.0
SetVarFl64xEstado.impulsoXy0.0
SetVarFl64xEstado.impulsoYy0.0
SetVarInSd32xEstado.viday100
ChamarxFps3DExplodir[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Efeitos,@Luzes,[3.0,2.0,0.525],4.0,35,@PEfeitos,@Sons]
${eq('@Estado.vida',100)}
ChamarxPerto[@Estado.impulsoX,0.0]
ChamarxPerto[@Estado.impulsoY,0.0]
ChamarxPerto[@Estado.vz,0.0]
// Sobreviventes tambem recebem XYZ durante a preparacao do disparo.
SetVarInSd64xMundo.triangulosy2
SetVarFl64xEstado.pxy8.0
ChamarxFpsEntidadeCriar[@Entidades,0,1,2.0,2.0]
SetVarFl64xEntidades@0.pzy0.0
SetVarInSd32xEntidades@0.viday10
SetVarInSd32xEntidades@0.aiy3
SetVarInSd32xEntidades@0.ataquey200
ChamarxFps3DExplodir[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Efeitos,@Luzes,[1.0,1.0,0.525],4.0,35,@PEfeitos,@Sons]
${eq('Entidades@0.vida',6)}
DefVarFl64xImpulsoNPCyEntidades@0.impulsoX
DefVarFl64xImpulsoNPCYyEntidades@0.impulsoY
CompararMaiorxyFl64x@ImpulsoNPCy0.0
Exigir[@ULTIMO]
CompararMaiorxyFl64x@ImpulsoNPCYy0.0
Exigir[@ULTIMO]
CompararMaiorxyFl64xEntidades@0.vzy0.0
Exigir[@ULTIMO]
ChamarxFps3DInimigos[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PProjeteis,@PEfeitos,@Sons]
ChamarxPerto[Entidades@0.px,(2.0+@ImpulsoNPC/60.0)]
ChamarxPerto[Entidades@0.py,(2.0+@ImpulsoNPCY/60.0)]
ChamarxPerto[Entidades@0.vx,@ImpulsoNPC]
ChamarxPerto[Entidades@0.vy,@ImpulsoNPCY]
ChamarxPerto[Entidades@0.impulsoX,(@ImpulsoNPC*0.85)]
ChamarxPerto[Entidades@0.impulsoY,(@ImpulsoNPCY*0.85)]
CompararMaiorxyFl64xEntidades@0.pzy0.0
Exigir[@ULTIMO]
${eq('Entidades@0.ai',3)}
// Decaimento tem corte deterministico; residuos nao sobrevivem indefinidamente.
ChamarxFps3DImpulsoDecair[0.000001]
${eq('@ULTIMO',0.0,'Fl64')}
GerarTxtxl'OK'
`;

const edgeElevator=prefix+arena+`
SetVarInSd64xMundo.elevadoresy1
SetVarFl64xElevadores@0.pxy9.0
SetVarFl64xElevadores@0.pyy2.0
SetVarFl64xElevadores@0.pzy1.6
SetVarFl64xElevadores@0.minimoy0.01
SetVarFl64xElevadores@0.maximoy3.2
SetVarFl64xElevadores@0.larguray1.8
SetVarFl64xElevadores@0.comprimentoy1.8
SetVarInSd32xElevadores@0.esperay0
SetVarInSd32xElevadores@0.direcaoy1
ChamarxFps3DCaixa[@Mundo,@Malha,[9.0,2.0,-0.16],[10.8,3.8,0.0],16,0,-1]
RaizQuadradaFl64[(0.22*0.22-0.15*0.15)]
DefVarFl64xCalotaZy@ULTIMO
DefVarFl64xPeBorday(1.6+@CalotaZ-0.22)
// Intersecao XY isolada nao basta: base ao plano, mas fora, esta suspensa.
ChamarxFps3DElevadorApoio[@Elevadores,0,[8.85,2.9,1.6]]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
ChamarxFps3DElevadorApoio[@Elevadores,0,[8.75,2.9,@PeBorda]]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
ChamarxFps3DElevadorApoio[@Elevadores,0,[8.85,2.9,(@PeBorda+0.09)]]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
SetVarFl64xEstado.pxy8.85
SetVarFl64xEstado.pyy2.9
SetVarFl64xEstado.pzy@PeBorda
// Centro fora do retangulo: a calota apoiada ainda e transportada e classificada.
ChamarxFps3DElevadorApoio[@Elevadores,0,[@Estado.px,@Estado.py,@Estado.pz]]
Exigir[@ULTIMO]
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
ChamarxPerto[@Estado.pz,(@PeBorda+0.01333333333333333)]
ChamarxFps3DAndares[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Entidades,@Regioes]
${eq('@Estado.andar',1)}
// Teto com borda x=9 nao e encontrado por raio vertical no centro x=8,85.
SetVarFl64xElevadores@0.pzy1.6
SetVarFl64xEstado.pzy@PeBorda
DefVarFl64xTetoy(@PeBorda+1.05-0.22+0.168)
ChamarxFps3DQuad[@Mundo,@Malha,[9.0,2.0,@Teto],[9.0,3.8,@Teto],[10.8,3.8,@Teto],[10.8,2.0,@Teto],24,1,0,0,Verdadeiro]
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
${eq('Elevadores@0.direcao',-1)}
ChamarxPerto[Elevadores@0.pz,1.6]
ChamarxPerto[@Estado.pz,@PeBorda]
// NPC apoiado na borda deve provocar exatamente a mesma reversao.
SetVarFl64xEstado.pxy2.0
SetVarFl64xEstado.pzy0.0
SetVarInSd32xElevadores@0.esperay0
SetVarInSd32xElevadores@0.direcaoy1
ChamarxFpsEntidadeCriar[@Entidades,0,1,8.85,2.9]
SetVarFl64xEntidades@0.pzy@PeBorda
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
${eq('Elevadores@0.direcao',-1)}
ChamarxPerto[Elevadores@0.pz,1.6]
ChamarxPerto[Entidades@0.pz,@PeBorda]
// Deck descendente intercepta a calota superior mesmo com centro fora da borda.
SetVarInSd64xMundo.triangulosy14
SetVarBlxEntidades@0.ativayFalso
SetVarInSd32xElevadores@0.esperay0
SetVarInSd32xElevadores@0.direcaoy-1
DefVarFl64xSobDecky(1.6-0.16-0.168+0.22-1.05)
SetVarFl64xEstado.pxy8.85
SetVarFl64xEstado.pzy@SobDeck
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
${eq('Elevadores@0.direcao',1)}
ChamarxPerto[Elevadores@0.pz,1.6]
ChamarxPerto[@Estado.pz,@SobDeck]
SetVarFl64xEstado.pxy2.0
SetVarFl64xEstado.pzy0.0
SetVarBlxEntidades@0.ativayVerdadeiro
SetVarFl64xEntidades@0.pzy@SobDeck
SetVarInSd32xElevadores@0.esperay0
SetVarInSd32xElevadores@0.direcaoy-1
ChamarxFps3DElevadoresPasso[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Entidades]
${eq('Elevadores@0.direcao',1)}
ChamarxPerto[Elevadores@0.pz,1.6]
ChamarxPerto[Entidades@0.pz,@SobDeck]
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D jump pulses cannot reset ascending velocity; ceiling, landing and missing support (${optimize})`,()=>run(jumpPulses,optimize,{buildTimeout:180000}));
 test(`3D player and NPC XYZ velocities, blast impulses, decay and swept collision (${optimize})`,()=>run(impulses,optimize,{buildTimeout:180000}));
 test(`3D elevator edge capsules are supported and protected from ceiling and deck crush (${optimize})`,()=>run(edgeElevator,optimize,{buildTimeout:180000}));
}

const stairSupport=prefix+`
${load(0)}
// Percurso da campanha a partir do spawn, sem reposicionar ou saltar.
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarFl64xComando.frentey1.0
SetVarFl64xEstado.anguloy1.5707963267948966
ParaxPasso[0,75,1]
${move}
FimPara
CompararMaiorxyFl64x@Estado.pzy1.5
Exigir[@ULTIMO]
CompararMaiorxyFl64x@Estado.pyy5.5
Exigir[@ULTIMO]
// A mesma locomocao da capsula tambem permite que o ator suba a escada.
DefVarVec3<Fl64>xNPCy[2.5,2.5,0.0]
ParaxPassoNPC[0,75,1]
ChamarxFps3DAndarCapsula[@Mapa,@Mundo,@Malha,@Elevadores,@NPC,[0.0,0.04333333333333333,0.0],1.05]yNPC
FimPara
CompararMaiorxyFl64x@NPC.zy1.5
Exigir[@ULTIMO]
CompararMaiorxyFl64x@NPC.yy5.5
Exigir[@ULTIMO]
// O segundo percurso passa por baixo da plataforma, preservando a altura.
${load(0)}
ParaxHorizontal[0,23,1]
${move}
FimPara
SetVarFl64xEstado.anguloy1.5707963267948966
ParaxPorBaixo[0,75,1]
${move}
FimPara
CompararMenorxyFl64x@Estado.pzy0.05
Exigir[@ULTIMO]
CompararMaiorxyFl64x@Estado.pyy5.5
Exigir[@ULTIMO]
// O centro nao precisa estar sobre o topo: contato exato da calota e apoio.
SetVarInSd64xMundo.triangulosy0
SetVarInSd64xMundo.elevadoresy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,3.5,0.2],[4.0,3.5,0.2],[4.0,4.0,0.2],[0.0,4.0,0.2],23,0,0,0,Verdadeiro]
ChamarxFps3DApoioCapsula[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,3.323,0.111],1.05]
Exigir[@ULTIMO]
// O mesmo contato durante a subida nao reativa apoio nem aceita outro salto.
SetVarFl64xEstado.pxy2.5
SetVarFl64xEstado.pyy3.323
SetVarFl64xEstado.pzy0.111
SetVarFl64xEstado.vzy2.0
SetVarBlxEstado.noChaoyFalso
SetVarFl64xComando.frentey0.0
SetVarBlxComando.pularyVerdadeiro
${move}
ChamarxPerto[@Estado.vz,(2.0-9.8/60.0)]
NaoBlx@Estado.noChao
Exigir[@ULTIMO]
// Suspensao lateral, contato de cintura e face por baixo nao sustentam.
ChamarxFps3DApoioCapsula[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,3.1,0.111],1.05]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
ChamarxFps3DApoioCapsula[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,3.323,-0.2],1.05]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,3.5,0.2],[0.0,4.0,0.2],[4.0,4.0,0.2],[4.0,3.5,0.2],24,0,0,0,Verdadeiro]
ChamarxFps3DApoioCapsula[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,3.323,0.111],1.05]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
// Plano mais inclinado que 45 graus continua sem apoio caminhavel.
SetVarInSd64xMundo.triangulosy0
ChamarxFps3DQuad[@Mundo,@Malha,[0.0,0.0,0.0],[4.0,0.0,0.0],[4.0,1.0,2.0],[0.0,1.0,2.0],23,0,0,0,Verdadeiro]
ChamarxFps3DApoioCapsula[@Mapa,@Mundo,@Malha,@Elevadores,[2.0,0.1,0.0],1.05]
NaoBlx@ULTIMO
Exigir[@ULTIMO]
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D real Bastiao stairs and stacked route use volumetric walkable foot support (${optimize})`,()=>run(stairSupport,optimize,{buildTimeout:180000}));
}

const curvedDoor=prefix+`
ChamarxFps3DNivelCarregar[0,@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PAtores,@PProjeteis,@PEfeitos,@Sons]
ParaIndiceSOAxI[@Entidades]
SetVarBlxEntidades@@I.ativayFalso
FimPara
// Um corredor real em L: a visada ao jogador bate na parede da curva.
ParaIndiceSOAxI[@Mapa]
SetVarInSd32xMapa@@I.materialy1
SetVarBlxMapa@@I.portayFalso
SetVarInSd32xMapa@@I.chavey0
SetVarInSd32xMapa@@I.passoy0
SetVarInSd32xMapa@@I.movimentoy0
SetVarInSd32xMapa@@I.esperay0
SetVarFl64xMapa@@I.aberturay0.0
SetVarFl64xMapa@@I.anteriory0.0
FimPara
ParaxX[2,7,1]
DefVarInSd64xCy(64+@X)
SetVarInSd32xMapa@@C.materialy0
FimPara
ParaxY[2,7,1]
DefVarInSd64xCy(@Y*32+6)
SetVarInSd32xMapa@@C.materialy0
FimPara
ChamarxFpsPortaCriar[@Mapa,4,2,0,1]
SetVarInSd64xMundo.triangulosy0
SetVarInSd64xMundo.regioesy0
SetVarInSd64xMundo.elevadoresy0
ChamarxFps3DConverterMapa[@Mapa,@Estado,@Mundo,@Malha,@Regioes]
ChamarxFps3DGrafoPreparar[@Mundo,@Regioes]
SetVarFl64xEstado.pxy6.5
SetVarFl64xEstado.pyy6.5
SetVarFl64xEstado.pzy0.0
SetVarFl64xEstado.alturaCorpoy1.05
SetVarFl64xEstado.vzy0.0
SetVarBlxEstado.noChaoyVerdadeiro
SetVarBlxEstado.chaveAzulyFalso
SetVarEnum<FpsFase>xEstado.fasey@FpsFase.Jogando
ChamarxFpsEntidadeCriar[@Entidades,0,1,2.5,2.5]
SetVarFl64xEntidades@0.pzy0.0
SetVarFl64xEntidades@0.alturaCorpoy1.05
SetVarInSd32xEntidades@0.viday10
SetVarInSd32xEntidades@0.tipoAtaquey1
SetVarInSd32xEntidades@0.aiy2
SetVarFl64xEntidades@0.postoXy2.5
SetVarFl64xEntidades@0.postoYy2.5
ChamarxFps3DSub[[6.5,6.5,0.63],[2.5,2.5,0.85]]
DefVarVec3<Fl64>xVy@ULTIMO
ChamarxVetor3Fl64Comprimento[@V]
DefVarFl64xDisty@ULTIMO
ChamarxVetor3Fl64Escalar[@V,(1.0/@Dist)]
ChamarxFps3DRaio[@Mapa,@Mundo,@Malha,@Elevadores,[2.5,2.5,0.85],@ULTIMO,@Dist]
DefVarRegistro<Fps3DContato>xContatoJogadory@ULTIMO
CompararMaiorIgualxyInSd64x@ContatoJogador.trianguloy0
Exigir[@ULTIMO]
CompararIgualxyInSd32x@ContatoJogador.movely0
Exigir[@ULTIMO]
// Sem a chave, o grafo e a porta impedem a passagem.
DefVarRegistro<Fps3DComando>xComandoyPadrao
ParaxJ[0,120,1]
SetVarInSd64xMundo.sonsy0
ChamarxFps3DPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@Comando,@PProjeteis,@PEfeitos,@Sons]
CompararIgualxyInSd32xMapa@68.passoy0
Exigir[@ULTIMO]
CompararIgualxyInSd32xMapa@68.movimentoy0
Exigir[@ULTIMO]
CompararIgualxyInSd64x@Mundo.sonsy0
Exigir[@ULTIMO]
FimPara
CompararMenorxyFl64xEntidades@0.pxy4.0
Exigir[@ULTIMO]
// Com a chave reutilizavel, siga a mesma rota e atravesse a porta em movimento.
SetVarBlxEstado.chaveAzulyVerdadeiro
DefVarInSd32xSonsAbriry0
DefVarBlxAbriuyFalso
ParaxJ[0,200,1]
SetVarInSd64xMundo.sonsy0
ChamarxFps3DPasso[@Mapa,@Estado,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@Comando,@PProjeteis,@PEfeitos,@Sons]
CompararMaiorxyInSd32xMapa@68.passoy0
OuxyBlx@Abriuy@ULTIMO
SetVarBlxAbriuy@ULTIMO
ParaxQ[0,@Mundo.sons,1]
CompararIgualxyInSd32xSons@@Q.tipoy4
Sex@ULTIMO
SetVarInSd32xSonsAbriry(@SonsAbrir+1)
CompararIgualxyInSd32xSons@@Q.prioridadey30
Exigir[@ULTIMO]
ChamarxPerto[Sons@@Q.px,4.5]
ChamarxPerto[Sons@@Q.py,2.5]
ChamarxPerto[Sons@@Q.pz,1.8]
FimSe
FimPara
FimPara
Exigir[@Abriu]
CompararIgualxyInSd32x@SonsAbriry1
Exigir[@ULTIMO]
CompararMaiorxyFl64xEntidades@0.pxy4.8
Exigir[@ULTIMO]
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,[Entidades@0.px,Entidades@0.py,Entidades@0.pz],Entidades@0.alturaCorpo]
Exigir[@ULTIMO]
Exigir[@Estado.chaveAzul]
GerarTxtxl'OK'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D NPC follows a curved route, honors the key and opens the route door once (${optimize})`,()=>run(curvedDoor,optimize,{buildTimeout:180000}));
}

const validSpawns=prefix+`
// A carga real dos tres mapas deve aceitar apenas capsulas livres apos conversao.
ParaxN[0,3,1]
InSd64ParaInSd32[@N]
${load('@ULTIMO')}
ParaIndiceSOAxI[@Entidades]
CompararIgualxyInSd32xEntidades@@I.tipoy1
ExyBlx@ULTIMOyEntidades@@I.ativa
Sex@ULTIMO
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,[Entidades@@I.px,Entidades@@I.py,Entidades@@I.pz],Entidades@@I.alturaCorpo]
Exigir[@ULTIMO]
FimSe
FimPara
FimPara
GerarTxtxl'OK'
`;
const invalidSpawn=prefix+`
${load(0)}
// Uma parede cruza a capsula em toda a faixa das 36 tentativas de ajuste.
SetVarInSd64xMundo.triangulosy0
SetVarFl64xEntidades@0.pxy2.5
SetVarFl64xEntidades@0.pyy2.5
SetVarFl64xEntidades@0.pzy0.0
SetVarFl64xEntidades@0.alturaCorpoy1.05
ChamarxFps3DQuad[@Mundo,@Malha,[2.5,1.0,-1.0],[2.5,4.0,-1.0],[2.5,4.0,4.0],[2.5,1.0,4.0],0,0,0,0,Verdadeiro]
GerarTxtxl'BEGIN_INVALID_SPAWN'
ChamarxFps3DAtorSpawnValidar[@Mapa,@Mundo,@Malha,@Elevadores,@Entidades,0]
GerarTxtxl'UNREACHABLE_INVALID_SPAWN'
`;
for(const optimize of ['-O0','-O2']) {
 test(`3D converted campaign spawns validate the final capsule (${optimize})`,()=>run(validSpawns,optimize,{buildTimeout:180000}));
 test(`3D exhausted spawn adjustment rejects a blocked capsule (${optimize})`,()=>{
  const assert=require('node:assert/strict');
  const {execute}=require('../../../tom-lang/tests/helpers');
  const {loadModules}=require('../../../tom-lang/core/module-loader');
  const {root,file,environment}=require('./helpers');
  const result=execute(invalidSpawn,{file,modules:loadModules(invalidSpawn,file),optimize,assets:require('node:path').join(root,'assets'),environment,maximumLiveObjects:64,buildTimeout:180000});
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/BEGIN_INVALID_SPAWN/);
  assert.doesNotMatch(result.stdout,/UNREACHABLE_INVALID_SPAWN/);
  assert.match(result.stdout+result.stderr,/mundo3d\.tom:\d+:1: erro:/);
 });
}
