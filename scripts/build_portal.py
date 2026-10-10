#!/usr/bin/env python3
"""Publish only reachable current APK pages; no downloads from older ZIPs."""
from pathlib import Path
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'training-app/assets'
PORTAL=ROOT/'portal'

def main():
    modules=json.loads((ASSETS/'studio/modules.json').read_text())
    assert len(modules)==8 and len({m['id'] for m in modules})==8
    content=PORTAL/'content'
    if content.exists(): shutil.rmtree(content)
    (content/'sections').mkdir(parents=True)
    shutil.copytree(ASSETS/'studio',content/'studio')
    pages={m['asset'].split('?')[0] for m in modules}|{'sections/pro-video-guide.html','sections/studio-help.html'}
    for page in sorted(pages):
        source=ASSETS/page
        assert 'navigation.js' in source.read_text(),page
        shutil.copy2(source,content/page)
    legacy={
        'recap':'recap','recap-guide':'help/recap',
        'image-studio':'image-studio','image-guide':'help/image',
        'video-maker':'video-maker','video-guide':'help/video',
        'academy':'future','guides':'lessons','downloads':'downloads','tools':'tools',
        'design':'documents','invoice':'documents','lesson-videos':'lesson-videos'
    }
    for name,route in legacy.items():
        directory=PORTAL/name;directory.mkdir(exist_ok=True)
        url='../student/?section='+route
        (directory/'index.html').write_text('<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url='+url+'"><title>Future Code Student Studio</title></head><body><p><a href="'+url+'">Student Studio ကို ဖွင့်မည်</a></p></body></html>')
    (PORTAL/'index.html').write_text('<!doctype html><html lang="my"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=student/"><title>Future Code AI Studio</title></head><body><a href="student/">Student Portal</a> · <a href="admin/">Admin</a></body></html>')
    (PORTAL/'404.html').write_text('<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Future Code · Page မတွေ့ပါ</title></head><body><h1>Page မတွေ့ပါ။</h1><p><a href="/AI-Recap-GitHub/student/">Student Portal ပင်မသို့ ပြန်မည်</a></p></body></html>')
    (PORTAL/'.nojekyll').touch()
    print(f'Portal ready: {len(modules)} modules, {len(pages)} pages and {len(legacy)} compatible links.')

if __name__=='__main__': main()
