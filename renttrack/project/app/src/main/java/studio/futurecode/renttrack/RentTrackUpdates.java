package studio.futurecode.renttrack;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

public final class RentTrackUpdates {
  private static final String MANIFEST_URL="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/renttrack-update.json";
  private static final String APK_URL_PREFIX="https://futurecode064-cyber.github.io/AI-Recap-GitHub/apps/FutureCodeRentTrack-v";
  private static final String PACKAGE="studio.futurecode.renttrack";
  private static final long MAX_APK=100L*1024L*1024L;
  private RentTrackUpdates(){}
  private static SharedPreferences preferences(Context c){
    return c.getSharedPreferences("renttrack_updates",Context.MODE_PRIVATE);
  }
  private static String digest(byte[] data) throws Exception {
    byte[] sum=MessageDigest.getInstance("SHA-256").digest(data);
    StringBuilder b=new StringBuilder();
    for(byte x:sum)b.append(String.format(Locale.US,"%02x",x&255));
    return b.toString();
  }
  private static String fileHash(File f) throws Exception {
    MessageDigest md=MessageDigest.getInstance("SHA-256");
    try(InputStream in=new java.io.FileInputStream(f)){
      byte[] buf=new byte[32768];int n;
      while((n=in.read(buf))!=-1)md.update(buf,0,n);
    }
    StringBuilder b=new StringBuilder();
    for(byte x:md.digest())b.append(String.format(Locale.US,"%02x",x&255));
    return b.toString();
  }
  private static Signature getSigner(PackageInfo info){
    if(info==null||info.signingInfo==null)return null;
    Signature[] signatures=info.signingInfo.getApkContentsSigners();
    if(signatures==null||signatures.length!=1)return null;
    return signatures[0];
  }
  private static Signature currentSigner(Context c) throws Exception {
    PackageInfo i=c.getPackageManager().getPackageInfo(c.getPackageName(),PackageManager.GET_SIGNING_CERTIFICATES);
    Signature signer=getSigner(i);
    if(signer==null)throw new SecurityException("installed certificate unavailable");
    return signer;
  }
  private static JSONObject fetch() throws Exception {
    URL u=new URL(MANIFEST_URL);
    HttpURLConnection conn=(HttpURLConnection)u.openConnection();
    conn.setInstanceFollowRedirects(false);
    conn.setConnectTimeout(10000);
    conn.setReadTimeout(10000);
    conn.setRequestProperty("Accept","application/json");
    try{
      if(conn.getResponseCode()!=200)throw new IllegalStateException("manifest HTTP "+conn.getResponseCode());
      if(conn.getContentLengthLong()>20000)throw new IllegalStateException("manifest too large");
      java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();
      try(InputStream in=conn.getInputStream()){
        byte[] buf=new byte[4096];int n;
        while((n=in.read(buf))!=-1){if(out.size()+n>20000)throw new IllegalStateException("manifest limit");out.write(buf,0,n);}
      }
      return new JSONObject(out.toString("UTF-8"));
    }finally{conn.disconnect();}
  }
  private static boolean signedManifest(JSONObject j){
    String url=j.optString("apkUrl","");
    return j.optString("packageName","").equals(PACKAGE)
      && j.optString("status","").equals("production-signed")
      && j.optInt("versionCode",0)>0
      && j.optString("sha256","").matches("[0-9a-f]{64}")
      && j.optString("certificateSha256","").matches("[0-9a-f]{64}")
      && url.startsWith(APK_URL_PREFIX) && url.endsWith(".apk")
      && !url.contains("?") && !url.contains("#");
  }
  private static String installedCertificateHash(Context c) throws Exception{
    return digest(currentSigner(c).toByteArray());
  }
  public static JSONObject check(Context c,boolean manual,JSONObject ignored){
    JSONObject result=new JSONObject();
    try {
      SharedPreferences p=preferences(c);
      if(!manual&&System.currentTimeMillis()-p.getLong("checkedAt",0)<6L*3600000L)
        return new JSONObject().put("status","cached");
      JSONObject j=fetch();
      p.edit().putLong("checkedAt",System.currentTimeMillis()).apply();
      if(!signedManifest(j))return result.put("status","unpublished").put("message","Official Update မထုတ်သေးပါ");
      int newer=j.getInt("versionCode");
      if(newer<=BuildConfig.VERSION_CODE)
        return result.put("status","current").put("versionName",BuildConfig.VERSION_NAME);
      if(!j.getString("certificateSha256").equals(installedCertificateHash(c)))
        return result.put("status","signing_mismatch")
          .put("message","မူလ QA APK နှင့် Official Signed APK လက်မှတ်မတူပါ။ Encrypted Backup ထုတ်ပြီး Official APK ကို အသစ်ထည့်ရန်လိုပါသည်။");
      result.put("status","available").put("versionCode",newer)
        .put("versionName",j.optString("versionName",""));
      if(p.getInt("notifiedVersion",0)<newer){
        RentTrackNotifications.post(c,RentTrackNotifications.UPDATES,1101,"RentTrack Update ရရှိပါပြီ",
          "Version "+j.optString("versionName")+" အသစ်ကို Download လုပ်နိုင်ပါပြီ။ Install အတွက် အတည်ပြုချက်လိုပါသည်။");
        p.edit().putInt("notifiedVersion",newer).apply();
      }
      if(!manual&&p.getBoolean("autoDownload",false)&&unmetered(c)){
        download(c,false);
        result.put("downloadStarted",true);
      }
    }catch(Exception e){try{result.put("status","error").put("message","Version စစ်ဆေးရာတွင် ချိတ်ဆက်မှုမရပါ");}catch(Exception ignored2){}}
    return result;
  }
  public static boolean unmetered(Context c){
    ConnectivityManager cm=(ConnectivityManager)c.getSystemService(Context.CONNECTIVITY_SERVICE);
    Network net=cm.getActiveNetwork();
    NetworkCapabilities cap=cm.getNetworkCapabilities(net);
    return cap!=null&&cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      && cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
  }
  public static JSONObject download(Context c,boolean manual){
    JSONObject r=new JSONObject();
    File part=null;
    try{
      JSONObject j=fetch();
      if(!signedManifest(j)||j.getInt("versionCode")<=BuildConfig.VERSION_CODE)
        return r.put("status","no_update");
      if(!j.getString("certificateSha256").equals(installedCertificateHash(c)))
        return r.put("status","signing_mismatch");
      if(!manual&&!unmetered(c))return r.put("status","wifi_required");
      File folder=new File(c.getFilesDir(),"renttrack-updates");
      if(!folder.exists()&&!folder.mkdirs())throw new IllegalStateException("storage");
      File apk=new File(folder,"verified-v"+j.getInt("versionCode")+".apk");
      if(apk.isFile()&&verifyPackage(c,apk,j)){
        return r.put("status","downloaded").put("versionName",j.optString("versionName",""));
      }
      part=new File(folder,"incoming.part");
      HttpURLConnection conn=(HttpURLConnection)new URL(j.getString("apkUrl")).openConnection();
      conn.setInstanceFollowRedirects(false);
      conn.setConnectTimeout(12000);
      conn.setReadTimeout(25000);
      try{
        if(conn.getResponseCode()!=200)throw new IllegalStateException("download HTTP "+conn.getResponseCode());
        if(conn.getContentLengthLong()>MAX_APK)throw new IllegalStateException("APK too large");
        try(InputStream in=conn.getInputStream();FileOutputStream out=new FileOutputStream(part)){
          byte[] b=new byte[32768];int n;long count=0;
          while((n=in.read(b))!=-1){
            count+=n;if(count>MAX_APK)throw new IllegalStateException("APK too large");
            out.write(b,0,n);
          }
          out.getFD().sync();
        }
      }finally{conn.disconnect();}
      if(!verifyPackage(c,part,j))throw new SecurityException("hash/package/certificate mismatch");
      if(apk.exists()&&!apk.delete())throw new IllegalStateException("cannot replace");
      if(!part.renameTo(apk))throw new IllegalStateException("cannot store APK");
      r.put("status","downloaded").put("versionName",j.optString("versionName",""));
      RentTrackNotifications.post(c,RentTrackNotifications.UPDATES,1102,"RentTrack APK Download ပြီးပါပြီ",
        "Version "+j.optString("versionName")+" လက်မှတ်နှင့် SHA-256 စစ်ပြီးပါပြီ။ App ထဲမှာ Install ကိုနှိပ်ပါ။");
    }catch(Exception e){try{r.put("status","error").put("message","APK Download/စစ်ဆေးမှု မအောင်မြင်ပါ");}catch(Exception ignored){}}
    finally{if(part!=null&&part.exists())part.delete();}
    return r;
  }
  private static boolean verifyPackage(Context c,File file,JSONObject j){
    try{
      if(!file.isFile()||file.length()<10000||file.length()>MAX_APK)return false;
      if(!fileHash(file).equals(j.getString("sha256")))return false;
      PackageInfo archive=c.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(),PackageManager.GET_SIGNING_CERTIFICATES);
      if(archive==null||!PACKAGE.equals(archive.packageName)||archive.getLongVersionCode()!=j.getInt("versionCode"))return false;
      Signature signer=getSigner(archive);
      return signer!=null&&signer.equals(currentSigner(c))
        && digest(signer.toByteArray()).equals(j.getString("certificateSha256"));
    }catch(Exception e){return false;}
  }
  public static JSONObject install(Context c){
    JSONObject r=new JSONObject();
    try{
      JSONObject j=fetch();
      if(!signedManifest(j)||j.getInt("versionCode")<=BuildConfig.VERSION_CODE)return r.put("status","no_update");
      File f=new File(new File(c.getFilesDir(),"renttrack-updates"),"verified-v"+j.getInt("versionCode")+".apk");
      if(!verifyPackage(c,f,j))return r.put("status","not_downloaded");
      if(Build.VERSION.SDK_INT>=26&&!c.getPackageManager().canRequestPackageInstalls()){
        Intent settings=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+c.getPackageName()));
        settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        c.startActivity(settings);
        return r.put("status","install_permission").put("message","Allow from this source ခွင့်ပြုပြီး Install ထပ်နှိပ်ပါ");
      }
      Uri uri=FileProvider.getUriForFile(c,PACKAGE+".files",f);
      Intent install=new Intent(Intent.ACTION_VIEW);
      install.setDataAndType(uri,"application/vnd.android.package-archive");
      install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_GRANT_READ_URI_PERMISSION);
      c.startActivity(install);
      return r.put("status","installer_opened");
    }catch(Exception e){try{return r.put("status","error").put("message","Install စတင်မရပါ");}catch(Exception ignored){return r;}}
  }
  public static void autoDownload(Context c,boolean allowed){
    preferences(c).edit().putBoolean("autoDownload",allowed).apply();
  }
  public static boolean isAutoDownload(Context c){return preferences(c).getBoolean("autoDownload",false);}
}
