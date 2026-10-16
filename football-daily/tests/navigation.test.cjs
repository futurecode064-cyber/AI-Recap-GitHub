const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function setup(branded=false){
 const elements=new Map(),requests=[];
 function element(tag='div'){
  const classes=new Set();
  return {tagName:tag,textContent:'',children:[],attrs:{},dataset:{},
    classList:{toggle(name,force){if(force)classes.add(name);else classes.delete(name)},add(name){classes.add(name)},contains(name){return classes.has(name)}},
    appendChild(n){this.children.push(n);return n},replaceChildren(...items){this.children=items},
    setAttribute(k,v){this.attrs[k]=v},addEventListener(){},
    querySelectorAll(){return this.children.filter(x=>x.tagName==='button')}
  };
 }
 const document={baseURI:'https://example.com/'+(branded?'myanmar-football/':''),documentElement:{dataset:branded?{footballDataUrl:'../data/today.json'}:{}},getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){}};
 const context=vm.createContext({document,Intl,Date,URL,AbortController,setTimeout,clearTimeout,console,fetch(url){return new Promise((resolve,reject)=>requests.push({url,resolve,reject}))}});
 vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
 return {run:code=>vm.runInContext(code,context),requests,elements};
}
function ok(reportDate,extras={}){return {ok:true,status:200,json:async()=>({reportDate,published:true,matches:[],...extras})}}
test('branded page resolves yesterday archive and today shared data',async()=>{
 const s=setup(true);
 for(const [day,fragment] of [[-1,/^\/data\/archive\/\d{4}-\d{2}-\d{2}\.json$/],[0,/^\/data\/today\.json$/]]){
  const pending=s.run(`selectedDay=${day};load()`),req=s.requests.at(-1);
  assert.match(new URL(req.url).pathname,fragment);
  req.resolve(ok(s.run('selectedDateKey()')));await pending;
 }
});
test('only competitions represented in the selected date report are visible',async()=>{
 const s=setup(),pending=s.run('load()');
 s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[
  {home:'A',away:'B',league:'English FA Cup'},
  {home:'C',away:'D',league:'UEFA Nations League'},
  {home:'E',away:'F',league:'English FA Cup'}
 ]}));await pending;
 const names=s.elements.get('filters').children.map(x=>x.dataset.league);
 assert.deepEqual(names,['all','FA Cup','UEFA Nations League']);
 assert.equal(names.includes('Premier League'),false);
});
test('special choice filter is hidden unless an actual selected-date choice exists',async()=>{
 const s=setup(),pending=s.run('load()');
 s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[
   {home:'A',away:'B',league:'Serie B',specialChoice:true}
 ]}));await pending;
 assert.deepEqual(s.elements.get('filters').children.map(x=>x.dataset.league),['all','Serie B','special']);
});
test('late rejected request cannot overwrite newer successful selection',async()=>{
 const s=setup(),old=s.run('load()'),next=s.run('selectedDay=-1;load()');
 s.requests[1].resolve(ok(s.run('selectedDateKey()')));await next;
 s.requests[0].reject(Error('old request failed'));await old;
 assert.equal(s.elements.get('statusText').textContent,'ရလဒ်မရရှိသေး');
});
test('latest refresh wins even for the same date',async()=>{
 const s=setup(),a=s.run('load()'),b=s.run('load()');
 s.requests[1].resolve(ok(s.run('selectedDateKey()')));await b;
 s.requests[0].resolve({ok:false,status:500});await a;
 assert.equal(s.elements.get('statusText').textContent,'ထုတ်ဝေပြီး');
});
test('unpublished and stale reports do not leak matches',async()=>{
 for(const extras of [{published:false},{reportDate:'2000-01-01'}]){
  const s=setup(),pending=s.run('load()');
  s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[{home:'A',away:'B'}],...extras}));
  // When a report is unpublished/stale, the site checks a separate fixture-only snapshot.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(s.requests.length,2);
  s.requests[1].resolve({ok:false,status:404});
  await pending;
  assert.equal(s.run('report.matches.length'),0);
 }
});
test('malformed report recovers to retryable error',async()=>{
 const s=setup(),pending=s.run('load()');s.requests[0].resolve(ok(s.run('selectedDateKey()'),{matches:[null]}));await pending;
 assert.equal(s.elements.get('statusText').textContent,'ချိတ်ဆက်မှု မအောင်မြင်');
 assert.equal(s.elements.get('matchList').attrs['aria-busy'],'false');
});
test('both entry pages contain navigation targets and both export modules',()=>{
 for(const file of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const id of ['dateTabs','dateYesterday','dateToday','reportHeading','reportPill'])assert.ok(html.includes(`id="${id}"`),`${file}: ${id}`);
  assert.equal(html.includes('data-day="1"'),false);
  for(const script of ['card-export.js','social-export.js','app.js'])assert.ok(html.includes(script));
 }
});

