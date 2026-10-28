#!/usr/bin/env python3
"""Fail release if signing identity or any required lesson/audio asset changed incorrectly."""
import argparse,hashlib,json,struct,subprocess,zipfile
from pathlib import Path
CERT={'thai':'cb8e3b40e23982b7ef27d8252a4c26fdd8942d129383b14eed3a3eda0c94ede1','chinese':'984a8f1fcc3a2add33e8faf545b617ab0485f25091116e4c4bcc804ef81c6ecb','english':'0e37a26cd08900280d2486ff47fa4ea0375c3c89ac5cba51b47ac31be908ecc3','academy':'85c3dc3a0ac83670196ae8c4aa59c1b2bfef7d34d61193730a0775cf68bdd5b1'}
def lp(b,offset=0):
 n=struct.unpack_from('<I',b,offset)[0];return b[offset+4:offset+4+n],offset+4+n
def signer_certificate(apk):
 b=Path(apk).read_bytes();end=b.rfind(b'PK\x05\x06');cd=struct.unpack_from('<I',b,end+16)[0]
 if b[cd-16:cd]!=b'APK Sig Block 42':raise ValueError('Missing APK signing block')
 size=struct.unpack_from('<Q',b,cd-24)[0];start=cd-size-8
 if struct.unpack_from('<Q',b,start)[0]!=size:raise ValueError('Corrupt APK signing block')
 offset=start+8
 while offset<cd-24:
  length=struct.unpack_from('<Q',b,offset)[0];ident=struct.unpack_from('<I',b,offset+8)[0]
  if ident==0x7109871a:
   signers,_=lp(b[offset+12:offset+8+length]);signer,_=lp(signers);signed,_=lp(signer);_,pos=lp(signed);certs,_=lp(signed,pos);cert,_=lp(certs)
   return hashlib.sha256(cert).hexdigest()
  offset+=length+8
 raise ValueError('APK v2 signature required')
def verify(project,apk):
 cert=signer_certificate(apk)
 assert cert==CERT[project],f'Original signing certificate differs: {project}: {cert}'
 with zipfile.ZipFile(apk) as z:
  meta=json.loads(z.read('assets/audio/manifest.json'));assert meta['engine']=='edge-neural-v1','Robotic voice fallback forbidden'
  expected=json.loads(subprocess.check_output(['node','scripts/offline_audio_extract.js',project]))
  required={f'{lang}/{hashlib.sha256(text.encode()).hexdigest()[:24]}.mp3':text for lang,items in expected.items() for text in items}
  clips={c['path']:c for c in meta['clips']};assert set(clips)==set(required),'Some playable models lack audio'
  assert len(clips)==meta['clipCount']==sum(meta['generated'].values())
  for path,text in required.items():
   clip=clips[path];data=z.read('assets/audio/'+path)
   assert len(data)>800 and clip['text']==text and clip['duration']>=.2
   assert hashlib.sha256(data).hexdigest()==clip['sha256'],f'Corrupt clip: {path}'
 print('PASS original signing identity and complete neural audio coverage',project,len(clips),cert)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('project',choices=CERT);p.add_argument('apk');a=p.parse_args();verify(a.project,a.apk)
