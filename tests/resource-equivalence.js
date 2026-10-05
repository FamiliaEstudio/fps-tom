'use strict';
const assert=require('node:assert/strict');
// PCM16: tolerância registrada antes da implementação para libm versus V8.
// Cabeçalho, tamanho e taxa são exatos; nunca comparar só estatísticas do som.
function comparePCM(actual,expected,label='WAV') {
  assert.equal(actual.length,expected.length,label);
  assert.deepEqual(actual.subarray(0,44),expected.subarray(0,44),label);
  let different=0,maximumDelta=0;
  for(let offset=44;offset<actual.length;offset+=2) {
    const delta=Math.abs(actual.readInt16LE(offset)-expected.readInt16LE(offset));
    if(delta)different++;
    maximumDelta=Math.max(maximumDelta,delta);
    assert.ok(delta<=1,`${label}: amostra ${(offset-44)/2}, delta ${delta}`);
  }
  return {samples:(actual.length-44)/2,different,maximumDelta};
}
module.exports={comparePCM};
