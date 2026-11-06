package studio.futurecode.renttrack;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.PeriodicWorkRequest;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

public final class RentTrackWorker extends Worker {
  public RentTrackWorker(@NonNull Context context,@NonNull WorkerParameters params){super(context,params);}
  @NonNull @Override public Result doWork(){
    Context c=getApplicationContext();
    try{RentTrackNotifications.dailyReminder(c);}catch(Exception ignored){}
    try{RentTrackUpdates.check(c,false,null);}catch(Exception ignored){}
    return Result.success();
  }
  public static void schedule(Context c){
    PeriodicWorkRequest task=new PeriodicWorkRequest.Builder(RentTrackWorker.class,24,TimeUnit.HOURS)
      .setInitialDelay(1,TimeUnit.HOURS).build();
    WorkManager.getInstance(c).enqueueUniquePeriodicWork("renttrack-daily",ExistingPeriodicWorkPolicy.KEEP,task);
  }
}
