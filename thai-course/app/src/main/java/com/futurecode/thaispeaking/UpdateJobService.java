package com.futurecode.thaispeaking;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;

public class UpdateJobService extends JobService {
    private static final String BASE="https://futurecode064-cyber.github.io/AI-Recap-GitHub/thai-course/";
    private static final String CHANNEL="fc_thai_course";
    private JSONObject readJson(String name)throws Exception{
        URL url=new URL(BASE+name);
        if(!"https".equals(url.getProtocol())||!"futurecode064-cyber.github.io".equals(url.getHost()))
            throw new SecurityException("Unexpected update endpoint");
        HttpURLConnection conn=(HttpURLConnection)url.openConnection();
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        conn.setInstanceFollowRedirects(false);
        try{
            if(conn.getResponseCode()!=200)throw new Exception("HTTP "+conn.getResponseCode());
            try(InputStream in=conn.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buf=new byte[4096];int n;
                while((n=in.read(buf))!=-1){
                    if(out.size()+n>16000)throw new Exception("Response too large");
                    out.write(buf,0,n);
                }
                return new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8));
            }
        }finally{conn.disconnect();}
    }
    private void notify(String title,String message,int id){
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26)
            manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Thai Course Updates",NotificationManager.IMPORTANCE_DEFAULT));
        Intent intent=new Intent(this,MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending=PendingIntent.getActivity(this,id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notice=new Notification.Builder(this,CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new Notification.BigTextStyle().bigText(message))
            .setAutoCancel(true).setContentIntent(pending).build();
        manager.notify(id,notice);
    }
    @Override public boolean onStartJob(JobParameters parameters){
        new Thread(()->{
            try{
                JSONObject notice=readJson("notice.json");
                String id=notice.optString("id","");
                String last=getSharedPreferences("fc_thai",MODE_PRIVATE).getString("notice_id","");
                if(!id.isEmpty()&&!id.equals(last)){
                    getSharedPreferences("fc_thai",MODE_PRIVATE).edit().putString("notice_id",id).apply();
                    notify(notice.optString("title","Future Code Thai Speaking"),notice.optString("body","ထိုင်းစာသင်ခန်းစာ အသိပေးချက်"),2701);
                }
                JSONObject update=readJson("latest.json");
                int next=update.optInt("versionCode",1);
                int old=getSharedPreferences("fc_thai",MODE_PRIVATE).getInt("last_version_notice",1);
                if(next>BuildConfig.VERSION_CODE&&next>old){
                    getSharedPreferences("fc_thai",MODE_PRIVATE).edit().putInt("last_version_notice",next).apply();
                    notify("Future Code Thai Speaking Update","APK "+update.optString("version","အသစ်")+" ရရှိပါပြီ။ App ထဲမှ ဒေါင်းလုပ်ဖွင့်ပြီး Update တင်နိုင်ပါသည်။",2702);
                }
            }catch(Exception ignored){
                // Keep the installed offline course working when network is unavailable.
            }finally{jobFinished(parameters,false);}
        }).start();
        return true;
    }
    @Override public boolean onStopJob(JobParameters parameters){return true;}
}