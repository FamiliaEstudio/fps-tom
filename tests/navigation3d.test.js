'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {run,eq}=require('./helpers');
const setup=`Importar[l'../src/simulacao3d.tom']
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
`;
const load=n=>`ChamarxFps3DNivelCarregar[${n},@Estado,@Mapa,@Entidades,@Mundo,@Malha,@Elevadores,@Regioes,@Projeteis,@Efeitos,@Luzes,@PAtores,@PProjeteis,@PEfeitos,@Sons]\n`;
const nav=`ChamarxFps3DNavegacao[@Mapa,@Estado,@Mundo,@Malha,@Elevadores,@Regioes]\n`;
const mover=`ChamarxFps3DMover[@Mapa,@Mundo,@Malha,@Elevadores,@Estado,@Comando]\n`;
const source=setup+`
// BFS usa raios 3D da malha; cada chave é acessível antes de ser concedida.
ParaxNivel[0,3,1]
InSd64ParaInSd32[@Nivel]
${load('@ULTIMO')}
${nav}
ParaxEtapa[5,7,1]
ParaIndiceSOAxI[@Entidades]
SexEntidades@@I.ativa
InSd64ParaInSd32[@Etapa]
CompararIgualxyInSd32xEntidades@@I.tipoy@ULTIMO
Sex@ULTIMO
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[Entidades@@I.px,Entidades@@I.py,Entidades@@I.pz]]
DefVarInSd64xAlvoy@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@Alvo.distanciay0
Exigir[@ULTIMO]
CompararIgualxyInSd64x@Etapay5
Sex@ULTIMO
SetVarBlxEstado.chaveAzulyVerdadeiro
Senao
SetVarBlxEstado.chaveVermelhayVerdadeiro
FimSe
${nav}
FimSe
FimSe
FimPara
FimPara
DefVarInSd32xSaidasy0
ParaIndiceSOAxI[@Entidades]
SexEntidades@@I.ativa
CompararIgualxyInSd32xEntidades@@I.tipoy4
Sex@ULTIMO
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[Entidades@@I.px,Entidades@@I.py,Entidades@@I.pz]]
DefVarInSd64xAlvoy@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@Alvo.distanciay0
Exigir[@ULTIMO]
SetVarInSd32xSaidasy(@Saidas+1)
FimSe
FimSe
FimPara
${eq('@Saidas',1)}
// A mesma região XY possui rotas caminháveis superior e inferior.
DefVarVec3<Fl64>xSuperiory[3.5,5.75,1.6]
DefVarVec3<Fl64>xInferiory[3.5,5.75,0.0]
CompararMaiorxyInSd64x@Nively0
Sex@ULTIMO
SetVarVec3<Fl64>xSuperiory[7.5,4.8,1.6]
SetVarVec3<Fl64>xInferiory[7.5,4.8,0.0]
FimSe
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,@Superior]
DefVarInSd64xRegSuperior y@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@RegSuperior.distanciay0
Exigir[@ULTIMO]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,@Inferior]
DefVarInSd64xRegInferiory@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@RegInferior.distanciay0
Exigir[@ULTIMO]
CompararDiferentexyInSd64x@RegSuperiory@RegInferior
Exigir[@ULTIMO]
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,@Inferior,1.05]
Exigir[@ULTIMO]
CompararIgualxyInSd64x@Nively2
Sex@ULTIMO
// O segundo percurso sobreposto do Núcleo também liga à campanha.
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[5.5,8.6,1.6]]
DefVarInSd64xSegundaPassarelay@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@SegundaPassarela.distanciay0
Exigir[@ULTIMO]
ChamarxFps3DRegiaoPerto[@Mundo,@Regioes,@Elevadores,[5.5,8.6,0.0]]
DefVarInSd64xAbaixoPassarelay@ULTIMO
CompararMaiorIgualxyInSd32xRegioes@@AbaixoPassarela.distanciay0
Exigir[@ULTIMO]
CompararDiferentexyInSd64x@SegundaPassarelay@AbaixoPassarela
Exigir[@ULTIMO]
ChamarxFps3DLivre[@Mapa,@Mundo,@Malha,@Elevadores,[5.5,8.6,0.0],1.05]
Exigir[@ULTIMO]
FimSe
FimPara
// Percurso por comandos na malha real de Bastião: escadas até a passarela.
${load(0)}
DefVarRegistro<Fps3DComando>xComandoyPadrao
SetVarFl64xComando.frentey1.0
SetVarFl64xEstado.anguloy1.5707963267948966
ParaxI[0,75,1]
${mover}
FimPara
CompararMaiorxyFl64x@Estado.pzy1.5
Exigir[@ULTIMO]
CompararMaiorxyFl64x@Estado.pyy5.5
Exigir[@ULTIMO]
// Um segundo percurso começa no spawn e passa por baixo da mesma plataforma.
${load(0)}
ParaxI[0,23,1]
${mover}
FimPara
SetVarFl64xEstado.anguloy1.5707963267948966
ParaxI[0,75,1]
${mover}
FimPara
CompararMenorxyFl64x@Estado.pzy0.05
Exigir[@ULTIMO]
CompararMaiorxyFl64x@Estado.pyy5.5
Exigir[@ULTIMO]
GerarTxtxl'navegacao-ok'`.replace('xRegSuperior y','xRegSuperiory');
for(const optimize of ['-O0','-O2'])test(`campanha 3D: chaves/saídas nos três mapas e percursos sobre/baixo ${optimize}`,()=>assert.equal(run(source,optimize,{buildTimeout:180000}).stdout,'navegacao-ok'));
