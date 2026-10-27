#!/usr/bin/env python3
"""Generate REAL prerecorded offline MP3 lesson clips; no device TTS engine required.
This synthesizes using free/libre eSpeak NG at APK build time, not at runtime.
No model/data access occurs on learner devices. This is a robotic TTS voice,
not a native-speaker recording; native-speaker QA is needed for tone pedagogy.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

VOICE = {'zh':'zh','en':'en-us','th':'th','ja':'ja','ko':'ko','de':'de','fr':'fr','es':'es','ru':'ru','ar':'ar','hi':'hi','vi':'vi'}
EXPECTED={'thai':(1,150),'chinese':(1,180),'english':(1,200),'academy':(12,216)}

def run(args, **kwargs):
    return subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)

def build(project, output):
    raw=run(['node','scripts/offline_audio_extract.js',project]).stdout
    groups=json.loads(raw)
    expected_languages, min_total=EXPECTED[project]
    unique=sum(len(v) for v in groups.values())
    if len(groups)!=expected_languages or unique<min_total:
        raise RuntimeError(f'{project}: incomplete offline lesson set ({len(groups)} languages, {unique} items)')
    output.mkdir(parents=True, exist_ok=True)
    manifest={'schema':1,'project':project,'engine':'espeak-ng','generated':{},'clipCount':0}
    with TemporaryDirectory() as tmp:
        wav=Path(tmp)/'clip.wav'
        for language,phrases in groups.items():
            if language not in VOICE:raise RuntimeError('Unsupported voice '+language)
            dest=output/language;dest.mkdir(exist_ok=True)
            for i,text in enumerate(phrases):
                digest=hashlib.sha256(text.encode('utf-8')).hexdigest()[:24]
                target=dest/(digest+'.mp3')
                if not target.exists():
                    try:
                        run(['espeak-ng','-b','1','-v',VOICE[language],'-s','128','-a','170','-w',str(wav),'--stdin'],input=text.encode('utf-8'))
                        run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','16000','-codec:a','libmp3lame','-af','atempo=0.85,apad=pad_dur=0.18','-b:a','48k',str(target)])
                        duration=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(target)]).stdout.decode().strip())
                        if target.stat().st_size<800 or duration<0.20:raise RuntimeError(f'Invalid audio {language}/{digest}: {duration}s')
                    except Exception as err:
                        raise RuntimeError(f'Audio generation failed for {language} clip {i}: {text[:50]!r}: {err}') from err
                manifest['clipCount']+=1
            manifest['generated'][language]=len(phrases)
            print(f'{project}: {language} {len(phrases)} physical mp3 files',flush=True)
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    files=list(output.glob('*/*.mp3'))
    if len(files)!=manifest['clipCount']:raise RuntimeError(f'Audio clip count mismatch {len(files)} != {manifest["clipCount"]}')
    print('Offline audio ready:',json.dumps(manifest,ensure_ascii=False),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('project',choices=EXPECTED)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    build(args.project,args.output)
