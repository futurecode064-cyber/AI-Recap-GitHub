package com.futurecode.queuepro;
import android.app.Activity;
import android.print.PrintManager;
import android.content.Intent;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
  private WebView web;
  private String pendingContent;
  private static final int EXPORT=81,IMPORT=82;
  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);
    getWindow().setStatusBarColor(0xff06192e);
    getWindow().setNavigationBarColor(0xff061526);
    web=new WebView(this);
    WebSettings settings=web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return !url.startsWith("file:///android_asset/");}
      @Override public boolean shouldOverrideUrlLoading(WebView view,android.webkit.WebResourceRequest request){return !request.getUrl().toString().startsWith("file:///android_asset/");}
    });
    web.addJavascriptInterface(new AppBridge(),"Android");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
  }
  public final class AppBridge {
    @JavascriptInterface public void beep(){
      runOnUiThread(()->{
        ToneGenerator sound=new ToneGenerator(AudioManager.STREAM_NOTIFICATION,70);
        sound.startTone(ToneGenerator.TONE_PROP_BEEP,250);
        web.postDelayed(sound::release,450);
      });
    }
    @JavascriptInterface public void shareText(String text){
      runOnUiThread(()->{
        Intent intent=new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT,text);
        startActivity(Intent.createChooser(intent,"QueuePro Share"));
      });
    }
    @JavascriptInterface public void printPage(){
      runOnUiThread(()->{
        PrintManager printer=(PrintManager)getSystemService(PRINT_SERVICE);
        printer.print("QueuePro Ticket",web.createPrintDocumentAdapter("QueuePro Ticket"),new PrintAttributes.Builder().build());
      });
    }
    @JavascriptInterface public void saveFile(String filename,String content,String type){
      runOnUiThread(()->{
        pendingContent=content;
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(type);
        intent.putExtra(Intent.EXTRA_TITLE,filename.replaceAll("[^A-Za-z0-9._-]","_"));
        startActivityForResult(intent,EXPORT);
      });
    }
    @JavascriptInterface public void openBackup(){
      runOnUiThread(()->{
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        startActivityForResult(intent,IMPORT);
      });
    }
  }
  @Override protected void onActivityResult(int req,int result,Intent data){
    super.onActivityResult(req,result,data);
    if(result!=RESULT_OK||data==null||data.getData()==null)return;
    Uri uri=data.getData();
    try{
      if(req==EXPORT&&pendingContent!=null){
        try(OutputStream out=getContentResolver().openOutputStream(uri)){
          if(out==null)throw new Exception("File unavailable");
          out.write(pendingContent.getBytes(StandardCharsets.UTF_8));
        }
        pendingContent=null;
      } else if(req==IMPORT){
        ByteArrayOutputStream buf=new ByteArrayOutputStream();
        try(InputStream in=getContentResolver().openInputStream(uri)){
          if(in==null)throw new Exception("Input unavailable");
          byte[] chunk=new byte[4096];int count;
          while((count=in.read(chunk))!=-1){
            if(buf.size()+count>5_000_000)throw new Exception("Backup too large");
            buf.write(chunk,0,count);
          }
        }
        web.evaluateJavascript("window.receiveBackup("+JSONObject.quote(buf.toString("UTF-8"))+")",null);
      }
    }catch(Exception e){
      web.evaluateJavascript("console.warn("+JSONObject.quote("Storage: "+e.getMessage())+")",null);
    }
  }
  @Override public void onBackPressed(){
    web.evaluateJavascript("(function(){var d=document.getElementById('display');if(d.classList.contains('open'))d.classList.remove('open');else document.querySelector('[data-page=\"home\"]').click()})()",null);
  }
  @Override protected void onDestroy(){
    if(web!=null){web.removeJavascriptInterface("Android");web.destroy();}
    super.onDestroy();
  }
}
