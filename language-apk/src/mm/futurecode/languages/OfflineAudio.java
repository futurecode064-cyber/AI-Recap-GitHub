package mm.futurecode.languages;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

/** Plays ACTUAL prerecorded MP3 audio bundled INSIDE the installed APK. No Android TTS voice needed. */
public final class OfflineAudio {
    private static MediaPlayer player;
    private OfflineAudio() {}
    private static String hash(String s) throws Exception {
        byte[] digest=MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        StringBuilder out=new StringBuilder();
        for(int i=0;i<12;i++){int b=digest[i]&255;out.append(Character.forDigit((b>>>4)&15,16)).append(Character.forDigit(b&15,16));}
        return out.toString();
    }
    public static synchronized boolean play(Context ctx,String language,String sentence){
        if(sentence==null||sentence.trim().isEmpty()||sentence.length()>2000)return false;
        if(!language.matches("[a-z]{2}"))return false;
        MediaPlayer next=null;
        try {
            String digest=hash(sentence.trim());
            long revision=ctx.getPackageManager().getPackageInfo(ctx.getPackageName(),0).lastUpdateTime;
            String asset="audio/"+language+"/"+digest+".mp3";
            File clip=new File(ctx.getCacheDir(),"fc-offline-"+revision+"-"+language+"-"+digest+".mp3");
            if(!clip.exists()||clip.length()<800){
                try(InputStream input=ctx.getAssets().open(asset);FileOutputStream out=new FileOutputStream(clip)){
                    byte[] buf=new byte[8192];int len;while((len=input.read(buf))!=-1)out.write(buf,0,len);
                }
            }
            if(clip.length()<800)return false;
            stop();
            next=new MediaPlayer();
            next.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            next.setDataSource(clip.getAbsolutePath());
            next.prepare();
            MediaPlayer active=next;
            next.setOnCompletionListener(mp->{synchronized(OfflineAudio.class){if(player==mp)player=null;mp.release();}});
            next.setOnErrorListener((mp,what,extra)->{synchronized(OfflineAudio.class){if(player==mp)player=null;mp.release();}return true;});
            player=active;
            next.start();
            return true;
        } catch(Exception ex){
            if(next!=null){try{next.release();}catch(Exception ignored){}}
            return false;
        }
    }
    public static synchronized void stop(){
        if(player!=null){try{player.stop();}catch(Exception ignored){}try{player.release();}catch(Exception ignored){}player=null;}
    }
}
