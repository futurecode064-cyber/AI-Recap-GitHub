const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('V3 and V4 frame migrations are independent startup functions and retain saved assignments',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','frame-workspace.js'),'utf8');
 const begin=source.indexOf('// V4 uses a separate default'),end=source.indexOf('function assignPreviewV2()',begin);
 const data=new Map(),state={placements:{previewsV3:['customer-v3'],previewsV4:['customer-v4']},selected:{}},context={state,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},frame:id=>({id}),assigned:(id,k)=>state.placements[k].includes(id)};
 vm.runInNewContext(source.slice(begin,end),context);
 assert.equal(typeof context.assignPreviewV3,'function');assert.equal(typeof context.assignPreviewV4,'function');
 assert.equal(context.assignPreviewV4(),true);assert.equal(context.assignPreviewV3(),true);
 assert.deepEqual(state.placements.previewsV4,['customer-v4','preview-v4-red-gold']);assert.deepEqual(state.placements.previewsV3,['customer-v3','preview-v3-gold']);
 assert.equal(context.assignPreviewV4(),false);assert.equal(context.assignPreviewV3(),false);
});
