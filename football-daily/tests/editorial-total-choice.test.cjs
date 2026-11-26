'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function api(){const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'main-editorial-choice.js'),'utf8'),{window,document:{documentElement:{dataset:{}},head:{appendChild(){}},createElement(){return {}}}});return window.FutureCodeEditorialChoice;}
test('Confirmed total-goals picks remain visible in the main card and PNG label',()=>{const c=api();for(const pick of ['ဂိုးပေါ်','ဂိုးအောက်','Over','Under']){const m={homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',previewV2Selection:pick};assert.equal(c.pick(m),pick);assert.ok(c.line(m).endsWith(pick));}});
test('Closing goal selection is read without inventing an unconfirmed team choice',()=>{const c=api();assert.equal(c.pick({homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',dailyPreviewText:'ဂိုးအောက်ကို ရွေးချယ်ပါတယ်။'}),'ဂိုးအောက်');assert.equal(c.pick({homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',selection:'unrelated'}),'');});
test('Every current published pick is identical in the report and main image label',()=>{const c=api(),d=JSON.parse(fs.readFileSync(path.join(root,'data/today.json')));for(const m of d.matches)assert.equal(c.pick(m),m.previewV2Selection,m.fixtureId);});
