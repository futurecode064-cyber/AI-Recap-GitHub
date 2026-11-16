const test=require('node:test');const assert=require('node:assert/strict');const freshness=require('../news-freshness.js');
test('Yangon midnight, rather than host timezone, selects the news edition',()=>{
 assert.equal(freshness.dayKey(new Date('2026-11-15T17:29:59Z')),'2026-11-15');
 assert.equal(freshness.dayKey(new Date('2026-11-15T17:30:00Z')),'2026-11-16');
});
test('yesterday and future feeds cannot render as current news',()=>{
 const now=new Date('2026-11-16T01:00:00Z');
 for(const date of ['2026-11-15','2026-11-17',undefined])assert.equal(freshness.inspect({date,items:[{}]},now).current,false);
 assert.equal(freshness.inspect({date:'2026-11-16',items:[{}]},now).current,true);
 assert.equal(freshness.inspect({date:'2026-11-16',items:[]},now).current,false);
});
