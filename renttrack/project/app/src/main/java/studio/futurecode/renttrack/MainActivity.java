package studio.futurecode.renttrack;

import android.app.Activity;
import android.print.PrintManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import android.Manifest;
import android.os.Build;
import android.content.pm.PackageManager;

public final class MainActivity extends Activity {
  private static final int EXPORT_REQUEST=121;
  private static final int IMPORT_REQUEST=122;
  private static final String HOME="https://appassets.androidplatform.net/assets/index.html";
  private WebView web;
  private String pendingText;
  private final ExecutorService updates=Executors.newSingleThreadExecutor();
  private static final int NOTIFICATION_REQUEST=187;
  private boolean pendingPushOptIn=false;
  @Override public void onCreate(Bundle saved){
    super.onCreate(saved);
    getWindow().setStatusBarColor(Color.rgb(6,27,47));
    getWindow().setNavigationBarColor(Color.rgb(5,23,39));
    web=new WebView(this);
    WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowContentAccess(false);
    s.setAllowFileAccess(false);
    s.setAllowFileAccessFromFileURLs(false);
    s.setAllowUniversalAccessFromFileURLs(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    s.setSupportMultipleWindows(false);
    web.setWebChromeClient(new WebChromeClient());
    final WebViewAssetLoader loader=new WebViewAssetLoader.Builder()
      .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
    web.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
        return loader.shouldInterceptRequest(r.getUrl());
      }
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
        return !r.getUrl().toString().startsWith("https://appassets.androidplatform.net/assets/");
      }
    });
    web.addJavascriptInterface(new NativeBridge(),"Android");
    setContentView(web);
    web.loadUrl(HOME);
    RentTrackNotifications.create(this);
    RentTrackMessagingService.configure(this);
    RentTrackMessagingService.refreshSubscription(this);
    RentTrackWorker.schedule(this);
    web.postDelayed(()->runUpdateCheck(false),1800);
  }
  public final class NativeBridge {
    @JavascriptInterface public void saveFile(String name,String content,String type){
      runOnUiThread(()->{
        pendingText=content;
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(type);
        intent.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^A-Za-z0-9._-]","_"));
        startActivityForResult(intent,EXPORT_REQUEST);
      });
    }
    @JavascriptInterface public void openBackup(){
      runOnUiThread(()->{
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        startActivityForResult(intent,IMPORT_REQUEST);
      });
    }

    @JavascriptInterface public void requestNotificationPermission(){
      runOnUiThread(()->{
        pendingPushOptIn=true;
        if(Build.VERSION.SDK_INT>=33&&!RentTrackNotifications.granted(MainActivity.this)){
          requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFICATION_REQUEST);
        }else{
          completeNotificationOptIn(true);
        }
      });
    }
    @JavascriptInterface public void disablePush(){
      RentTrackMessagingService.setSubscribed(MainActivity.this,false);
      getSharedPreferences("renttrack_notify",MODE_PRIVATE).edit().putBoolean("rent_enabled",false).apply();
      postResult("notifications","disabled","အသိပေးချက်များ ပိတ်ထားပါပြီ");
    }
    @JavascriptInterface public void setRentReminders(boolean enabled){
      getSharedPreferences("renttrack_notify",MODE_PRIVATE).edit().putBoolean("rent_enabled",enabled).apply();
      postResult("reminders",enabled?"enabled":"disabled","ငှားခသတိပေးချက် Setting သိမ်းပြီး");
    }
    @JavascriptInterface public void syncReminders(int overdue,int dueSoon,int expiring){
      RentTrackNotifications.syncReminder(MainActivity.this,
        Math.min(100000,Math.max(0,overdue)),Math.min(100000,Math.max(0,dueSoon)),
        Math.min(100000,Math.max(0,expiring)));
    }
    @JavascriptInterface public void checkForUpdates(){runUpdateCheck(true);}
    @JavascriptInterface public void downloadUpdate(){
      updates.execute(()->sendNative("update",RentTrackUpdates.download(MainActivity.this,true)));
    }
    @JavascriptInterface public void installUpdate(){
      updates.execute(()->sendNative("update",RentTrackUpdates.install(MainActivity.this)));
    }
    @JavascriptInterface public void setAutomaticDownloads(boolean value){
      RentTrackUpdates.autoDownload(MainActivity.this,value);
      postResult("update",value?"autodownload_on":"autodownload_off",
        value?"Wi-Fi ရရှိချိန် Update ကို အလိုအလျောက် Download လုပ်ပါမယ်":"Auto Download ပိတ်ထားပါပြီ");
    }
    @JavascriptInterface public String systemStatus(){
      boolean pushConfigured=RentTrackMessagingService.configure(MainActivity.this);
      boolean pushEnabled=getSharedPreferences("renttrack_notify",MODE_PRIVATE).getBoolean("push_enabled",false);
      boolean reminderEnabled=getSharedPreferences("renttrack_notify",MODE_PRIVATE).getBoolean("rent_enabled",false);
      try{
        return new JSONObject().put("version",BuildConfig.VERSION_NAME)
          .put("autoDownload",RentTrackUpdates.isAutoDownload(MainActivity.this))
          .put("notificationPermission",RentTrackNotifications.granted(MainActivity.this))
          .put("pushConfigured",pushConfigured).put("pushEnabled",pushEnabled)
          .put("rentReminders",reminderEnabled).toString();
      }catch(Exception e){return "{}";}
    }

    @JavascriptInterface public void printPage(){
      runOnUiThread(()->{
        PrintManager p=(PrintManager)getSystemService(PRINT_SERVICE);
        p.print("RentTrack Invoice/Receipt",web.createPrintDocumentAdapter("RentTrack"),new PrintAttributes.Builder().build());
      });
    }
  }

  private void sendNative(String kind,JSONObject result){
    try{result.put("kind",kind);}catch(Exception ignored){}
    final String value=JSONObject.quote(result.toString());
    runOnUiThread(()->{if(web!=null)web.evaluateJavascript("if(window.RentTrackNativeResult)window.RentTrackNativeResult("+value+")",null);});
  }
  private void postResult(String kind,String status,String message){
    try{sendNative(kind,new JSONObject().put("status",status).put("message",message));}
    catch(Exception ignored){}
  }
  private void runUpdateCheck(boolean manual){
    updates.execute(()->sendNative("update",RentTrackUpdates.check(this,manual,null)));
  }
  private void completeNotificationOptIn(boolean granted){
    pendingPushOptIn=false;
    if(granted){
      getSharedPreferences("renttrack_notify",MODE_PRIVATE).edit().putBoolean("rent_enabled",true).apply();
      RentTrackMessagingService.setSubscribed(this,true);
      postResult("notifications","enabled",
        RentTrackMessagingService.configure(this)?"Notification ဖွင့်ပြီးပါပြီ":"ဖုန်းသတိပေးချက်ဖွင့်ပြီးပါပြီ။ Push Server ချိတ်ဆက်ရန် Firebase Config လိုအပ်ပါတယ်");
    }else postResult("notifications","denied","Android Notification ခွင့်ပြုချက် မရသေးပါ");
  }
  @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
    super.onRequestPermissionsResult(requestCode,permissions,results);
    if(requestCode==NOTIFICATION_REQUEST&&pendingPushOptIn)
      completeNotificationOptIn(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED);
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);
    if(result!=RESULT_OK||data==null||data.getData()==null)return;
    Uri uri=data.getData();
    try{
      if(request==EXPORT_REQUEST&&pendingText!=null){
        try(OutputStream output=getContentResolver().openOutputStream(uri)){
          if(output==null)throw new Exception("Could not open output");
          output.write(pendingText.getBytes(StandardCharsets.UTF_8));
        }
        pendingText=null;
      }else if(request==IMPORT_REQUEST){
        ByteArrayOutputStream output=new ByteArrayOutputStream();
        try(InputStream input=getContentResolver().openInputStream(uri)){
          if(input==null)throw new Exception("Could not open input");
          byte[] block=new byte[8192];int n;
          while((n=input.read(block))!=-1){
            if(output.size()+n>8000000)throw new Exception("Backup file too large");
            output.write(block,0,n);
          }
        }
        String json=new String(output.toByteArray(),StandardCharsets.UTF_8);
        web.evaluateJavascript("window.restoreRentTrack("+JSONObject.quote(json)+")",null);
      }
    }catch(Exception ex){
      web.evaluateJavascript("console.error("+JSONObject.quote("RentTrack file error: "+ex.getMessage())+")",null);
    }
  }
  @Override public void onBackPressed(){
    web.evaluateJavascript("(function(){var x=document.getElementById('overlay');if(x&&x.classList.contains('open')){document.getElementById('close-modal').click()}else{var h=document.querySelector('[data-nav=\"home\"]');if(h)h.click()}})()",null);
  }
  @Override protected void onDestroy(){
    if(web!=null){web.removeJavascriptInterface("Android");web.destroy();}
    updates.shutdown();
    super.onDestroy();
  }
}
