#!/usr/bin/env python3
"""Rebrand original 2026-11-17 Kotlin asset-rental source WITHOUT altering rental logic."""
import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "riderent-build" / "RentTrack"
APP = SOURCE / "app"
VERSION = "1.0.1"
NAME = "Future Code RideRent"
PACKAGE = "com.futurecode.riderent"
APK_NAME = "FutureCode-RideRent-v1.0.1.apk"
APK_URL = ("https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/" + APK_NAME)
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def change(path, old, new):
    original = path.read_text(encoding="utf-8")
    if old not in original:
        raise AssertionError(f"Expected original source marker absent: {path}: {old}")
    path.write_text(original.replace(old, new), encoding="utf-8")

def icon(size):
    scale = size / 512
    def v(n): return round(n * scale)
    im = Image.new("RGB", (size, size), (5, 24, 51))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((v(5),v(5),v(507),v(507)),radius=v(90),fill=(6,31,64),outline=(22,195,220),width=max(1,v(6)))
    d.ellipse((v(330),v(-110),v(650),v(220)),fill=(12,77,119))
    d.line([(v(38),v(387)),(v(138),v(304)),(v(294),v(310)),(v(455),v(180))],fill=(14,213,208),width=max(3,v(20)),joint="curve")
    d.line([(v(45),v(93)),(v(194),v(93))],fill=(255,179,55),width=max(2,v(13)))
    f=ImageFont.truetype(FONT_BOLD,max(9,v(158)))
    d.text((v(252),v(173)), "FC",font=f,anchor="mm",fill=(242,252,255),stroke_width=max(0,v(2)),stroke_fill=(21,213,216))
    # Bike silhouette: two wheels, deck/frame, fork and handlebar
    d.ellipse((v(103),v(283),v(187),v(367)),outline=(15,224,216),width=max(2,v(10)))
    d.ellipse((v(332),v(283),v(416),v(367)),outline=(15,224,216),width=max(2,v(10)))
    d.line([(v(146),v(326)),(v(227),v(259)),(v(274),v(326)),(v(146),v(326)),(v(211),v(326)),(v(227),v(259))],fill=(247,190,74),width=max(2,v(10)),joint="curve")
    d.line([(v(274),v(326)),(v(375),v(326)),(v(347),v(238)),(v(327),v(224))],fill=(248,250,252),width=max(2,v(9)),joint="curve")
    d.line([(v(306),v(225)),(v(351),v(225))],fill=(248,250,252),width=max(2,v(9)))
    d.line([(v(204),v(251)),(v(250),v(251))],fill=(248,250,252),width=max(2,v(8)))
    font=ImageFont.truetype(FONT_BOLD,max(7,v(58)))
    d.text((v(256),v(437)),"RideRent",font=font,anchor="mm",fill=(250,189,72))
    return im

