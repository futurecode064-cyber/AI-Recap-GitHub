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
    private val _state = MutableStateFlow(RecapUiState())
    val state: StateFlow<RecapUiState> = _state.asStateFlow()

    fun selectVideo(uri: Uri) {
        try { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (_: Exception) {}
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { VideoProbe.probe(context, uri) }
                .onSuccess { video -> _state.value = _state.value.copy(video = video, status = "Ready to create recap", error = null, outputPath = null) }
                .onFailure { fail(it) }
        }
    }

    fun setLength(v: RecapLength) { _state.value = _state.value.copy(recapLength = v) }
    fun setLanguage(v: RecapLanguage) { _state.value = _state.value.copy(language = v) }
    fun setStyle(v: RecapStyle) { _state.value = _state.value.copy(style = v) }

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
                chunks.forEachIndexed { index, c ->
                    val text = transcriber.transcribe(c, _state.value.language)
                    if (text.isNotBlank()) transcript += TranscriptChunk(c.startMs, c.endMs, text)
                    val p = .12f + .43f * ((index + 1f) / chunks.size.coerceAtLeast(1))
                    stage(PipelineStage.TRANSCRIBING, p, "Transcribing ${index + 1}/${chunks.size}")
                }
                require(transcript.isNotEmpty()) { "No speech could be transcribed. Check the selected language or device speech-recognition support." }
                _state.value = _state.value.copy(transcript = transcript)

                stage(PipelineStage.UNDERSTANDING, .58f, "Building a factual recap without inventing plot details…")
                val generated = withContext(Dispatchers.Default) {
                    RecapGenerator.generate(transcript, _state.value.recapLength, _state.value.style)
                }
                require(generated.scenes.isNotEmpty()) { "Could not identify recap scenes." }
                _state.value = _state.value.copy(scenes = generated.scenes, script = generated.script)

                stage(PipelineStage.SELECTING, .64f, "Selected ${generated.scenes.size} source scenes")
                stage(PipelineStage.NARRATING, .69f, "Creating device TTS narration…")
                val narrator = TtsNarrator(context)
                val narration = narrator.synthesize(generated.scenes, _state.value.language, File(work, "narration"))
                val narrationStatus = if (narration == null) "TTS voice unavailable; keeping original clip audio" else "Narration ready"

                stage(PipelineStage.SUBTITLES, .75f, "Generating subtitles…")
                val movies = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
                movies.mkdirs()
                val srt = File(movies, "AI-Recap-${System.currentTimeMillis()}.srt")
                SubtitleWriter.writeSrt(generated.scenes, srt)

                stage(PipelineStage.RENDERING, .80f, "$narrationStatus. Rendering MP4…")
                val output = File(movies, "AI-Recap-${System.currentTimeMillis()}.mp4")
                VideoRenderer(context).render(video.uri, video.durationMs, generated.scenes, narration, output)
                _state.value = _state.value.copy(
                    stage = PipelineStage.COMPLETE,
                    progress = 1f,
                    status = "Recap exported successfully",
                    outputPath = output.absolutePath,
                    error = null
                )
            } catch (t: Throwable) {
                fail(t)
            }
        }
    }

    fun updateScript(text: String) {
        val lines = text.lines().map { it.trim() }.filter { it.isNotEmpty() }
        val scenes = _state.value.scenes.mapIndexed { i, scene -> scene.copy(caption = lines.getOrNull(i) ?: scene.caption) }
        _state.value = _state.value.copy(script = text, scenes = scenes)
    }

    fun toggleScene(index: Int) {
        val scenes = _state.value.scenes.toMutableList()
        scenes[index] = scenes[index].copy(enabled = !scenes[index].enabled)
        _state.value = _state.value.copy(scenes = scenes)
    }

    fun rerender() {
        val video = _state.value.video ?: return
        val scenes = _state.value.scenes.filter { it.enabled }
        if (scenes.isEmpty()) return
        viewModelScope.launch {
            try {
                stage(PipelineStage.NARRATING, .2f, "Rebuilding narration…")
                val work = File(context.cacheDir, "recap_rerender").apply { deleteRecursively(); mkdirs() }
                val narration = TtsNarrator(context).synthesize(scenes, _state.value.language, File(work, "narration"))
                stage(PipelineStage.RENDERING, .5f, "Re-rendering edited recap…")
                val movies = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
                val output = File(movies, "AI-Recap-Edited-${System.currentTimeMillis()}.mp4")
                VideoRenderer(context).render(video.uri, video.durationMs, scenes, narration, output)
                _state.value = _state.value.copy(stage = PipelineStage.COMPLETE, progress = 1f, status = "Edited recap exported", outputPath = output.absolutePath)
            } catch (t: Throwable) { fail(t) }
        }
    }

    fun shareIntent(): Intent? {
        val path = _state.value.outputPath ?: return null
        val file = File(path)
        if (!file.exists()) return null
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        return Intent(Intent.ACTION_SEND).apply {
            type = "video/mp4"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    private fun stage(stage: PipelineStage, progress: Float, status: String) {
        _state.value = _state.value.copy(stage = stage, progress = progress.coerceIn(0f, 1f), status = status, error = null)
    }

    private fun fail(t: Throwable) {
        _state.value = _state.value.copy(stage = PipelineStage.ERROR, status = "Stopped", error = t.message ?: t.javaClass.simpleName)
    }
}
