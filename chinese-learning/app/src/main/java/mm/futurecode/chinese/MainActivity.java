package mm.futurecode.chinese;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {
    public static final String UPDATE_URL="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/chinese-update.json";
    public static final String FEED_URL="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/chinese-notifications.json";
    private static final String PORTAL_URL="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/";
    private WebView web;
    private TextToSpeech tts;
    private boolean speechReady=false;
    private static final int SPEECH=71, NOTIFICATION=72;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(0xff102b53);
        getWindow().setNavigationBarColor(0xff102b53);
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel("learning","Future Code Chinese",NotificationManager.IMPORTANCE_DEFAULT));
        web=new WebView(this);
        web.setBackgroundColor(0xfff4f7fb);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,android.webkit.WebResourceRequest r){
                Uri u=r.getUrl();
                if("file".equals(u.getScheme())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW,u));return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new NativeBridge(),"FutureCode");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
        tts=new TextToSpeech(this,status->{
            if(status==TextToSpeech.SUCCESS) {
                int result=tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
                speechReady=result!=TextToSpeech.LANG_MISSING_DATA && result!=TextToSpeech.LANG_NOT_SUPPORTED;
            }
        });
        JobScheduler scheduler=(JobScheduler)getSystemService(JOB_SCHEDULER_SERVICE);
        JobInfo job=new JobInfo.Builder(42027,new ComponentName(this,AppSyncJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPersisted(false)
            .setPeriodic(24L*60*60*1000)
            .build();
        scheduler.schedule(job);
    }
    @Override public void onResume(){super.onResume(); if(tts!=null){int r=tts.setLanguage(Locale.SIMPLIFIED_CHINESE);speechReady=r>=0;} if(web!=null)checkUpdates(false);}
    @Override public void onDestroy(){if(tts!=null){tts.stop();tts.shutdown();}if(web!=null)web.destroy();super.onDestroy();}
    private void callback(String expression){runOnUiThread(()->{if(web!=null)web.evaluateJavascript(expression,null);});}
    private static String readUrl(String target) throws Exception {
        HttpURLConnection conn=(HttpURLConnection)new URL(target).openConnection();
        conn.setConnectTimeout(7000);conn.setReadTimeout(7000);
        conn.setRequestProperty("Accept","application/json");
        try(InputStream in=conn.getInputStream()){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] buffer=new byte[4096];int n;
            while((n=in.read(buffer))!=-1){
                if(out.size()+n>65536)throw new java.io.IOException("Update metadata too long");
                out.write(buffer,0,n);
            }
            return new String(out.toByteArray(),StandardCharsets.UTF_8);
        } finally {conn.disconnect();}
    }
    private void checkUpdates(boolean showResult){
        new Thread(()->{
            try {
                JSONObject o=new JSONObject(readUrl(UPDATE_URL));
                int version=o.optInt("versionCode",1);
                String target=o.optString("apkUrl",PORTAL_URL);
                if(!target.startsWith("https://"))target=PORTAL_URL;
                if(version>BuildConfig.VERSION_CODE){
                    callback("window.onUpdateCheck && window.onUpdateCheck("+JSONObject.quote(o.optString("versionName","new"))+","+JSONObject.quote(target)+")");
                } else if(showResult)callback("window.nativeStatus && window.nativeStatus('နောက်ဆုံး Version ဖြစ်ပါသည်။')");
            }catch(Exception e){if(showResult)callback("window.nativeStatus && window.nativeStatus('Internet ချိတ်ဆက်မှုကို စစ်ဆေးပါ။')");}
        }).start();
    }
    public class NativeBridge {
        @JavascriptInterface public void speak(String text) {
            runOnUiThread(()->{
                if(!speechReady){callback("window.nativeStatus && window.nativeStatus('ဖုန်း Settings တွင် Chinese TTS အသံကို ထည့်သွင်းပါ။')");return;}
                if(text!=null && text.length()<300)tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"fc-zh");
            });
        }
        @JavascriptInterface public void installVoice(){
            runOnUiThread(()->{
                try{startActivity(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA));}
                catch(Exception e){try{startActivity(new Intent("com.android.settings.TTS_SETTINGS"));}
                catch(Exception ignored){callback("window.nativeStatus && window.nativeStatus('Phone Settings → Text-to-speech → Chinese Voice ထည့်သွင်းပါ။')");}}
            });
        }
        @JavascriptInterface public void listen(){
            runOnUiThread(()->{
                try{
                    Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"zh-CN");
                    i.putExtra(RecognizerIntent.EXTRA_PROMPT,"တရုတ်လို ပြောပါ");
                    i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
                    startActivityForResult(i,SPEECH);
                }catch(Exception e){callback("window.nativeStatus && window.nativeStatus('Chinese Speech Recognition ကို ဖုန်းတွင် မရရှိပါ။')");}
            });
        }
        @JavascriptInterface public void checkUpdates(){MainActivity.this.checkUpdates(true);}
        @JavascriptInterface public void openUpdate(String link){
            runOnUiThread(()->{
                if(link!=null && link.startsWith("https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/"))
                    startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(link)));
                else startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(PORTAL_URL)));
            });
        }
        @JavascriptInterface public void reminder(){
            runOnUiThread(()->{
                if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFICATION);
                } else callback("window.nativeStatus && window.nativeStatus('Notification ခွင့်ပြုချက် ရရှိပြီးပါပြီ။')");
            });
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==SPEECH && result==RESULT_OK && data!=null){
            ArrayList<String> a=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if(a!=null && !a.isEmpty())
                callback("window.onSpeechResult && window.onSpeechResult("+JSONObject.quote(a.get(0))+")");
        }else if(request==SPEECH){
            callback("window.nativeStatus && window.nativeStatus('အသံဖမ်းခြင်း မပြီးဆုံးပါ။')");
        }
    }
    @Override public void onBackPressed(){
        callback("window.goHome && window.goHome()");
    }
}
