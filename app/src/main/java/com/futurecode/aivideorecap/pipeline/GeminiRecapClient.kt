package com.futurecode.aivideorecap.pipeline

import com.futurecode.aivideorecap.model.RecapLength
import com.futurecode.aivideorecap.model.RecapScene
import com.futurecode.aivideorecap.model.RecapStyle
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * Opt-in cloud analysis. Only the user's own key is used; the app has no backend
 * and NEVER ships a vendor API key in its APK. YouTube media is analyzed by
 * Gemini's native URL input feature; the application does not download videos.
 */
class GeminiRecapClient {
    data class Result(val scenes: List<RecapScene>, val script: String)

    suspend fun analyzeYoutube(
        url: String, apiKey: String, length: RecapLength, style: RecapStyle
    ): Result {
        require(isPublicYoutubeLink(url)) {
            "Only public YouTube / youtu.be links are supported for link analysis. Choose a local file for other videos."
        }
        require(apiKey.isNotBlank()) { "Enter your own Gemini API key in Settings first." }
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val prompt = """
                You are a professional movie recap editor. Watch the actual supplied video, including
                its visuals, not merely its title or metadata. Write a compelling, faithful movie recap
                voiceover in natural colloquial Burmese (Myanmar language). The style is ${style.label}.
                Aim for approximately ${length.seconds} seconds of FINAL NARRATION, not of the source video.
                Include the story setup, character motivations, major turning points and ending when visible.
                NEVER fabricate characters, dialogue, plot twists or the ending. If evidence is missing,
                state the uncertainty plainly in Burmese. Avoid phrases that suggest an unverified fact.
                Return only VALID JSON without markdown or extra prose:
                {"scenes":[{"start_ms":0,"end_ms":12000,"narration":"မြန်မာဘာသာဖြင့် ဇာတ်လမ်းပြောစာသား"}]}
                Each start_ms/end_ms is the time range IN THE SOURCE VIDEO corresponding to the
                narrated event, in milliseconds. Use chronological order, realistic time ranges,
                and choose 5 to 45 story scenes depending on source and requested output length.
                Each narration is 1-3 distinct Burmese sentences, suitable for spoken TTS.
                Do not quote long stretches of original dialogue. Summarize in new words.
            """.trimIndent()

            val input = JSONArray()
                .put(JSONObject().put("type", "text").put("text", prompt))
                .put(JSONObject().put("type", "video").put("uri", url.trim()))
            val payload = JSONObject()
                .put("model", "gemini-3.5-flash-lite")
                .put("input", input)
            val conn = URL("https://generativelanguage.googleapis.com/v1beta/interactions")
                .openConnection() as HttpsURLConnection
            try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 20_000
                conn.readTimeout = 180_000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                conn.setRequestProperty("x-goog-api-key", apiKey.trim())
                conn.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                val response = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
                if (code !in 200..299) {
                    val msg = runCatching {
                        JSONObject(response).optJSONObject("error")?.optString("message")
                    }.getOrNull().orEmpty().ifBlank { "HTTP $code" }
                    throw IllegalStateException("Gemini request failed: $msg")
                }
                val obj = JSONObject(response)
                require(obj.optString("status") == "completed") {
                    "Analysis not complete. Try a shorter public YouTube video or retry."
                }
                val steps = obj.optJSONArray("steps") ?: JSONArray()
                val answer = buildString {
                    for (i in 0 until steps.length()) {
                        val step = steps.optJSONObject(i) ?: continue
                        if (step.optString("type") != "model_output") continue
                        val parts = step.optJSONArray("content") ?: continue
                        for (j in 0 until parts.length()) {
                            val part = parts.optJSONObject(j) ?: continue
                            if (part.optString("type") == "text") append(part.optString("text"))
                        }
                    }
                }
                parseScenes(answer)
            } finally {
                conn.disconnect()
            }
        }
    }

    fun isPublicYoutubeLink(link: String): Boolean {
        val uri = runCatching { android.net.Uri.parse(link.trim()) }.getOrNull() ?: return false
        val host = uri.host?.lowercase() ?: return false
        if (uri.scheme?.lowercase() != "https") return false
        return host == "youtu.be" || host == "youtube.com" || host.endsWith(".youtube.com")
    }

    internal fun parseScenes(text: String): Result {
        val first = text.indexOf('{')
        val last = text.lastIndexOf('}')
        require(first >= 0 && last > first) { "AI did not return a structured recap. Please retry." }
        val data = JSONObject(text.substring(first, last + 1))
        val raw = data.optJSONArray("scenes") ?: JSONArray()
        val scenes = mutableListOf<RecapScene>()
        for (i in 0 until minOf(raw.length(), 60)) {
            val scene = raw.optJSONObject(i) ?: continue
            val begin = scene.optLong("start_ms", -1L)
            val end = scene.optLong("end_ms", -1L)
            val narration = scene.optString("narration").trim()
            if (begin < 0 || end <= begin || end > 28_800_000 || narration.isBlank()) continue
            scenes += RecapScene(begin, end, narration.take(800))
        }
        val ordered = scenes.sortedBy { it.startMs }
        require(ordered.isNotEmpty()) { "No usable story scenes were returned. Please retry." }
        return Result(ordered, ordered.joinToString("\n") { it.caption })
    }
}
