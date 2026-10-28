#!/usr/bin/env python3
"""Build-time neural speech. Every playable teaching model is embedded in the APK.
No device voice download, runtime synthesis, or robotic fallback is used.
A failed synthesis fails the release. Human native-teacher certification is separate.
"""
import argparse,asyncio,hashlib,json,os,ssl,subprocess
from pathlib import Path
import edge_tts
import edge_tts.communicate
VOICE={'en':'en-US-JennyNeural','th':'th-TH-NiwatNeural','zh':'zh-CN-XiaoxiaoNeural','ja':'ja-JP-NanamiNeural','ko':'ko-KR-SunHiNeural','de':'de-DE-KatjaNeural','fr':'fr-FR-DeniseNeural','es':'es-ES-ElviraNeural','ru':'ru-RU-SvetlanaNeural','ar':'ar-SA-ZariyahNeural','hi':'hi-IN-SwaraNeural','vi':'vi-VN-HoaiMyNeural'}
EXPECTED={'thai':(1,250),'chinese':(1,230),'english':(1,290),'academy':(12,360)}
# Respect the host's trusted CA bundle when one is configured; never disable TLS.
if os.environ.get('SSL_CERT_FILE'):
    edge_tts.communicate._SSL_CTX=ssl.create_default_context()

def duration(p):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]).decode().strip())

async def build(project,output):
    groups=json.loads(subprocess.check_output(['node','scripts/offline_audio_extract.js',project]))
    n=sum(map(len,groups.values()));languages,minimum=EXPECTED[project]
    if len(groups)!=languages or n<minimum:raise RuntimeError(f'Incomplete curriculum: {len(groups)} languages, {n} clips')
    output.mkdir(parents=True,exist_ok=True)
    metadata=output/'manifest.json'
    old=json.loads(metadata.read_text()) if metadata.exists() else {}
    # A previous eSpeak file at the same hash is never accepted as a neural clip.
    if old.get('engine')!='edge-neural-v1':
        for p in output.glob('*/*.mp3'):p.unlink()
    semaphore=asyncio.Semaphore(2);completed=0;clips=[]
    async def generate(lang,text):
        nonlocal completed
        digest=hashlib.sha256(text.encode()).hexdigest()[:24]
        folder=output/lang;folder.mkdir(exist_ok=True);target=folder/(digest+'.mp3')
        async with semaphore:
            if not target.exists():
                for attempt in range(6):
                    tmp=target.with_suffix('.partial.mp3')
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(text,VOICE[lang],rate='-12%').save(str(tmp)),90)
                        seconds=duration(tmp)
                        if tmp.stat().st_size<800 or seconds<.2:raise RuntimeError('Empty speech')
                        tmp.replace(target);break
                    except Exception:
                        tmp.unlink(missing_ok=True)
                        print(f'{project}: retry {attempt+1}/6 {lang} {text!r}',flush=True)
                        if attempt==5:raise RuntimeError(f'Neural synthesis failed: {lang} {text!r}')
                        await asyncio.sleep(2*(attempt+1))
            seconds=duration(target)
            if seconds<.2:raise RuntimeError('Invalid speech duration')
            clips.append({'language':lang,'text':text,'path':f'{lang}/{digest}.mp3','voice':VOICE[lang],'duration':round(seconds,3),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
            completed+=1
            if completed%25==0 or completed==n:print(f'{project}: {completed}/{n} verified neural clips',flush=True)
    await asyncio.gather(*(generate(lang,text) for lang,phrases in groups.items() for text in phrases))
    required={c['path'] for c in clips}
    for p in output.glob('*/*.mp3'):
        if p.relative_to(output).as_posix() not in required:p.unlink()
    manifest={'schema':2,'project':project,'engine':'edge-neural-v1','generated':{k:len(v) for k,v in groups.items()},'clipCount':n,'nativeTeacherCertified':False,'clips':sorted(clips,key=lambda c:c['path'])}
    metadata.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'PASS {project}: {n} neural recordings ready for offline packaging',flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('project',choices=EXPECTED);p.add_argument('output',type=Path);a=p.parse_args();asyncio.run(build(a.project,a.output))
