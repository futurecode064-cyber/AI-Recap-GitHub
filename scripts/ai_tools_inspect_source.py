#!/usr/bin/env python3
import json, urllib.request, collections
try:
  import yaml
except ImportError:
  raise SystemExit('Missing PyYAML')
url='https://raw.githubusercontent.com/archestack/best-of-ai/main/data/entries.yaml'
req=urllib.request.Request(url,headers={'User-Agent':'Future-Code-AI-Tools-Schema-Inspector/1.0'})
with urllib.request.urlopen(req,timeout=30) as r:
 data=yaml.safe_load(r.read(5*1024*1024))
print('DATA TYPE:',type(data).__name__)
if isinstance(data,dict):
 print('ROOT KEYS:',list(data.keys()))
 for k,v in data.items():
  if isinstance(v,list): print('ARRAY:',k,len(v));print('FIRST:',json.dumps(v[0],ensure_ascii=False,default=str)[:4000] if v else 'empty')
  elif isinstance(v,dict):print('OBJECT:',k,list(v.keys())[:30]);print('FIRST CHILD:',json.dumps(next(iter(v.values())),ensure_ascii=False,default=str)[:2000] if v else 'empty')
  else:print('SCALAR:',k,str(v)[:300])
elif isinstance(data,list):
 print('LENGTH',len(data))
 print('FIRST',json.dumps(data[0],ensure_ascii=False,default=str)[:5000] if data else '')
 print('SECOND',json.dumps(data[1],ensure_ascii=False,default=str)[:2000] if len(data)>1 else '')

from collections import Counter
if isinstance(data,dict) and isinstance(data.get('entries'),list):
 entries=data['entries']
 print('CATEGORY DISTRIBUTION:',dict(Counter(cat for e in entries for cat in (e.get('categories') or []))))
 print('STATUS DISTRIBUTION:',dict(Counter(e.get('status') for e in entries)))
 print('REPO PRESENCE:',sum(bool(e.get('repo')) for e in entries))
 print('SCORED:',sum(e.get('score') is not None for e in entries))
 print('SAMPLE CATEGORIES:',[(e.get('id'),e.get('categories')) for e in entries[:25]])
