#!/usr/bin/env python3
"""Build existing YKZ/BW/Ko Thet/KMM native WebView app in a FCM-capable opt-in variant.

Only transforms existing brand scripts from repository; does not silently replace existing releases.
The FCM client configuration is supplied by CI environment at build time, never hardcoded as server credentials.
"""
import json
import os
import re
import sys
from pathlib import Path

BRANDS = {
    "ykz": dict(package="com.futurecode.ykzsoccertips",topic="fc_football_ykz",prefix="YKZ-Soccer-Tips",code=4,name="1.2.1",old_code=2,old_name="1.1.0"),
    "bw": dict(package="com.futurecode.bwsportjournal",topic="fc_football_bw",prefix="BW-Sport-Journal",code=3,name="1.0.2",old_code=1,old_name="1.0.0"),
    "ko_thet": dict(package="com.futurecode.kothetfamilyjournal",topic="fc_football_ko_thet",prefix="Ko-Thet-Family-Journal",code=4,name="1.0.3",old_code=2,old_name="1.0.1"),
    "kmm": dict(package="com.futurecode.kmmsporthub",topic="fc_football_kmm",prefix="KMM-Sport-Hub",code=3,name="1.0.2",old_code=1,old_name="1.0.0"),
}
WORKFLOWS = {
    "ykz": ".github/workflows/ykz-soccer-tips-apk.yml",
    "bw": ".github/workflows/bw-sport-journal-apk.yml",
    "ko_thet": ".github/workflows/ko-thet-family-journal-apk.yml",
    "kmm": ".github/workflows/kmm-sport-hub-apk.yml",
}
brand = sys.argv[1]
cfg = BRANDS[brand]
src = Path(WORKFLOWS[brand]).read_text(encoding="utf-8")
if brand == "ykz":
    block = src.split("      - name: Build YKZ Soccer Tips APK\n        shell: bash\n        run: |\n", 1)[1]
    block = block.split("      - uses: actions/upload-artifact@v4", 1)[0]
    script = "\n".join(line[10:] if line.startswith("          ") else line for line in block.splitlines()) + "\n"
else:
    block = src.split("          python3 - <<'PY'\n", 1)[1]
    block = block.split("\n          PY", 1)[0]
    code = "\n".join(line[10:] if line.startswith("          ") else line for line in block.splitlines())
    exec(compile(code, WORKFLOWS[brand], "exec"), {"__name__": "__main__"})
    script_path = {"bw":"/tmp/build_bw_sport.sh","ko_thet":"/tmp/build_ko_thet_family.sh","kmm":"/tmp/build_kmm_sport_hub.sh"}[brand]
    script = Path(script_path).read_text(encoding="utf-8")

old_version = f"versionCode {cfg['old_code']}"
old_name = f"versionName '{cfg['old_name']}'"
assert old_version in script and old_name in script, (old_version,old_name)
script = script.replace(old_version, f"versionCode {cfg['code']}")
script = script.replace(old_name, f"versionName '{cfg['name']}'")
assert script.count("gradle --no-daemon :app:assembleDebug") == 1
package=cfg["package"]
topic=cfg["topic"]
project=os.environ.get("FC_FIREBASE_PROJECT_ID","")
appid=os.environ.get("FC_FIREBASE_APP_ID_"+brand.upper(),"")
apikey=os.environ.get("FC_FIREBASE_API_KEY_"+brand.upper(),"")
sender=os.environ.get("FC_FIREBASE_SENDER_ID","")
ready=bool(project and appid and apikey and sender)
if ready and (not appid.startswith("1:"+sender+":android:") or not re.match(r"^1:[0-9]+:android:[a-fA-F0-9]+$",appid)):
    raise SystemExit("FCM app ID must match this brand's registered Android app and Sender ID")
if os.environ.get("FC_REQUIRE_FCM")=="true" and not ready:
    raise SystemExit("BLOCKED: brand-specific Firebase Android credentials are missing; do NOT distribute an unconfigured APK")
def j(v):
    return json.dumps(str(v), ensure_ascii=True)

