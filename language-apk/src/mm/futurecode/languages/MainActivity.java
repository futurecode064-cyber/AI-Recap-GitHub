package mm.futurecode.languages;

import android.Manifest;
import android.app.*;
import android.app.job.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.webkit.*;
import android.widget.Toast;
import org.json.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
  static final int CURRENT_VERSION = 5;
  static final String META = "https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/languages/latest.json";
  static final String CHANNEL = "fc_languages_updates";
  static final String PREF = "fc_language_settings";
  static final int REQUEST_SPEECH = 177;
  private WebView web;
  private TextToSpeech tts;
  private String speechLanguage = "en-US";
  private final ExecutorService pool = Executors.newSingleThreadExecutor();

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(8,22,41));
    getWindow().setNavigationBarColor(Color.rgb(8,22,41));
    notifyChannel(this);
    if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},321);
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(8,22,41));
    WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(false);
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    if(Build.VERSION.SDK_INT>=26)s.setSafeBrowsingEnabled(true);
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
        Uri uri=req.getUrl();
        if("file".equals(uri.getScheme()) && "android_asset".equals(uri.getHost()))return false;
        if("https".equals(uri.getScheme())) {
          try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
        }
        return true;
      }
    });
    web.addJavascriptInterface(new Bridge(),"FutureCodeNative");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
    tts=new TextToSpeech(getApplicationContext(),status->{});
    scheduleChecks(this);
    checkUpdate(false);
    if(getIntent().getBooleanExtra("install_update",false))installDownloaded();
  }

  public class Bridge {
    @JavascriptInterface public void speak(String text,String language) {
      runOnUiThread(()->{
        String code=(language==null?"":language.split("-")[0]).toLowerCase(Locale.ROOT);
        if(OfflineAudio.play(MainActivity.this,code,text)){
          if(web!=null)web.evaluateJavascript("window.FCVoiceStatus&&window.FCVoiceStatus('🔊 APK ထဲပါပြီးသား အသံဖိုင် ဖွင့်နေသည်။')",null);
          return;
        }
        if(tts==null){if(web!=null)web.evaluateJavascript("window.FCVoiceStatus&&window.FCVoiceStatus('Offline အသံဖိုင်မတွေ့ပါ။ Build ပြန်စစ်ရန်လိုပါသည်။')",null);return;}
        Locale locale=Locale.forLanguageTag(language);
        int ready=tts.setLanguage(locale);
        if(ready<0){Toast.makeText(MainActivity.this,"ဒီဘာသာစကားအတွက် TTS voice တပ်ဆင်ရန်လိုပါသည်။",Toast.LENGTH_LONG).show();if(web!=null)web.evaluateJavascript("window.FCVoiceStatus&&window.FCVoiceStatus('Voice မရနိုင်ပါ။ ⚙️ Voice ရယူရန် ကိုနှိပ်ပါ။')",null);return;}
        tts.setSpeechRate(.82f);
        tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"future_code_lesson");
      });
    }
    @JavascriptInterface public void installVoice(String language){
      runOnUiThread(()->{
        try{startActivity(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA));}
        catch(Exception e){try{startActivity(new Intent("com.android.settings.TTS_SETTINGS"));}
        catch(Exception ignored){web.evaluateJavascript("window.FCVoiceStatus&&window.FCVoiceStatus('Settings → Text-to-speech → Install voice data မှ အသံထည့်သွင်းပါ။')",null);}}
      });
    }
    @JavascriptInterface public void listen(String language,String expected) {
      runOnUiThread(()->beginSpeech(language));
    }
    @JavascriptInterface public void checkUpdates() {
      runOnUiThread(()->checkUpdate(true));
    }
  }

  private void beginSpeech(String language) {
    speechLanguage=language;
    Intent in=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    in.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    in.putExtra(RecognizerIntent.EXTRA_LANGUAGE,language);
    in.putExtra(RecognizerIntent.EXTRA_PROMPT,"Future Code — အသံပြောပါ");
    try{startActivityForResult(in,REQUEST_SPEECH);}
    catch(Exception e){Toast.makeText(this,"Speech Recognition Service မရနိုင်ပါ။",Toast.LENGTH_LONG).show();}
  }
  @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
    super.onActivityResult(requestCode,resultCode,data);
    if(requestCode==REQUEST_SPEECH&&resultCode==RESULT_OK&&data!=null&&web!=null){
      ArrayList<String> words=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
      if(words!=null&&!words.isEmpty())
        web.evaluateJavascript("window.FCRecognizedSpeech("+JSONObject.quote(words.get(0))+")",null);
    }
  }

  static void notifyChannel(Context context) {
    NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
    if(Build.VERSION.SDK_INT>=26){
      NotificationChannel channel=new NotificationChannel(CHANNEL,"Future Code Language Academy",NotificationManager.IMPORTANCE_DEFAULT);
      channel.setDescription("New lessons, new APK versions and learning updates");
      nm.createNotificationChannel(channel);
    }
  }
  static void showNotification(Context context,int id,String title,String body,boolean install){
    notifyChannel(context);
    if(Build.VERSION.SDK_INT>=33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
    Intent open=new Intent(context,MainActivity.class);
    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    open.putExtra("install_update",install);
    PendingIntent pending=PendingIntent.getActivity(context,id,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(context,CHANNEL):new Notification.Builder(context);
    b.setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(pending).setAutoCancel(true);
    ((NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id,b.build());
  }

  static void scheduleChecks(Context context){
    try{
      JobScheduler scheduler=(JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
      JobInfo info=new JobInfo.Builder(12702,new ComponentName(context,UpdateJob.class))
        .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
        .setPeriodic(24L*60L*60L*1000L)
        .setPersisted(true).build();
      scheduler.schedule(info);
    }catch(Exception ignored){}
  }

  void checkUpdate(boolean interactive){
    pool.execute(()->{
      try{
        JSONObject j=fetchVersion();
        if(j==null){if(interactive)message("Update server ဆက်သွယ်မရပါ။");return;}
        checkAnnouncement(this,j);
        int v=j.optInt("versionCode",1);
        if(v>CURRENT_VERSION){
          String link=j.optString("apkUrl","");
          String sha=j.optString("sha256","");
          if(!safeLink(link)||!sha.matches("[a-fA-F0-9]{64}")){if(interactive)message("Update file ကို အတည်မပြုနိုင်သေးပါ။");return;}
          if(interactive)runOnUiThread(()->new AlertDialog.Builder(this)
            .setTitle("Future Code Update v"+j.optString("versionName"))
            .setMessage("ဗားရှင်းအသစ်ကို ဒေါင်းလုပ်လုပ်ပြီး Install ပြုလုပ်ဖို့ ဖုန်းက အတည်ပြုချက်တောင်းပါမယ်။")
            .setPositiveButton("ဒေါင်းလုပ်", (d,w)->downloadUpdate(this,j))
            .setNegativeButton("နောက်မှ",null).show());
          else downloadUpdate(this,j);
        }else if(interactive)message("App က နောက်ဆုံး Version "+j.optString("versionName","1.0.0")+" ဖြစ်ပါတယ်။");
      }catch(Exception e){if(interactive)message("Update ကို စစ်ဆေး၍ မရပါ။");}
    });
  }
  void message(String m){runOnUiThread(()->new AlertDialog.Builder(this).setMessage(m).setPositiveButton("OK",null).show());}

  static JSONObject fetchVersion() {
    HttpURLConnection connection=null;
    try{
      connection=(HttpURLConnection)new URL(META+"?t="+(System.currentTimeMillis()/3600000)).openConnection();
      connection.setRequestMethod("GET");connection.setConnectTimeout(9000);connection.setReadTimeout(9000);
      connection.setInstanceFollowRedirects(false);
      if(connection.getResponseCode()!=200)return null;
      ByteArrayOutputStream out=new ByteArrayOutputStream();
      try(InputStream stream=connection.getInputStream()){
        byte[] buffer=new byte[4096];int n;
        while((n=stream.read(buffer))!=-1){out.write(buffer,0,n);if(out.size()>15000)return null;}
      }
      return new JSONObject(out.toString("UTF-8"));
    }catch(Exception e){return null;}
    finally{if(connection!=null)connection.disconnect();}
  }
  static boolean safeLink(String link){
    try{Uri url=Uri.parse(link);return "https".equals(url.getScheme())&&"github.com".equals(url.getHost())&&url.getPath().startsWith("/futurecode064-cyber/AI-Recap-GitHub/releases/download/")&&url.getPath().endsWith(".apk");}
    catch(Exception e){return false;}
  }
  static void checkAnnouncement(Context context,JSONObject obj){
    JSONObject ann=obj.optJSONObject("announcement");
    if(ann==null)return;
    String id=ann.optString("id",""),text=ann.optString("text","");
    if(id.isEmpty()||text.isEmpty())return;
    android.content.SharedPreferences pref=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
    if(!id.equals(pref.getString("ann_id",""))){
      pref.edit().putString("ann_id",id).apply();
      showNotification(context,314,"Future Code · သင်ခန်းစာအသစ်",text,false);
    }
  }
  static void downloadUpdate(Context context,JSONObject obj) {
    try{
      String link=obj.optString("apkUrl",""),sha=obj.optString("sha256","");
      if(!safeLink(link)||!sha.matches("[a-fA-F0-9]{64}"))return;
      int version=obj.optInt("versionCode",0);if(version<=CURRENT_VERSION)return;
      android.content.SharedPreferences pref=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
      if(pref.getInt("pending_version",0)==version&&pref.getLong("download_id",-1L)>0)return;
      DownloadManager dm=(DownloadManager)context.getSystemService(Context.DOWNLOAD_SERVICE);
      DownloadManager.Request r=new DownloadManager.Request(Uri.parse(link));
      r.setTitle("Future Code Language Update "+obj.optString("versionName",""));
      r.setDescription("New lesson version – Android confirmation required");
      r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
      r.setMimeType("application/vnd.android.package-archive");
      r.setDestinationInExternalFilesDir(context,Environment.DIRECTORY_DOWNLOADS,"fc-language-update-"+version+".apk");
      long id=dm.enqueue(r);
      pref.edit().putLong("download_id",id).putString("download_sha256",sha.toLowerCase(Locale.ROOT)).putInt("pending_version",version).apply();
      showNotification(context,311,"Future Code Update","Download စတင်ပြီးပါပြီ။ ပြီးသွားချိန် Install ခွင့်ပြုရပါမယ်။",false);
    }catch(Exception e){showNotification(context,315,"Update error","APK ဒေါင်းလုပ်မအောင်မြင်ပါ။ App ထဲက Update ပြန်စစ်ပါ။",false);}
  }
  static boolean validDownload(Context context, DownloadManager dm,long id){
    DownloadManager.Query q=new DownloadManager.Query().setFilterById(id);
    try(android.database.Cursor c=dm.query(q)){
      if(c==null||!c.moveToFirst())return false;
      return c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))==DownloadManager.STATUS_SUCCESSFUL;
    }catch(Exception e){return false;}
  }
  static boolean verifyHash(Context context,Uri uri,String expected){
    if(expected==null||!expected.matches("[a-f0-9]{64}"))return false;
    try(InputStream in=context.getContentResolver().openInputStream(uri)){
      if(in==null)return false;
      MessageDigest md=MessageDigest.getInstance("SHA-256");
      byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)md.update(b,0,n);
      StringBuilder out=new StringBuilder();for(byte x:md.digest())out.append(String.format(Locale.ROOT,"%02x",x&0xff));
      return expected.equals(out.toString());
    }catch(Exception e){return false;}
  }
  void installDownloaded(){
    android.content.SharedPreferences pref=getSharedPreferences(PREF,MODE_PRIVATE);
    long id=pref.getLong("download_id",-1L);
    if(id<=0)return;
    DownloadManager dm=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);
    if(!validDownload(this,dm,id)){message("APK Download မပြီးသေးပါ။");return;}
    Uri uri=dm.getUriForDownloadedFile(id);
    if(uri==null||!verifyHash(this,uri,pref.getString("download_sha256",""))){message("APK လုံခြုံရေးစစ်ဆေးမှု မအောင်မြင်ပါ။ ပြန်ဒေါင်းလုပ်လုပ်ပါ။");return;}
    if(Build.VERSION.SDK_INT>=26&&!getPackageManager().canRequestPackageInstalls()){
      new AlertDialog.Builder(this).setTitle("Install ခွင့်ပြုချက်").setMessage("ဒီ App မှ Update APK Install လုပ်ခွင့်ကို ဖုန်း Settings မှာ ပေးပြီး Update ကို ပြန်နှိပ်ပါ။")
        .setPositiveButton("Settings", (d,w)->startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName()))))
        .setNegativeButton("နောက်မှ",null).show();
      return;
    }
    Intent install=new Intent(Intent.ACTION_VIEW);
    install.setDataAndType(uri,"application/vnd.android.package-archive");
    install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    try{startActivity(install);}catch(Exception e){message("Installer မဖွင့်နိုင်ပါ။ Downloads မှ APK ကို ဖွင့်ပါ။");}
  }
  @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);if(i.getBooleanExtra("install_update",false))installDownloaded();}
  @Override protected void onDestroy(){OfflineAudio.stop();if(tts!=null)tts.shutdown();if(web!=null)web.destroy();pool.shutdownNow();super.onDestroy();}

  public static class UpdateReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){
      if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction()))return;
      long id=intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1);
      android.content.SharedPreferences pref=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
      if(id<=0||id!=pref.getLong("download_id",-1))return;
      DownloadManager dm=(DownloadManager)context.getSystemService(Context.DOWNLOAD_SERVICE);
      Uri uri=dm.getUriForDownloadedFile(id);
      if(validDownload(context,dm,id)&&uri!=null&&verifyHash(context,uri,pref.getString("download_sha256",""))){
        showNotification(context,312,"Future Code Update အဆင်သင့်","Install လုပ်ဖို့ နှိပ်ပါ။ Android က အတည်ပြုချက် တောင်းပါမယ်။",true);
      }else{
        pref.edit().remove("download_id").remove("pending_version").apply();
        showNotification(context,313,"Update မအောင်မြင်ပါ","ဒေါင်းလုပ် သို့မဟုတ် SHA-256 စစ်ဆေးမှု မအောင်မြင်ပါ။",false);
      }
    }
  }
  public static class UpdateJob extends JobService {
    @Override public boolean onStartJob(JobParameters params){
      new Thread(()->{
        try{
          JSONObject j=fetchVersion();
          if(j!=null){checkAnnouncement(this,j);if(j.optInt("versionCode",0)>CURRENT_VERSION)downloadUpdate(this,j);}
        }finally{jobFinished(params,false);}
      }).start();
      return true;
    }
    @Override public boolean onStopJob(JobParameters params){return true;}
  }
}
