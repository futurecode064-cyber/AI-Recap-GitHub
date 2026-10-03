@file:OptIn(androidx.media3.common.util.UnstableApi::class)

package com.futurecode.aivideorecap.pipeline

import android.content.Context
import android.net.Uri
import android.text.SpannableString
import android.text.style.BackgroundColorSpan
import android.text.style.ForegroundColorSpan
import androidx.media3.common.Effect
import androidx.media3.common.MediaItem
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.StaticOverlaySettings
import androidx.media3.effect.TextOverlay
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.EditedMediaItemSequence
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import com.futurecode.aivideorecap.model.RecapScene
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class VideoRenderer(private val context: Context) {
    suspend fun render(
        sourceUri: Uri,
        sourceDurationMs: Long,
        scenes: List<RecapScene>,
        narration: List<TtsNarrator.Narration>?,
        output: File
    ) {
        val enabled = scenes.filter { it.enabled }
        require(enabled.isNotEmpty()) { "No scenes selected." }
        if (output.exists()) output.delete()

        val videoItems = enabled.mapIndexed { index, scene ->
            val narrationDuration = narration?.getOrNull(index)?.durationMs
            val desired = narrationDuration ?: (scene.endMs - scene.startMs).coerceIn(2500L, 10_000L)
            var start = scene.startMs.coerceAtLeast(0L)
            if (start + desired > sourceDurationMs) start = (sourceDurationMs - desired).coerceAtLeast(0L)
            val end = (start + desired).coerceAtMost(sourceDurationMs)
            val mediaItem = MediaItem.Builder()
                .setUri(sourceUri)
                .setClippingConfiguration(
                    MediaItem.ClippingConfiguration.Builder()
                        .setStartPositionMs(start)
                        .setEndPositionMs(end)
                        .build()
                )
                .build()

            val subtitle = SpannableString(scene.caption).apply {
                setSpan(ForegroundColorSpan(android.graphics.Color.WHITE), 0, length, 0)
                setSpan(BackgroundColorSpan(0xB0000000.toInt()), 0, length, 0)
            }
            val settings = StaticOverlaySettings.Builder()
                .setOverlayFrameAnchor(0f, -1f)
                .setBackgroundFrameAnchor(0f, -0.82f)
                .setScale(0.75f, 0.75f)
                .build()
            val overlay = TextOverlay.createStaticTextOverlay(subtitle, settings)
            val effects = Effects(
                emptyList<AudioProcessor>(),
                listOf<Effect>(OverlayEffect(listOf(overlay)))
            )
            EditedMediaItem.Builder(mediaItem)
                .setRemoveAudio(narration != null)
                .setEffects(effects)
                .build()
        }

        val composition = if (narration != null && narration.size == enabled.size) {
            val videoSequence = EditedMediaItemSequence.withVideoFrom(videoItems)
            val audioItems = narration.map { n -> EditedMediaItem.Builder(MediaItem.fromUri(Uri.fromFile(n.file))).build() }
            val audioSequence = EditedMediaItemSequence.withAudioFrom(audioItems)
            Composition.Builder(videoSequence, audioSequence).build()
        } else {
            val avItems = videoItems.mapIndexed { index, item ->
                val scene = enabled[index]
                val desired = (scene.endMs - scene.startMs).coerceIn(2500L, 10_000L)
                var start = scene.startMs.coerceAtLeast(0L)
                if (start + desired > sourceDurationMs) start = (sourceDurationMs - desired).coerceAtLeast(0L)
                val end = (start + desired).coerceAtMost(sourceDurationMs)
                val media = MediaItem.Builder().setUri(sourceUri)
                    .setClippingConfiguration(MediaItem.ClippingConfiguration.Builder().setStartPositionMs(start).setEndPositionMs(end).build())
                    .build()
                EditedMediaItem.Builder(media).setEffects(item.effects).build()
            }
            Composition.Builder(EditedMediaItemSequence.withAudioAndVideoFrom(avItems)).build()
        }

        suspendCancellableCoroutine<Unit> { cont ->
            lateinit var transformer: Transformer
            val listener = object : Transformer.Listener {
                override fun onCompleted(composition: Composition, exportResult: ExportResult) {
                    if (cont.isActive) cont.resume(Unit)
                }
                override fun onError(composition: Composition, exportResult: ExportResult, exportException: ExportException) {
                    if (cont.isActive) cont.resumeWithException(exportException)
                }
            }
            transformer = Transformer.Builder(context).addListener(listener).build()
            cont.invokeOnCancellation { transformer.cancel() }
            transformer.start(composition, output.absolutePath)
        }
    }
}