def prepare():
    gradle=APP/"build.gradle.kts"
    manifest=APP/"src/main/AndroidManifest.xml"
    main=APP/"src/main/java/com/futurecode/renttrack/MainActivity.kt"
    worker=APP/"src/main/java/com/futurecode/renttrack/UpdateService.kt"
    change(gradle, 'applicationId = "com.futurecode.renttrack"', 'applicationId = "'+PACKAGE+'"')
    change(manifest,'android:label="Future Code RentTrack"','android:label="'+NAME+'"')
    change(manifest,'android:name=".MainActivity"','android:name="com.futurecode.renttrack.MainActivity"')
    # Only rebrand source display/internal class identifiers, keep DB statements and rental behavior.
    for path in (main,worker):
        change(path,"RentTrack","RideRent")
    change(worker,"main/renttrack/channel.json","main/riderent/channel.json")
    dim={"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}
    for density,size in dim.items():
        folder=APP/"src/main/res"/("mipmap-"+density)
        for name in ("ic_launcher.png","ic_launcher_round.png"):
            p=folder/name
            if not p.is_file(): raise AssertionError("Missing expected launcher icon: "+str(p))
            icon(size).save(p,optimize=True)
    logo=APP/"src/main/res/drawable-nodpi/renttrack_logo.png"
    if not logo.is_file(): raise AssertionError("Original rental app logo missing")
    icon(512).save(logo,optimize=True)
    folder=ROOT/"portal/apps";folder.mkdir(parents=True,exist_ok=True)
    icon(512).save(folder/"riderent-icon.png",optimize=True)
    print("PREPARED",PACKAGE,VERSION,"with unchanged original rental features")

def publish():
    apk=ROOT/"portal/apps"/APK_NAME
    if not apk.is_file() or apk.stat().st_size<30000:
        raise AssertionError("Signed APK missing or too small")
    sha=hashlib.sha256(apk.read_bytes()).hexdigest()
    cert=os.environ.get("RIDERENT_CERT_SHA256","").lower().replace(":","")
    if len(cert)!=64 or not re.fullmatch("[0-9a-f]{64}",cert):
        raise AssertionError("Signed APK certificate fingerprint was not verified")
    data={
        "id":"riderent","name":NAME,"packageName":PACKAGE,
        "versionName":VERSION,"versionCode":2,"minSdk":26,
        "file":APK_URL,"apkUrl":APK_URL,"sizeBytes":apk.stat().st_size,
        "sha256":sha,"certificateSha256":cert,"releaseChannel":"stable",
        "releasedAt":"2026-11-17",
        "releaseNotes":"E-bike, motorbike, camera and equipment rental; booking overlap protection, maintenance lock, deposits, returns, update notifications. Separate from property RentTrack."
    }
    channel={
        "packageName":PACKAGE,"versionCode":2,"versionName":VERSION,"apkUrl":APK_URL,
        "sha256":sha,
        "releaseNotes":"Future Code RideRent v1.0.1 — E-Bike, motorbike and equipment rental management. Owner-signed release.",
        "announcements":[]
    }
    out=ROOT/"riderent";out.mkdir(exist_ok=True)
    (out/"channel.json").write_text(json.dumps(channel,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    landing=ROOT/"portal/riderent";landing.mkdir(parents=True,exist_ok=True)
    (landing/"channel.json").write_text((out/"channel.json").read_text(encoding="utf-8"),encoding="utf-8")
    (landing/"index.html").write_text(f'''<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#061f40"><title>Future Code RideRent | APK Download</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#07172d;color:#eafaff;font-family:system-ui,"Noto Sans Myanmar",sans-serif;line-height:1.9}}main{{max-width:800px;margin:auto;padding:24px 18px 65px}}header{{display:flex;justify-content:space-between;align-items:center}}header a{{color:#b6d9e4;text-decoration:none}}.hero{{margin-top:42px;text-align:center}}img{{width:156px;height:156px;border-radius:34px;box-shadow:0 12px 45px #0007}}h1{{font-size:clamp(29px,7vw,46px);margin:22px 0 5px}}p{{color:#bad1db}}.button{{display:inline-block;background:linear-gradient(110deg,#ffd460,#f7ac34);padding:14px 27px;border-radius:14px;color:#07203d;text-decoration:none;font-weight:900}}.box{{background:#0c2947;border:1px solid #244b67;border-radius:18px;padding:21px;margin:27px 0}}.hash{{font-family:monospace;font-size:12px;overflow-wrap:anywhere}}li{{margin:8px 0}}</style></head><body><main><header><b>FUTURE CODE AI STUDIO</b><a href="../apps/">App စာရင်းသို့</a></header><section class="hero"><img src="../apps/riderent-icon.png" alt="Future Code RideRent icon"><h1>Future Code RideRent</h1><p>E-Bike၊ ဆိုင်ကယ်၊ ကင်မရာနှင့် ပစ္စည်းအငှားလုပ်ငန်းများအတွက် Offline အငှားစီမံခန့်ခွဲရေး Android App</p><p>Android 8+ · v1.0.1 · Signed APK · Free</p><a class="button download" data-app-key="riderent" href="../apps/{APK_NAME}" download>RideRent APK Download ↓</a></section><div class="box"><h2>ပါဝင်သော လုပ်ဆောင်ချက်များ</h2><ul><li>Asset Catalog နှင့် Daily Rental Rate</li><li>Booking အချိန်တိုက်မှု ကာကွယ်ခြင်း</li><li>Maintenance Lock နှင့် Available စစ်ဆေးခြင်း</li><li>စပေါ်ငွေ၊ အငှားခ၊ ပြန်အပ်မှုမှတ်တမ်း</li><li>Opt-in Update Checking နှင့် Notification</li></ul></div><div class="box"><h2>APK Verification</h2><p class="hash">SHA-256: {sha}</p><p>App ID: {PACKAGE}</p><p>ဒီ App သည် အိမ်ခန်းအငှား RentTrack နှင့် သီးခြားဖြစ်ပါသည်။ ဖုန်းအစစ် Install Test ကို ထပ်စစ်ဆေးရန်လိုအပ်သည်။</p></div><script defer src="../apps/stats.js"></script></main></body></html>''',encoding="utf-8")
    index=ROOT/"portal/apps/index.html"
    html=index.read_text(encoding="utf-8")
    marker='<div class="store-grid" id="app-grid">'
    if marker not in html: raise AssertionError("Current download catalog layout was modified")
    if 'data-app="riderent"' not in html:
        card=f'''<article aria-label="Future Code RideRent APK အသေးစိတ်ကြည့်မည်" class="card" data-app="riderent" data-category="daily" data-name="Future Code RideRent E-Bike ဆိုင်ကယ် ကင်မရာ ပစ္စည်းအငှား Booking Return Deposit" data-status="available" role="button" tabindex="0">
<img alt="Future Code RideRent app icon" src="riderent-icon.png" width="78" height="78"/>
<div class="meta">Android 8.0+ · v1.0.1 · Signed Release · Offline-first</div>
<h3>Future Code RideRent · E-Bike နှင့် ပစ္စည်းအငှားစီမံခန့်ခွဲရေး</h3>
<span class="store-summary">E-Bike၊ ဆိုင်ကယ်၊ ကင်မရာ၊ ပစ္စည်းအငှား၊ Booking၊ Maintenance နှင့် Return</span>
<button class="details" data-details="riderent" type="button">အသေးစိတ်ကြည့်မည်</button>
<p class="app-description" id="description-riderent">Future Code RideRent သည် E-Bike၊ ဆိုင်ကယ်၊ ကင်မရာနှင့် အခြားပစ္စည်းအငှားလုပ်ငန်းများအတွက် Offline Android App ဖြစ်ပါသည်။ Asset စာရင်း၊ နေ့စဉ်ငှားခနှုန်း၊ Booking အချိန်တိုက်မှု ကာကွယ်ခြင်း၊ Maintenance Lock၊ Customer စာရင်း၊ စပေါ်ငွေ၊ ပစ္စည်းပြန်အပ်မှုနှင့် Notification/Update Checking ပါဝင်သည်။ မူလ အိမ်ခန်းငှား RentTrack နှင့် လုပ်ဆောင်ချက်မတူသော သီးခြား App ဖြစ်ပါသည်။</p>
<div class="foot"><a class="download" data-app-key="riderent" href="{APK_NAME}">RideRent v1.0.1 APK Download ↓</a><a class="preview-link" href="../riderent/">RideRent အကြောင်း ကြည့်ရန် ↗</a><small>Signed APK · Android 8.0+ · SHA-256 Verified · ဖုန်းအစစ် QA လိုအပ်</small></div>
<span class="store-label">အခမဲ့ · Equipment Rental</span></article>'''
        html=html.replace(marker,marker+card,1)
        index.write_text(html,encoding="utf-8")
    statspath=ROOT/"portal/apps/stats.js"
    stats=statspath.read_text(encoding="utf-8")
    if APK_NAME not in stats:
        needle='  const knownApps = Object.freeze({'
        if needle not in stats: raise AssertionError("Existing counter module not recognized")
        stats=stats.replace(needle,needle+'\n    "'+APK_NAME+'": "riderent",',1)
        statspath.write_text(stats,encoding="utf-8")
    latest=ROOT/"portal/apps/latest.json"
    database=json.loads(latest.read_text(encoding="utf-8"))
    database["apps"]=[a for a in database["apps"] if a.get("id")!="riderent"]
    database["apps"].insert(0,data)
    latest.write_text(json.dumps(database,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (ROOT/"portal/apps/riderent-update.json").write_text(json.dumps(channel,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"README.md").write_text(f"# Future Code RideRent v{VERSION}\n\nRenamed from original Kotlin equipment-rental source at renttrack/RentTrack-Android-v1.0.1-source.zip. App ID {PACKAGE}; original property RentTrack remains studio.futurecode.renttrack.\n\nOriginal E-Bike rental features unchanged. Build/rebranding source transformation: scripts/prepare_riderent.py. Android manifest, launcher icon, visible app names, update channel and APK download catalog were changed. No signing private key is committed to GitHub. Signing reuses the protected owner-controlled RentTrack release vault key for a separate package; it does not share app data or Android identity. Old com.futurecode.renttrack installs are distinct and cannot migrate in place. Physical-device QA pending.\n\nAPK SHA256: {sha}\nSigner certificate SHA256: {cert}\n",encoding="utf-8")
    print("PUBLISHED METADATA",APK_NAME,sha,apk.stat().st_size,PACKAGE,cert)

if __name__=="__main__":
    if len(sys.argv)!=2 or sys.argv[1] not in ("prepare","publish"):
        raise SystemExit("Usage: prepare_riderent.py prepare|publish")
    (prepare if sys.argv[1]=="prepare" else publish)()
