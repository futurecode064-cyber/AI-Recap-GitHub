package com.futurecode.aivideorecap.model

import android.net.Uri

enum class RecapLength(val seconds: Int, val label: String) {
    ONE_MINUTE(60, "1 min"),
    THREE_MINUTES(180, "3 min"),
    FIVE_MINUTES(300, "5 min"),
    TEN_MINUTES(600, "10 min")
}
enum class RecapStyle(val label: String) {
    STORYTELLING("Storytelling"),
    SHORT_FAST("Short & Fast"),
    DRAMATIC("Dramatic"),
    FUNNY("Funny")
}
enum class RecapLanguage(val tag: String, val label: String) {
    BURMESE("my-MM", "မြန်မာ"),
    ENGLISH("en-US", "English")
}
enum class PipelineStage(val label: String) {
    IDLE("Ready"),
    PREPARING("Preparing video"),
    TRANSCRIBING("Transcribing audio"),
    UNDERSTANDING("Understanding story"),
    SELECTING("Selecting scenes"),
    NARRATING("Creating narration"),
    SUBTITLES("Generating subtitles"),
    RENDERING("Rendering video"),
    COMPLETE("Complete"),
    ERROR("Error")
}
data class VideoInfo(val uri: Uri, val name: String, val durationMs: Long)
data class TranscriptChunk(val startMs: Long, val endMs: Long, val text: String)
data class RecapScene(
    val startMs: Long,
    val endMs: Long,
    val caption: String,
    val enabled: Boolean = true
)
data class RecapUiState(
    val video: VideoInfo? = null,
    val youtubeUrl: String = "",
    val fromYoutube: Boolean = false,
    val recapLength: RecapLength = RecapLength.ONE_MINUTE,
    val language: RecapLanguage = RecapLanguage.BURMESE,
    val style: RecapStyle = RecapStyle.STORYTELLING,
    val stage: PipelineStage = PipelineStage.IDLE,
    val progress: Float = 0f,
    val status: String = "Paste a public YouTube link or choose a local video",
    val transcript: List<TranscriptChunk> = emptyList(),
    val scenes: List<RecapScene> = emptyList(),
    val script: String = "",
    val outputPath: String? = null,
    val narrationPath: String? = null,
    val error: String? = null,
    val recognizerMode: String = ""
)
