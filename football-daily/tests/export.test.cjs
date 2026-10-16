const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sources=['canvas-image-kit.js','daily-image-export.js','card-export.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8'));
const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-12.json'),'utf8'));
const currentSheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-13.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-12.json'),'utf8'));
const current=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));

function harness(){
 const drawn=[],clicked=[],canvases=[];
 const document={
  fonts:{ready:Promise.resolve()},
  body:{appendChild(){}},
  createElement(type){
   if(type==='a')return {click(){clicked.push(this.download)},remove(){}};
   if(type!=='canvas')throw Error('unexpected DOM creation: '+type);
   const canvas={width:0,height:0,toBlob(cb){cb({size:500,type:'image/png'})}};
   const ctx={
    canvas,fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},rect(){},clip(){},
    createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}},
    drawImage(){drawn.push({type:'logo'})},
    measureText(value){return {width:String(value).length*11}},
    fillText(value){drawn.push({type:'text',value:String(value)})}
   };
   canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }
 };
 class FakeImage{constructor(){this.naturalWidth=100;this.naturalHeight=100}
  set src(value){queueMicrotask(()=>this.onload?.())}
 }
 const BrowserURL={createObjectURL(){return 'blob:png'},revokeObjectURL(){}};
 const window={};
 const sandbox={window,document,Image:FakeImage,URL:BrowserURL,setTimeout,clearTimeout,Promise,console};
 const context=vm.createContext(sandbox);
 for(const src of sources)vm.runInContext(src,context);
 return {window,drawn,clicked,canvases};
}
test('fast Canvas odds PNG renders every original league table row, prices, prediction and header',async()=>{
 const x=harness();await x.window.FutureCodeDailyExport.saveOdds(sheet);
 assert.equal(x.clicked[0],'future-code-odds-2026-10-12.png');
 assert.equal(x.canvases[0].width,1200);
 const groups=new Set(sheet.matches.map(m=>m.league));
 assert.equal(x.canvases[0].height,222+groups.size*126+sheet.matches.length*68+80,
  'PNG height must include all league headings and every match without clipping');
 const labels=x.drawn.filter(n=>n.type==='text').map(n=>n.value);
 assert.ok(labels.includes('ယနေ့ ပေါက်ကြေးများ'));
 for(const m of sheet.matches){
  assert.ok(labels.join('').includes(m.home),m.home+' missing');
  assert.ok(labels.join('').includes(m.away),m.away+' missing');
  assert.ok(labels.includes(m.bodyOdds),m.bodyOdds+' missing');
  assert.ok(labels.includes(m.goalTotalOdds),m.goalTotalOdds+' missing');
  assert.ok(labels.includes(m.pdfLastColumn),m.pdfLastColumn+' missing');
 }
 for(const name of ['ပွဲချိန်','ယှဉ်ပြိုင်မည့်အသင်း','အပေါ်အသင်း','ဘော်ဒီကြေး','ဂိုးပေါင်းကြေး','အင်တာနက်ခန့်မှန်းချက်']){
  assert.equal(labels.filter(x=>x===name).length,new Set(sheet.matches.map(m=>m.league)).size);
 }
 assert.ok(x.drawn.some(n=>n.type==='logo'),'logo should render');
});
test('goal results canvas includes only confirmed final-score fixtures',async()=>{
 const x=harness();
 await assert.rejects(()=>x.window.FutureCodeDailyExport.saveResults({date:'2026-10-11',matches:[
  {status:'scheduled',finalScore:'9-0'}
 ]}),/ရလဒ်များ မရှိသေးပါ/);
 await x.window.FutureCodeDailyExport.saveResults({date:'2026-10-11',matches:[
  {homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',league:'Premier League',status:'finished',finalScore:'2-1'},
  {home:'Fake',away:'Future',status:'scheduled',finalScore:'9-9'},
  {home:'Invalid',away:'Invalid',status:'finished',finalScore:'TBD'}
 ]});
 assert.equal(x.clicked[0],'football-goal-results-2026-10-11.png');
 const labels=x.drawn.filter(n=>n.type==='text').map(n=>n.value);
 assert.ok(labels.includes('ဂိုးရလဒ်များ'));
 assert.ok(labels.includes('2-1'));
 assert.ok(!labels.includes('9-9'));
 assert.ok(!labels.includes('TBD'));
});
test('preview PNG keeps full text, both 5-game WDL strips and central 1X2 without H2H',async()=>{
 const x=harness(),match=report.matches.find(m=>m.homeLastFive?.length&&m.headToHead?.length);
 assert.ok(match);
 const translated={...match,home:match.homeDisplay||match.home,away:match.awayDisplay||match.away};
 await x.window.FutureCodeCardExport.save(translated,{brandName:'FUTURE CODE FOOTBALL',leagueLabel:'စပိန် လာလီဂါ ၂'});
 const labels=x.drawn.filter(n=>n.type==='text').map(n=>n.value);
 assert.equal(x.canvases[1].width,1200);
 assert.ok(labels.includes('ပွဲကြိုသုံးသပ်ချက်'));
 assert.ok(labels.includes('အိမ်ရှင် နောက်ဆုံး ၅ ပွဲ'));
 assert.ok(!labels.some(x=>String(x).includes('H2H')));
 assert.ok(labels.includes('ပွဲပြီး 1X2 ကြေး'));
 assert.ok(labels.includes('W = နိုင်  •  D = သရေ  •  L = ရှုံး'));
 assert.ok(labels.includes('ဧည့်သည် နောက်ဆုံး ၅ ပွဲ'));
 assert.ok(labels.includes(String(match.homeOdds)));
 assert.ok(labels.includes(String(match.drawOdds)));
 assert.ok(labels.includes(String(match.awayOdds)));
 assert.ok(labels.includes(translated.home));
 assert.ok(labels.includes(translated.away));
 assert.ok(labels.join(' ').includes(match.dailyPreviewText.replace(/\*\*/g,'').slice(0,10)));
 assert.ok(x.clicked[0].endsWith('.png'));
});
test('Special Choice PNG renders only exclusive special article, not normal article',async()=>{
 const match=current.matches.find(m=>m.specialChoice===true);
 assert.ok(match,"Need at least one special match to validate");
 const synthetic={...match,
  home:match.homeDisplay,away:match.awayDisplay,
  dailyPreviewText:"REGULAR_ONLY_MARKER — do not duplicate the normal match analysis in Special Choice",
  specialAnalysisParagraphs:["EXCLUSIVE_SPECIAL_MARKER — အထူးသုံးသပ်ချက် တစ်ခုတည်းသာ ပြသမည်။",
   "SECOND_SPECIAL_PARAGRAPH — အခြားအထူးသုံးသပ်ချက် အကြောင်းအရာ။"]
 };
 const normal=harness();
 await normal.window.FutureCodeCardExport.save(synthetic,{brandName:"FUTURE CODE FOOTBALL",special:false});
 const regularText=normal.drawn.filter(x=>x.type==="text").map(x=>x.value).join(" ");
 assert.ok(regularText.includes("REGULAR_ONLY_MARKER"));
 assert.ok(!regularText.includes("EXCLUSIVE_SPECIAL_MARKER"));
 assert.ok(regularText.includes("ပွဲကြိုသုံးသပ်ချက်"));
 const special=harness();
 await special.window.FutureCodeCardExport.save(synthetic,{brandName:"FUTURE CODE FOOTBALL",special:true});
 const specialLabels=special.drawn.filter(x=>x.type==="text").map(x=>x.value);
 const specialText=specialLabels.join(" ");
 assert.ok(specialText.includes("EXCLUSIVE_SPECIAL_MARKER"));
 assert.ok(specialText.includes("SECOND_SPECIAL_PARAGRAPH"));
 assert.ok(!specialText.includes("REGULAR_ONLY_MARKER"));
 assert.ok(!specialLabels.includes("ပွဲကြိုသုံးသပ်ချက်"),"No second normal-analysis title");
 assert.ok(specialLabels.some(x=>x.includes("★ SPECIAL CHOICE")));
 assert.ok(special.canvases[1].height>925,"Full special analysis must fit");
 assert.ok(special.clicked[0]?.endsWith(".png"));
});

test('native Canvas export contains no DOM snapshot / external export dependency',()=>{
 const js=sources.join('\n');
 assert.ok(!js.includes('domtoimage'));
 assert.ok(!js.includes('html2canvas'));
 assert.ok(!js.includes('cloneNode('));
 assert.ok(js.includes('canvas.toBlob'));
});

test('today preview PNG accepts bookmaker odds and verified form with no H2H panel',async()=>{
 const x=harness(),match=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-14.json'),'utf8')).matches[0];
 assert.ok(match.homeLastFive?.length===5&&match.awayLastFive?.length===5);
 assert.equal(match.headToHead.length,0);
 assert.ok(Number(match.homeOdds)>1);
 await x.window.FutureCodeCardExport.save({...match,home:match.homeDisplay,away:match.awayDisplay},{brandName:'FUTURE CODE FOOTBALL',leagueLabel:'UEFA Champions League'});
 const labels=x.drawn.filter(n=>n.type==='text').map(n=>n.value);
 assert.ok(labels.includes(match.homeDisplay));
 assert.ok(labels.includes(match.awayDisplay));
 assert.ok(!labels.some(x=>String(x).includes('H2H')));
 assert.ok(labels.includes('ပွဲပြီး 1X2 ကြေး'));
 assert.ok(labels.includes('W = နိုင်  •  D = သရေ  •  L = ရှုံး'));
 assert.ok(x.clicked[0]?.endsWith('.png'));
});

test('13 Oct PNG contains all 21 user-provided fixture rows, prices, internet forecasts and original Myanmar labels',async()=>{
 const x=harness();
 await x.window.FutureCodeDailyExport.saveOdds(currentSheet);
 const labels=x.drawn.filter(n=>n.type==='text').map(n=>n.value);
 assert.equal(currentSheet.matches.length,21);
 assert.equal(x.canvases[0].width,1200);
 const groups=new Set(currentSheet.matches.map(m=>m.league));
 assert.equal(x.canvases[0].height,222+groups.size*126+21*68+80);
 assert.ok(x.clicked[0].endsWith('odds-2026-10-13.png'));
 for(const match of currentSheet.matches){
  assert.ok(labels.join('').includes(match.home),'Missing original converted home '+match.home);
  assert.ok(labels.join('').includes(match.away),'Missing original converted away '+match.away);
  assert.ok(labels.includes(match.goalTotalOdds),'Missing original total '+match.home);
  assert.ok(labels.includes(match.pdfLastColumn),'Missing original internet forecast '+match.home);
  if(match.bodyOdds!==null)assert.ok(labels.includes(match.bodyOdds),'Missing original body price '+match.home);
  assert.ok(labels.includes(String(match.kickoffDisplay).replace(/^.*? ည /,'ည ')),'Missing Myanmar overnight time '+match.home);
 }
});
