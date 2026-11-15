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
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
public final class UpdateWorker extends Worker {
    private static final String ROOT = MainActivity.APP_URL;
    private static final String CHANNEL = "future-code-ai-tools-updates";
    public UpdateWorker(@NonNull Context c,@NonNull WorkerParameters p){super(c,p);}
    private JSONObject load(String name) throws Exception {
        HttpURLConnection connection=(HttpURLConnection)new URL(ROOT+name).openConnection();
        connection.setConnectTimeout(10000); connection.setReadTimeout(10000);
        connection.setUseCaches(false);connection.setRequestProperty("Cache-Control","no-cache");
        try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);
            if(out.size()>262144)throw new Exception("Response too large");
            return new JSONObject(out.toString(StandardCharsets.UTF_8.name()));
        } finally {connection.disconnect();}
    }
    @Override @NonNull public Result doWork(){
        try{
            Context c=getApplicationContext();
            SharedPreferences prefs=c.getSharedPreferences("fc-ai-tools-update",Context.MODE_PRIVATE);
            JSONObject catalog=load("tools.json");
            String revision=catalog.optString("revision","");
            if(revision.isEmpty())return Result.retry();
            String previous=prefs.getString("revision",null);
            if(previous==null){prefs.edit().putString("revision",revision).apply();}
            else if(!revision.equals(previous)){
                String notes="AI Tools အသစ်များကို ဖွင့်ကြည့်နိုင်ပါပြီ။";
                try{notes=load("updates.json").optString("message",notes);}catch(Exception ignored){}
                prefs.edit().putString("revision",revision).apply();
                notifyUser(c,"AI Tools စာရင်း Update",notes,2001);
            }
            JSONObject nativeVersion=load("android-version.json");
            int remoteCode=nativeVersion.optInt("versionCode",1);
            String download=nativeVersion.optString("apkUrl","");
            int notified=prefs.getInt("notifiedApkCode",1);
            if(remoteCode>BuildConfig.VERSION_CODE && remoteCode>notified && download.startsWith("https://")){
                prefs.edit().putInt("notifiedApkCode",remoteCode).apply();
                notifyUser(c,"Future Code AI Tools APK Update","Version "+nativeVersion.optString("versionName")+" အသစ်ထွက်ပါပြီ။ Update ဖွင့်ကြည့်ပါ။",2002);
            }
            return Result.success();
        }catch(Exception e){return Result.retry();}
    }
    private void notifyUser(Context c,String title,String body,int id){
        if(Build.VERSION.SDK_INT>=33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26){NotificationChannel channel=new NotificationChannel(CHANNEL,"AI Tools Updates",NotificationManager.IMPORTANCE_DEFAULT);manager.createNotificationChannel(channel);}
        Intent target=new Intent(c,MainActivity.class);
        target.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent intent=PendingIntent.getActivity(c,100+id,target,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder builder=new NotificationCompat.Builder(c,CHANNEL).setSmallIcon(android.R.drawable.stat_notify_sync).setContentTitle(title).setContentText(body).setStyle(new NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(intent).setPriority(NotificationCompat.PRIORITY_DEFAULT);
        manager.notify(id,builder.build());
    }
}