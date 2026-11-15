package mm.futurecode.aitools;
import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;
public final class MainActivity extends Activity {
    public static final String APP_URL = "https://futurecode064-cyber.github.io/AI-Recap-GitHub/ai-tools/";
    private WebView web;
    private final String allowedHost = "futurecode064-cyber.github.io";
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(Color.rgb(7,18,32));
        getWindow().setNavigationBarColor(Color.rgb(7,18,32));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(8,15,28));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setBuiltInZoomControls(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                if(!req.isForMainFrame()) return false;
                Uri uri = req.getUrl();
                if("https".equals(uri.getScheme()) && allowedHost.equalsIgnoreCase(uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/AI-Recap-GitHub/ai-tools/"))return false;
                Intent action=new Intent(Intent.ACTION_VIEW,uri);
                try { startActivity(action); } catch(Exception ignored){}
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, android.webkit.WebResourceError error) {
                if(req.isForMainFrame()){ view.loadDataWithBaseURL(null, "<html><meta name='viewport' content='width=device-width'><body style='background:#080f1c;color:#bdf59e;text-align:center;font:16px sans-serif;padding:60px 12px'><h2>Future Code AI Tools</h2><p>Internet မရရှိပါ။ Network ချိတ်ဆက်ပြီး App ကို ပြန်ဖွင့်ပါ။</p></body></html>","text/html","UTF-8",null); }
            }
        });
        setContentView(web,new ViewGroup.LayoutParams(-1,-1));
        web.loadUrl(APP_URL);
        Constraints c=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest periodic = new PeriodicWorkRequest.Builder(UpdateWorker.class,6,TimeUnit.HOURS).setConstraints(c).build();
        WorkManager.getInstance(getApplicationContext()).enqueueUniquePeriodicWork("fc-ai-tools-updates",ExistingPeriodicWorkPolicy.KEEP,periodic);
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},123);}
    }
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}