package com.futurecode.aivideorecap.pipeline

import android.media.MediaMetadataRetriever
import android.util.Base64
import com.futurecode.aivideorecap.model.RecapScene
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.URL
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.net.ssl.HttpsURLConnection

/**
 * User-opt-in cloud Myanmar voice: Gemini 3.8 Flash TTS supports Burmese.
 * Uses the user's own Gemini key. Subject to provider free quotas / billing tier.
 * Output is validated and converted to PCM WAV for Media3 composition.
 */
class GeminiTtsNarrator {
    suspend fun synthesize(
        scenes: List<RecapScene>, key: String, dir: File
    ): List<TtsNarrator.Narration> = withContext(Dispatchers.IO) {
        require(key.isNotBlank()) { "Enter your own Gemini API key to use cloud Burmese narration." }
        dir.mkdirs()
        scenes.mapIndexed { index, scene ->
            val annotation = JSONObject()
                .put("type", "speech_metadata")
                .put("style", "Natural Burmese movie recap storyteller, confident and clear")
            val contentPart = JSONObject()
                .put("type", "text")
                .put("text", scene.caption)
                .put("annotations", JSONArray().put(annotation))
            val input = JSONArray().put(
                JSONObject().put("type", "user_input")
                    .put("content", JSONArray().put(contentPart))
            )
            val payload = JSONObject()
                .put("model", "gemini-3.8-flash-tts")
                .put("input", input)
                .put("response_format", JSONObject().put("type", "audio"))
                .put("generation_config", JSONObject().put("speech_config",
                    JSONArray().put(JSONObject().put("voice", "Kore"))))
            val conn = URL("https://generativelanguage.googleapis.com/v1beta/interactions")
                .openConnection() as HttpsURLConnection
            val response = try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 20_000
                conn.readTimeout = 120_000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("x-goog-api-key", key.trim())
                conn.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                val text = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
                if (code !in 200..299) {
                    val error = runCatching { JSONObject(text).getJSONObject("error").getString("message") }
                        .getOrNull() ?: "HTTP $code"
                    throw IllegalStateException("Cloud voice scene ${index + 1} failed: $error")
                }
                JSONObject(text)
            } finally { conn.disconnect() }
            require(response.optString("status") == "completed") {
                "Cloud speech has not completed for scene ${index + 1}."
            }
            var audio: ByteArray? = null
            val steps = response.optJSONArray("steps") ?: JSONArray()
            for (i in 0 until steps.length()) {
                val step = steps.optJSONObject(i) ?: continue
                if (step.optString("type") != "model_output") continue
                val parts = step.optJSONArray("content") ?: continue
                for (j in 0 until parts.length()) {
                    val part = parts.optJSONObject(j) ?: continue
                    if (part.optString("type") == "audio") {
                        val b64 = part.optString("data")
                        if (b64.isNotBlank()) audio = Base64.decode(b64, Base64.DEFAULT)
                    }
                }
            }
            val data = requireNotNull(audio) { "Cloud TTS response did not contain audio." }
            val file = File(dir, "gemini_${index.toString().padStart(3, '0')}.wav")
            if (data.size > 12 && String(data, 0, 4, Charsets.US_ASCII) == "RIFF") {
                file.writeBytes(data)
            } else {
                writePcmWav(file, data)
            }
            val media = MediaMetadataRetriever()
            val duration = try {
                media.setDataSource(file.absolutePath)
                media.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                    ?.toLongOrNull() ?: 0L
            } finally { media.release() }
            TtsNarrator.Narration(file, duration.coerceAtLeast(800L))
        }
    }

    private fun writePcmWav(file: File, pcm: ByteArray) {
        require(pcm.isNotEmpty() && pcm.size % 2 == 0) { "Invalid PCM audio returned by TTS." }
        val buf = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
        buf.put("RIFF".toByteArray(Charsets.US_ASCII))
        buf.putInt(36 + pcm.size)
        buf.put("WAVEfmt ".toByteArray(Charsets.US_ASCII))
        buf.putInt(16)
        buf.putShort(1.toShort())
        buf.putShort(1.toShort())
        buf.putInt(24_000)
        buf.putInt(48_000)
        buf.putShort(2.toShort())
        buf.putShort(16.toShort())
        buf.put("data".toByteArray(Charsets.US_ASCII))
        buf.putInt(pcm.size)
        file.outputStream().use { it.write(buf.array()); it.write(pcm) }
    }
}
