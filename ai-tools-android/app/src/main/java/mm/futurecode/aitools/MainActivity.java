package mm.futurecode.aitools;
import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceError;
import android.view.ViewGroup;
import androidx.webkit.WebViewAssetLoader;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

/** VPN-free core: all catalog, CSS and JS are bundled in this APK. Network optional. */
public final class MainActivity extends Activity {
    public static final String LOCAL_URL="https://appassets.androidplatform.net/assets/ai-tools/index.html";
    // Planned path on the user's EXISTING download gateway. This new path must be
    // explicitly deployed before remote catalog updates work; it is NOT live yet.
    public static final String UPDATE_FEED_URL="https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/ai-tools/";
    private WebView web;
    private WebViewAssetLoader assets;
    private static final String HOST="appassets.androidplatform.net";
    private static final String PREFIX="/assets/ai-tools/";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(7,18,32));
        getWindow().setNavigationBarColor(Color.rgb(7,18,32));
        assets=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
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
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){
                Uri uri=request.getUrl();
                if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost())){
                    String path=uri.getPath();
                    if((PREFIX+"tools.json").equals(path)||(PREFIX+"updates.json").equals(path)){
                        String name=path.substring(PREFIX.length());
                        File cached=new File(new File(getFilesDir(),"ai-tools-cache"),name);
                        if(cached.isFile() && cached.length()>0 && cached.length()<12000000){
                            try{return new WebResourceResponse("application/json","UTF-8",new FileInputStream(cached));}
                            catch(IOException ignored){}
                        }
                    }
                }
                return assets.shouldInterceptRequest(uri);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                if(!request.isForMainFrame()) return false;
                Uri uri=request.getUrl();
                if("https".equals(uri.getScheme())&&HOST.equalsIgnoreCase(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith(PREFIX)) return false;
                if("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
                }
                return true;
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){
                // Do not replace locally bundled UI with an Internet error page.
                // External links may fail independently; core catalog must stay usable.
            }
        });
        setContentView(web,new ViewGroup.LayoutParams(-1,-1));
        web.loadUrl(LOCAL_URL);
        Constraints network=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest work=new PeriodicWorkRequest.Builder(UpdateWorker.class,6,TimeUnit.HOURS)
            .setConstraints(network).build();
        WorkManager.getInstance(getApplicationContext()).enqueueUniquePeriodicWork(
            "fc-ai-tools-updates",ExistingPeriodicWorkPolicy.REPLACE,work);
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},123);
    }
    @Override public void onBackPressed(){
        if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}