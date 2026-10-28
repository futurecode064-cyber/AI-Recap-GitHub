package mm.futurecode.englishacademy;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.content.pm.PackageManager;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.security.MessageDigest;
import java.util.Locale;

/** Automatic discovery; explicit Android approval remains required for installation. */
public final class ReleaseUpdater {
    static final String META="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/english-update.json";
    static final String PREF="fc_verified_updates_v1";
    static final String CHANNEL="fc_verified_updates";
    static volatile boolean checking=false;
    static boolean safe(String s){try{Uri u=Uri.parse(s);return "https".equals(u.getScheme())&&"github.com".equals(u.getHost())&&u.getPath().startsWith("/futurecode064-cyber/AI-Recap-GitHub/releases/download/")&&u.getPath().endsWith(".apk");}catch(Exception e){return false;}}
    static int version(Context c)throws Exception{return c.getPackageManager().getPackageInfo(c.getPackageName(),0).versionCode;}
    public static void check(Activity a,boolean explicit){
        if(checking)return;checking=true;
        new Thread(()->{HttpURLConnection c=null;try{
            c=(HttpURLConnection)new URL(META+"?t="+System.currentTimeMillis()/3600000).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(10000);
            if(c.getResponseCode()!=200)throw new IOException("Update server unavailable");
            ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=c.getInputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>50000)throw new IOException("Metadata too large");out.write(b,0,n);}}
            JSONObject j=new JSONObject(out.toString("UTF-8"));
            if(!a.getPackageName().equals(j.optString("packageName")))throw new IOException("Wrong package");
            if(j.optInt("versionCode",0)<=version(a)){if(explicit)message(a,"လက်ရှိ App က နောက်ဆုံးဗားရှင်းဖြစ်ပါတယ်။");return;}
            if(!safe(j.optString("apkUrl"))||!j.optString("sha256").matches("[a-f0-9]{64}"))throw new IOException("Invalid release");
            android.content.SharedPreferences pref=a.getSharedPreferences(PREF,0);
            int next=j.optInt("versionCode");
            if(!explicit&&pref.getInt("offered",0)==next)return;
            pref.edit().putInt("offered",next).apply();
            a.runOnUiThread(()->{if(a.isFinishing())return;new AlertDialog.Builder(a).setTitle("Update v"+j.optString("versionName"))
                .setMessage("သင်ခန်းစာနှင့် အသံအသစ်များ ရရှိပါပြီ။ လက်ရှိ App ကို မဖျက်ဘဲ Update တင်နိုင်ပါတယ်။ APK ဒေါင်းလုပ်ပြီးရင် Install ကို အတည်ပြုပေးပါ။")
                .setPositiveButton("ဒေါင်းလုပ်",(d,w)->download(a,j)).setNegativeButton("နောက်မှ",null).show();});
        }catch(Exception e){if(explicit)message(a,"Update Server ကို ဆက်သွယ်မရပါ။ အင်တာနက် ပြန်စစ်ပါ။");}finally{if(c!=null)c.disconnect();checking=false;}}).start();
    }
    static void message(Activity a,String s){a.runOnUiThread(()->{if(!a.isFinishing())new AlertDialog.Builder(a).setMessage(s).setPositiveButton("OK",null).show();});}
    static void download(Activity a,JSONObject j){try{
        DownloadManager dm=(DownloadManager)a.getSystemService(Context.DOWNLOAD_SERVICE);
        android.content.SharedPreferences p=a.getSharedPreferences(PREF,0);long old=p.getLong("download",-1);
        if(old>0){try(android.database.Cursor c=dm.query(new DownloadManager.Query().setFilterById(old))){if(c!=null&&c.moveToFirst()){int status=c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));if(p.getInt("version",0)==j.optInt("versionCode")&&(status==DownloadManager.STATUS_RUNNING||status==DownloadManager.STATUS_PENDING||status==DownloadManager.STATUS_PAUSED)){message(a,"APK ဒေါင်းလုပ်လုပ်နေပါတယ်။");return;}}}}
        DownloadManager.Request r=new DownloadManager.Request(Uri.parse(j.optString("apkUrl")));
        r.setMimeType("application/vnd.android.package-archive");r.setTitle("Future Code Update "+j.optString("versionName"));r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        r.setDestinationInExternalFilesDir(a,android.os.Environment.DIRECTORY_DOWNLOADS,"update-"+j.optInt("versionCode")+"-"+System.currentTimeMillis()+".apk");
        long id=dm.enqueue(r);p.edit().putLong("download",id).putString("sha",j.optString("sha256")).putInt("version",j.optInt("versionCode")).apply();
        message(a,"Download စတင်ပါပြီ။ ပြီးလျှင် အသိပေးချက်ကို နှိပ်ပြီး Install အတည်ပြုပါ။");
    }catch(Exception e){message(a,"Download မစတင်နိုင်ပါ။ နောက်တစ်ကြိမ် ပြန်စမ်းပါ။");}}
    static boolean verified(Context c,Uri uri,String expected){try(InputStream in=c.getContentResolver().openInputStream(uri)){
        if(in==null||!expected.matches("[a-f0-9]{64}"))return false;MessageDigest digest=MessageDigest.getInstance("SHA-256");byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)digest.update(b,0,n);StringBuilder s=new StringBuilder();for(byte v:digest.digest())s.append(String.format(Locale.ROOT,"%02x",v&255));return expected.equals(s.toString());
    }catch(Exception e){return false;}}
    public static void handle(Activity a,Intent intent){if(intent!=null&&intent.getBooleanExtra("fc_install_verified_update",false)){intent.removeExtra("fc_install_verified_update");install(a);}}
    static void install(Activity a){new Thread(()->{try{
        android.content.SharedPreferences p=a.getSharedPreferences(PREF,0);long id=p.getLong("download",-1);DownloadManager dm=(DownloadManager)a.getSystemService(Context.DOWNLOAD_SERVICE);Uri uri=dm.getUriForDownloadedFile(id);
        if(uri==null||!verified(a,uri,p.getString("sha",""))){message(a,"APK ဖိုင် စစ်ဆေးမှုမအောင်မြင်ပါ။ Update ပြန်ဒေါင်းလုပ်လုပ်ပါ။");return;}
        a.runOnUiThread(()->{
            if(Build.VERSION.SDK_INT>=26&&!a.getPackageManager().canRequestPackageInstalls()){
                new AlertDialog.Builder(a).setMessage("ဒီ App မှ Update Install ခွင့်ကို Settings မှာ ပေးပြီး Update အသိပေးချက်ကို ပြန်နှိပ်ပါ။")
                    .setPositiveButton("Settings",(d,w)->a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+a.getPackageName())))).setNegativeButton("နောက်မှ",null).show();return;
            }
            try{Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(uri,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);a.startActivity(i);}catch(Exception e){message(a,"Downloads မှ APK ဖိုင်ကို ဖွင့်ပါ။");}
        });
    }catch(Exception e){message(a,"APK ဖိုင်ကို မဖွင့်နိုင်ပါ။ Update ပြန်စစ်ပါ။");}}).start();}
    public static class Receiver extends BroadcastReceiver {
        @Override public void onReceive(Context c,Intent i){if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(i.getAction()))return;
            android.content.SharedPreferences p=c.getSharedPreferences(PREF,0);if(i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-2)!=p.getLong("download",-1))return;
            NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Verified APK Updates",NotificationManager.IMPORTANCE_DEFAULT));
            if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED)return;
            Intent open=new Intent(c,MainActivity.class).putExtra("fc_install_verified_update",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending=PendingIntent.getActivity(c,417,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            nm.notify(417,new Notification.Builder(c,CHANNEL).setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle("Future Code Update").setContentText("ဒေါင်းလုပ်ရလဒ်ကို စစ်ပြီး Install တင်ရန် နှိပ်ပါ။").setContentIntent(pending).setAutoCancel(false).build());
        }
    }
}
