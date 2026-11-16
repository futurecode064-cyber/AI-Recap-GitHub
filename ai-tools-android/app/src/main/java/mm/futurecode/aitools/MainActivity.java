package mm.futurecode.aitools;
import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public final class MainActivity extends Activity {
    public static final String LOCAL_URL="https://appassets.androidplatform.net/assets/ai-tools/index.html";
    public static final String UPDATE_FEED_URL="https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/ai-tools/";
    public static final String ACTION_SHOW_UPDATES="mm.futurecode.aitools.SHOW_UPDATES";
    private static final String HOST="appassets.androidplatform.net";
    private static final String PREFIX="/assets/ai-tools/";
    private WebView web;

    public static boolean safeApkUrl(String value) {
        if(value==null || value.length()>2048)return false;
        Uri u=Uri.parse(value);
        String host=u.getHost(),path=u.getPath();
        return "https".equalsIgnoreCase(u.getScheme())
            && "future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site".equalsIgnoreCase(host)
            && u.getPort()==-1 && u.getUserInfo()==null
            && path!=null && (path.startsWith("/ai-tools/")||path.startsWith("/apps/"))
            && path.toLowerCase(java.util.Locale.US).endsWith(".apk");
    }
    private int dp(int n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(7,18,32));
        getWindow().setNavigationBarColor(Color.rgb(7,18,32));
        WebViewAssetLoader assets=new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web=new WebView(this);
        web.setBackgroundColor(Color.rgb(8,15,28));
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest req){
                Uri uri=req.getUrl();
                if("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())){
                    String path=uri.getPath();
                    if((PREFIX+"tools.json").equals(path) || (PREFIX+"updates.json").equals(path)){
                        String name=path.substring(PREFIX.length());
                        File cached=new File(new File(getFilesDir(),"ai-tools-cache"),name);
                        if(cached.isFile() && cached.length()>0 && cached.length()<12000000){
                            try {return new WebResourceResponse("application/json","UTF-8",new FileInputStream(cached));}
                            catch(IOException ignored){}
                        }
                    }
                }
                return assets.shouldInterceptRequest(uri);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){
                if(!req.isForMainFrame())return false;
                Uri uri=req.getUrl();
                String scheme=uri.getScheme();
                if("https".equals(scheme) && HOST.equalsIgnoreCase(uri.getHost()) &&
                    uri.getPath()!=null && uri.getPath().startsWith(PREFIX))return false;
                if("https".equals(scheme)||"mailto".equals(scheme)){
                    try {startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
                }
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest req,WebResourceError error){
                // Offline local content remains usable even when a third-party service cannot load.
            }
        });
        FrameLayout root=new FrameLayout(this);
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        TextView updateButton=new TextView(this);
        updateButton.setText("↻");
        updateButton.setTextSize(28);
        updateButton.setTextColor(Color.rgb(191,250,142));
        updateButton.setGravity(Gravity.CENTER);
        updateButton.setContentDescription("App Updates and Notifications");
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(Color.rgb(15,46,56));bg.setCornerRadius(dp(19));
        bg.setStroke(dp(1),Color.rgb(79,170,158));
        updateButton.setBackground(bg);
        updateButton.setOnClickListener(v->showUpdateDialog());
        FrameLayout.LayoutParams btnParams=new FrameLayout.LayoutParams(dp(48),dp(48),Gravity.END|Gravity.BOTTOM);
        btnParams.setMargins(0,0,dp(14),dp(22));
        root.addView(updateButton,btnParams);
        setContentView(root);
        web.loadUrl(LOCAL_URL);

        Constraints network=new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest periodic=new PeriodicWorkRequest.Builder(UpdateWorker.class,6,TimeUnit.HOURS)
            .setConstraints(network).build();
        WorkManager.getInstance(getApplicationContext()).enqueueUniquePeriodicWork(
            "fc-ai-tools-updates",ExistingPeriodicWorkPolicy.KEEP,periodic);
        if(Build.VERSION.SDK_INT>=33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},123);
        }
        if(ACTION_SHOW_UPDATES.equals(getIntent().getAction()))showUpdateDialog();
    }
    private void checkNow(){
        Constraints c=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        OneTimeWorkRequest req=new OneTimeWorkRequest.Builder(UpdateWorker.class).setConstraints(c).build();
        WorkManager.getInstance(this).enqueueUniqueWork("fc-ai-tools-manual-check",ExistingWorkPolicy.REPLACE,req);
        Toast.makeText(this,"Update ကို စစ်ဆေးနေပါတယ်။",Toast.LENGTH_SHORT).show();
    }
    private void openApkUrl(String url){
        if(!safeApkUrl(url)){
            Toast.makeText(this,"Verified Download Link မရှိသေးပါ။",Toast.LENGTH_LONG).show();return;
        }
        try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}
        catch(Exception ex){Toast.makeText(this,"Download ဖွင့်မရပါ။",Toast.LENGTH_LONG).show();}
    }
    private void showUpdateDialog(){
        SharedPreferences p=getSharedPreferences("fc-ai-tools-update",MODE_PRIVATE);
        String url=p.getString("availableApkUrl","");
        int code=p.getInt("availableVersionCode",0);
        String version=p.getString("availableVersionName","");
        String last=p.getString("lastCheckStatus","Gateway မချိတ်ဆက်ရသေးပါ။");
        boolean found=code>BuildConfig.VERSION_CODE&&safeApkUrl(url);
        String content="Installed: v"+BuildConfig.VERSION_NAME+"\n"
            +(found?"Update Available: v"+version+"\nInstall လုပ်ရန် Android ခွင့်ပြုချက်လိုပါတယ်။"
                   :"အခုထိ APK Version အသစ် မတွေ့ပါ။")+"\n\n"+last;
        AlertDialog.Builder b=new AlertDialog.Builder(this)
            .setTitle("Future Code AI Tools · Updates").setMessage(content)
            .setPositiveButton("Update စစ်မယ်",(d,w)->checkNow())
            .setNegativeButton("ပိတ်မယ်",(d,w)->{});
        if(found)b.setNeutralButton("APK ဒေါင်းလုပ်",(d,w)->openApkUrl(url));
        b.show();
    }
    @Override protected void onNewIntent(Intent i){
        super.onNewIntent(i);setIntent(i);
        if(ACTION_SHOW_UPDATES.equals(i.getAction()))showUpdateDialog();
    }
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
