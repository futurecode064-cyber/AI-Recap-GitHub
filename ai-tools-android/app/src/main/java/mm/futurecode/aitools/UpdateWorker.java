package mm.futurecode.aitools;
import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
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
import java.util.Locale;

public final class UpdateWorker extends Worker {
    private static final int MAX_BYTES=12*1024*1024;
    private static final String CHANNEL="future-code-ai-tools-updates";
    public UpdateWorker(@NonNull Context c,@NonNull WorkerParameters p){super(c,p);}
    private byte[] download(String name)throws Exception{
        if(!name.matches("[a-z-]+\\.json"))throw new IllegalArgumentException("invalid feed name");
        URL endpoint=new URL(MainActivity.UPDATE_FEED_URL+name);
        if(!"https".equals(endpoint.getProtocol()))throw new Exception("HTTPS required");
        HttpURLConnection connection=(HttpURLConnection)endpoint.openConnection();
        connection.setConnectTimeout(12000);connection.setReadTimeout(12000);
        connection.setUseCaches(false);connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept","application/json");
        connection.setRequestProperty("Cache-Control","no-cache");
        try{
            if(connection.getResponseCode()!=200)throw new Exception("Gateway Feed unavailable");
            String ct=connection.getContentType();
            if(ct==null||!ct.toLowerCase(Locale.US).contains("json"))throw new Exception("Unexpected content type");
            try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buf=new byte[8192];int len;
                while((len=in.read(buf))!=-1){
                    if(out.size()+len>MAX_BYTES)throw new Exception("Feed too large");
                    out.write(buf,0,len);
                }
                return out.toByteArray();
            }
        }finally{connection.disconnect();}
    }
    private JSONObject json(String name)throws Exception{
        return new JSONObject(new String(download(name),StandardCharsets.UTF_8));
    }
    private void cache(String name,byte[] bytes)throws Exception{
        File dir=new File(getApplicationContext().getFilesDir(),"ai-tools-cache");
        if(!dir.isDirectory()&&!dir.mkdirs())throw new Exception("cannot create cache");
        File tmp=new File(dir,name+".new"),dest=new File(dir,name);
        try(FileOutputStream out=new FileOutputStream(tmp)){out.write(bytes);out.getFD().sync();}
        if(!tmp.renameTo(dest)){
            if(dest.exists()&&!dest.delete())throw new Exception("cannot replace cache");
            if(!tmp.renameTo(dest))throw new Exception("rename failed");
        }
    }
    private void record(SharedPreferences p,String status){
        p.edit().putString("lastCheckStatus",status).putLong("lastCheckedAt",System.currentTimeMillis()).apply();
    }
    @Override @NonNull public Result doWork(){
        Context c=getApplicationContext();
        SharedPreferences p=c.getSharedPreferences("fc-ai-tools-update",Context.MODE_PRIVATE);
        try{
            // Full tools.json is bundled with the APK, so the UI works when the gateway is down.
            byte[] payload=download("tools.json");
            JSONObject cat=new JSONObject(new String(payload,StandardCharsets.UTF_8));
            String revision=cat.optString("revision","");
            if(revision.length()<5||cat.optJSONArray("tools")==null||cat.optJSONArray("tools").length()<1000||
               cat.optJSONArray("categories")==null||cat.optJSONArray("categories").length()!=31){
                record(p,"Update Feed Data မမှန်ကန်ပါ။");return Result.success();
            }
            byte[] notes=null;JSONObject updateNotes=null;
            try{
                notes=download("updates.json");
                updateNotes=new JSONObject(new String(notes,StandardCharsets.UTF_8));
                if(!revision.equals(updateNotes.optString("revision","")))notes=null;
            }catch(Exception ignored){notes=null;}
            String previous=p.getString("revision",null);
            cache("tools.json",payload);
            if(notes!=null)cache("updates.json",notes);
            if(previous==null)p.edit().putString("revision",revision).apply();
            else if(!revision.equals(previous)){
                p.edit().putString("revision",revision).apply();
                String msg=updateNotes!=null?updateNotes.optString("message","AI Tools စာရင်း Update ရရှိပါပြီ"):"AI Tools စာရင်း Update ရရှိပါပြီ";
                notifyUser(c,"AI Tools Catalog Update",msg,2001,false);
            }

            // Release metadata only advertises an APK on the SAME existing download host.
            // APK installations still require explicit Android/user consent.
            try{
                JSONObject release=json("android-version.json");
                int remote=release.optInt("versionCode",0);
                String url=release.optString("apkUrl",""),version=release.optString("versionName","");
                if(remote>BuildConfig.VERSION_CODE && MainActivity.safeApkUrl(url)){
                    int notified=p.getInt("notifiedApkCode",BuildConfig.VERSION_CODE);
                    p.edit().putString("availableApkUrl",url)
                        .putString("availableVersionName",version)
                        .putInt("availableVersionCode",remote).apply();
                    if(remote>notified){
                        p.edit().putInt("notifiedApkCode",remote).apply();
                        notifyUser(c,"Future Code AI Tools APK v"+version+" ရရှိပါပြီ",
                            release.optString("releaseNotes","Update အသစ်ကို ဒေါင်းလုပ်လုပ်နိုင်ပါပြီ။"),2002,true);
                    }
                }
            }catch(Exception ignored){}

            // Admin can publish a notice by changing announcements.json on this gateway.
            // Poll-based notices are NOT instant FCM pushes; Android controls their timing.
            try{
                JSONObject message=json("announcements.json");
                String id=message.optString("id","");
                String title=message.optString("title","");
                String body=message.optString("body","");
                if(id.length()>0 && id.length()<120 && title.length()>0 && title.length()<160 && body.length()>0 && body.length()<600){
                    String old=p.getString("lastAnnouncementId",null);
                    if(old==null) p.edit().putString("lastAnnouncementId",id).apply();
                    else if(!old.equals(id)){
                        p.edit().putString("lastAnnouncementId",id).apply();
                        notifyUser(c,title,body,2003,false);
                    }
                }
            }catch(Exception ignored){}
            record(p,"Update Check အောင်မြင်သည်။");
            return Result.success();
        }catch(Exception ex){
            // Gateway /ai-tools/ may not be deployed; keep bundled app fully operational.
            record(p,"Update Gateway လက်ရှိ မရနိုင်သေးပါ။ Offline App သုံးနိုင်ပါသည်။");
            return Result.success();
        }
    }
    private void notifyUser(Context c,String title,String body,int id,boolean apk){
        if(Build.VERSION.SDK_INT>=33 &&
            c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26) manager.createNotificationChannel(
            new NotificationChannel(CHANNEL,"Future Code AI Tools Updates",NotificationManager.IMPORTANCE_DEFAULT));
        Intent intent=new Intent(c,MainActivity.class);
        intent.setAction(MainActivity.ACTION_SHOW_UPDATES);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap=PendingIntent.getActivity(c,100+id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder builder=new NotificationCompat.Builder(c,CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle(title.length()>70?title.substring(0,70):title)
            .setContentText(body.length()>130?body.substring(0,130):body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true).setContentIntent(tap)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);
        if(apk){
            String url=c.getSharedPreferences("fc-ai-tools-update",Context.MODE_PRIVATE).getString("availableApkUrl","");
            if(MainActivity.safeApkUrl(url)){
                Intent view=new Intent(Intent.ACTION_VIEW,Uri.parse(url));
                view.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                PendingIntent open=PendingIntent.getActivity(c,2099,view,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
                builder.addAction(android.R.drawable.stat_sys_download,"APK ဒေါင်းလုပ်",open);
            }
        }
        manager.notify(id,builder.build());
    }
}
