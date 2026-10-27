package mm.futurecode.chinese;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.pm.PackageManager;
import android.os.Build;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.io.InputStream;

public class AppSyncJob extends JobService {
    @Override public boolean onStartJob(JobParameters params){
        new Thread(()->{
            try{
                if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
                HttpURLConnection c=(HttpURLConnection)new URL(MainActivity.FEED_URL).openConnection();
                c.setConnectTimeout(7000);c.setReadTimeout(7000);
                JSONObject feed;
                try(InputStream in=c.getInputStream()){
                    feed=new JSONObject(new String(in.readNBytes(16000),StandardCharsets.UTF_8));
                }finally{c.disconnect();}
                String id=feed.optString("id","");
                if(id.isEmpty())return;
                SharedPreferences pref=getSharedPreferences("chinese-news",MODE_PRIVATE);
                String last=pref.getString("last",null);
                if(last==null){pref.edit().putString("last",id).apply();return;}
                if(last.equals(id))return;
                String title=feed.optString("title","Future Code Chinese");
                String message=feed.optString("message","သင်ခန်းစာအသစ် ရရှိနိုင်ပါပြီ။");
                Notification n=new Notification.Builder(this,"learning")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(title).setContentText(message)
                    .setStyle(new Notification.BigTextStyle().bigText(message)).setAutoCancel(true).build();
                ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(62027,n);
                pref.edit().putString("last",id).apply();
            }catch(Exception ignored){}finally{jobFinished(params,false);}
        }).start();
        return true;
    }
    @Override public boolean onStopJob(JobParameters params){return true;}
}