test('archived 12 Oct editorial sheet preserves all 17 user-submitted prices and nine historical previews',()=>{
 const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-12.json'),'utf8'));
 const archive=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-12.json'),'utf8'));
 assert.equal(sheet.reportDate,'2026-10-12');
 assert.equal(archive.reportDate,'2026-10-12');
 assert.equal(sheet.matches.length,17);
 assert.equal(sheet.matches.filter(x=>x.eligibleForPreview).length,9);
 assert.equal(archive.matches.length,9);
 for(const m of archive.matches){
  const quote=sheet.matches.find(x=>x.home===m.homeDisplay&&x.away===m.awayDisplay);
  assert.ok(quote,'No historical PDF price row for '+m.homeDisplay);
  assert.equal(m.myanmarOdds.bodyOdds,quote.bodyOdds);
  assert.equal(m.myanmarOdds.goalTotalOdds,quote.goalTotalOdds);
  assert.equal(m.dailyPreviewText.split('**').length,5);
  assert.equal(m.status,'finished');
  assert.ok(/^\d+-\d+$/.test(m.finalScore),'Invalid verified final score for '+m.home);
  assert.ok(m.finalScoreSourceUrl?.startsWith('https://'),'Final score source missing '+m.home);
 }
});

test('13 Oct user PDF contributes all 21 odds rows and exactly 16 independently verifiable preview fixtures',()=>{
 const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-13.json'),'utf8'));
 const report=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-13-previews.json'),'utf8'));
 assert.equal(sheet.reportDate,'2026-10-13');
 assert.equal(sheet.matches.length,21);
 assert.equal(sheet.matches.filter(x=>x.eligibleForPreview).length,16);
 assert.equal(report.reportDate,'2026-10-13');
 assert.equal(report.published,true);
 assert.equal(report.matches.length,16);
 assert.equal(report.matches.filter(x=>x.league==='UEFA Champions League').length,9);
 assert.equal(report.matches.filter(x=>x.league==='Championship').length,7);
 assert.equal(sheet.matches[0].bodyOdds,null,'Unspecified Lens original body quote must not be invented');
 for(const q of sheet.matches){
  assert.match(q.kickoffDisplay,/၁၃ ရက်နေ့ ည /,'Night editorial date missing');
  assert.ok(q.pdfOriginalLegacy?.home&&q.pdfOriginalLegacy?.away,'Original PDF spelling not preserved');
  assert.match(q.pdfLastColumn,/^\d-\d$/,'Internet prediction column must be intact');
  if(q.kickoffDate==='2026-10-14')assert.ok(q.kickoffDisplay.includes('ည ၁:'));
 }
 for(const match of report.matches){
  const q=sheet.matches.find(x=>x.canonicalHome===match.home&&x.canonicalAway===match.away);
  assert.ok(q,'Preview outside user-supplied match list '+match.home);
  assert.equal(match.homeDisplay,q.home);
  assert.equal(match.awayDisplay,q.away);
  assert.equal(match.kickoffYangon,q.kickoffDisplay);
  assert.equal(match.kickoffCalendarDate,q.kickoffDate);
  assert.equal(match.myanmarOdds.bodyOdds,q.bodyOdds);
  assert.equal(match.myanmarOdds.goalTotalOdds,q.goalTotalOdds);
  assert.equal(match.dailyPreviewText.split('**').length,5);
  assert.ok(match.dailyPreviewText.length>400);
  assert.ok(match.researchSources.length>=2);
  assert.ok(Array.isArray(match.homeLastFive)&&Array.isArray(match.awayLastFive)&&Array.isArray(match.headToHead));
  assert.ok(Number(match.homeOdds)>1&&Number(match.drawOdds)>1&&Number(match.awayOdds)>1);
  assert.ok(match.oddsProvider&&match.oddsSourceUrl.startsWith('https://'));
  assert.equal(match.oddsMarket,'Full-time 1X2');
  assert.equal(match.oddsIsLive,false);
  if(match.league==='Championship'){
   for(const side of ['homeStanding','awayStanding']){
    const rec=match[side];
    assert.equal(rec.played,9);
    assert.equal(rec.wins+rec.draws+rec.losses,9);
    assert.equal(rec.points,rec.wins*3+rec.draws);
   }
  }
 }
});

