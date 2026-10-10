#!/usr/bin/env python3
"""Validate reachable APK resources, menu/lesson routing and JS syntax."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'training-app/assets'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.resources=[]; self.links=[]; self.scripts=[]; self.script=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='script' and not a.get('src'): self.script=''
        if tag=='script' and a.get('src'): self.resources.append(a['src'])
        if tag=='link' and a.get('rel')=='stylesheet': self.resources.append(a.get('href',''))
        if tag=='a': self.links.append(a.get('href',''))
    def handle_data(self, data):
        if self.script is not None: self.script+=data
    def handle_endtag(self, tag):
        if tag=='script' and self.script is not None: self.scripts.append(self.script); self.script=None

pages=['academy-advanced','pro-video-guide','ai-apps-download','ai-directory','document-studio','image-studio','video-maker','media-editor','lesson-videos','studio-help']
checks=0
for name in pages:
    path=ASSETS/'sections'/f'{name}.html'; page=Page(); page.feed(path.read_text())
    if name in ['image-studio','video-maker','media-editor','lesson-videos','studio-help']:
        assert len(page.ids)==len(set(page.ids)),f'duplicate ids: {name}'
    for resource in page.resources:
        if resource.startswith(('http:','https:','data:')): continue
        assert (path.parent/resource.split('?')[0]).resolve().is_file(),f'missing {resource} in {name}'
    for script in page.scripts:
        with tempfile.NamedTemporaryFile('w',suffix='.js') as f:
            f.write(script); f.flush(); subprocess.run(['node','--check',f.name],check=True,capture_output=True)
    if name in ['image-studio','video-maker','media-editor']:
        script={'image-studio':'image','video-maker':'video','media-editor':'editor'}[name]
        code=(ASSETS/'studio'/f'{script}.js').read_text()
        required=set(re.findall(r"\$\('([^']+)'\)",code))
        assert not required-set(page.ids),f'missing JS ids: {required-set(page.ids)}'
        assert "frame-src 'none'" in path.read_text()
    checks+=1
for script in (ASSETS/'studio').glob('*.js'):
    subprocess.run(['node','--check',str(script)],check=True,capture_output=True); checks+=1
for name in ['academy','academy-advanced']:
    text=(ASSETS/'sections'/f'{name}.html').read_text()
    assert "FCNav.open('lessons')" in text
    assert not re.search(r"""showPage\(['"]course['"]\)""",text)
native=(ROOT/'training-app/src/mm/futurecode/videostudio/MainActivity.java').read_text()
manifest=json.loads((ASSETS/'studio/modules.json').read_text())
ids=[m['id'] for m in manifest]
assert ids==['future','downloads','tools','documents','image-studio','video-maker','recap','lesson-videos']
assert 'loadModules()' in native and 'studio/modules.json' in native
for m in manifest:
    assert (ASSETS/m['asset'].split('?')[0]).is_file()
    assert m['permissions']
assert len(ids)==len(set(ids))
assert '"lessons".equals(host)' in native and '"sections/pro-video-guide.html","သင်ခန်းစာများ"' in native
group=Page();group.feed((ASSETS/'sections/lesson-videos.html').read_text())
assert 'https://t.me/+KALI6r9Dnls1ZTc1' in group.links
assert 'https://www.facebook.com/share/g/1F7FrTwv4b/' in group.links
workflow=(ROOT/'.github/workflows/video-studio-academy.yml').read_text()
assert 'curl ' not in workflow and 'changeme' not in workflow
assert 'RELEASE_KEYSTORE_PASSWORD' in workflow
print(f'PASS: {checks} reachable pages/scripts, exact group links, eight menu entries, lesson routing and checked-in-source workflow.')

portal=ROOT/'portal'
for name in pages:
    path=portal/'content/sections'/f'{name}.html'
    assert path.read_bytes()==(ASSETS/'sections'/f'{name}.html').read_bytes()
    assert 'navigation.js' in path.read_text()
for file in ['index.html','student/index.html','student/app.js','student/access.js','student/student.css','theme.css']:
    assert (portal/file).is_file(),file
for path in (portal/'student').glob('*.js'):
    subprocess.run(['node','--check',str(path)],check=True,capture_output=True)
for path in portal.rglob('*.html'):
    page=Page();page.feed(path.read_text())
    for resource in page.resources:
        if resource.startswith(('http:','https:','data:')):continue
        assert (path.parent/resource.split('?')[0]).resolve().is_file(),f'missing web {resource} in {path}'
assert 'curl ' not in (ROOT/'.github/workflows/future-code-portal-pages.yml').read_text()
assert 'Browser Version အတွက် ပြင်ဆင်နေဆဲ' not in (portal/'student/index.html').read_text()
assert (portal/'content/studio/modules.json').read_bytes()==(ASSETS/'studio/modules.json').read_bytes()
print('PASS: all web sections match APK bytes; local web resources exist; no placeholder routes or stale source download.')
