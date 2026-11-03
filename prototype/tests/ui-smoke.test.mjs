import test from 'node:test';import assert from 'node:assert/strict';
test('UI module renders empty home with mocked browser APIs',async()=>{
 const elements=new Map();const el=(id)=>{if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{remove(){},add(){}},focus(){}});return elements.get(id)};
 globalThis.document={getElementById:el,body:{classList:{remove(){},add(){}}},addEventListener(){}};
 globalThis.localStorage={getItem(){return null;},setItem(){}};
 globalThis.window={};
 await import('../src/app.mjs');
 assert.match(el('app').innerHTML,/복잡한 마음은 내려놓고/);
 assert.match(el('app').innerHTML,/한 걸음/);
 assert.match(el('app').innerHTML,/정원/);
});
