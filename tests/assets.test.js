'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {atlas,wav}=require('../scripts/generate-assets');
const {root}=require('./helpers');
test('packaged art and sounds match their deterministic generators',()=>{
  assert.deepEqual(fs.readFileSync(path.join(root,'assets/atlas.png')),atlas());
  for(const kind of ['tiro','dano','item'])assert.deepEqual(fs.readFileSync(path.join(root,'assets',kind+'.wav')),wav(kind));
});
test('all level spawns and the exit are reachable from the player',()=>{
  const source=fs.readFileSync(path.join(root,'src/fase.tom'),'utf8');
  const rows=[...source.matchAll(/ChamarxFpsMapaLinha\[@Mapa,\d+,l'([0-3]+)'\]/g)].map(m=>m[1]);
  assert.equal(rows.length,16);assert.ok(rows.every(row=>row.length===16));
  const seen=new Set(['2,2']),queue=[[2,2]];
  for(let i=0;i<queue.length;i++){const[x,y]=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(rows[ny]?.[nx]==='0'&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}}
  const spawns=[...source.matchAll(/ChamarxFpsEntidadeCriar\[@Entidades,(\d+),(\d+),([\d.]+),([\d.]+)\]/g)];
  assert.equal(spawns.filter(m=>m[2]==='1').length,6);
  for(const m of spawns)assert.ok(seen.has(`${Math.floor(+m[3])},${Math.floor(+m[4])}`),`unreachable spawn ${m[1]}`);
  assert.equal(spawns.filter(m=>m[2]==='4').length,1);
});
