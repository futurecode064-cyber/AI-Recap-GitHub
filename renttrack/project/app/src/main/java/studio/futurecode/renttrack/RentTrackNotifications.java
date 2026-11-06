package studio.futurecode.renttrack;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class RentTrackNotifications {
  public static final String UPDATES = "renttrack_updates";
  public static final String RENT = "renttrack_billing";
  public static final String ANNOUNCEMENTS = "renttrack_announcements";
  private RentTrackNotifications(){}
  static void create(Context ctx){
    NotificationManager nm=(NotificationManager)ctx.getSystemService(Context.NOTIFICATION_SERVICE);
    if(Build.VERSION.SDK_INT>=26){
      nm.createNotificationChannel(new NotificationChannel(UPDATES,"APK Updates",NotificationManager.IMPORTANCE_DEFAULT));
      nm.createNotificationChannel(new NotificationChannel(RENT,"ငှားခနှင့် စာချုပ် သတိပေးချက်",NotificationManager.IMPORTANCE_DEFAULT));
      nm.createNotificationChannel(new NotificationChannel(ANNOUNCEMENTS,"Future Code အသိပေးချက်",NotificationManager.IMPORTANCE_DEFAULT));
    }
  }
  static boolean granted(Context ctx){
    return Build.VERSION.SDK_INT<33 || ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED;
  }
  static void post(Context ctx,String channel,int id,String title,String body){
    if(!granted(ctx))return;
    create(ctx);
    Intent intent=new Intent(ctx,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent tap=PendingIntent.getActivity(ctx,id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification n=new Notification.Builder(ctx,channel)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(new Notification.BigTextStyle().bigText(body))
      .setAutoCancel(true).setContentIntent(tap)
      .build();
    ((NotificationManager)ctx.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id,n);
  }
  static void syncReminder(Context ctx,int overdue,int dueSoon,int expiring){
    SharedPreferences p=ctx.getSharedPreferences("renttrack_notify",Context.MODE_PRIVATE);
    p.edit().putInt("overdue",Math.max(0,overdue))
      .putInt("dueSoon",Math.max(0,dueSoon))
      .putInt("expiring",Math.max(0,expiring))
      .putLong("syncTime",System.currentTimeMillis()).apply();
  }
  static void dailyReminder(Context ctx){
    SharedPreferences p=ctx.getSharedPreferences("renttrack_notify",Context.MODE_PRIVATE);
    if(!p.getBoolean("rent_enabled",false)||!granted(ctx))return;
    String day=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date());
    if(day.equals(p.getString("last_remind","")))return;
    long age=System.currentTimeMillis()-p.getLong("syncTime",0);
    if(age<0||age>2L*86400000L)return; // stale local snapshot cannot be trusted
    int o=p.getInt("overdue",0), d=p.getInt("dueSoon",0), e=p.getInt("expiring",0);
    if(o+d+e==0)return;
    String text="ရက်ကျော်ဘေလ် "+o+" ခု · ငှားခပေးရက်နီး "+d+" ခု · စာချုပ်ကုန်ခါနီး "+e+" ခန်း";
    post(ctx,RENT,2201,"RentTrack — ယနေ့ စာရင်းသတိပေးချက်",text);
    p.edit().putString("last_remind",day).apply();
  }
}
