package mm.futurecode.videostudio;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.view.Gravity;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Independent native Android shell. User sessions are checked server-side; only the admin can create accounts. */
public class MainActivity extends Activity {
  private static final String API="https://mxwervqihaqlxybghdak.supabase.co/functions/v1/video-studio-gate";
  private static final String ASSET="https://appassets.futurecode.local/";
  private static final int FILE_CODE=427;
  private String[] IDS,LABELS,ICONS,ASSETS;
  private String[][] PERMISSIONS;
  private static final int SAVE_CODE=428;
  private String activeAsset="";
  private volatile boolean downloadsEnabled=false;
  private File saveFile; private FileOutputStream saveStream; private String saveId="",saveName="",saveMime=""; private long saveBytes=0;
  private final ExecutorService worker=Executors.newSingleThreadExecutor();
  private SharedPreferences prefs;private String token="",username="";private volatile Set<String> accessible=new HashSet<>();
  private LinearLayout root;private WebView web;private ValueCallback<Uri[]> fileCallback;private int opened=-1;private volatile boolean authenticated=false;private boolean pending=false;
  private void loadModules() throws Exception {
    byte[] bytes;try(InputStream in=getAssets().open("studio/modules.json")){java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1)out.write(b,0,n);bytes=out.toByteArray();}
    JSONArray list=new JSONArray(new String(bytes,StandardCharsets.UTF_8));int count=list.length();if(count!=8)throw new Exception("Incomplete module manifest");
    IDS=new String[count];LABELS=new String[count];ICONS=new String[count];ASSETS=new String[count];PERMISSIONS=new String[count][];Set<String> unique=new HashSet<>();
    for(int i=0;i<count;i++){JSONObject row=list.getJSONObject(i);IDS[i]=row.getString("id");if(!unique.add(IDS[i]))throw new Exception("Duplicate module");LABELS[i]=row.getString("title");ICONS[i]=row.getString("icon");ASSETS[i]=row.getString("asset");JSONArray keys=row.getJSONArray("permissions");PERMISSIONS[i]=new String[keys.length()];for(int k=0;k<keys.length();k++)PERMISSIONS[i][k]=keys.getString(k);}
  }
  private int d(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
  private void installRoot(){
    if(android.os.Build.VERSION.SDK_INT>=30){
      getWindow().setDecorFitsSystemWindows(false);
      final int left=root.getPaddingLeft(),top=root.getPaddingTop(),right=root.getPaddingRight(),bottom=root.getPaddingBottom();
      root.setOnApplyWindowInsetsListener((view,insets)->{android.graphics.Insets safe=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.ime());view.setPadding(left+safe.left,top+safe.top,right+safe.right,bottom+safe.bottom);return insets;});
    }
    setContentView(root);root.requestApplyInsets();
  }
  @Override public void onCreate(Bundle b){super.onCreate(b);try{loadModules();}catch(Exception e){shell("Future Code AI Studio");text(root,"Section ဖိုင် မပြည့်စုံပါ။ APK အသစ်ကို ပြန်တင်ပါ။",16);return;}getWindow().setStatusBarColor(0xff101625);getWindow().setNavigationBarColor(0xff101625);prefs=getSharedPreferences("future_code_v4",MODE_PRIVATE);token=prefs.getString("token","");username=prefs.getString("username","");if(token.isEmpty())showLogin();else verifySession();}
  @Override protected void onResume(){super.onResume();if(!token.isEmpty()&&authenticated&&!pending)verifySession();}
  private GradientDrawable bg(int color,int radius){GradientDrawable x=new GradientDrawable();x.setColor(color);x.setCornerRadius(d(radius));return x;}
  private LinearLayout column(){LinearLayout x=new LinearLayout(this);x.setOrientation(1);return x;}
  private void shell(String title){root=column();root.setPadding(d(16),d(24),d(16),d(10));root.setBackgroundColor(0xff09111d);TextView head=new TextView(this);head.setText(title);head.setTextSize(25);head.setTextColor(0xffe9cb87);head.setPadding(0,d(7),0,d(16));head.setTypeface(null,1);root.addView(head);installRoot();}
  private TextView text(LinearLayout parent,String text,int size){TextView x=new TextView(this);x.setText(text);x.setTextSize(size);x.setTextColor(0xffd3ddeb);x.setPadding(d(5),d(8),d(4),d(7));parent.addView(x);return x;}
  private Button button(LinearLayout parent,String title,Runnable click){Button b=new Button(this);b.setText(title);b.setAllCaps(false);b.setTextSize(15);b.setTextColor(0xff161611);b.setBackground(bg(0xffe9c781,12));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,d(52));lp.bottomMargin=d(11);parent.addView(b,lp);b.setOnClickListener(v->click.run());return b;}
  private void error(String s){Toast.makeText(this,s,Toast.LENGTH_LONG).show();}
  private EditText field(LinearLayout parent,String title,boolean secret){text(parent,title,13);EditText v=new EditText(this);v.setSingleLine(true);v.setTextColor(Color.WHITE);v.setHintTextColor(0xff8293af);v.setTextSize(16);v.setPadding(d(15),d(10),d(15),d(10));v.setBackground(bg(0xff1d293c,12));if(secret)v.setInputType(129);else v.setInputType(1);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,d(54));lp.bottomMargin=d(15);parent.addView(v,lp);return v;}
  private void showLogin(){authenticated=false;pending=false;shell("Future Code AI Video Studio");text(root,"သင်တန်းသား အကောင့်ဝင်ရန်",19);text(root,"Admin ဖွင့်ပေးထားတဲ့ Username နဲ့ Password ကိုသာ အသုံးပြုနိုင်ပါတယ်။ ပထမဆုံး ဝင်သည့် ဖုန်းတစ်လုံးကို မှတ်ပုံတင်ပါမည်။",14);EditText user=field(root,"Username",false);EditText pass=field(root,"Password",true);user.setText(username);Button submit=button(root,"🔐 Login ဝင်ရန်",()->{});TextView status=text(root,"",13);submit.setOnClickListener(v->{String name=user.getText().toString().trim().toLowerCase(),pw=pass.getText().toString();if(!name.matches("[a-z0-9._-]{3,40}")||pw.isEmpty()){status.setText("Username / Password စစ်ပါ");return;}submit.setEnabled(false);status.setText("အကောင့်နဲ့ ဖုန်း လုံခြုံရေးစစ်နေပါတယ်…");worker.execute(()->{try{JSONObject c=call("challenge",new JSONObject().put("username",name));String nonce=c.getString("nonce");KeyPair pair=deviceKey(name);String spki=Base64.encodeToString(pair.getPublic().getEncoded(),Base64.NO_WRAP);String proof=Base64.encodeToString(ecdsaRaw(pair.getPrivate(),name+"|"+nonce),Base64.NO_WRAP);JSONObject auth=call("student_login",new JSONObject().put("username",name).put("password",pw).put("nonce",nonce).put("spki",spki).put("signature",proof));String t=auth.getString("token");runOnUiThread(()->{token=t;username=name;prefs.edit().putString("token",t).putString("username",name).apply();pass.setText("");setSections(auth.optJSONArray("sections"));authenticated=true;openHome();});}catch(Exception e){runOnUiThread(()->{submit.setEnabled(true);status.setText(e.getMessage());});}});});}
  private static class ApiFailure extends Exception { private static final long serialVersionUID=1L; final int status; ApiFailure(int status,String message){super(message);this.status=status;} }
  private JSONObject call(String action,JSONObject input)throws Exception{input.put("action",action);HttpURLConnection conn=(HttpURLConnection)new URL(API).openConnection();try{conn.setRequestMethod("POST");conn.setConnectTimeout(13000);conn.setReadTimeout(30000);conn.setDoOutput(true);conn.setRequestProperty("Content-Type","application/json; charset=utf-8");conn.setRequestProperty("Accept","application/json");try(OutputStream out=conn.getOutputStream()){out.write(input.toString().getBytes(StandardCharsets.UTF_8));}int status=conn.getResponseCode();InputStream stream=status<400?conn.getInputStream():conn.getErrorStream();String result;try(InputStream s=stream){byte[] bytes=new byte[16384];int n;java.io.ByteArrayOutputStream all=new java.io.ByteArrayOutputStream();while((n=s.read(bytes))>0){all.write(bytes,0,n);if(all.size()>100000)break;}result=new String(all.toByteArray(),StandardCharsets.UTF_8);}JSONObject obj=new JSONObject(result);if(status>=400)throw new ApiFailure(status,obj.optString("error","Login failed ("+status+")"));return obj;}finally{conn.disconnect();}}
  private KeyPair deviceKey(String name)throws Exception{String alias="future_video_key_"+name;KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);if(!store.containsAlias(alias)){KeyPairGenerator g=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC,"AndroidKeyStore");g.initialize(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_SIGN|KeyProperties.PURPOSE_VERIFY).setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1")).setDigests(KeyProperties.DIGEST_SHA256).build());g.generateKeyPair();}java.security.cert.Certificate cert=store.getCertificate(alias);PrivateKey privateKey=(PrivateKey)store.getKey(alias,null);return new KeyPair(cert.getPublicKey(),privateKey);}
  private byte[] ecdsaRaw(PrivateKey key,String msg)throws Exception{Signature signer=Signature.getInstance("SHA256withECDSA");signer.initSign(key);signer.update(msg.getBytes(StandardCharsets.UTF_8));byte[] der=signer.sign();int o=0;if((der[o++]&255)!=48)throw new Exception("ECDSA Signature error");int length=der[o++]&255;if((length&128)!=0){int n=length&127;o+=n;}if((der[o++]&255)!=2)throw new Exception("Invalid ECDSA R");int rlen=der[o++]&255;byte[] r=new byte[rlen];System.arraycopy(der,o,r,0,rlen);o+=rlen;if((der[o++]&255)!=2)throw new Exception("Invalid ECDSA S");int slen=der[o++]&255;byte[] s=new byte[slen];System.arraycopy(der,o,s,0,slen);byte[] raw=new byte[64];int rl=Math.min(32,rlen),sl=Math.min(32,slen);System.arraycopy(r,rlen-rl,raw,32-rl,rl);System.arraycopy(s,slen-sl,raw,64-sl,sl);return raw;}
  private void verifySession(){if(token.isEmpty()){showLogin();return;}if(pending)return;pending=true;if(root==null)shell("အကောင့် စစ်ဆေးနေပါတယ်…");String t=token,n=username;worker.execute(()->{try{long ts=System.currentTimeMillis();String proof=Base64.encodeToString(ecdsaRaw(deviceKey(n).getPrivate(),"me|"+t+"|"+ts),Base64.NO_WRAP);JSONObject j=call("student_me",new JSONObject().put("token",t).put("timestamp",ts).put("signature",proof));runOnUiThread(()->{pending=false;authenticated=true;setSections(j.optJSONArray("sections"));if(opened<0)openHome();else if(!canOpen(opened)){error("Section ကို Admin က ပိတ်ထားပါတယ်");openHome();}});}catch(Exception ex){runOnUiThread(()->{pending=false;if(ex instanceof ApiFailure && (((ApiFailure)ex).status==401||((ApiFailure)ex).status==403)){token="";authenticated=false;prefs.edit().remove("token").apply();showLogin();error("Login ပြန်ဝင်ရန်: "+ex.getMessage());}else if(authenticated){error("အကောင့် ပြန်စစ်ရန် ချိတ်ဆက်မှု မရပါ။ အင်တာနက် ပြန်ချိတ်ပါ။");}else{shell("အကောင့် စစ်ဆေးရန်");text(root,"အင်တာနက် / VPN ချိတ်ဆက်မှု စစ်ပြီး ပြန်စမ်းပါ။",15);button(root,"ပြန်စစ်မည်",()->verifySession());button(root,"Login ပြန်ဝင်မည်",()->showLogin());}});}});}
  private void setSections(JSONArray array){Set<String> next=new HashSet<>();if(array!=null)for(int i=0;i<array.length();i++){JSONObject item=array.optJSONObject(i);if(item!=null&&item.optBoolean("enabled",false))next.add(item.optString("section_key"));}accessible=next;}
  private void openHome(){opened=-1;activeAsset="";downloadsEnabled=false;if(web!=null){web.destroy();web=null;}shell("Future Code AI Studio");ScrollView sc=new ScrollView(this);LinearLayout list=column();list.setPadding(0,0,0,d(45));sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));text(list,"မင်္ဂလာပါ · "+username,17);text(list,"သင်ခန်းစာကို စတင်ပြီး ပုံ၊ ဗီဒီယိုနှင့် Movie Recap များကို ဖန်တီးနိုင်ပါတယ်။",13);for(int i=0;i<IDS.length;i++){if(!canOpen(i))continue;final int ix=i;Button b=new Button(this);b.setAllCaps(false);b.setText(ICONS[i]+"   "+LABELS[i]+"    ›");b.setTextSize(15);b.setTextColor(Color.WHITE);b.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);b.setPadding(d(19),0,d(12),0);b.setBackground(bg(i>=4?0xff203b46:0xff18283f,16));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,d(74));p.bottomMargin=d(11);list.addView(b,p);b.setOnClickListener(v->openSection(ix));}Button logout=button(list,"အကောင့်မှ ထွက်ရန်",()->logout());logout.setTextColor(0xff341820);}
  private boolean canOpen(int i){if(IDS==null||i<0||i>=IDS.length)return false;for(String key:PERMISSIONS[i])if(accessible.contains(key))return true;return false;}
  private boolean allowedAsset(String p){if(p.contains("..")||p.contains("\\"))return false;if(p.startsWith("studio/"))return p.matches("studio/(shared|image|video|editor|renderer|navigation)\\.js")||p.equals("studio/studio.css")||p.equals("studio/modules.json");if(p.equals("sections/lesson-videos.html")||p.equals("sections/studio-help.html")||p.equals("sections/media-editor.html"))return true;for(String a:ASSETS)if(a.split("\\?")[0].equals(p))return true;return p.equals("sections/pro-video-guide.html")||p.equals("sections/academy.html");}
  private WebResourceResponse assetResponse(Uri u){
    if(!"appassets.futurecode.local".equalsIgnoreCase(u.getHost()))return null;String p=u.getPath().replaceFirst("^/","");
    if(!authenticated||!allowedAsset(p))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    try{String type=p.endsWith(".js")?"text/javascript":p.endsWith(".css")?"text/css":p.endsWith(".json")?"application/json":"text/html";return new WebResourceResponse(type,"UTF-8",getAssets().open(p));}
    catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new ByteArrayInputStream("Page unavailable".getBytes(StandardCharsets.UTF_8)));}
  }
  private boolean allowedPage(String path){
    if(!authenticated)return false;
    if(path.equals("sections/pro-video-guide.html")||path.equals("sections/academy.html"))return canOpen(0);
    if(path.equals("sections/studio-help.html"))return canOpen(opened);
    if(path.equals("sections/media-editor.html"))return canOpen(5)||canOpen(6);
    for(int i=0;i<ASSETS.length;i++)if(ASSETS[i].split("\\?")[0].equals(path))return canOpen(i);
    return false;
  }
  private class NativeBridge {
    private final WebView owner;NativeBridge(WebView owner){this.owner=owner;}
    @JavascriptInterface public void printPage(){runOnUiThread(()->{if(!authenticated||owner==null)return;try{android.print.PrintManager m=(android.print.PrintManager)getSystemService(PRINT_SERVICE);if(m==null)throw new Exception("Printing unavailable");m.print("FutureCode_Document",owner.createPrintDocumentAdapter("FutureCode_Document"),new android.print.PrintAttributes.Builder().build());}catch(Exception e){error("Print / PDF မဖွင့်နိုင်ပါ: "+e.getMessage());}});}
  }
  private void ifStudioIdle(Runnable next){if(web==null){next.run();return;}web.evaluateJavascript("Boolean(window.FCStudioBusy && window.FCStudioBusy())",value->{if("true".equals(value)){error("လုပ်ဆောင်မှု ပြီးအောင် စောင့်ပါ။ ရပ်ချင်လျှင် Studio ရဲ့ Cancel ကို နှိပ်ပါ။");}else next.run();});}
  private void showHelp(String tool){
    if(web!=null)web.evaluateJavascript("document.querySelectorAll('video,audio').forEach(e=>e.pause())",null);
    final WebView help=new WebView(this);help.getSettings().setJavaScriptEnabled(true);help.getSettings().setDomStorageEnabled(true);help.getSettings().setAllowFileAccess(false);help.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);help.addJavascriptInterface(new NativeBridge(help),"FutureCodeNative");
    help.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return assetResponse(r.getUrl());}
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if("appassets.futurecode.local".equalsIgnoreCase(u.getHost())){String p=u.getPath().replaceFirst("^/","");if(allowedPage(p))return false;error("Section ကို Admin က ပိတ်ထားပါတယ်");return true;}if("https".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){error("Link မဖွင့်နိုင်ပါ");}}return true;}
    });
    help.setLayoutParams(new LinearLayout.LayoutParams(-1,Math.round(getResources().getDisplayMetrics().heightPixels*.72f)));
    android.app.AlertDialog dialog=new android.app.AlertDialog.Builder(this).setTitle("အသုံးပြုနည်း").setView(help).setPositiveButton("ပြန်",(d,w)->{}).create();dialog.setOnDismissListener(d->help.destroy());dialog.show();help.loadUrl(ASSET+"sections/studio-help.html?tool="+tool);
  }
  private void openSection(int i){if(!authenticated){showLogin();return;}if(!canOpen(i)){error("Section ကို Admin က ပိတ်ထားပါတယ်");return;}showAsset(i,ASSETS[i],LABELS[i]);}
  private void showAsset(int i,String path,String label){
    if(web!=null){web.destroy();web=null;} opened=i;activeAsset=path;
    downloadsEnabled=path.startsWith("sections/image-studio.html")||path.startsWith("sections/video-maker.html")||path.startsWith("sections/media-editor.html");
    root=column();root.setBackgroundColor(0xff0c111b);LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setBackgroundColor(0xff172136);bar.setPadding(d(6),d(4),d(6),d(4));Button back=new Button(this);back.setText("‹ ပြန်");back.setTextSize(12);back.setAllCaps(false);bar.addView(back,new LinearLayout.LayoutParams(d(80),d(48)));back.setOnClickListener(v->goBack());TextView title=new TextView(this);title.setText(label);title.setTextSize(14);title.setGravity(Gravity.CENTER_VERTICAL);title.setTextColor(0xfff4d29a);bar.addView(title,new LinearLayout.LayoutParams(0,d(49),1));root.addView(bar);
    web=new WebView(this);WebSettings st=web.getSettings();st.setJavaScriptEnabled(true);st.setDomStorageEnabled(true);st.setSupportMultipleWindows(false);st.setAllowFileAccess(false);st.setAllowContentAccess(true);st.setAllowUniversalAccessFromFileURLs(false);st.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);st.setJavaScriptCanOpenWindowsAutomatically(false);st.setMediaPlaybackRequiresUserGesture(false);web.setBackgroundColor(0xff101522);web.addJavascriptInterface(new NativeBridge(web),"FutureCodeNative");if(downloadsEnabled)web.addJavascriptInterface(new FileBridge(),"FutureCodeDownloads");
    web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> cb,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=cb;try{Intent pick=params.createIntent();pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);startActivityForResult(pick,FILE_CODE);return true;}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;error("File Picker မဖွင့်နိုင်ပါ");return false;}}});
    web.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView w,WebResourceRequest req){return assetResponse(req.getUrl());}
      @Override public void onReceivedError(WebView v,WebResourceRequest r,android.webkit.WebResourceError e){if(r.isForMainFrame())error("စာမျက်နှာ ဖွင့်မရပါ။ ပင်မမှ ပြန်ဖွင့်ပါ။");}
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){if(!r.isForMainFrame())return false;Uri u=r.getUrl();if("app".equalsIgnoreCase(u.getScheme())){String host=u.getHost();if("home".equals(host)){ifStudioIdle(()->openHome());return true;}if("lessons".equals(host)&&canOpen(0)){showAsset(0,"sections/pro-video-guide.html","သင်ခန်းစာများ");return true;}if("editor".equals(host)&&(opened==5||opened==6)&&canOpen(opened)){ifStudioIdle(()->showAsset(opened,"sections/media-editor.html?mode=edit","Video Editor"));return true;}if("help".equals(host)&&canOpen(opened)){String tool=u.getPath().replace("/","");if(tool.equals("image")||tool.equals("video")||tool.equals("recap"))ifStudioIdle(()->showHelp(tool));return true;}return true;}if("appassets.futurecode.local".equalsIgnoreCase(u.getHost())){String p=u.getPath().replaceFirst("^/","");if(allowedPage(p))return false;error("Section ကို Admin က ပိတ်ထားပါတယ်");return true;}if("https".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){error("Link မဖွင့်နိုင်ပါ");}}return true;}
    });root.addView(web,new LinearLayout.LayoutParams(-1,0,1));installRoot();web.loadUrl(ASSET+path);
  }
  private void goBack(){ifStudioIdle(()->{if(opened>=0&&!activeAsset.equals(ASSETS[opened])){openSection(opened);return;}openHome();});}
  private synchronized void clearSave(){try{if(saveStream!=null)saveStream.close();}catch(Exception ignored){}saveStream=null;if(saveFile!=null)saveFile.delete();saveFile=null;saveId="";saveBytes=0;}
  private class FileBridge {
    @JavascriptInterface public String beginSave(String filename,String mime){synchronized(MainActivity.this){
      if(!authenticated||!downloadsEnabled||!saveId.isEmpty()||filename==null)return "";
      if(!java.util.Arrays.asList("image/png","image/jpeg","image/webp","audio/wav","video/mp4","video/webm","application/json","text/plain","application/octet-stream").contains(mime))return "";
      try{saveId=java.util.UUID.randomUUID().toString();saveName=filename.replaceAll("[^a-zA-Z0-9_.-]","_");if(saveName.isEmpty())saveName="FutureCode_Export";if(saveName.length()>140)saveName=saveName.substring(0,140);saveMime=mime;saveFile=new File(getCacheDir(),"export-"+saveId);saveStream=new FileOutputStream(saveFile);saveBytes=0;return saveId;}catch(Exception e){clearSave();return "";}
    }}
    @JavascriptInterface public boolean appendSave(String id,String data){synchronized(MainActivity.this){
      if(!authenticated||!downloadsEnabled||!saveId.equals(id)||saveStream==null||data==null||data.length()>600000)return false;
      try{byte[] b=Base64.decode(data,Base64.DEFAULT);saveBytes+=b.length;if(saveBytes>256L*1048576){clearSave();return false;}saveStream.write(b);return true;}catch(Exception e){clearSave();return false;}
    }}
    @JavascriptInterface public boolean finishSave(String id){synchronized(MainActivity.this){
      if(!authenticated||!downloadsEnabled||!saveId.equals(id)||saveStream==null)return false;
      try{saveStream.close();saveStream=null;final String jobId=saveId,name=saveName,mime=saveMime;runOnUiThread(()->{synchronized(MainActivity.this){if(!saveId.equals(jobId)||isFinishing())return;try{Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(mime);intent.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(intent,SAVE_CODE);}catch(Exception e){clearSave();error("Save dialog မဖွင့်နိုင်ပါ");}}});return true;}catch(Exception e){clearSave();return false;}
    }}
    @JavascriptInterface public void cancelSave(String id){synchronized(MainActivity.this){if(saveId.equals(id))clearSave();}}
  }
  private void logout(){String old=token;token="";authenticated=false;prefs.edit().remove("token").apply();worker.execute(()->{try{call("logout",new JSONObject().put("token",old));}catch(Exception ignored){}});if(web!=null){web.destroy();web=null;}showLogin();}
  @Override protected void onActivityResult(int code,int result,Intent data){
    if(code==SAVE_CODE){if(result==RESULT_OK&&data!=null&&data.getData()!=null&&saveFile!=null){final Uri target=data.getData();final File source=saveFile;worker.execute(()->{try(InputStream in=new java.io.FileInputStream(source);OutputStream out=getContentResolver().openOutputStream(target,"w")){if(out==null)throw new Exception("Save location unavailable");byte[] buffer=new byte[65536];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);runOnUiThread(()->error("✓ ဖိုင်သိမ်းပြီးပါပြီ"));}catch(Exception e){runOnUiThread(()->error("Save မအောင်မြင်ပါ: "+e.getMessage()));}finally{clearSave();}});}else{clearSave();error("ဖိုင်သိမ်းခြင်း ပယ်ဖျက်ထားပါပြီ");}return;}
    if(code==FILE_CODE){if(fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}return;}super.onActivityResult(code,result,data);
  }
  @Override public void onBackPressed(){if(opened>=0){goBack();return;}super.onBackPressed();}
  @Override protected void onDestroy(){clearSave();if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}if(web!=null)web.destroy();worker.shutdownNow();super.onDestroy();}
}
