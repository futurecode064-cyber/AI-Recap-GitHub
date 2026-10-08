package com.futurecode.aivideorecap

import android.app.Application
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.futurecode.aivideorecap.model.*
import com.futurecode.aivideorecap.pipeline.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class RecapViewModel(application: Application) : AndroidViewModel(application) {
    private val context get() = getApplication<Application>()
    private val prefs get() = context.getSharedPreferences("private_ai_settings", android.content.Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(RecapUiState())
    val state: StateFlow<RecapUiState> = _state.asStateFlow()

    fun savedApiKey(): String = prefs.getString("gemini_user_api_key", "").orEmpty()
    fun setApiKey(value: String) {
        prefs.edit().putString("gemini_user_api_key", value.trim()).apply()
    }
    fun setYoutubeUrl(url: String) {
        _state.value = _state.value.copy(youtubeUrl = url)
    }
    fun selectVideo(uri: Uri) {
        try {
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } catch (_: Exception) { }
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { VideoProbe.probe(context, uri) }
                .onSuccess {
                    _state.value = _state.value.copy(video = it, status = "Video ready to use in recap",
                        error = null, outputPath = null)
                }
                .onFailure { fail(it) }
        }
    }

    fun setLength(value: RecapLength) { _state.value = _state.value.copy(recapLength = value) }
    fun setLanguage(value: RecapLanguage) { _state.value = _state.value.copy(language = value) }
    fun setStyle(value: RecapStyle) { _state.value = _state.value.copy(style = value) }
    fun setCloudVoiceEnabled(value: Boolean) { _state.value = _state.value.copy(cloudVoiceEnabled = value) }

    /** Real model-driven video analysis: public YouTube link -> timestamped Burmese script. */
    fun createLinkRecap() {
        val snapshot = _state.value
        viewModelScope.launch {
            try {
                stage(PipelineStage.UNDERSTANDING, .15f, "AI is watching the linked video and writing a Burmese movie recap…")
                val generated = GeminiRecapClient().analyzeYoutube(
                    snapshot.youtubeUrl, savedApiKey(), snapshot.recapLength, snapshot.style
                )
                _state.value = _state.value.copy(
                    fromYoutube = true, language = RecapLanguage.BURMESE,
                    scenes = generated.scenes, script = generated.script,
                    transcript = emptyList(), outputPath = null, narrationPath = null,
                    stage = PipelineStage.COMPLETE, progress = 1f,
                    status = "Burmese recap script ready. Edit it, generate WAV voice, or select your permitted video file and export MP4.",
                    error = null, recognizerMode = "Gemini visual + audio video understanding"
                )
            } catch (t: Throwable) { fail(t) }
        }
    }

    /** Fully local fallback, uses Android speech recognition rather than movie-understanding AI. */
    fun createRecap() {
        val video = _state.value.video ?: return
        viewModelScope.launch {
            try {
                val work = File(context.cacheDir, "recap_work").apply { deleteRecursively(); mkdirs() }
                stage(PipelineStage.PREPARING, .05f, "Decoding audio locally…")
                val pcm = File(work, "audio_16k_mono.pcm")
                withContext(Dispatchers.IO) { AudioDecoder(context).decode16kMono(video.uri, pcm) }
                val chunks = withContext(Dispatchers.IO) { PcmChunker.split(pcm, File(work, "chunks")) }
                val transcriber = DeviceSpeechTranscriber(context)
                _state.value = _state.value.copy(recognizerMode = transcriber.mode)
                stage(PipelineStage.TRANSCRIBING, .12f, "${transcriber.mode}: 0/${chunks.size}")
                val transcript = mutableListOf<TranscriptChunk>()
                chunks.forEachIndexed { index, chunk ->
                    val text = transcriber.transcribe(chunk, _state.value.language)
                    if (text.isNotBlank()) transcript += TranscriptChunk(chunk.startMs, chunk.endMs, text)
                    val progress = .12f + .43f * ((index + 1f) / chunks.size.coerceAtLeast(1))
                    stage(PipelineStage.TRANSCRIBING, progress, "Transcribing ${index + 1}/${chunks.size}")
                }
                require(transcript.isNotEmpty()) {
                    "No speech could be transcribed. Check the language or install a compatible speech recognizer."
                }
                _state.value = _state.value.copy(transcript = transcript)
                stage(PipelineStage.UNDERSTANDING, .58f, "Selecting important spoken moments…")
                val generated = withContext(Dispatchers.Default) {
                    RecapGenerator.generate(transcript, _state.value.recapLength, _state.value.style)
                }
                require(generated.scenes.isNotEmpty()) { "Could not identify recap scenes." }
                _state.value = _state.value.copy(fromYoutube = false, scenes = generated.scenes,
                    script = generated.script, outputPath = null, narrationPath = null)
                exportInternal(video, generated.scenes, "AI-Recap")
            } catch (t: Throwable) { fail(t) }
        }
    }

    fun updateScript(text: String) {
        val lines = text.lines().map { it.trim() }
        val updated = _state.value.scenes.mapIndexed { i, scene ->
            scene.copy(caption = lines.getOrNull(i)?.takeIf { it.isNotBlank() } ?: scene.caption)
        }
        _state.value = _state.value.copy(script = text, scenes = updated, outputPath = null)
    }
    fun toggleScene(index: Int) {
        val scenes = _state.value.scenes.toMutableList()
        if (index !in scenes.indices) return
        scenes[index] = scenes[index].copy(enabled = !scenes[index].enabled)
        _state.value = _state.value.copy(scenes = scenes, outputPath = null)
    }
    fun shiftSceneEdge(index: Int, isStart: Boolean, deltaMs: Long) {
        val scenes = _state.value.scenes.toMutableList()
        if (index !in scenes.indices) return
        val scene = scenes[index]
        scenes[index] = if (isStart) scene.copy(
            startMs = (scene.startMs + deltaMs).coerceIn(0, scene.endMs - 500)
        ) else scene.copy(endMs = (scene.endMs + deltaMs).coerceAtLeast(scene.startMs + 500))
        _state.value = _state.value.copy(scenes = scenes, outputPath = null)
    }

    fun exportEdited() {
        val video = _state.value.video
        if (video == null) {
            fail(IllegalStateException("Select the matching locally owned video to export original footage. YouTube videos are not downloaded."))
            return
        }
        val scenes = _state.value.scenes.filter { it.enabled }
        if (scenes.isEmpty()) {
            fail(IllegalStateException("Enable at least one scene."))
            return
        }
        viewModelScope.launch {
            try { exportInternal(video, scenes, "AI-Recap-Edited") }
            catch (t: Throwable) { fail(t) }
        }
    }
    fun rerender() = exportEdited()

    /** Voice-only export works after YouTube analysis, even without a local movie file. */
    fun exportVoiceover() {
        val scenes = _state.value.scenes.filter { it.enabled }
        if (scenes.isEmpty()) { fail(IllegalStateException("Generate or edit recap scenes first.")); return }
        viewModelScope.launch {
            try {
                stage(PipelineStage.NARRATING, .25f, "Generating Burmese narration with installed TTS voice…")
                val work = File(context.cacheDir, "recap_voice").apply { deleteRecursively(); mkdirs() }
                val narration = synthesizeScenes(scenes, work)
                    ?: error("No compatible Myanmar voice on this phone. Enable Gemini Cloud Voice with your API key, or install a my-MM Android TTS voice.")
                val music = context.getExternalFilesDir(Environment.DIRECTORY_MUSIC) ?: context.filesDir
                music.mkdirs()
                val wav = File(music, "Future-Code-Recap-Voice-${System.currentTimeMillis()}.wav")
                withContext(Dispatchers.IO) { WavJoiner.join(narration.map { it.file }, wav) }
                _state.value = _state.value.copy(stage = PipelineStage.COMPLETE, progress = 1f,
                    status = "Voiceover WAV ready to share. Review pronunciation before publishing.",
                    narrationPath = wav.absolutePath, error = null)
            } catch (t: Throwable) { fail(t) }
        }
    }

    private suspend fun exportInternal(video: VideoInfo, scenes: List<RecapScene>, prefix: String) {
        require(video.durationMs > 500) { "Selected video does not contain readable duration metadata." }
        stage(PipelineStage.NARRATING, .35f, "Creating voice narration (if installed)…")
        val work = File(context.cacheDir, "recap_export").apply { deleteRecursively(); mkdirs() }
        val narration = synthesizeScenes(scenes, File(work, "narration"))
        val movies = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
        movies.mkdirs()
        val base = "$prefix-${System.currentTimeMillis()}"
        stage(PipelineStage.SUBTITLES, .50f, "Creating subtitles…")
        withContext(Dispatchers.IO) {
            SubtitleWriter.writeSrt(scenes, File(movies, "$base.srt"),
                narration?.map { it.durationMs })
        }
        stage(PipelineStage.RENDERING, .60f, "Rendering MP4…")
        val output = File(movies, "$base.mp4")
        VideoRenderer(context).render(video.uri, video.durationMs, scenes, narration, output)
        val note = if (narration == null)
            "MP4 exported with ORIGINAL SOUND; no matching ${_state.value.language.label} TTS voice installed."
        else "MP4 exported with ${_state.value.language.label} AI narration. Review sound and timing."
        _state.value = _state.value.copy(stage = PipelineStage.COMPLETE, progress = 1f,
            status = note, outputPath = output.absolutePath, error = null)
    }

    private suspend fun synthesizeScenes(scenes: List<RecapScene>, dir: File): List<TtsNarrator.Narration>? =
        if (_state.value.cloudVoiceEnabled) GeminiTtsNarrator().synthesize(scenes, savedApiKey(), dir)
        else TtsNarrator(context).synthesize(scenes, _state.value.language, dir)

    fun shareIntent(): Intent? = shareFile(_state.value.outputPath, "video/mp4")
    fun shareVoiceIntent(): Intent? = shareFile(_state.value.narrationPath, "audio/wav")
    private fun shareFile(path: String?, mime: String): Intent? {
        if (path == null) return null
        val file = File(path)
        if (!file.exists()) return null
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        return Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    private fun stage(stage: PipelineStage, progress: Float, text: String) {
        _state.value = _state.value.copy(stage = stage,
            progress = progress.coerceIn(0f, 1f), status = text, error = null)
    }
    private fun fail(t: Throwable) {
        _state.value = _state.value.copy(stage = PipelineStage.ERROR,
            status = "Stopped", error = t.message ?: t.javaClass.simpleName)
    }
}
