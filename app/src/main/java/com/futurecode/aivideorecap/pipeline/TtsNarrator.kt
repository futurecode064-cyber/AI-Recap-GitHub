package com.futurecode.aivideorecap.pipeline

import android.content.Context
import android.media.MediaMetadataRetriever
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.futurecode.aivideorecap.model.RecapLanguage
import com.futurecode.aivideorecap.model.RecapScene
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import java.util.Locale
import java.util.UUID
import kotlin.coroutines.resume

class TtsNarrator(private val context: Context) {
    data class Narration(val file: File, val durationMs: Long)

    suspend fun synthesize(scenes: List<RecapScene>, language: RecapLanguage, dir: File): List<Narration>? {
        dir.mkdirs()
        val tts = initTts() ?: return null
        try {
            val locale = Locale.forLanguageTag(language.tag)
            val support = tts.setLanguage(locale)
            if (support == TextToSpeech.LANG_MISSING_DATA || support == TextToSpeech.LANG_NOT_SUPPORTED) return null
            val result = mutableListOf<Narration>()
            for ((index, scene) in scenes.withIndex()) {
                val file = File(dir, "narration_${index.toString().padStart(3, '0')}.wav")
                val ok = synthesizeOne(tts, scene.caption, file)
                if (!ok || !file.exists() || file.length() == 0L) return null
                result += Narration(file, mediaDuration(file).coerceAtLeast(1200L))
            }
            return result
        } finally {
            tts.shutdown()
        }
    }

    private suspend fun initTts(): TextToSpeech? = suspendCancellableCoroutine { cont ->
        var engine: TextToSpeech? = null
        engine = TextToSpeech(context) { status ->
            if (cont.isActive) cont.resume(if (status == TextToSpeech.SUCCESS) engine else null)
        }
        cont.invokeOnCancellation { engine?.shutdown() }
    }

    private suspend fun synthesizeOne(tts: TextToSpeech, text: String, file: File): Boolean =
        suspendCancellableCoroutine { cont ->
            val id = UUID.randomUUID().toString()
            tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) = Unit
                override fun onDone(utteranceId: String?) {
                    if (utteranceId == id && cont.isActive) cont.resume(true)
                }
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    if (utteranceId == id && cont.isActive) cont.resume(false)
                }
                override fun onError(utteranceId: String?, errorCode: Int) {
                    if (utteranceId == id && cont.isActive) cont.resume(false)
                }
            })
            val queued = tts.synthesizeToFile(text.take(TextToSpeech.getMaxSpeechInputLength()), Bundle(), file, id)
            if (queued != TextToSpeech.SUCCESS && cont.isActive) cont.resume(false)
        }

    private fun mediaDuration(file: File): Long {
        val r = MediaMetadataRetriever()
        return try {
            r.setDataSource(file.absolutePath)
            r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
        } finally { r.release() }
    }
}
