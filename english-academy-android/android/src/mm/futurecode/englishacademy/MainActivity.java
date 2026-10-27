package mm.futurecode.englishacademy;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.net.Uri;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.graphics.Color;
import android.view.Window;
import android.widget.Toast;
import android.content.pm.PackageManager;
import java.util.Locale;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public final class MainActivity extends Activity {
  private static final int VOICE_REQUEST = 1881;
  private static final int NOTIFICATION_REQUEST = 1882;
  static final String HOST = "https://future-code-football-daily.pages.dev";
  static final String UPDATE_JSON = HOST + "/english-academy/latest.json";
  private WebView web;
  private TextToSpeech tts;
  private final ExecutorService background = Executors.newSingleThreadExecutor();

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().setStatusBarColor(Color.rgb(7,19,34));
    getWindow().setNavigationBarColor(Color.rgb(6,23,39));
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(7,19,34));
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true); // Required for trusted, APK-bundled offline lessons only.
    s.setAllowContentAccess(false);
    s.setAllowFileAccessFromFileURLs(false);
    s.setAllowUniversalAccessFromFileURLs(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.addJavascriptInterface(new Bridge(), "Android");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest r) {return route(r.getUrl());}
      @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {return route(Uri.parse(url));}
      private boolean route(Uri uri) {
        if ("file".equals(uri.getScheme()) && "".equals(uri.getHost()==null?"":uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/android_asset/"))return false;
        try { Intent i=new Intent(Intent.ACTION_VIEW,uri);startActivity(i); }catch(Exception ignored){}
        return true;
      }
    });
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
    tts = new TextToSpeech(this, status -> {if(status==TextToSpeech.SUCCESS){tts.setLanguage(Locale.US);tts.setSpeechRate(0.85f);}});
    if (getSharedPreferences("fc_english_settings",MODE_PRIVATE).getBoolean("notices",false)) PollJob.schedule(this);
    background.execute(() -> checkVersion(false));
  }

  final class Bridge {
    @JavascriptInterface public void speak(String sentence){
      if(sentence==null || sentence.length()>350)return;
      runOnUiThread(()->{if(tts!=null){int ready=tts.setLanguage(Locale.US);if(ready<0){sendError("English Voice မရှိပါ။ Phone Settings → Text-to-speech မှ English အသံထည့်သွင်းပါ။");return;}tts.speak(sentence,TextToSpeech.QUEUE_FLUSH,null,"fc-en-tts");}else sendError("ဖုန်း၏ Text-to-speech စနစ် အလုပ်မလုပ်ပါ။");});
    }
    @JavascriptInterface public void listen(){runOnUiThread(()->{
      try {Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,Locale.US.toLanguageTag());
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT,"Please speak English");
        startActivityForResult(intent,VOICE_REQUEST);
      }catch(Exception ignored){sendError("Speech Recognition service မရှိပါ။ Google Voice အပါအဝင် ဖုန်းဝန်ဆောင်မှု စစ်ပါ။");}
    });}
    @JavascriptInterface public void setNotifications(boolean allow){runOnUiThread(()->{
      getSharedPreferences("fc_english_settings",MODE_PRIVATE).edit().putBoolean("notices",allow).apply();
      if(allow){PollJob.schedule(MainActivity.this);if(Build.VERSION.SDK_INT>=33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},NOTIFICATION_REQUEST);}
      else PollJob.stop(MainActivity.this);
    });}
    @JavascriptInterface public void checkUpdate(){background.execute(()->checkVersion(true));}
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);
    if(request!=VOICE_REQUEST)return;
    if(result==RESULT_OK && data!=null){ArrayList<String> a=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);if(a!=null&&!a.isEmpty()){String js="window.onNativeSpeech("+JSONObject.quote(a.get(0))+")";runOnUiThread(()->web.evaluateJavascript(js,null));return;}}
    sendError("အသံမဖမ်းနိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။");
  }
  private void sendError(String msg){if(web!=null)web.evaluateJavascript("window.onNativeError("+JSONObject.quote(msg)+")",null);}
  private void checkVersion(boolean explicit){
    HttpsURLConnection c=null;
    try{
      URL url=new URL(UPDATE_JSON);c=(HttpsURLConnection)url.openConnection();c.setConnectTimeout(7500);c.setReadTimeout(7500);c.setRequestProperty("Accept","application/json");
      if(c.getResponseCode()!=200)throw new Exception("no manifest");
      StringBuilder sb=new StringBuilder();try(BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream(),"UTF-8"))){String line;while((line=r.readLine())!=null && sb.length()<12000)sb.append(line);}
      JSONObject j=new JSONObject(sb.toString());
      if(!"mm.futurecode.englishacademy".equals(j.optString("packageName")))throw new Exception("wrong package");
      int newCode=j.optInt("versionCode",0);
      if(newCode>3){String address=j.optString("apkUrl","");
        Uri u=Uri.parse(address);if(!"https".equals(u.getScheme())||!"future-code-football-daily.pages.dev".equals(u.getHost())||!u.getPath().startsWith("/english-academy/")||!u.getPath().endsWith(".apk"))throw new Exception("untrusted update link");
        PollJob.post(this,499,"Future Code English Academy","Version "+j.optString("versionName")+" အသစ်ရပါပြီ။ Update တင်နိုင်ပါပြီ။",address);
        runOnUiThread(()->new android.app.AlertDialog.Builder(this).setTitle("English Academy Update").setMessage("ဗားရှင်းအသစ်ရှိပါပြီ။ Android Install အတည်ပြုချက် လိုအပ်နိုင်ပါသည်။").setPositiveButton("Download",(d,w)->startActivity(new Intent(Intent.ACTION_VIEW,u))).setNegativeButton("Later",null).show());
      }else if(explicit)runOnUiThread(()->Toast.makeText(this,"လက်ရှိ App က နောက်ဆုံးဗားရှင်းဖြစ်ပါတယ်",Toast.LENGTH_LONG).show());
    }catch(Exception e){if(explicit)runOnUiThread(()->Toast.makeText(this,"Update Server မရနိုင်သေးပါ",Toast.LENGTH_LONG).show());}
    finally{if(c!=null)c.disconnect();}
  }
  @Override public void onBackPressed(){if(web!=null)web.evaluateJavascript("document.getElementById('overlay').hidden?false:(document.getElementById('closeModal').click(),true)",v->{if("false".equals(v))super.onBackPressed();});else super.onBackPressed();}
  @Override public void onDestroy(){background.shutdownNow();if(tts!=null){tts.stop();tts.shutdown();}if(web!=null){web.removeJavascriptInterface("Android");web.destroy();}super.onDestroy();}
}
