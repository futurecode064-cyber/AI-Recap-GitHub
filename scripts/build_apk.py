#!/usr/bin/env python3
"""Build checked-in app and sign with the owner's stable release key."""
import argparse, os, shutil, subprocess, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def main():
    p = argparse.ArgumentParser()
    p.add_argument('--android-jar', default=os.environ.get('ANDROID_JAR'))
    p.add_argument('--build-tools', default=os.environ.get('ANDROID_BUILD_TOOLS'))
    p.add_argument('--keystore', required=True)
    p.add_argument('--password-file', required=True)
    p.add_argument('--alias', default='future-code-release')
    p.add_argument('--ecj-jar', default=os.environ.get('ECJ_JAR'))
    p.add_argument('--output', default=str(ROOT/'build'/'Future_Code_AI_Studio_v8.apk'))
    a = p.parse_args()
    if not a.android_jar or not a.build_tools: p.error('Set Android platform and build-tools paths.')
    aj, bt = Path(a.android_jar).resolve(), Path(a.build_tools).resolve()
    ks, password = Path(a.keystore).resolve(), Path(a.password_file).resolve()
    for f in [aj, ks, password, *(bt/n for n in ['aapt2','d8','zipalign','apksigner'])]:
        if not f.is_file(): p.error(f'Missing: {f}')
    output = Path(a.output).resolve()
    output.parent.mkdir(parents=True,exist_ok=True)
    work=ROOT/'build'/'compiled'
    if work.exists(): shutil.rmtree(work)
    for d in ['classes','generated','dex']: (work/d).mkdir(parents=True)
    app=ROOT/'training-app'
    def run(*args): subprocess.run([str(x) for x in args],check=True,cwd=ROOT)
    run(bt/'aapt2','compile','--dir',app/'res','-o',work/'resources.zip')
    run(bt/'aapt2','link','-I',aj,'--manifest',app/'AndroidManifest.xml','-A',app/'assets','-o',work/'base.apk','--java',work/'generated',work/'resources.zip')
    sources=[*sorted((app/'src').rglob('*.java')),*sorted((work/'generated').rglob('*.java'))]
    if a.ecj_jar: run('java','-jar',Path(a.ecj_jar).resolve(),'-8','-encoding','UTF-8','-classpath',aj,'-d',work/'classes',*sources)
    else: run('javac','-encoding','UTF-8','-source','8','-target','8','-classpath',aj,'-d',work/'classes',*sources)
    run(bt/'d8','--min-api','26','--lib',aj,'--output',work/'dex',*sorted((work/'classes').rglob('*.class')))
    with zipfile.ZipFile(work/'base.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
        for f in sorted((work/'dex').glob('*.dex')): z.write(f,f.name)
    run(bt/'zipalign','-f','-p','4',work/'base.apk',work/'aligned.apk')
    run(bt/'apksigner','sign','--ks',ks,'--ks-key-alias',a.alias,'--ks-pass','file:'+str(password),'--out',output,work/'aligned.apk')
    run(bt/'apksigner','verify','--verbose','--print-certs',output)
    run(bt/'zipalign','-c','-p','4',output)
    print('Signed APK:',output)
if __name__=='__main__': main()
