package mm.futurecode.aitools;
import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Background catalogue poll from same future VPN-free gateway as the user's
 * other download app. The /ai-tools/ path must be provisioned separately.
 * No requests to blocked github.io or pages.dev in this APK.
 */
public final class UpdateWorker extends Worker {
    private static final int MAX_BYTES=10*1024*1024;
    private static final String CHANNEL="future-code-ai-tools-updates";
    public UpdateWorker(@NonNull Context context,@NonNull WorkerParameters params){super(context,params);}
    private byte[] download(String resource) throws Exception {
        URL endpoint=new URL(MainActivity.UPDATE_FEED_URL+resource);
        if(!"https".equals(endpoint.getProtocol()))throw new Exception("HTTPS required");
        HttpURLConnection connection=(HttpURLConnection)endpoint.openConnection();
        connection.setConnectTimeout(12000);connection.setReadTimeout(12000);
        connection.setInstanceFollowRedirects(false);connection.setUseCaches(false);
        connection.setRequestProperty("Accept","application/json");
        connection.setRequestProperty("Cache-Control","no-cache");
        try{
            if(connection.getResponseCode()!=200)throw new Exception("Feed not available");
            String type=connection.getContentType();
            if(type==null||!type.toLowerCase(java.util.Locale.US).contains("json"))throw new Exception("Unexpected content type");
            try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buf=new byte[8192];int n;
                while((n=in.read(buf))!=-1){
                    if(out.size()+n>MAX_BYTES)throw new Exception("Catalog too big");
                    out.write(buf,0,n);
                }
                return out.toByteArray();
            }
        }finally{connection.disconnect();}
    }
    private void atomicallyCache(String name,byte[] bytes)throws Exception{
        File dir=new File(getApplicationContext().getFilesDir(),"ai-tools-cache");
        if(!dir.exists()&&!dir.mkdirs())throw new Exception("Cannot create cache");
        File temp=new File(dir,name+".tmp");
        File finalFile=new File(dir,name);
        try(FileOutputStream out=new FileOutputStream(temp)){out.write(bytes);out.getFD().sync();}
        if(!temp.renameTo(finalFile)){
            if(finalFile.exists()&&!finalFile.delete())throw new Exception("Cannot replace cache");
            if(!temp.renameTo(finalFile))throw new Exception("Cannot rename cache");
        }
    }
    @Override @NonNull public Result doWork(){
        try{
            Context context=getApplicationContext();
            byte[] data=download("tools.json");
            JSONObject catalog=new JSONObject(new String(data,StandardCharsets.UTF_8));
            String revision=catalog.optString("revision","");
            if(revision.length()<5||catalog.optJSONArray("tools")==null||catalog.optJSONArray("tools").length()<1000||
                catalog.optJSONArray("categories")==null||catalog.optJSONArray("categories").length()!=31) return Result.success();
            SharedPreferences prefs=context.getSharedPreferences("fc-ai-tools-update",Context.MODE_PRIVATE);
            String previous=prefs.getString("revision",null);
            JSONObject news=null;byte[] notes=null;
            try{
                notes=download("updates.json");
                news=new JSONObject(new String(notes,StandardCharsets.UTF_8));
                if(!revision.equals(news.optString("revision"))) {news=null;notes=null;}
            }catch(Exception ignored){notes=null;}
            // Update the offline catalogue cache only after validation succeeds.
            atomicallyCache("tools.json",data);
            if(notes!=null)atomicallyCache("updates.json",notes);
            if(previous==null){
                // On first good network check the installed bundle is a baseline; don't spam.
                prefs.edit().putString("revision",revision).apply();
            }else if(!revision.equals(previous)){
                prefs.edit().putString("revision",revision).apply();
                String message=news!=null?news.optString("message","AI Tools စာရင်း အသစ် ရပါပြီ။"):"AI Tools စာရင်း အသစ် ရပါပြီ။";
                notifyUser(context,"Future Code AI Tools Update",message,2001);
            }
            // Binary releases are only announced: Android user approval is still required.
            try{
                JSONObject nativeUpdate=new JSONObject(new String(download("android-version.json"),StandardCharsets.UTF_8));
                int code=nativeUpdate.optInt("versionCode",1);
                String apkUrl=nativeUpdate.optString("apkUrl","");
                int prior=prefs.getInt("notifiedApkCode",BuildConfig.VERSION_CODE);
                if(code>BuildConfig.VERSION_CODE&&code>prior&&apkUrl.startsWith("https://")){
                    prefs.edit().putInt("notifiedApkCode",code).apply();
                    notifyUser(context,"Future Code AI Tools APK Update",
                        "Version "+nativeUpdate.optString("versionName","")+" အသစ် ရပါပြီ။",2002);
                }
            }catch(Exception ignored){}
            return Result.success();
        }catch(Exception unavailable){
            // The gateway's /ai-tools/ route is not deployed yet; bundled app stays usable.
            return Result.success();
        }
    }
    private void notifyUser(Context c,String title,String body,int id){
        if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(
            new NotificationChannel(CHANNEL,"AI Tools Updates",NotificationManager.IMPORTANCE_DEFAULT));
        Intent open=new Intent(c,MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi=PendingIntent.getActivity(c,100+id,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        manager.notify(id,new NotificationCompat.Builder(c,CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_sync).setContentTitle(title).setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true)
            .setContentIntent(pi).setPriority(NotificationCompat.PRIORITY_DEFAULT).build());
    }
}