test('odds page and its browser script are linked from both football entry pages',()=>{
 assert.ok(fs.existsSync(path.join(root,'odds.html')));
 assert.ok(fs.existsSync(path.join(root,'odds.js')));
 for(const file of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(html.includes('odds.html'),file);
 }
});

test('every featured match has correctly linked home/away crests and native Burmese labels',()=>{
 const today=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 for(const m of today.matches){
  assert.ok(m.homeDisplay && m.awayDisplay,'Burmese team label missing: '+m.home);
  if(m.homeCrestUrl!==null)assert.match(m.homeCrestUrl,/^https:\/\//,'Invalid home crest '+m.home);
  if(m.awayCrestUrl!==null)assert.match(m.awayCrestUrl,/^https:\/\//,'Invalid away crest '+m.away);
  for(const g of m.headToHead||[]){
   assert.ok(g.homeCrestUrl && g.awayCrestUrl,'H2H crests missing '+m.home+' / '+m.away);
  }
 }
});
test('odds sheet clearly labels internet predictions and morning Myanmar market openings',()=>{
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(html.includes('အာရှ စျေးကွက် မြန်မာကြေး မနက်ပိုင်း ဖွင့်လှစ်မှုများ'));
 assert.ok(!html.includes('မူရင်းစာရင်း၏ နောက်ဆုံးကော်လံကို'));
 assert.ok(js.includes('အင်တာနက်ခန့်မှန်းချက်'));
 assert.ok(js.includes('homeCrestUrl') && js.includes('awayCrestUrl'));
 assert.ok(js.includes('odds-matchup'));
});
test('compact WDL badges are derived from verified finished games and no H2H UI is rendered',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(js.includes('function formLetter(game)'));
 assert.ok(js.includes('game.teamGoals>game.opponentGoals?"W"'));
 assert.ok(js.includes('renderWdlStrip(match,"home")'));
 assert.ok(js.includes('renderWdlStrip(match,"away")'));
 assert.ok(!js.includes('renderFormAndH2H(match)'));
 assert.ok(!js.includes('Head-to-Head · နောက်ဆုံး ၅ ကြိမ်'));
});

test('old source bookie odds stay in 12 Oct archive and new report has verified independently sourced coherent 1X2 triplets',()=>{
 const archive=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-12.json'),'utf8'));
 assert.equal(archive.matches.length,9);
 for(const m of archive.matches){
  for(const key of ['homeOdds','drawOdds','awayOdds'])assert.ok(Number(m[key])>1);
  assert.ok(m.oddsSourceUrl?.startsWith('https://'));
  assert.equal(m.oddsMarket,'Full-time 1X2');
 }
 const today=JSON.parse(fs.readFileSync(path.join(root,'data/today.json'),'utf8'));
 for(const m of today.matches){
  const vals=[m.homeOdds,m.drawOdds,m.awayOdds];
  if(vals.every(v=>v===null||v===undefined)){
   assert.ok(!m.oddsProvider&&!m.oddsSourceUrl,'Unverified 1X2 source should not be invented '+m.home);
  }else{
   assert.ok(vals.every(v=>Number(v)>1),'Incomplete 1X2 for '+m.home);
   assert.ok(m.oddsProvider&&m.oddsSourceUrl?.startsWith('https://'),'Unattributed fulltime odds '+m.home);
  }
  assert.equal(m.oddsMarket,'Full-time 1X2');
 }
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.ok(js.includes('oddBox("အိမ်ရှင် (1)",match.homeOdds)'));
 assert.ok(js.includes('oddBox("ဧည့်သည် (2)",match.awayOdds)'));
});

test('navigation has three equally grouped Yesterday/Today/Odds boxes in both entry pages',()=>{
 for(const filename of ['index.html','myanmar-football/index.html']){
  const html=fs.readFileSync(path.join(root,filename),'utf8');
  const from=html.indexOf('<nav class="date-tabs"');
  const to=html.indexOf('</nav>',from);
  const nav=html.slice(from,to);
  assert.equal((nav.match(/data-day=/g)||[]).length,2);
  assert.ok(nav.includes('date-tab-odds'),filename);
  assert.ok(nav.includes('odds.html'),filename);
  assert.ok(!html.includes('odds-feature-link'),filename);
  assert.ok(html.includes('id="resultsPngBtn"'),filename);
  assert.ok(html.includes('daily-image-export.js'),filename);
 }
});
test('mobile odds keeps screenshot-style table grid with horizontal scrolling instead of dark cards',()=>{
 const html=fs.readFileSync(path.join(root,'odds.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'odds-sheet-theme.css'),'utf8');
 assert.ok(html.includes('id="oddsPngBtn"'));
 assert.ok(html.includes('daily-image-export.js?v=odds-filter-20261016'));
 assert.ok(html.includes('odds-sheet-theme.css?v=odds-filter-20261016'));
 assert.ok(html.indexOf('odds-sheet-theme.css')>html.indexOf('</style>'),'New stylesheet must override old inline card CSS');
 assert.ok(css.includes('overflow-x:auto!important'));
 assert.ok(css.includes('display:table-row!important'));
 assert.ok(css.includes('display:table-cell!important'));
 assert.ok(css.includes('display:table-header-group!important'));
 assert.ok(css.includes('background:#fff!important'));
});
test('new screenshot-inspired team hero and WDL–1X2–WDL layout is responsive and has no H2H panel',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 const exporter=fs.readFileSync(path.join(root,'card-export.js'),'utf8');
 assert.ok(js.includes('function renderMatchHero(match)'));
 assert.ok(js.includes('hero-team-crest'));
 assert.ok(!js.includes('hero-team-photo'));
 assert.ok(!js.includes('hero-player-silhouette'));
 assert.ok(!js.includes('match[side+"HeroImageUrl"]'));
 assert.ok(js.includes('renderQuoteAndForm(match)'));
 assert.ok(js.includes('node("span","hero-info-side hero-info-left")'));
 assert.ok(!js.includes('node("strong","hero-info-home"'));
 assert.ok(js.includes('node("span","hero-info-side hero-info-right")'));
 assert.ok(!js.includes('node("strong","hero-info-away"'));
 assert.ok(js.includes('node("strong","hero-info-fixture",teamLabel(match,"home")+" နှင့် "+teamLabel(match,"away"))'));
 assert.ok(!js.includes('hero-info-kickoff'));
 assert.ok(css.includes('.hero-team{display:grid;place-items:center'));
 assert.ok(css.includes('.hero-team-crest{position:static'));
 assert.ok(!css.includes('.hero-player-silhouette'));
 assert.ok(js.includes('renderWdlStrip(match,"home")'));
 assert.ok(js.includes('renderWdlStrip(match,"away")'));
 assert.ok(css.includes('.market-form-row{display:grid;grid-template-columns:'));
 assert.ok(css.includes('.hero-info-bar{display:grid'));
 assert.ok(css.includes('.analysis-body p{font-size:18px'));
 assert.ok(css.includes('font-size:16.5px;line-height:2.05'));
 assert.ok(exporter.includes('const crestY=heroY+(heroH-badgeSize)/2'));
 assert.ok(!exporter.includes('heroKit('));
 assert.ok(!exporter.includes('kickoffYangon'));
 assert.ok(exporter.includes('const infoY=473,infoH=83,infoMiddle=460'));
 assert.ok(!exporter.includes('text(ctx,home,M+outer/2'));
 assert.ok(!exporter.includes('text(ctx,away,M+outer+'));
 assert.ok(exporter.includes('text(ctx,home+" နှင့် "+away,W/2'));
 assert.ok(!exporter.includes('photoCover(ctx,'));
 assert.ok(!exporter.includes('ထိပ်တိုက်တွေ့ဆုံမှု H2H'));
});
test('Canvas exporter includes all odds entries and only confirmed results',()=>{
 const js=fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8');
 assert.ok(js.includes('async function saveOdds(data,options={})'), 'Odds exporter supports league-specific option');
 assert.ok(js.includes('async function saveResults({matches,date})'));
 assert.ok(js.includes('matches.filter(verified)'));
 assert.ok(js.includes('m.status==="finished"'));
 assert.ok(js.includes('window.FutureCodeDailyExport={saveOdds,saveOddsSmart,saveResults}'));
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const odds=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 assert.ok(app.includes('window.FutureCodeDailyExport.saveResults'));
  assert.ok(odds.includes('odds-league-download'), 'Each odds league has its own PNG download action');
  assert.ok(app.includes('allPreviewsDownloadBtn'), 'Published preview page has all-match batch export');
 assert.ok(odds.includes('window.FutureCodeDailyExport.saveOdds'));
});

test('Native Canvas renderer is loaded ahead of download exporters',()=>{
 const kit=fs.readFileSync(path.join(root,'canvas-image-kit.js'),'utf8');
 assert.ok(kit.includes('window.FutureCodeCanvasKit'));
 assert.ok(kit.includes('preloadImages'));
 assert.ok(kit.includes('950'));
 for(const file of ['index.html','myanmar-football/index.html','odds.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const a=html.indexOf('canvas-image-kit.js');
  const b=html.indexOf('daily-image-export.js');
  assert.ok(a>0&&b>a,'Canvas script must load before export scripts in '+file);
  // All live entrypoints use bounded native Canvas (no DOM serializer).
  assert.equal(html.includes('dom-capture.js'),false);
 }
});

test('Myanmar overnight convention is shared across odds HTML, full Canvas PNG and every published preview',()=>{
 const odds=fs.readFileSync(path.join(root,'odds.js'),'utf8');
 const png=fs.readFileSync(path.join(root,'daily-image-export.js'),'utf8');
 assert.ok(odds.includes('const time=m.kickoffDisplay||m.kickoff||"";'));
 assert.ok(png.includes('const clock=String(m.kickoffDisplay||m.kickoff||"")'),'PNG preserves exact Myanmar overnight label');
 assert.ok(!odds.includes('၁၃ ရက် မနက်'));
 const preview=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-15.json'),'utf8'));
 assert.ok(preview.matches.some(m=>m.kickoffCalendarDate==='2026-10-16'&&m.kickoffYangon.includes('၁၅ ရက်နေ့ ည ၁:၃၀')));
});

test('all 21 supplied Myanmar-odds matches have both verified club badge source URLs',()=>{
 const sheet=JSON.parse(fs.readFileSync(path.join(root,'data/odds/2026-10-13.json'),'utf8'));
 assert.equal(sheet.matches.length,21);
 for(const match of sheet.matches){
  assert.ok(match.homeCrestUrl?.startsWith('https://'),'Missing home badge '+match.canonicalHome);
  assert.ok(match.awayCrestUrl?.startsWith('https://'),'Missing away badge '+match.canonicalAway);
 }
});

test('all 16 previews contain authentic five-by-two prior finished games with event-level citations and opponent logos where sourced',()=>{
 const report=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-13-previews.json'),'utf8'));
 const research=[
  JSON.parse(fs.readFileSync(path.join(root,'data/research/2026-10-13-team-forms-01.json'),'utf8')),
  JSON.parse(fs.readFileSync(path.join(root,'data/research/2026-10-13-team-forms-02.json'),'utf8'))
 ];
 const provider=new Map(research.flatMap(x=>x.teams).map(t=>[t.name,t]));
 let count=0;
 for(const match of report.matches){
  assert.ok(match.homeCrestUrl?.startsWith('https://'),'Missing preview home badge '+match.home);
  assert.ok(match.awayCrestUrl?.startsWith('https://'),'Missing preview away badge '+match.away);
  assert.equal(match.homeLastFive.length,5,'Missing home form '+match.home);
  assert.equal(match.awayLastFive.length,5,'Missing away form '+match.away);
  assert.ok(match.headToHeadSourceUrl?.startsWith('https://'),'H2H citation missing '+match.home);
  for(const [team,form] of [[match.home,match.homeLastFive],[match.away,match.awayLastFive]]){
   assert.ok(provider.has(team),'Research missing for '+team);
   for(const item of form){
    assert.ok(item.sourceUrl?.startsWith('https://'),'Source missing '+team);
    assert.ok(item.date<='2026-10-12','Future game used as prior match '+team);
    assert.ok(Number.isInteger(item.teamGoals)&&Number.isInteger(item.opponentGoals),'Score malformed '+team);
    assert.ok(['home','away'].includes(item.venueSide),'No venue '+team);
    count++;
   }
  }
 }
 assert.equal(count,160);
});

test('live 13 October H2H cards contain verified actual prior scores only, never predicted results',()=>{
 const report=JSON.parse(fs.readFileSync(path.join(root,'data/archive/2026-10-13-previews.json'),'utf8'));
 const historic=JSON.parse(fs.readFileSync(path.join(root,'data/research/2026-10-13-livescore-h2h.json'),'utf8'));
 let total=0;
 for(const match of report.matches){
  const src=historic.matches.find(x=>x.home===match.home&&x.away===match.away);
  assert.ok(src,'Missing LiveScore H2H page reference '+match.home);
  assert.equal(match.headToHead.length,src.previousMeetings.length,'Unverified extra H2H '+match.home);
  for(const [i,g] of match.headToHead.entries()){
   const s=src.previousMeetings[i];
   assert.equal(g.home,s.home);
   assert.equal(g.away,s.away);
   assert.equal(g.homeGoals,s.homeGoals);
   assert.equal(g.awayGoals,s.awayGoals);
   assert.ok(g.sourceUrl?.startsWith('https://'),'H2H match source URL missing');
   total++;
  }
 }
 assert.ok(total>=40,'Expected verified historical H2H records for matches with actual prior meetings');
});

test('match preview header has no duplicate top-line date or time',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const part=js.slice(js.indexOf('function renderMatch(match,i){'),js.indexOf('function renderLeagueFilters('));
 assert.ok(!part.includes('node("span","match-time"'));
 assert.ok(!part.includes('textOrEmpty(match.kickoffYangon)'));
 assert.ok(!part.includes('hero-info-kickoff'));
 assert.ok(part.includes('card.appendChild(renderMatchHero(match))'));
});
