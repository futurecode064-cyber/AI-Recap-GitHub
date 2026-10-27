package com.futurecode.thaispeaking;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String HOME = "https://futurecode064-cyber.github.io/AI-Recap-GitHub/thai-course/";
    private static final String ASSET = "file:///android_asset/index.html";
    private static final String ORIGIN = "futurecode064-cyber.github.io";
    private static final int VOICE_REQUEST=31;
    private WebView web;
    private TextToSpeech tts;
    private boolean offlineTried = false;

    @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"})
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(Color.rgb(7,19,32));
        getWindow().setNavigationBarColor(Color.rgb(7,19,32));
        web=new WebView(this);
        setContentView(web);
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        web.addJavascriptInterface(new Bridge(),"FCNative");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
                Uri url=request.getUrl();
                String scheme=url.getScheme();
                if("https".equals(scheme)&&ORIGIN.equals(url.getHost())
                    && url.getPath()!=null && url.getPath().startsWith("/AI-Recap-GitHub/thai-course/")) return false;
                if("file".equals(scheme)&&url.toString().startsWith("file:///android_asset/"))return false;
                if("https".equals(scheme)&&request.isForMainFrame()){
                    try{ startActivity(new Intent(Intent.ACTION_VIEW,url)); }catch(Exception e){}
                }
                return true;
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest req,WebResourceError err){
                if(req.isForMainFrame()&&!offlineTried&&!v.getUrl().startsWith("file:")){
                    offlineTried=true;
                    runOnUiThread(()->v.loadUrl(ASSET));
                }
            }
        });
        tts=new TextToSpeech(this,status->{
            if(status==TextToSpeech.SUCCESS) {
                int availability=tts.setLanguage(new Locale("th","TH"));
                if(availability==TextToSpeech.LANG_MISSING_DATA||availability==TextToSpeech.LANG_NOT_SUPPORTED)
                    runOnUiThread(()->Toast.makeText(this,"Thai TTS အသံဒေတာ ထည့်သွင်းရန် လိုအပ်သည်",Toast.LENGTH_LONG).show());
            }
        });
        web.loadUrl(HOME);
        scheduleUpdateCheck();
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},42);
    }

    private void scheduleUpdateCheck(){
        try{
            JobScheduler scheduler=(JobScheduler)getSystemService(JOB_SCHEDULER_SERVICE);
            JobInfo job=new JobInfo.Builder(270126,new ComponentName(this,UpdateJobService.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPeriodic(6L*60*60*1000).setPersisted(false).build();
            scheduler.schedule(job);
        }catch(Exception ignored){}
    }

    private static String quoteJs(String s){
        if(s==null)return "\"\"";
        StringBuilder out=new StringBuilder("\"");
        for(int i=0;i<s.length();i++){
            char c=s.charAt(i);
            if(c=='\\'||c=='"')out.append('\\').append(c);
            else if(c=='\n')out.append("\\n");
            else if(c=='\r')out.append("\\r");
            else if(c=='\u2028'||c=='\u2029')out.append(' ');
            else out.append(c);
        }
        return out.append('"').toString();
    }
    private class Bridge {
        @JavascriptInterface public String getProgress(){
            return getSharedPreferences("fc_thai",MODE_PRIVATE).getString("progress","");
        }
        @JavascriptInterface public void setProgress(String progress){
            if(progress!=null&&progress.length()<120000)
                getSharedPreferences("fc_thai",MODE_PRIVATE).edit().putString("progress",progress).apply();
        }
        @JavascriptInterface public void speak(String text){
            if(text==null||text.length()>300)return;
            runOnUiThread(()->{
                if(tts!=null)tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"thai-utterance");
            });
        }
        @JavascriptInterface public void recognize(String expected){
            runOnUiThread(()->{
                if(Build.VERSION.SDK_INT>=23&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},43);
                    Toast.makeText(MainActivity.this,"Microphone ခွင့်ပြုပြီး ထပ်နှိပ်ပါ",Toast.LENGTH_LONG).show();
                    return;
                }
                Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"th-TH");
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE,"th-TH");
                intent.putExtra(RecognizerIntent.EXTRA_PROMPT,"ထိုင်းလို ပြောပါ");
                try { startActivityForResult(intent,VOICE_REQUEST); }
                catch(Exception e) { Toast.makeText(MainActivity.this,"Thai Speech Recognition မရရှိနိုင်ပါ",Toast.LENGTH_LONG).show(); }
            });
        }
    }

    @Override protected void onActivityResult(int req,int result,Intent data) {
        super.onActivityResult(req,result,data);
        if(req==VOICE_REQUEST&&result==RESULT_OK&&data!=null){
            ArrayList<String> results=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if(results!=null&&!results.isEmpty()){
                String js="window.FCRecognized("+quoteJs(results.get(0))+")";
                web.evaluateJavascript(js,null);
            }
        }
    }
    @Override public void onBackPressed(){
        if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(tts!=null){tts.stop();tts.shutdown();}
        if(web!=null){web.removeJavascriptInterface("FCNative");web.destroy();}
        super.onDestroy();
    }
}