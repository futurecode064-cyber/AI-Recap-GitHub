package mm.futurecode.mandalay;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.app.job.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
  private static final String HOME = "https://future-code-mandalay-city-helper.cheeky-elf-5504.chatgpt.site/";
  private static final String HOST = "future-code-mandalay-city-helper.cheeky-elf-5504.chatgpt.site";
  private static final String UPDATES = "https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/mandalay-city-helper-update.json";
  static final String NOTICES = "https://mxwervqihaqlxybghdak.supabase.co/functions/v1/future-code-updates?app=mandalay-city-helper&since=";
  static final String CHANNEL = "fc_mandalay_notices";
  private WebView game;
  private FrameLayout holder;
  private LinearLayout offline;
  private ValueCallback<Uri[]> chooser;
  private static final int PICK_FILE=711;
  @SuppressLint("SetJavaScriptEnabled")
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(7,20,35));
    getWindow().setNavigationBarColor(Color.BLACK);
    createChannel();
    if (Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},73);
    holder=new FrameLayout(this);
    game=new WebView(this);
    holder.addView(game,new FrameLayout.LayoutParams(-1,-1));
    offline=new LinearLayout(this);
    offline.setOrientation(LinearLayout.VERTICAL);
    offline.setGravity(Gravity.CENTER);
    offline.setPadding(32,28,32,28);
    offline.setBackgroundColor(Color.rgb(7,20,35));
    TextView err=new TextView(this);
    err.setText("မြို့လေး ကူညီရေး စွန့်စားခန်း\n\nအင်တာနက် ချိတ်ဆက်၍ မရသေးပါ။\nInternet / VPN စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။");
    err.setTextColor(Color.WHITE);err.setTextSize(18);err.setGravity(Gravity.CENTER);
    offline.addView(err);
    Button retry=new Button(this);retry.setText("ပြန်လည်ကြိုးစားရန်");
    retry.setOnClickListener(v->{offline.setVisibility(View.GONE);game.loadUrl(HOME);});
    offline.addView(retry);
    holder.addView(offline,new FrameLayout.LayoutParams(-1,-1));
    offline.setVisibility(View.GONE);
    setContentView(holder);
    WebSettings s=game.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(false);
    s.setAllowContentAccess(true);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    s.setSupportZoom(false);
    if(Build.VERSION.SDK_INT>=26)s.setSafeBrowsingEnabled(true);
    android.webkit.CookieManager.getInstance().setAcceptCookie(true);
    game.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
        if(!request.isForMainFrame())return false;
        Uri uri=request.getUrl();
        if("https".equals(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost()))return false;
        String scheme=uri.getScheme();
        if(scheme!=null && (scheme.equals("https")||scheme.equals("http")||scheme.equals("mailto")||scheme.equals("tel")||scheme.equals("tg"))){
          try {startActivity(new Intent(Intent.ACTION_VIEW,uri).addCategory(Intent.CATEGORY_BROWSABLE));}
          catch(Exception ignore){Toast.makeText(MainActivity.this,"Link ဖွင့်မရပါ",Toast.LENGTH_SHORT).show();}
        }
        return true;
      }
      @Override public void onPageStarted(WebView v,String url,android.graphics.Bitmap icon){offline.setVisibility(View.GONE);}
      @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame())offline.setVisibility(View.VISIBLE);}
      @Override public void onReceivedSslError(WebView v,SslErrorHandler h,android.net.http.SslError e){h.cancel();offline.setVisibility(View.VISIBLE);}
    });
    game.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
        if(chooser!=null)chooser.onReceiveValue(null);
        chooser=callback;
        try{startActivityForResult(params.createIntent(),PICK_FILE);return true;}
        catch(Exception e){chooser=null;return false;}
      }
      @Override public void onPermissionRequest(PermissionRequest r){r.deny();}
    });
    game.setDownloadListener((url,agent,disposition,mime,length)->{
      if(url.startsWith("https://")) {
        try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception ignore){}
      }
    });
    if(state==null)game.loadUrl(HOME);else game.restoreState(state);
    NoticeService.schedule(this);
    NoticeService.check(this);
    checkBinaryUpdate();
  }
  @Override protected void onActivityResult(int req,int res,Intent data) {
    super.onActivityResult(req,res,data);
    if(req==PICK_FILE&&chooser!=null){chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res,data));chooser=null;}
  }
  @Override public void onBackPressed() {
    if(game!=null&&game.canGoBack())game.goBack();else super.onBackPressed();
  }
  @Override protected void onPause(){super.onPause();if(game!=null)game.onPause();}
  @Override protected void onResume(){super.onResume();if(game!=null)game.onResume();}
  @Override protected void onSaveInstanceState(Bundle b){if(game!=null)game.saveState(b);super.onSaveInstanceState(b);}
  @Override protected void onDestroy(){if(game!=null){holder.removeView(game);game.destroy();game=null;}super.onDestroy();}
  void createChannel(){
    NotificationManager m=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
    NotificationChannel c=new NotificationChannel(CHANNEL,"မြို့လေး ဂိမ်း အသိပေးချက်များ",NotificationManager.IMPORTANCE_DEFAULT);
    c.setDescription("ဂိမ်းသတင်း၊ ပွဲစဉ်နှင့် update အသိပေးချက်များ");m.createNotificationChannel(c);
  }
  static String fetchText(String url) throws IOException{
    HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
    c.setConnectTimeout(8000);c.setReadTimeout(8000);c.setUseCaches(false);
    c.setRequestProperty("Accept","application/json");
    try{
      if(c.getResponseCode()!=200)throw new IOException("HTTP "+c.getResponseCode());
      try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
        byte[] b=new byte[4096];int n;
        while((n=in.read(b))>=0){out.write(b,0,n);if(out.size()>200000)throw new IOException("Excessive payload");}
        return out.toString("UTF-8");
      }
    }finally{c.disconnect();}
  }
  void checkBinaryUpdate(){
    new Thread(()->{
      try{
        JSONObject data=new JSONObject(fetchText(UPDATES));
        int newest=data.optInt("versionCode",1);
        if(newest<=1)return;
        String href=data.optString("apkUrl","");
        if(!href.startsWith("https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/"))return;
        String latestName=data.optString("versionName","");
        runOnUiThread(()->{
          if(isFinishing()||isDestroyed())return;
          new AlertDialog.Builder(this)
          .setTitle("မြို့လေး ဂိမ်း Update")
          .setMessage("APK Version "+latestName+" ရရှိပါပြီ။ Android လုံခြုံရေးအရ Install လုပ်ရန် သင့်ခွင့်ပြုချက် လိုအပ်ပါသည်။")
          .setNegativeButton("နောက်မှ",null)
          .setPositiveButton("ဒေါင်းလုပ်ဆွဲရန်",(d,w)->{
            try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(href)).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception ignored){}
          }).show();
        });
      }catch(Exception ignored){ /* offline cannot interrupt game */ }
    }).start();
  }
  public static class NoticeService extends JobService {
    private volatile boolean stopped=false;
    static void schedule(Context context){
      try {
        JobScheduler j=(JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        JobInfo job=new JobInfo.Builder(80623,new ComponentName(context,NoticeService.class))
         .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
         .setPeriodic(15*60*1000L)
         .setPersisted(true).build();
        j.schedule(job);
      }catch(Exception ignored){}
    }
    static void check(Context context){new Thread(()->poll(context)).start();}
    static void poll(Context context){
      try{
        android.content.SharedPreferences p=context.getSharedPreferences("fc_mandalay",MODE_PRIVATE);
        long last=p.getLong("notice_id",0);
        JSONObject root=new JSONObject(fetchText(NOTICES+last));
        JSONArray items=root.optJSONArray("notices");
        if(items==null)return;
        long max=last;
        NotificationManager manager=(NotificationManager)context.getSystemService(NOTIFICATION_SERVICE);
        for(int i=0;i<items.length();i++){
          JSONObject item=items.getJSONObject(i);
          long id=item.optLong("id",last);
          if(id<=last)continue;
          max=Math.max(max,id);
          Intent launch=new Intent(context,MainActivity.class);
          launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
          PendingIntent pi=PendingIntent.getActivity(context,(int)(id%32000),launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
          Notification note=new Notification.Builder(context,CHANNEL)
           .setSmallIcon(android.R.drawable.ic_dialog_info)
           .setContentTitle(item.optString("title","Future Code Mandalay"))
           .setContentText(item.optString("message",""))
           .setStyle(new Notification.BigTextStyle().bigText(item.optString("message","")))
           .setContentIntent(pi).setAutoCancel(true).build();
          if(Build.VERSION.SDK_INT<33||context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==android.content.pm.PackageManager.PERMISSION_GRANTED)
            manager.notify((int)(id%100000),note);
        }
        if(max>last)p.edit().putLong("notice_id",max).apply();
      }catch(Exception ignored){}
    }
    @Override public boolean onStartJob(JobParameters params){
      stopped=false;
      new Thread(()->{poll(getApplicationContext());if(!stopped)jobFinished(params,false);}).start();
      return true;
    }
    @Override public boolean onStopJob(JobParameters params){stopped=true;return true;}
  }
}
