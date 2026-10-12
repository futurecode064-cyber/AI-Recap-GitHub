const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const exportSource=fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8');
const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-12.json'),'utf8'));
function harness(){
 const written=[],clicked=[],canvases=[];
 const document={
  fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(type){
   if(type==='a')return {click(){clicked.push(this.download)},remove(){}};
   if(type!=='canvas')throw Error('unexpected element '+type);
   const canvas={width:0,height:0,toBlob(cb){cb({mime:'image/png'})}};
   const ctx={canvas,beginPath(){},roundRect(){},rect(){},fill(){},fillRect(){},drawImage(){},
      measureText(value){return {width:String(value).length*10}},
      fillText(value){written.push(String(value))}};
   canvas.getContext=()=>ctx;canvases.push(canvas);
   return canvas;
  }
 };
 class Img{set src(v){queueMicrotask(()=>this.onerror?.(new Error('CORS blocked')))}}
 const browserURL={createObjectURL(){return 'blob:png'},revokeObjectURL(){}};
 const window={};
 const ctx=vm.createContext({document,window,Image:Img,URL:browserURL,console,setTimeout,clearTimeout,queueMicrotask});
 vm.runInContext(exportSource,ctx);
 return {exporter:window.FutureCodeDailyExport,written,clicked,canvases};
}
test('complete daily odds PNG includes every source row, both team names, odds, predictions and title',async()=>{
 const s=harness();await s.exporter.saveOdds(sheet);
 assert.equal(s.clicked.length,1);
 assert.equal(s.clicked[0],'future-code-odds-2026-10-12.png');
 assert.ok(s.canvases[0].height>2000,'not enough room for all fixtures');
 for(const m of sheet.matches){
  assert.ok(s.written.includes(m.home),'missing home club '+m.number);
  assert.ok(s.written.includes(m.away),'missing away club '+m.number);
  assert.ok(s.written.some(t=>t.includes('ဘော်ဒီ  '+m.bodyOdds)),'missing body quote '+m.number);
  assert.ok(s.written.some(t=>t.includes('ခန့်မှန်း  '+m.pdfLastColumn)),'missing internet prediction '+m.number);
 }
 assert.ok(s.written.includes('ယနေ့ ပေါက်ကြေးများ'));
});
test('goals-results PNG refuses predictions and includes only confirmed finished games',async()=>{
 const s=harness();
 await assert.rejects(()=>s.exporter.saveResults({date:'2026-10-11',matches:[
  {home:'Test A',away:'Test B',finalScore:'1-0',status:'scheduled'}
 ]}),/ရလဒ်များ မရှိသေးပါ/);
 const matches=[
  {homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',league:'Premier League',status:'finished',finalScore:'2-1'},
  {home:'Pending',away:'Prediction',league:'Premier League',status:'scheduled',finalScore:'9-9'},
  {home:'Incomplete',away:'No score',league:'La Liga',status:'finished',finalScore:'TBD'}
 ];
 await s.exporter.saveResults({date:'2026-10-11',matches});
 assert.equal(s.clicked[0],'football-goal-results-2026-10-11.png');
 assert.ok(s.written.includes('ဂိုးရလဒ်များ'));
 assert.ok(s.written.includes('2-1'));
 assert.ok(!s.written.includes('9-9'));
 assert.ok(!s.written.includes('TBD'));
 assert.equal(s.written.filter(x=>x==='1 ပွဲပြီး').length,1);
});
