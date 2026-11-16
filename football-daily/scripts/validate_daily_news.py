#!/usr/bin/env python3
"""Reject stale/replayed daily news; source research is still performed by the invoked editor."""
import argparse,datetime as dt,json
from pathlib import Path

def validate(feed,day,previous_feeds=()):
    errors=[];items=feed.get('items',[])
    if feed.get('date')!=str(day):errors.append('News edition date does not match publication day')
    if len(items)!=10:errors.append('Ten distinct current news stories required')
    prior={}
    for old in previous_feeds:
        for x in old.get('items',[]):
            for key in ['sourceUrl','eventKey']:
                if x.get(key):prior[x[key]]=x
    seen=set()
    for item in items:
        ident=item.get('id','?')
        for key in ['sourceUrl','eventKey']:
            value=item.get(key)
            if not value:errors.append(f'{ident}: missing {key}')
            elif value in seen:errors.append(f'{ident}: duplicate {key}')
            else:seen.add(value)
            old=prior.get(value)
            if old and not(item.get('newDevelopment') and item.get('sourceDateISO','')>old.get('sourceDateISO','')):
                errors.append(f'{ident}: previously published event/source replay without a verified newer development')
        try:
            source_day=dt.date.fromisoformat(item.get('sourceDateISO','')[:10]);age=(day-source_day).days
            if age<0 or age>2:errors.append(f'{ident}: source outside current 48-hour calendar window')
        except ValueError:errors.append(f'{ident}: source publication date missing')
        if len(item.get('paragraphs',[])) not in range(4,7):errors.append(f'{ident}: original four-to-six-paragraph article required')
        if not all(item.get(k) for k in ['image','imageSourceUrl','imageCredit','imageLicense','imageLicenseUrl']):errors.append(f'{ident}: authentic photo attribution incomplete')
    return errors

def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--date',required=True);args=p.parse_args();day=dt.date.fromisoformat(args.date)
    feed=json.loads((args.root/'data/news/latest.json').read_text());previous=[]
    for age in range(1,8):
        path=args.root/f'data/news/archive/{day-dt.timedelta(days=age)}.json'
        if path.exists():previous.append(json.loads(path.read_text()))
    errors=validate(feed,day,previous)
    print(json.dumps({'newsDate':feed.get('date'),'stories':len(feed.get('items',[])),'previousEditionsChecked':len(previous),'status':'FAIL' if errors else 'PASS','errors':errors},ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
if __name__=='__main__':main()