starter="""package %s;
import android.app.Activity;
import android.app.AlertDialog;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

public final class FcmStarter {
 private static final String APP_ID=%s,API_KEY=%s,PROJECT=%s,SENDER=%s,TOPIC=%s;
 public static void start(Activity a){
  if(!a.getSharedPreferences("fc_notify_first_open",0).getBoolean("explained",false)){
   a.getSharedPreferences("fc_notify_first_open",0).edit().putBoolean("explained",true).apply();
   new AlertDialog.Builder(a)
     .setTitle("Notification Allow")
     .setMessage("Notification Allow ကို ON ထားပါက နေ့စဉ် ပေါက်ကြေးများ ရပြီ ဆိုတာကို သိရှိနိုင်ပါသည်။")
     .setPositiveButton("Allow",(dialog,which)->{
       if(Build.VERSION.SDK_INT>=33&&a.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
         a.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},1301);
     })
     .setNegativeButton("နောက်မှ",(dialog,which)->{}).show();
  }
  if(APP_ID.isEmpty()||API_KEY.isEmpty()||PROJECT.isEmpty()||SENDER.isEmpty())return;
  try{
   if(FirebaseApp.getApps(a).isEmpty()){
    FirebaseOptions opts=new FirebaseOptions.Builder().setApplicationId(APP_ID).setApiKey(API_KEY)
      .setProjectId(PROJECT).setGcmSenderId(SENDER).build();
    FirebaseApp.initializeApp(a,opts);
   }
   FirebaseMessaging.getInstance().subscribeToTopic(TOPIC).addOnFailureListener(
      e->Log.w("FC_FCM","Topic subscription failed",e));
  }catch(Exception e){Log.w("FC_FCM","Client push init failed",e);}
 }
}
""" % (package,j(appid),j(apikey),j(project),j(sender),j(topic))

service="""package %s;
import android.app.*;
import android.content.*;
import android.os.Build;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
public class PushMessageService extends FirebaseMessagingService {
 @Override public void onMessageReceived(RemoteMessage m){
  String title="",body="";
  if(m.getNotification()!=null){
   title=m.getNotification().getTitle();body=m.getNotification().getBody();
  }
  if(title==null||title.isEmpty())title="Football Update";
  if(body==null||body.isEmpty())body=m.getData().get("body");
  if(body==null||body.isEmpty())return;
  NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
  if(Build.VERSION.SDK_INT>=26)
   nm.createNotificationChannel(new NotificationChannel("fc_live","Football Updates",NotificationManager.IMPORTANCE_DEFAULT));
  Intent in=new Intent(this,MainActivity.class);in.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  int flags=PendingIntent.FLAG_UPDATE_CURRENT;
  if(Build.VERSION.SDK_INT>=23)flags|=PendingIntent.FLAG_IMMUTABLE;
  PendingIntent click=PendingIntent.getActivity(this,0,in,flags);
  Notification.Builder nb=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,"fc_live"):new Notification.Builder(this);
  nb.setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body))
    .setSmallIcon(android.R.drawable.ic_dialog_info).setAutoCancel(true).setContentIntent(click);
  nm.notify((m.getMessageId()==null?body:m.getMessageId()).hashCode(),nb.build());
 }
}
""" % package

