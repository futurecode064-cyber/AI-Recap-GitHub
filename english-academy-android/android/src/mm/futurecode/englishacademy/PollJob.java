package mm.futurecode.englishacademy;

import android.app.job.JobService;
import android.app.job.JobParameters;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.ComponentName;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import org.json.JSONObject;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public final class PollJob extends JobService {
  private static final int JOB=9201;
  private static final String CHANNEL="fc_english_updates";
  static void schedule(Context c){
    JobScheduler jobs=(JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE);if(jobs==null)return;
    JobInfo info=new JobInfo.Builder(JOB,new ComponentName(c,PollJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true).setPeriodic(30*60*1000L).build();jobs.schedule(info);
  }
  static void stop(Context c){JobScheduler s=(JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE);if(s!=null)s.cancel(JOB);}
  static void post(Context c,int id,String title,String body,String url){
    if(Build.VERSION.SDK_INT>=33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
    NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(nm==null)return;
    nm.createNotificationChannel(new NotificationChannel(CHANNEL,"English Academy Learning",NotificationManager.IMPORTANCE_DEFAULT));
    Intent i=url==null?new Intent(c,MainActivity.class):new Intent(Intent.ACTION_VIEW,android.net.Uri.parse(url));
    i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent p=PendingIntent.getActivity(c,id,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(p).setAutoCancel(true).build();nm.notify(id,n);
  }
  @Override public boolean onStartJob(JobParameters params){
    new Thread(()->{HttpsURLConnection c=null;try{
      if(!getSharedPreferences("fc_english_settings",MODE_PRIVATE).getBoolean("notices",false))return;
      c=(HttpsURLConnection)new URL(MainActivity.HOST+"/english-academy/notifications.json").openConnection();c.setConnectTimeout(8000);c.setReadTimeout(8000);
      if(c.getResponseCode()!=200)return;
      StringBuilder s=new StringBuilder();try(BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream(),"UTF-8"))){String l;while((l=r.readLine())!=null&&s.length()<5000)s.append(l);}
      JSONObject j=new JSONObject(s.toString());if(j.optBoolean("active",false)){
        String id=j.optString("id","").trim(),title=j.optString("title","").trim(),body=j.optString("body","").trim();
        if(id.matches("[a-zA-Z0-9_-]{1,70}") && title.length()>0&&title.length()<120 && body.length()>0&&body.length()<400){
          String before=getSharedPreferences("notices_seen",MODE_PRIVATE).getString("last_id","");
          if(!id.equals(before)){post(this,217,title,body,null);getSharedPreferences("notices_seen",MODE_PRIVATE).edit().putString("last_id",id).apply();}
        }
      }
      java.util.Calendar cal=java.util.Calendar.getInstance();String day=cal.get(java.util.Calendar.YEAR)+"-"+cal.get(java.util.Calendar.DAY_OF_YEAR);
      if(cal.get(java.util.Calendar.HOUR_OF_DAY)>=19 && !day.equals(getSharedPreferences("notices_seen",MODE_PRIVATE).getString("study_day",""))){
        post(this,219,"English လေ့လာချိန် ရောက်ပါပြီ","ဒီနေ့ ၁၀ မိနစ် English Speaking နဲ့ Reading လေ့ကျင့်ကြည့်ပါ။",null);
        getSharedPreferences("notices_seen",MODE_PRIVATE).edit().putString("study_day",day).apply();
      }
    }catch(Exception ignored){}finally{if(c!=null)c.disconnect();jobFinished(params,false);}}).start();return true;
  }
  @Override public boolean onStopJob(JobParameters params){return true;}
}
