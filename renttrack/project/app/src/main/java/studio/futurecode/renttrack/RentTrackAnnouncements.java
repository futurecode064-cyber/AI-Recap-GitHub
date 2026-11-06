package studio.futurecode.renttrack;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;

public final class RentTrackAnnouncements {
  private static final String FEED="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/renttrack-announcement.json";
  private RentTrackAnnouncements(){}
  public static void check(Context ctx){
    SharedPreferences p=ctx.getSharedPreferences("renttrack_notify",Context.MODE_PRIVATE);
    if(!p.getBoolean("push_enabled",false)||!RentTrackNotifications.granted(ctx))return;
    HttpURLConnection c=null;
    try{
      c=(HttpURLConnection)new URL(FEED).openConnection();
      c.setInstanceFollowRedirects(false);
      c.setConnectTimeout(8000);
      c.setReadTimeout(8000);
      c.setRequestProperty("Accept","application/json");
      if(c.getResponseCode()!=200||c.getContentLengthLong()>6000)return;
      ByteArrayOutputStream out=new ByteArrayOutputStream();
      try(InputStream in=c.getInputStream()){
        byte[] b=new byte[1024];int n;
        while((n=in.read(b))!=-1){if(out.size()+n>6000)return;out.write(b,0,n);}
      }
      JSONObject j=new JSONObject(out.toString("UTF-8"));
      if(!"active".equals(j.optString("status","")))return;
      String id=j.optString("id","");
      if(!id.matches("[A-Za-z0-9_-]{8,90}")||id.equals(p.getString("lastAnnouncement","")))return;
      long now=System.currentTimeMillis()/1000;
      long published=j.optLong("publishedAt",0),expires=j.optLong("expiresAt",0);
      if(published<=0||published>now+900||expires<=now||expires>published+7L*86400L)return;
      String title=j.optString("title","").trim(),body=j.optString("body","").trim();
      if(title.isEmpty()||title.length()>100||body.isEmpty()||body.length()>600)return;
      RentTrackNotifications.post(ctx,RentTrackNotifications.ANNOUNCEMENTS,3101,title,body);
      p.edit().putString("lastAnnouncement",id).apply();
    }catch(Exception ignored){
      // Offline is normal; WorkManager retries next cycle.
    }finally{if(c!=null)c.disconnect();}
  }
}
