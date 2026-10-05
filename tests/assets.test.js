'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {atlas,wav}=require('../scripts/generate-assets');
const {decodePNG}=require('../scripts/prepare-clips'),{comparePCM}=require('./resource-equivalence');
const {generated}=require('../scripts/generate-renderers');
const {root}=require('./helpers');
test('arte, sons e adaptadores GPU correspondem aos geradores',()=>{
  assert.deepEqual(decodePNG(fs.readFileSync(path.join(root,'assets/atlas.png'))),decodePNG(atlas()));
  for(const kind of ['tiro','dano','item','abrir','fechar'])comparePCM(fs.readFileSync(path.join(root,'assets',kind+'.wav')),wav(kind),kind);
  for(const [file,source] of Object.entries(generated()))assert.equal(fs.readFileSync(path.join(root,'src',file),'utf8').split('\n').slice(1).join('\n'),source);
});
test('os tres mapas permitem obter chaves, alcançar todos os alvos e concluir a campanha',()=>{
  const source=fs.readFileSync(path.join(root,'src/fase.tom'),'utf8');
  const levels=[...source.matchAll(/CompararIgualxyInSd32x@Nively(\d+)\nSex@ULTIMO\n([\s\S]*?)FimSe/g)];
  assert.equal(levels.length,3);
  for(const [number,level] of levels.map(m=>[+m[1],m[2]])){
    const size=[16,24,32][number];
    const rows=[...level.matchAll(/FpsMapaLinha\[@Mapa,\d+,l'([0-3]+)'\]/g)].map(m=>m[1]);
    assert.equal(rows.length,size);assert.ok(rows.every(r=>r.length===32));
    for(let y=0;y<size;y++)for(let x=0;x<32;x++)if(x===0||y===0||x>=size-1||y===size-1)assert.notEqual(rows[y][x],'0');
    const doors=new Map([...level.matchAll(/FpsPortaCriar\[@Mapa,(\d+),(\d+),(\d+),(\d+)\]/g)].map(m=>[`${m[1]},${m[2]}`,+m[4]]));
    const entities=[...level.matchAll(/FpsEntidadeCriar\[@Entidades,(\d+),(\d+),([\d.]+),([\d.]+)\]/g)].map(m=>({slot:+m[1],type:+m[2],x:Math.floor(+m[3]),y:Math.floor(+m[4])}));
    assert.equal(entities.filter(e=>e.type===1).length,[6,10,16][number]);
    assert.equal(entities.filter(e=>e.type===4).length,1);assert.ok(doors.size<=32);assert.ok(entities.every(e=>e.slot<64));
    const keys=new Map(entities.filter(e=>e.type===5||e.type===6).map(e=>[`${e.x},${e.y}`,1<<(e.type-5)]));
    const queue=[[2,2,0]],seen=new Set(['2,2,0']),reachable=new Set();
    for(let i=0;i<queue.length;i++){
      const [x,y,inventory]=queue[i];reachable.add(`${x},${y}`);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,k=`${nx},${ny}`,lock=doors.get(k)||0;
        if(rows[ny]?.[nx]!=='0'||lock&&!(inventory&(1<<(lock-1))))continue;
        const mask=inventory|(keys.get(k)||0),state=`${k},${mask}`;
        if(!seen.has(state)){seen.add(state);queue.push([nx,ny,mask]);}
      }
    }
    for(const e of entities)assert.ok(reachable.has(`${e.x},${e.y}`),`nivel ${number}: entidade ${e.slot} inacessivel`);
    for(const k of doors.keys())assert.ok(reachable.has(k),`porta inacessivel ${k}`);
  }
});
