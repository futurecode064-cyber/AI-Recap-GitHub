package studio.futurecode.renttrack;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public final class RentTrackMessagingService extends FirebaseMessagingService {
  public static final String TOPIC="futurecode_renttrack";
  public static boolean configure(Context context){
    String api=BuildConfig.FIREBASE_API_KEY, app=BuildConfig.FIREBASE_APP_ID;
    String project=BuildConfig.FIREBASE_PROJECT_ID, sender=BuildConfig.FIREBASE_SENDER_ID;
    if(api.isEmpty()||app.isEmpty()||project.isEmpty()||sender.isEmpty())return false;
    try{
      if(FirebaseApp.getApps(context).isEmpty()){
        FirebaseOptions options=new FirebaseOptions.Builder()
          .setApiKey(api).setApplicationId(app).setProjectId(project)
          .setGcmSenderId(sender).build();
        FirebaseApp.initializeApp(context,options);
      }
      return true;
    }catch(Exception e){return false;}
  }
  public static void setSubscribed(Context ctx,boolean enabled){
    SharedPreferences p=ctx.getSharedPreferences("renttrack_notify",Context.MODE_PRIVATE);
    p.edit().putBoolean("push_enabled",enabled).apply();
    if(!configure(ctx))return;
    if(enabled&&RentTrackNotifications.granted(ctx))
      FirebaseMessaging.getInstance().subscribeToTopic(TOPIC);
    else
      FirebaseMessaging.getInstance().unsubscribeFromTopic(TOPIC);
  }
  public static void refreshSubscription(Context ctx){
    SharedPreferences p=ctx.getSharedPreferences("renttrack_notify",Context.MODE_PRIVATE);
    if(p.getBoolean("push_enabled",false)&&configure(ctx)&&RentTrackNotifications.granted(ctx))
      FirebaseMessaging.getInstance().subscribeToTopic(TOPIC);
  }
  @Override public void onNewToken(String token){
    super.onNewToken(token);
    refreshSubscription(this);
  }
  @Override public void onMessageReceived(RemoteMessage message){
    super.onMessageReceived(message);
    if(!getSharedPreferences("renttrack_notify",MODE_PRIVATE).getBoolean("push_enabled",false))return;
    RemoteMessage.Notification n=message.getNotification();
    String title=n!=null?n.getTitle():message.getData().get("title");
    String body=n!=null?n.getBody():message.getData().get("body");
    if(title==null||body==null)return;
    title=title.substring(0,Math.min(120,title.length()));
    body=body.substring(0,Math.min(1000,body.length()));
    RentTrackNotifications.post(this,RentTrackNotifications.ANNOUNCEMENTS,3000+(int)(System.currentTimeMillis()%1000),title,body);
  }
}
