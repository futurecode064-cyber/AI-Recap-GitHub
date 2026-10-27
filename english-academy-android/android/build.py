#!/usr/bin/env python3
"""Standalone native Android build with official sdkmanager android-35/build-tools-35.0.0 and JDK17."""
from pathlib import Path
import os, re, subprocess, zipfile, shutil
ROOT=Path(__file__).resolve().parent
SDK=Path(os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT') or '/invalid')
TOOLS=SDK/'build-tools'/'35.0.0'; ANDROID=SDK/'platforms'/'android-35'/'android.jar'
if not (TOOLS/'aapt2').exists() or not ANDROID.exists():
 raise SystemExit('Android SDK missing: install platforms;android-35 and build-tools;35.0.0. No APK was compiled.')
OUT=ROOT/'build'; shutil.rmtree(OUT,ignore_errors=True);OUT.mkdir()
for folder in ('gen','classes','dex'):(OUT/folder).mkdir()
def run(*a):subprocess.run(list(map(str,a)),check=True)
run(TOOLS/'aapt2','compile','--dir',ROOT/'res','-o',OUT/'resources.zip')
run(TOOLS/'aapt2','link','-I',ANDROID,'--manifest',ROOT/'AndroidManifest.xml','-A',ROOT/'assets',OUT/'resources.zip','-o',OUT/'base.apk','--java',OUT/'gen')
javafiles=[*ROOT.joinpath('src').rglob('*.java'),*OUT.joinpath('gen').rglob('*.java')]
run('javac','-encoding','UTF-8','-source','8','-target','8','-classpath',ANDROID,'-d',OUT/'classes',*javafiles)
run(TOOLS/'d8','--min-api','26','--lib',ANDROID,'--output',OUT/'dex',*OUT.joinpath('classes').rglob('*.class'))
with zipfile.ZipFile(OUT/'base.apk','a',compression=zipfile.ZIP_DEFLATED) as archive:
 for f in (OUT/'dex').glob('*.dex'):archive.write(f,f.name)
version = re.search(r'android:versionName="([^"]+)"',(ROOT/'AndroidManifest.xml').read_text(encoding='utf-8')).group(1)
name=OUT/f'Future_Code_English_Academy_v{version}_unsigned.apk'
run(TOOLS/'zipalign','-f','-p','4',OUT/'base.apk',name)
print('Unsigned APK built:',name,'bytes',name.stat().st_size)
