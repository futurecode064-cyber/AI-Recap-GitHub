#!/usr/bin/env python3
"""Read-only cross-resource morning package validation; not independent fact checking."""
import argparse, json, re
from pathlib import Path
from datetime import date, timedelta
p=argparse.ArgumentParser(); p.add_argument('--root',type=Path,required=True);p.add_argument('--date',required=True)
p.add_argument('--special-count',type=int,default=2)
a=p.parse_args(); day=date.fromisoformat(a.date); errors=[]
def check(ok,msg):
    if not ok: errors.append(msg)
def read(path):
    try:return json.loads((a.root/path).read_text(encoding='utf-8'))
    except (OSError,ValueError) as e: errors.append(f'{path}: {e}');return {}
# KuPS is printed in Latin in the owner source sheet; preserve its official name.
def my(v):return isinstance(v,str) and (bool(re.search('[\u1000-\u109f]',v)) or v=='KuPS')
r=read('data/today.json');o=read(f'data/odds/{day}.json');t=read(f'data/tips/{day}.json');n=read('data/news/latest.json');y=read(f'data/archive/{day-timedelta(days=1)}.json')
for label,obj in [('report',r),('odds',o),('tips',t)]:check(obj.get('reportDate')==str(day),f'{label}: wrong date')
ms=r.get('matches',[]);rows=o.get('matches',[])
check(bool(ms),'No previews');check(bool(rows),'No odds rows');check(len(rows)==o.get('sourceRows'),'PDF row count mismatch')
for label,items in [('previews',ms),('odds',rows)]:
    ids=[m.get('fixtureId') for m in items];check(all(ids) and len(ids)==len(set(ids)),f'{label}: missing/duplicate fixture IDs')
    for m in items:
        ident=m.get('fixtureId','?')
        for field in (['homeDisplay','awayDisplay','leagueDisplay'] if label=='previews' else ['home','away','leagueDisplay']):check(my(m.get(field)),f'{ident}: missing Myanmar {field}')
byid={m.get('fixtureId'):m for m in ms}
for row in rows:
    ident=row.get('fixtureId');m=byid.get(ident)
    check(row.get('eligibleForPreview') in (True,False),f'{ident}: eligibility not declared')
    if row.get('eligibleForPreview'):check(m is not None,f'{ident}: eligible preview missing')
    for f in ['bodyOdds','goalTotalOdds']:check(bool(row.get(f)),f'{ident}: missing {f}')
    if m:
        for f,g in [('home','homeDisplay'),('away','awayDisplay'),('leagueDisplay','leagueDisplay')]:check(row.get(f)==m.get(g),f'{ident}: inconsistent {g}')
for m in ms:
    ident=m.get('fixtureId');check(any(x.get('fixtureId')==ident for x in rows),f'{ident}: no odds row')
    prose=m.get('dailyPreviewText','');check(len(prose)>=300 and '\n' not in prose,f'{ident}: incomplete/multiple-paragraph preview')
    check(bool(re.search(r'ကို ရွေး(?:ချယ်)?ပါတယ်။(?:\*\*)?$',prose)),f'{ident}: preview ending')
    for side in ['home','away']:
        form=m.get(side+'LastFive',[]);check(len(form)==5,f'{ident}: {side} last five incomplete')
        for game in form:check(game.get('result') in ['W','D','L'] and bool(game.get('date')),f'{ident}: invalid last-five entry')
    for f in ['homeOdds','drawOdds','awayOdds','homeCrestUrl','awayCrestUrl','leagueLogoUrl','oddsSourceUrl']:check(bool(m.get(f)),f'{ident}: missing {f}')
# Permanent Preview V2 candidate guard from 2026-11-01 onward.
# Prevent publishing a new day with copied/opening sentence summaries or duplicate banners.
if day >= date(2026,11,1):
    for m in ms:
        ident=m.get('fixtureId','?')
        summary=m.get('previewV2Summary','')
        source=m.get('dailyPreviewText','')
        chosen=m.get('previewV2Selection')
        check(m.get('previewV2FormatVersion')=='2.1',f'{ident}: missing active V2 format 2.1')
        check(m.get('previewV2EditorialDate')==str(day) and m.get('previewV2SourcePreviewDate')==str(day),f'{ident}: stale V2 editorial/source date')
        check(isinstance(summary,str) and 180<=len(summary.strip())<=720 and summary.count('။')>=2,f'{ident}: unreviewed or incomplete V2 editorial')
        check(isinstance(summary,str) and not source.startswith(summary[:110]),f'{ident}: V2 mechanically clipped from original')
        check(isinstance(chosen,str) and chosen in [m.get('homeDisplay'),m.get('awayDisplay')],f'{ident}: V2 selection must match PDF Myanmar team name')
        check('reviewed' in str(m.get('previewV2EditorialStatus','')),f'{ident}: V2 human/editorial review marker missing')
choices=[m for m in ms if m.get('specialChoice')];check(len(choices)==a.special_count,'Special Choice count differs from requested count')
for m in choices:
    paragraphs=m.get('specialAnalysisParagraphs',[])
    # The owner's current premium standard is one developed paragraph, not
    # the historical multi-paragraph template. Require depth, not padding.
    check(len(paragraphs)==1 and isinstance(paragraphs[0],str) and
          len(paragraphs[0])>len(m.get('dailyPreviewText','')) and
          bool(re.search(r'ကို ရွေး(?:ချယ်)?ပါတယ်။(?:\*\*)?$',paragraphs[0])),
          f"{m.get('fixtureId')}: premium one-paragraph special analysis incomplete")
for m in ms:
    check(m.get('oddsVerifiedDate')==str(day),f"{m.get('fixtureId')}: 1X2 not reverified for today's probability section")
tids={x.get('fixtureId') for x in t.get('items',[])}
for ident in byid:check(ident in tids,f'{ident}: VIP source or explicit unavailable record missing')
for item in t.get('items',[]):
    check(item.get('fixtureId') in byid,'Tips contain unknown fixture')
    check(bool(item.get('unavailableReason')) or all(item.get(f) for f in ['score','sourceUrl','sourceName','sourceDate']),'VIP tip lacks provenance')
check(n.get('date')==str(day),'News is stale');check(len(n.get('items',[]))==10,'News must contain ten items')
for item in n.get('items',[]):
    check(bool(item.get('sourceUrl')),'News source missing')
    check(all(item.get(f) for f in ['image','imageCredit','imageCaption','imageSourceUrl','imageLicense']),
          f"{item.get('id')}: news image or provenance missing")
    image=item.get('image','')
    if image.startswith('/'):
        check((a.root/image.lstrip('/')).is_file(),f"{item.get('id')}: bundled news image missing")
check(y.get('reportDate')==str(day-timedelta(days=1)),'Yesterday archive date mismatch')
for m in y.get('matches',[]):
    if m.get('status')=='finished':check(bool(re.fullmatch(r'\d+-\d+',str(m.get('finalScore','')))) and bool(m.get('resultSourceUrl')),f"{m.get('fixtureId')}: FT lacks score/source")
print(json.dumps({'date':str(day),'status':'FAIL' if errors else 'STRUCTURAL_PASS','counts':{'previews':len(ms),'odds':len(rows),'special':len(choices),'tips':len(tids),'news':len(n.get('items',[]))},'errors':errors,'requires':'Independent source audit plus actual live section/PNG/ZIP/video verification'},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