appdir="app/src/main/java/"+package.replace(".","/")
patch=r"""
python3 - <<'FCPATCH'
from pathlib import Path
p=Path('app/src/main/AndroidManifest.xml')
s=p.read_text()
assert '</application>' in s
s=s.replace('<application ', '<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><application ', 1)
s=s.replace('</application>','<service android:name=".PushMessageService" android:exported="false"><intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT"/></intent-filter></service></application>',1)
p.write_text(s)
j=Path('APP_MAIN')
v=j.read_text()
assert 'super.onCreate(b);' in v
v=v.replace('super.onCreate(b);','super.onCreate(b); FcmStarter.start(this);',1)
j.write_text(v)
FCPATCH
cat >> app/build.gradle <<'FCGRADLE'
dependencies { implementation 'com.google.firebase:firebase-messaging:26.0.1' }
FCGRADLE
mkdir -p APPDIR
cat > APPDIR/FcmStarter.java <<'FCSTARTER'
__STARTER_CONTENT__
FCSTARTER
cat > APPDIR/PushMessageService.java <<'FCSERVICE'
__SERVICE_CONTENT__
FCSERVICE
""".replace("APP_MAIN",appdir+"/MainActivity.java").replace("APPDIR",appdir).replace("__STARTER_CONTENT__",starter.strip()).replace("__SERVICE_CONTENT__",service.strip())
script=script.replace("gradle --no-daemon :app:assembleDebug",patch+"\ngradle --no-daemon :app:assembleDebug",1)
# Android 8/9: app-specific external files are often invisible in Gallery.
# Ask for legacy scoped storage permission and save to public Pictures instead.
# Android 10+ keeps the existing scoped MediaStore implementation unchanged.
gallery_folder={"ykz":"YKZ Soccer Tips","bw":"BW Sport","ko_thet":"Ko Thet Family","kmm":"KMM Sport Hub"}[brand]
gallery_patch=r"""
python3 - <<'FC_GALLERY_PATCH'
from pathlib import Path
p=Path("app/src/main/AndroidManifest.xml")
s=p.read_text()
needle='<application '
assert s.count(needle)==1
s=s.replace(needle,'<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28"/><application ',1)
p.write_text(s)
main=Path("APP_MAIN")
v=main.read_text()
assert v.count("if (Build.VERSION.SDK_INT>=29) {")==1
assert v.count("getExternalFilesDir(Environment.DIRECTORY_PICTURES)")==1
assert v.count("class NativeDownload {")==1
assert v.count("@Override protected void onActivityResult(")==1
v=v.replace("class NativeDownload {",'private String pendingGalleryData, pendingGalleryName, pendingGalleryMime;\n           class NativeDownload {',1)
v=v.replace("if (Build.VERSION.SDK_INT>=29) {",'''if (Build.VERSION.SDK_INT>=23 && Build.VERSION.SDK_INT<29 &&
                    checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)!=android.content.pm.PackageManager.PERMISSION_GRANTED){
                    synchronized(MainActivity.this){pendingGalleryData=data;pendingGalleryName=name;pendingGalleryMime=mime;}
                    runOnUiThread(()->requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE},7391));
                    return;
                  }
                  if (Build.VERSION.SDK_INT>=29) {''',1)
v=v.replace("getExternalFilesDir(Environment.DIRECTORY_PICTURES)",
            'new java.io.File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),"GALLERY_FOLDER")',1)
v=v.replace("@Override protected void onActivityResult(",'''@Override public void onRequestPermissionsResult(int code,String[] p,int[] grants){
               super.onRequestPermissionsResult(code,p,grants);
               if(code!=7391)return;
               String data,name,mime;
               synchronized(this){data=pendingGalleryData;name=pendingGalleryName;mime=pendingGalleryMime;
                 pendingGalleryData=null;pendingGalleryName=null;pendingGalleryMime=null;}
               if(data==null)return;
               if(grants.length>0 && grants[0]==android.content.pm.PackageManager.PERMISSION_GRANTED){
                 new Thread(()->new NativeDownload().save(data,name,mime),"FC-GallerySave").start();
               }else msg("Gallery ထဲ ပုံသိမ်းရန် Storage ခွင့်ပြုချက် လိုအပ်ပါသည်။");
             }
             @Override protected void onActivityResult(''',1)
main.write_text(v)
print("Android 8/9 Gallery permission/public Pictures patch applied")
FC_GALLERY_PATCH
""".replace("APP_MAIN",appdir+"/MainActivity.java").replace("GALLERY_FOLDER",gallery_folder)
script=script.replace("gradle --no-daemon :app:assembleDebug",gallery_patch+"\ngradle --no-daemon :app:assembleDebug",1)

if os.environ.get("FC_REQUIRE_FCM")=="true":
    signing_vars=["FC_APK_RELEASE_KEYSTORE_B64","FC_APK_RELEASE_STOREPASS","FC_APK_RELEASE_ALIAS","FC_APK_RELEASE_KEYPASS"]
    if any(not os.environ.get(k) for k in signing_vars):
        raise SystemExit("BLOCKED: persistent owner APK signing keystore must be securely configured")
    signing_patch=r"""
set +x
printf '%s' "$FC_APK_RELEASE_KEYSTORE_B64" | base64 --decode > /tmp/fc-football-release.jks
chmod 600 /tmp/fc-football-release.jks
export FC_APK_KEYSTORE_PATH=/tmp/fc-football-release.jks
trap 'rm -f /tmp/fc-football-release.jks' EXIT
cat >> app/build.gradle <<'FC_RELEASE_SIGNING'
android {
 signingConfigs {
  fcOwner {
   storeFile file(System.getenv("FC_APK_KEYSTORE_PATH"))
   storePassword System.getenv("FC_APK_RELEASE_STOREPASS")
   keyAlias System.getenv("FC_APK_RELEASE_ALIAS")
   keyPassword System.getenv("FC_APK_RELEASE_KEYPASS")
  }
 }
 buildTypes { release { signingConfig signingConfigs.fcOwner; minifyEnabled false } }
}
FC_RELEASE_SIGNING
"""
    script=script.replace("gradle --no-daemon :app:assembleDebug",signing_patch+"\ngradle --no-daemon :app:assembleRelease",1)
    script=script.replace("app/build/outputs/apk/debug/app-debug.apk","app/build/outputs/apk/release/app-release.apk")

out=Path("/tmp/football_vnext_"+brand+".sh")
out.write_text(script,encoding="utf-8")
out.chmod(0o700)
print("Prepared "+brand+" version "+cfg["name"]+" / "+cfg["package"]+" FCM client-configured="+str(ready))
